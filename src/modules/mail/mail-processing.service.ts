import { Injectable, Logger } from '@nestjs/common';
import { GptService } from '../gpt/gpt.service';
import { MailLogService } from './mail-log.service';
import { CustomerService } from '../customer/customer.service';
import { PropertySearchRequestService } from '../property-search-request/property-search-request.service';
import { RealEstateService } from '../real-estate/real-estate.service';
import { RealEstateEmailAnalysis } from '../gpt/schemas/real-estate-email-analysis.schema';
import { MailService } from './mail.service';
import { PropertySearchRequest, RealEstateListing, Customer, Prisma } from '@prisma/client';
import { MailLogType } from './types/mail-log.type.enum';

@Injectable()
export class MailProcessingService {
  private readonly logger = new Logger(MailProcessingService.name);

  constructor(
    private readonly gptService: GptService,
    private readonly mailLogService: MailLogService,
    private readonly customerService: CustomerService,
    private readonly propertySearchRequestService: PropertySearchRequestService,
    private readonly realEstateService: RealEstateService,
    private readonly mailService: MailService,
  ) {}

  async processIncomingEmail(
    emailContent: string,
    fromEmail: string,
    emailSubject: string,
    emailTo?: string, // Opsiyonel, log için
    emailCc?: string, // Opsiyonel, log için
    externalId?: string, // Opsiyonel, e-postanın harici IDsi (örn: Message-ID)
    language?: string, // Opsiyonel, e-postanın dili
  ): Promise<void> {
    this.logger.log(
      `Gelen e-posta işleniyor: Kimden - ${fromEmail}, Konu - ${emailSubject}`,
    );

    let mailLogRecord = null;
    try {
      // 1. E-postayı logla (ilk kayıt)
      mailLogRecord = await this.mailLogService.createInitialLog({
        from: fromEmail,
        to: emailTo || 'N/A',
        cc: emailCc,
        contentTitle: emailSubject,
        contentBody: emailContent, // Ham içerik de loglanabilir
        externalId: externalId,
        language: language,
        type: 'INCOMING_EMAIL', // Veya daha spesifik bir tip
      });
      this.logger.log(`İlk mail log kaydı oluşturuldu: ID ${mailLogRecord.id}`);

      // 2. E-postayı analiz et
      const analysisResult: RealEstateEmailAnalysis | null =
        await this.gptService.analyzeRealEstateEmail(
          emailContent,
          fromEmail,
          emailSubject,
        );

      // 3. Analiz sonucunu logla
      if (analysisResult) {
        await this.mailLogService.updateLogWithAnalysis(
          mailLogRecord.id,
          analysisResult,
          'ANALYSIS_COMPLETED',
        );
        this.logger.log(
          `Mail log ID ${mailLogRecord.id} analiz sonucu ile güncellendi. E-posta Tipi: ${analysisResult.type}`,
        );
      } else {
        await this.mailLogService.updateLogWithAnalysis(
          mailLogRecord.id,
          null,
          'ANALYSIS_FAILED',
        );
        this.logger.warn(
          `Mail log ID ${mailLogRecord.id} için e-posta analizi başarısız oldu veya boş sonuç döndü.`,
        );
        return; // Analiz başarısızsa devam etme
      }

      // 4. Müşteriyi bul veya oluştur
      const customer = await this.customerService.findOrCreateCustomerFromAnalysis(
        analysisResult.customer,
        fromEmail,
      );

      if (!customer) {
        this.logger.error(
          `Müşteri bulunamadı veya oluşturulamadı: ${fromEmail}. İşlem sonlandırılıyor.`,
        );
        await this.mailLogService.updateLogWithAnalysis(
          mailLogRecord.id,
          analysisResult,
          'CUSTOMER_PROCESSING_FAILED',
        );
        return;
      }
      this.logger.log(
        `Müşteri işlendi: ID ${customer.id}, E-posta Tipi: ${analysisResult.type}`,
      );

      // 5. Analiz tipine göre işlem yap
      switch (analysisResult.type) {
        case 'BUYER_INQUIRY':
          if (analysisResult.buyerPreferences) {
            const searchRequest =
              await this.propertySearchRequestService.createOrUpdateSearchRequestFromAnalysis(
                customer.id,
                analysisResult.buyerPreferences,
              );
            if (searchRequest && mailLogRecord) {
              await this.mailLogService.linkToPropertySearchRequest(
                mailLogRecord.id,
                searchRequest.id,
              );
              this.logger.log(
                `Alıcı talebi ID ${searchRequest.id} oluşturuldu/güncellendi ve mail log ID ${mailLogRecord.id} ile ilişkilendirildi.`,
              );
              await this.notifyBuyerAboutMatchingProperties(customer, searchRequest);
            } else {
              this.logger.warn(
                `Alıcı talebi oluşturulamadı veya mail log kaydı bulunamadı. Müşteri ID: ${customer.id}`,
              );
            }
          } else {
            this.logger.warn(
              `BUYER_INQUIRY tipi için buyerPreferences verisi eksik. Müşteri ID: ${customer.id}`,
            );
          }
          break;

        case 'SELLER_LISTING':
          if (analysisResult.property) {
            const listing =
              await this.realEstateService.createOrUpdateListingFromAnalysis(
                customer.id,
                analysisResult.property,
              );
            if (listing) {
              this.logger.log(
                `Satıcı ilanı ID ${listing.id} oluşturuldu/güncellendi. Müşteri ID: ${customer.id}`,
              );
              // Yeni ilan için eşleşen alıcıları bul ve bildir
              await this.notifyMatchingBuyersAboutNewListing(listing);
            } else {
              this.logger.warn(
                `Satıcı ilanı oluşturulamadı. Müşteri ID: ${customer.id}`,
              );
            }
          } else {
            this.logger.warn(
              `SELLER_LISTING tipi için property verisi eksik. Müşteri ID: ${customer.id}`,
            );
          }
          break;

        case 'PROPERTY_VIEWING_REQUEST':
          this.logger.log(
            `Emlak görüntüleme talebi alındı. Müşteri ID: ${customer.id}, Detaylar: ${JSON.stringify(analysisResult.viewingRequest)}`,
          );
          // TODO: ViewingRequestService oluşturulup bu talep işlenebilir.
          // Örneğin, ilgili emlakçıya bildirim, müşteriye onay vs.
          break;

        case 'OTHER':
        default:
          this.logger.log(
            `E-posta tipi 'OTHER' veya bilinmiyor. Müşteri ID: ${customer.id}. Özet: ${analysisResult.summary}`,
          );
          break;
      }

      await this.mailLogService.updateLogWithAnalysis(
        mailLogRecord.id,
        analysisResult,
        'PROCESSED_SUCCESSFULLY',
      );
      this.logger.log(
        `E-posta başarıyla işlendi: Mail Log ID ${mailLogRecord.id}, Müşteri ID ${customer.id}, Tip: ${analysisResult.type}`,
      );
    } catch (error) {
      this.logger.error(
        `Gelen e-posta işlenirken genel hata: ${error.message}`,
        error.stack,
      );
      if (mailLogRecord && mailLogRecord.id) {
        // Hata durumunda logu güncelle
        try {
          await this.mailLogService.updateLogWithAnalysis(
            mailLogRecord.id,
            null, // Analiz sonucu null olabilir veya hata detayı eklenebilir
            'PROCESSING_FAILED',
          );
        } catch (logError) {
          this.logger.error(
            `Hata durumunda mail log güncellenirken ek hata: ${logError.message}`,
            logError.stack,
          );
        }
      }
      // Hatanın yukarıya fırlatılması, global bir hata yöneticisi tarafından yakalanmasını sağlar.
      // throw error; // Şimdilik fırlatmıyoruz, sadece logluyoruz.
    }
  }

  private async notifyBuyerAboutMatchingProperties(
    customer: Customer,
    searchRequest: PropertySearchRequest,
  ): Promise<void> {
    this.logger.log(
      `Müşteri ${customer.email} (Talep No: ${searchRequest.requestNo}) için eşleşen ilanlar aranıyor ve e-posta hazırlanıyor...`,
    );

    try {
      const safeParseJsonArray = (jsonString: string | null | undefined): string[] | undefined => {
        if (!jsonString) return undefined;
        try {
          const parsed = JSON.parse(jsonString);
          return Array.isArray(parsed) ? parsed : undefined;
        } catch (e) {
          this.logger.warn(`JSON parse hatası: ${jsonString}`, e);
          return undefined;
        }
      };

      // TypeScript tip hatalarını aşmak için searchRequest'i 'any' olarak ele alıyoruz
      const srAsAny = searchRequest as any;

      const preferencesForSearch = {
        propertyTypes: safeParseJsonArray(srAsAny.propertyTypes as string | null),
        cities: safeParseJsonArray(srAsAny.locations as string | null),
        districts: safeParseJsonArray(srAsAny.districts as string | null), // Eğer varsa 'districts' alanını kullan
        minPrice: srAsAny.minPrice ?? undefined,
        maxPrice: srAsAny.maxPrice ?? undefined,
        minSize: srAsAny.minSize ?? undefined,
        features: safeParseJsonArray(srAsAny.requiredFeatures as string | null), // Eğer varsa 'requiredFeatures' alanını kullan
      };

      this.logger.debug(`Alıcı ${customer.id} için oluşturulan arama tercihleri: ${JSON.stringify(preferencesForSearch)}`);

      const matchingListings = await this.realEstateService.findMatchesForBuyer(
        searchRequest.customerId,
        preferencesForSearch
      );

      if (matchingListings.length === 0) {
        this.logger.log(
          `Müşteri ${customer.email} (Talep No: ${searchRequest.requestNo}) için uygun ilan bulunamadı.`,
        );
        return;
      }

      this.logger.log(
        `${matchingListings.length} adet uygun ilan bulundu. Müşteri: ${customer.email}, Talep No: ${searchRequest.requestNo}`,
      );

      const emailHtmlContent = await this.gptService.generateBuyerResponse(
        { name: customer.name, email: customer.email, preferences: searchRequest },
        matchingListings,
      );

      await this.mailService.sendMail(
        customer.email,
        `Portföyünüze Uygun İlanlar Bulundu - Talep No: ${searchRequest.requestNo}`,
        emailHtmlContent,
        [],
        undefined,
        searchRequest.id,
        MailLogType.MATCH_NOTIFICATION_BUYER,
      );

      this.logger.log(
        `Eşleşen ilanlar hakkında e-posta başarıyla gönderildi: ${customer.email}, Talep No: ${searchRequest.requestNo}`,
      );
    } catch (error) {
      this.logger.error(
        `Müşteriye (${customer.email}) eşleşen ilanlar gönderilirken hata oluştu: ${error.message}`,
        error.stack,
      );
    }
  }

  private async notifyMatchingBuyersAboutNewListing(
    listing: RealEstateListing,
  ): Promise<void> {
    this.logger.log(
      `Yeni ilan (ID: ${listing.id}, No: ${listing.listingNo}) için eşleşen alıcı talepleri aranıyor...`,
    );
    try {
      const matchingSearchRequests = await this.propertySearchRequestService.findMatchingSearchRequestsForListing(
        listing,
      );

      if (matchingSearchRequests.length === 0) {
        this.logger.log(
          `İlan ID ${listing.id} için eşleşen alıcı talebi bulunamadı.`,
        );
        return;
      }

      this.logger.log(
        `${matchingSearchRequests.length} eşleşen alıcı talebi bulundu. İlan ID: ${listing.id}`,
      );

      for (const searchRequest of matchingSearchRequests) {
        if (!searchRequest.customerId) {
          this.logger.warn(`Arama talebi ID ${searchRequest.id} için müşteri ID bulunamadı.`);
          continue;
        }
        const customer = await this.customerService.findById(
          searchRequest.customerId,
        );

        if (!customer) {
          this.logger.warn(
            `Mişteri ID ${searchRequest.customerId} bulunamadı (Arama Talebi ID: ${searchRequest.id}).`,
          );
          continue;
        }

        this.logger.log(
          `Müşteri ${customer.email} (Talep No: ${searchRequest.requestNo}) yeni ilanla eşleşti: ${listing.listingNo}`,
        );

        // E-posta içeriğini GPT ile oluştur.
        // generateBuyerResponse metodunu yeniden kullanabiliriz, ancak ilanı vurgulamamız gerekebilir.
        // Şimdilik, alıcının talebini ve sadece bu yeni ilanı gönderiyoruz.
        const emailHtmlContent = await this.gptService.generateBuyerResponse(
          { name: customer.name, email: customer.email, preferences: searchRequest },
          [listing], // Sadece bu yeni ilanı bir dizi içinde gönder
        );

        await this.mailService.sendMail(
          customer.email,
          `Talebinize Uygun Olabilecek Yeni Bir İlan Eklendi! - ${listing.listingNo}`,
          emailHtmlContent,
          [],
          undefined, // language
          searchRequest.id, // searchRequestId
          MailLogType.NEW_LISTING_ALERT_BUYER, // E-posta log tipi
        );

        this.logger.log(
          `Müşteri ${customer.email} yeni ilan ${listing.listingNo} hakkında bilgilendirildi.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Yeni ilan (ID: ${listing.id}) için alıcılar bilgilendirilirken hata: ${error.message}`,
        error.stack,
      );
    }
  }
} 