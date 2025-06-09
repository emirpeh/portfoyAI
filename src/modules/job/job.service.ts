import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { PropertySearchRequestStatus } from '../property-search-request/types/property-search-request.status.enum';
import { MailStatusType } from '../property-search-request/types/property-search-request.types';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly database: DatabaseService,
  ) { }

  @Cron('*/10 * * * *')
  async handleNewListingNotificationCron() {
    this.logger.debug(
      'handleNewListingNotificationCron job is running, but the logic needs reimplementation after removing MailProcessingService.',
    );
  }

  @Cron('*/1 * * * *')
  async handleReminderCronForMissingInformation() {
    this.logger.debug(
      `Emlak arama talepleri için eksik bilgi hatırlatma cron job'u çalışıyor...`,
    );
    try {
      const endDate = new Date();
      const reminderDelayHours =
        this.configService.get<number>('MISSING_INFO_REMINDER_DELAY_HOURS') || 24;
      const checkDateBefore = new Date(
        endDate.getTime() - reminderDelayHours * 60 * 60 * 1000,
      );

      const pendingRequests = await this.database.propertySearchRequest.findMany({
        where: {
          status: PropertySearchRequestStatus.PENDING_USER_INFO,
          createdAt: {
            lt: checkDateBefore,
          },
        },
        include: {
          customer: true,
        },
      });

      if (pendingRequests.length > 0) {
        this.logger.debug(`${pendingRequests.length} adet eksik bilgili talep bulundu.`);
      }

      for (const request of pendingRequests) {
        const remindedLog = await this.mailService.findLogEntry(
          request.id.toString(),
          'SEARCH_REQUEST_MISSING_INFO_REMINDER',
        );

        if (remindedLog) {
          continue;
        }

        if (!request.customer || !request.customer.email) {
          this.logger.warn(`Talep ${request.id} için müşteri veya e-posta bilgisi eksik. Atlanıyor.`);
          continue;
        }

        const { customer } = request;

        this.logger.log(`Talep ${request.id} (Müşteri: ${customer.email}) için eksik bilgi hatırlatma maili hazırlanıyor.`);

        await this.mailService.sendGenericReminderMail({
          to: customer.email,
          subject: 'Emlak Arama Talebiniz Hakkında Hatırlatma',
          htmlBody: `<p>Merhaba ${customer.name || 'Müşterimiz'},</p><p>${request.id} numaralı emlak arama talebinizle ilgili olarak bazı ek bilgilere ihtiyacımız bulunmaktadır. Lütfen en kısa sürede bizimle iletişime geçiniz.</p><p>Teşekkürler.</p>`,
          referenceId: request.id.toString(),
          logType: 'SEARCH_REQUEST_MISSING_INFO_REMINDER',
        });

        this.logger.log(`Talep ${request.id} için eksik bilgi hatırlatma maili gönderildi: ${customer.email}`);
      }
    } catch (error) {
      this.logger.error(`Eksik bilgi hatırlatma cron job'u sırasında hata: ${error.message}`, error.stack);
    }
  }

  @Cron('*/15 * * * *')
  async handleSendPropertyMatchMail() {
    this.logger.debug(
      'handleSendPropertyMatchMail job is running, but the logic needs reimplementation after removing MailProcessingService.',
    );
  }
}
