import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CustomerService } from '../customer/customer.service';
import { RealEstateService } from '../real-estate/real-estate.service';
import { GptService } from '../gpt/gpt.service';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { Customer, Prisma, RealEstateListing, MailLogs } from '@prisma/client';
import { MailLogType } from './types/mail-log.type.enum';
import { PropertySearchRequestService } from '../property-search-request/property-search-request.service';
import { ProcessParsedPropertyEmailDto } from '../property-search-request/dto/process.property-email.dto';
import { MailStatusType } from '../property-search-request/types/property-search-request.types';

interface Mail {
  address: string;
  name: string;
}
export interface GetMail {
  id: string;
  date: string;
  from: Mail[];
  to: Mail[];
  cc: Mail[];
  body: string;
  subject: string;
}

@Injectable()
export class MailService {
  private readonly baseUrl: string;
  private readonly defaultMailList: string[];
  private readonly defaultMail: string;
  private readonly logger: Logger;
  private mailTransporter: nodemailer.Transporter;

  constructor(
    private mailerService: MailerService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private customerService: CustomerService,
    @Inject(forwardRef(() => RealEstateService))
    private readonly realEstateService: RealEstateService,
    private gptService: GptService,
    private propertySearchRequestService: PropertySearchRequestService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    this.defaultMailList =
      this.configService.get<string>('DEFAULT_MAIL_LIST')?.split(',') || [];

    this.defaultMail = this.configService.get<string>('DEFAULT_MAIL');
    this.logger = new Logger(MailService.name);

    // Mail transporter ayarları
    this.mailTransporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: this.configService.get('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async processMail(mail: GetMail) {
    try {
      const startDate = new Date();
      startDate.setHours(
        startDate.getHours() -
          this.configService.get<number>('OFFER_EXPIRY_HOURS_FOR_ALL', 24),
      );
      const getMailLogList = await this.getMailLogs({
        to: mail.from[0].address,
        startDate,
        endDate: new Date(),
        limit: 1,
        offset: 0,
      });

      const getMailLog = getMailLogList.data[0];
      let listingDetails: RealEstateListing | null = null;
      if (getMailLog && getMailLog.externalId) {
        this.logger.log('Eski mail logu bulundu, ilgili ilan detayları çekiliyor (varsa):', getMailLog.externalId);
        listingDetails = await this.prisma.realEstateListing.findUnique({ where: { listingNo: getMailLog.externalId } });
      }

      this.logger.log(`processMail: GptService.analyzeRealEstateEmail çağrılıyor. Subject: ${mail.subject}`);
      const analysisResult = await this.gptService.analyzeRealEstateEmail(
        mail.body, 
        mail.from[0]?.address || 'unknown@example.com', 
        mail.subject
      );

      if (analysisResult) {
        this.logger.log('GPT analysis successful. Result is being sent to propertySearchRequestService.');
        
        const dto: ProcessParsedPropertyEmailDto = {
          from: mail.from[0]?.address || 'unknown@example.com',
          to: mail.to.map(t => t.address), 
          cc: mail.cc?.map(c => c.address) || [],
          subject: mail.subject,
          body: mail.body,
          language: 'tr', 
          emailType: analysisResult.type as MailLogType, 
          propertyRequest: null,
          propertyListing: null,
          additionalRawData: { 
            messageId: mail.id, 
            analysis: analysisResult 
          } as any, 
        };

        if (analysisResult.type === 'BUYER_INQUIRY' && analysisResult.buyerPreferences) {
          let buyerNotes = analysisResult.buyerPreferences.features?.join(', ') || '';
          if (analysisResult.buyerPreferences.districts && analysisResult.buyerPreferences.districts.length > 0) {
            const districtNotes = `Preferred districts: ${analysisResult.buyerPreferences.districts.join(', ')}`;
            buyerNotes = buyerNotes ? `${buyerNotes}; ${districtNotes}` : districtNotes;
          }
          dto.propertyRequest = {
            notes: buyerNotes,
            propertyTypes: analysisResult.buyerPreferences.propertyTypes?.join(', ') || '',
            locations: analysisResult.buyerPreferences.locations?.join(', ') || '',
            minPrice: analysisResult.buyerPreferences.minPrice ?? undefined,
            maxPrice: analysisResult.buyerPreferences.maxPrice ?? undefined,
            minSize: analysisResult.buyerPreferences.minSize ?? undefined,
            maxSize: analysisResult.buyerPreferences.maxSize ?? undefined,
            minRooms: analysisResult.buyerPreferences.roomCount ?? undefined, 
          };
        } else if (analysisResult.type === 'SELLER_LISTING' && analysisResult.property) {
          let sellerDescription = analysisResult.property.description || '';
          const propertyTitle = `İlan: ${analysisResult.property.propertyType} - ${analysisResult.property.location || 'Konumsuz'}`;
          sellerDescription = `${propertyTitle}\n${sellerDescription}`.trim();
          // Adres bilgisi zaten location alanında olacak, ayrıca description'a eklemeye gerek yok gibi.
          // if (analysisResult.property.location) { 
          //   sellerDescription = `${sellerDescription}\nAdres: ${analysisResult.property.location}`;
          // }

          dto.propertyListing = {
            description: sellerDescription, 
            location: analysisResult.property.location || '', // Zorunlu 'location' alanı eklendi
            price: analysisResult.property.price ?? undefined,
            currency: analysisResult.property.currency || 'TRY',
            propertyType: analysisResult.property.propertyType || 'OTHER',
            city: analysisResult.property.city || '',
            district: analysisResult.property.district || '',
            neighborhood: analysisResult.property.neighborhood || '',
            size: analysisResult.property.size ?? undefined,
            roomCount: analysisResult.property.roomCount ?? undefined,
            bathroomCount: analysisResult.property.bathroomCount ?? undefined,
          };
        }
        
        await this.propertySearchRequestService.processParsedEmail(dto);
        this.logger.log('Successfully processed parsed email from processMail via GptService analysis.');
        await this.createMailLog({
          type: MailLogType.GPT_ANALYSIS_SUCCESS,
          from: mail.from[0]?.address || 'unknown@example.com',
          to: mail.to.map(t => t.address).join(', '),
          contentTitle: `ANALİZ BAŞARILI: ${mail.subject}`,
          contentBody: mail.body,
          parsedData: { analysis: analysisResult, mailId: mail.id } as Prisma.JsonValue,
        });

      } else {
        this.logger.error('GPT analizi başarısız oldu veya null sonuç döndürdü.');
        await this.createMailLog({
          type: MailLogType.GPT_ANALYSIS_FAILED,
          from: mail.from[0]?.address || 'unknown@example.com',
          to: mail.to.map(t => t.address).join(', '),
          cc: mail.cc?.map(c => c.address).join(', '),
          contentTitle: `ANALİZ HATASI: ${mail.subject}`,
          contentBody: mail.body,
          parsedData: { error: 'GPT analysis returned null or failed.', mailId: mail.id } as Prisma.JsonValue,
        });
      }
    } catch (error) {
      this.logger.error(`Email analysis error in processMail: ${error.message}`, error.stack);
      await this.createMailLog({
        type: MailLogType.ERROR_PROCESSING_MAIL,
        from: mail.from[0]?.address || 'unknown@example.com',
        to: mail.to.map(t => t.address).join(', '),
        cc: mail.cc?.map(c => c.address).join(', '),
        contentTitle: `İŞLEME HATASI: ${mail.subject}`,
        contentBody: mail.body,
        parsedData: { error: error.message, mailId: mail.id, stack: error.stack } as Prisma.JsonValue,
      });
    }
  }

  async createMailLog(data: {
    type: MailLogType | string;
    externalId?: string;
    from: string;
    to: string;
    cc?: string | string[];
    contentTitle?: string;
    contentBody?: string;
    searchRequestId?: number;
    parsedData?: Prisma.JsonValue;
    language?: string;
  }) {
    const ccString = Array.isArray(data.cc) ? data.cc.join(', ') : data.cc;
    try {
      return await this.prisma.mailLogs.create({
        data: {
          type: data.type.toString(),
          externalId: data.externalId,
          from: data.from,
          to: data.to,
          cc: ccString,
          contentTitle: data.contentTitle,
          contentBody: data.contentBody,
          language: data.language,
          parsedData: data.parsedData,
          propertySearchRequest: data.searchRequestId ? { connect: { id: data.searchRequestId } } : undefined,
        },
      });
    } catch (error) {
        this.logger.error(`Error creating mail log: ${error.message}`, { data, errorStack: error.stack });
        throw error;
    }
  }

  async getMailLogs({
    customerId,
    startDate,
    endDate,
    type,
    limit,
    offset,
    to,
    includeCustomer,
    searchRequestId,
    externalId,
  }: {
    customerId?: number;
    startDate?: Date;
    endDate?: Date;
    type?: MailLogType | string;
    externalId?: string;
    limit: number;
    offset: number;
    to?: string;
    includeCustomer?: boolean;
    searchRequestId?: number;
  }) {
    const where: Prisma.MailLogsWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(type && { type: type.toString() }),
      ...(to && { to }),
      ...(externalId && { externalId }),
      ...(searchRequestId && { searchRequestId }),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.mailLogs.count({ where }),
      this.prisma.mailLogs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          propertySearchRequest: {
            include: {
                customer: includeCustomer
            }
          }
        },
      }),
    ]);

    const resultData = data.map(log => {
        const logWithCustomer: any = { ...log };
        if (includeCustomer && log.propertySearchRequest && log.propertySearchRequest.customer) {
            logWithCustomer.customer = log.propertySearchRequest.customer;
        }
        return logWithCustomer;
    });

    return {
      data: resultData,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  getMailTypes() {
    return Object.values(MailLogType);
  }

  async sendMail(
    to: string,
    subject: string,
    content: string,
    cc: string[] = [],
    language?: string,
    searchRequestId?: number,
    mailLogType?: MailLogType | string
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html: content,
        cc,
      });

      await this.createMailLog({
        type: mailLogType || MailLogType.GENERAL_COMMUNICATION,
        from: this.defaultMail,
        to,
        cc,
        contentTitle: subject,
        contentBody: content,
        language: language || 'tr',
        searchRequestId,
      });
      this.logger.log(`Mail successfully sent to ${to} with subject: ${subject}`);
    } catch (error) {
      this.logger.error(`Mail gönderimi başarısız - ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendToBuyer(buyer: Customer, matchingProperties: RealEstateListing[], language?: string, replyTo?: string) {
    const subject = 'Size Uygun Emlak İlanları Bulundu!';
    const content = `<p>Merhaba ${buyer.name},</p><p>Arama kriterlerinize uygun aşağıdaki emlak ilanlarını bulduk:</p><ul>${matchingProperties.map(p => `<li>${p.listingNo} - ${p.location} - ${p.price} ${p.currency}</li>`).join('')}</ul>`;
    const searchRequestId = await this.customerService.getActiveSearchRequestId(buyer.id);
    await this.sendMail(buyer.email, subject, content, [], language || 'tr', searchRequestId, MailLogType.MATCH_NOTIFICATION_BUYER);
    this.logger.log(`Matching properties email sent to buyer: ${buyer.email}`);
  }

  async sendToSeller(seller: Customer, propertyInfo: RealEstateListing, listingNo: string, language?: string, replyTo?: string) {
    const subject = `İlanınız (#${listingNo}) Hakkında Bilgilendirme`;
    const content = `<p>Merhaba ${seller.name},</p><p>${listingNo} numaralı ilanınızla ilgili bir gelişme oldu.</p>`;
    await this.sendMail(seller.email, subject, content, [], language || 'tr', undefined, MailLogType.LISTING_UPDATE_SELLER);
    this.logger.log(`Seller notification email sent for listing: ${listingNo} to ${seller.email}`);
  }

  async sendPropertyMatch(buyer: Customer, property: RealEstateListing, seller: Customer, language?: string) {
    const subject = 'Yeni Bir Emlak Eşleşmesi!';
    const content = `<p>Merhaba,</p><p>${buyer.name} adlı alıcımız, ${seller.name} adlı satıcımızın ${property.listingNo} numaralı ilanıyla ilgileniyor olabilir.</p>`;
    await this.sendMail(this.defaultMail, subject, content, [], language || 'tr', undefined, MailLogType.INTERNAL_MATCH_ALERT);
    this.logger.log(`Property match notification sent for listing: ${property.listingNo}`);
  }

  async sendViewingConfirmation(buyer: Customer, property: RealEstateListing, viewingDate: Date, language?: string) {
    const subject = `Emlak Görme Randevunuz Onaylandı: ${property.listingNo}`;
    const content = `<p>Merhaba ${buyer.name},</p><p>${property.listingNo} numaralı emlak için ${viewingDate.toLocaleString(language || 'tr-TR')} tarihli görme randevunuz onaylanmıştır.</p>`;
    const searchRequestId = await this.customerService.getActiveSearchRequestId(buyer.id);
    await this.sendMail(buyer.email, subject, content, [], language || 'tr', searchRequestId, MailLogType.VIEWING_CONFIRMATION_BUYER);
    this.logger.log(`Viewing confirmation sent to buyer: ${buyer.email} for listing: ${property.listingNo}`);
  }

  private async logEmail(data: {
    from: string;
    to: string;
    subject: string;
    content: string;
    customerId?: number;
    type: MailLogType | string;
    listingNo?: string;
    language?: string;
  }) {
    let searchRequestIdToLog: number | undefined = undefined;
    if (data.customerId) {
        searchRequestIdToLog = await this.customerService.getActiveSearchRequestId(data.customerId);
    }
    return this.createMailLog({
        type: data.type,
        externalId: data.listingNo,
        from: data.from,
        to: data.to,
        contentTitle: data.subject,
        contentBody: data.content,
        searchRequestId: searchRequestIdToLog,
        language: data.language,
    });
  }

  async findLogEntry(
    referenceId: string,
    logType: MailStatusType,
  ): Promise<MailLogs | null> {
    this.logger.debug(`findLogEntry çağrıldı: referenceId=${referenceId}, logType=${logType}`);
    try {
      return await this.prisma.mailLogs.findFirst({
        where: {
          externalId: referenceId,
          type: logType.toString(),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(
        `findLogEntry sırasında hata: referenceId=${referenceId}, logType=${logType} - ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async sendGenericReminderMail(options: {
    to: string;
    subject: string;
    htmlBody: string;
    referenceId: string;
    logType: MailStatusType;
  }) {
    this.logger.log(
      `sendGenericReminderMail çağrıldı: to=${options.to}, subject=${options.subject}, referenceId=${options.referenceId}, logType=${options.logType}`,
    );
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        html: options.htmlBody,
      });

      this.logger.log(`Hatırlatma maili gönderildi: ${options.to}, referans: ${options.referenceId}`);

      await this.createMailLog({
        type: options.logType.toString(),
        externalId: options.referenceId,
        from: this.defaultMail,
        to: options.to,
        contentTitle: options.subject,
        contentBody: options.htmlBody,
      });
      this.logger.log(
        `sendGenericReminderMail için log kaydı oluşturuldu: refId=${options.referenceId}, type=${options.logType}`,
      );

    } catch (error) {
      this.logger.error(
        `sendGenericReminderMail sırasında hata: ${error.message}`, 
        { to: options.to, subject: options.subject, errorStack: error.stack }
      );
      throw error;
    }
  }

  async analyzeSimpleEmail(content: string, subject: string, from: string) {
    this.logger.log(`analyzeSimpleEmail: GptService.analyzeRealEstateEmail çağrılıyor. From: ${from}, Subject: ${subject}`);
    try {
      const analysisResult = await this.gptService.analyzeRealEstateEmail(
        content,
        from,
        subject
      );

      if (analysisResult) {
        this.logger.log('analyzeSimpleEmail: GPT analysis successful.');
        // İsteğe bağlı: Burada loglama veya basit bir dönüşüm yapılabilir.
        // Şimdilik doğrudan sonucu dönüyoruz.
      } else {
        this.logger.warn('analyzeSimpleEmail: GPT analysis returned null or failed.');
      }
      return analysisResult; // veya daha yapılandırılmış bir dönüş
    } catch (error) {
      this.logger.error(`Error in analyzeSimpleEmail: ${error.message}`, error.stack);
      throw error; // Hatayı yukarıya fırlat
    }
  }
}
