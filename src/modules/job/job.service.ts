// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { CustomerService } from '../customer/customer.service';
import { PropertySearchRequestService } from '../property-search-request/property-search-request.service';
import { MailStatusType } from '../property-search-request/types/property-search-request.types';
import { PropertySearchRequestStatus } from '../property-search-request/types/property-search-request.status.enum';
import { ConfigService } from '@nestjs/config';
import { RealEstateService } from '../real-estate/real-estate.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailProcessingService } from '../mail/mail-processing.service';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly customerService: CustomerService,
    private readonly propertySearchRequestService: PropertySearchRequestService,
    private readonly configService: ConfigService,
    private readonly realEstateService: RealEstateService,
    private readonly prisma: PrismaService,
    private readonly mailProcessingService: MailProcessingService,
  ) {}

  @Cron('*/10 * * * *')
  async handleNewListingNotificationCron() {
    this.logger.debug(`Yeni ilan bildirim cron job'u çalışıyor...`);
    try {
      const endDate = new Date();
      const listingAgeHours = this.configService.get<number>('NEW_LISTING_NOTIFICATION_WINDOW_HOURS') || 1;
      const startDate = new Date(endDate.getTime() - listingAgeHours * 60 * 60 * 1000);

      this.logger.debug(`Yeni ilanlar için arama periyodu: ${startDate} - ${endDate}`);
      
      const newActiveListings = await this.prisma.realEstateListing.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate, 
          },
          status: 'ACTIVE',
        },
        include: {
          lister: true,
        }
      });

      if (!newActiveListings || newActiveListings.length === 0) {
        this.logger.debug(`Belirtilen periyotta işlenecek yeni aktif ilan bulunamadı.`);
        return;
      }

      this.logger.debug(`${newActiveListings.length} adet potansiyel yeni aktif ilan bulundu.`);

      for (const listing of newActiveListings) {
        this.logger.log(`Yeni ilan ${listing.id} için eşleşen alıcılar bilgilendiriliyor...`);
        try {
          await this.mailProcessingService.notifyMatchingBuyersAboutNewListing(listing);
        } catch (error) {
          this.logger.error(
            `İlan ID ${listing.id} için alıcı bildirimleri gönderilirken hata: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Yeni ilan bildirim cron job'u sırasında genel bir hata: ${error.message}`,
        error.stack,
      );
    }
  }

  @Cron('*/1 * * * *')
  async handleReminderCronForMissingInformation() {
    this.logger.debug(`Emlak arama talepleri için eksik bilgi hatırlatma cron job'u çalışıyor...`);
    try {
      const endDate = new Date();
      const reminderDelayHours = this.configService.get<number>('MISSING_INFO_REMINDER_DELAY_HOURS') || 24;
      const checkDateBefore = new Date(endDate.getTime() - reminderDelayHours * 60 * 60 * 1000);

      this.logger.debug(`Eksik bilgili talepler için son kontrol tarihi (öncesi): ${checkDateBefore}`);
      
      const pendingRequests = await this.propertySearchRequestService.findRequestsNeedingFollowUp(        
        PropertySearchRequestStatus.PENDING_USER_INFO,
        checkDateBefore,
      );

      this.logger.debug(`${pendingRequests.length} adet eksik bilgili talep bulundu.`);

      for (const request of pendingRequests) {
        const remindedLog = await this.mailService.findLogEntry(
          request.id.toString(),
          MailStatusType.SEARCH_REQUEST_MISSING_INFO_REMINDER,
        );

        if (remindedLog) {
          this.logger.warn(
            `Talep ${request.id} için daha önce (${remindedLog.createdAt}) hatırlatma gönderilmiş. Atlanıyor.`,
          );
          continue;
        }

        if (!request.customer) {
            this.logger.warn(`Talep ${request.id} için müşteri bilgisi bulunamadı. Atlanıyor.`);
            continue;
        }
        const customer = request.customer;
        const email = customer.email;

        if (!email) {
            this.logger.warn(`Talep ${request.id}, Müşteri ${customer.id} için e-posta bulunamadı. Atlanıyor.`);
            continue;
        }
        
        this.logger.log(`Talep ${request.id} (Müşteri: ${email}) için eksik bilgi hatırlatma maili hazırlanıyor.`);

        await this.mailService.sendGenericReminderMail({
            to: email,
            subject: 'Emlak Arama Talebiniz Hakkında Hatırlatma',
            htmlBody: `<p>Merhaba ${customer.name || 'Müşterimiz'},</p><p>${request.id} numaralı emlak arama talebinizle ilgili olarak bazı ek bilgilere ihtiyacımız bulunmaktadır. Lütfen en kısa sürede bizimle iletişime geçiniz.</p><p>Teşekkürler.</p>`,
            referenceId: request.id.toString(),
            logType: MailStatusType.SEARCH_REQUEST_MISSING_INFO_REMINDER,
        });

        this.logger.log(`Talep ${request.id} için eksik bilgi hatırlatma maili gönderildi: ${email}`);
      }
    } catch (error) {
      this.logger.error(`Eksik bilgi hatırlatma cron job'u sırasında hata: ${error.message}`, error.stack);
    }
  }

  @Cron('*/15 * * * *')
  async handleSendPropertyMatchMail() {
    this.logger.debug(`Bekleyen emlak eşleşme bildirimleri gönderme cron job'u çalışıyor...`);
    try {
      const requestsToNotify = await this.propertySearchRequestService.findRequestsWithStatus(
        PropertySearchRequestStatus.MATCH_FOUND,
      );

      if (!requestsToNotify || requestsToNotify.length === 0) {
        this.logger.debug(`Bildirim bekleyen eşleşmiş talep bulunamadı.`);
        return;
      }

      this.logger.debug(`${requestsToNotify.length} adet talep için eşleşme bildirimi gönderilecek.`);

      for (const request of requestsToNotify) {
        if (!request.customer) {
          this.logger.warn(`Talep ${request.id} için müşteri bilgisi bulunamadı. Eşleşme bildirimi atlanıyor.`);
          continue;
        }

        this.logger.log(`Talep ${request.id} (Müşteri: ${request.customer.email}) için eşleşme bildirimi hazırlanıyor.`);
        try {
          await this.mailProcessingService.notifyBuyerAboutMatchingProperties(request.customer, request);
          
          await this.propertySearchRequestService.updateSearchRequestStatus(
            request.id,
            PropertySearchRequestStatus.MATCH_NOTIFICATION_SENT,
          );
        } catch (error) {
          this.logger.error(
            `Talep ID ${request.id} için eşleşme bildirimi gönderilirken hata: ${error.message}`,
            error.stack,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Emlak eşleşme bildirim cron job'u sırasında hata: ${error.message}`,
        error.stack,
      );
    }
  }
}
