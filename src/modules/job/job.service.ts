import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PositionService } from '../position/position.service';
import { MailService } from '../mail/mail.service';
import { CustomerService } from '../customer/customer.service';
import { OfferService } from '../offer/offer.service';
import { MailStatusType } from '../offer/types/mail.status.type';
import { ConfigService } from '@nestjs/config';
import { OfferStatusType } from '../offer/types/offer.status.type';
@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly positionService: PositionService,
    private readonly mailService: MailService,
    private readonly customerService: CustomerService,
    private readonly offerService: OfferService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('*/10 * * * *')
  async handleCron() {
    this.logger.debug('10 dakikalık zamanlanmış görev çalışıyor...');
    try {
      const endDate = new Date();
      const expiryHours =
        this.configService.get<number>('OFFER_EXPIRY_HOURS') || 24;
      const startDate = new Date(
        endDate.getTime() - expiryHours * 60 * 60 * 1000,
      );

      this.logger.debug(`${startDate} - ${endDate}`);
      const positionFiles = await this.positionService.getPositionFiles(
        undefined,
        startDate,
        endDate,
        true,
      );

      const sendedMailLogs = await this.mailService.getMailLogs({
        startDate,
        endDate,
        limit: 1000,
        offset: 0,
      });

      const newPositionFiles = positionFiles.filter(
        positionFile =>
          !sendedMailLogs.data.some(
            sendedMailLog =>
              sendedMailLog.externalId === positionFile.id.toString(),
          ),
      );

      this.logger.debug(`${newPositionFiles.length} adet yeni dosya bulundu`);

      try {
        for (const positionFile of newPositionFiles) {
          const customer = await this.customerService.getCustomerByExternalId(
            positionFile.companyNo.toString(),
          );

          let customerId: number;
          if (!customer) {
            try {
              const newCustomer = await this.customerService.createCustomer(
                positionFile.companyNo.toString(),
              );
              this.logger.debug(
                `Created new customer: ${JSON.stringify(newCustomer)}`,
              );

              if (!newCustomer || !newCustomer.id) {
                this.logger.error('New customer created but ID is missing');
                customerId = null;
              } else {
                customerId = newCustomer.id;
                this.logger.debug(`New customer ID: ${customerId}`);
              }
            } catch (error) {
              this.logger.error(`Error creating customer: ${error.message}`);
              customerId = null;
            }
          } else {
            customerId = customer.id;
            this.logger.debug(`Using existing customer ID: ${customerId}`);
          }

          const customerMailList =
            await this.customerService.getCustomerMailList(customerId);
          this.logger.debug(
            `Customer mail list: ${JSON.stringify(customerMailList)}`,
          );
          if (customerMailList.length !== 0) {
            positionFile.emails = customerMailList
              .filter(mail => mail.isSend)
              .map(mail => mail.mail)
              .filter(
                mail => mail && typeof mail === 'string' && mail.trim() !== '',
              );

            this.logger.debug(
              `Email addresses for position ${positionFile.pozNo}: ${JSON.stringify(positionFile.emails)}`,
            );
          } else {
            positionFile.emails = [];
            this.logger.warn(
              `No email addresses found for position ${positionFile.pozNo}`,
            );
          }

          if (positionFile.emails && positionFile.emails.length > 0) {
            await this.mailService.sendFileNotification([positionFile]);
            this.logger.debug(
              `Mail bildirimi gönderildi: ${positionFile.pozNo} - Alıcılar: ${positionFile.emails.join(', ')}`,
            );
          } else {
            this.logger.warn(
              `Mail gönderilemedi: ${positionFile.pozNo} - Geçerli e-posta adresi bulunamadı`,
            );
          }
        }
      } catch (error) {
        this.logger.error('Mail gönderimi sırasında hata oluştu:', error);
      }
    } catch (error) {
      this.logger.error('Zamanlanmış görev hatası:', error);
    }
  }

  @Cron('*/1 * * * *')
  async handleReminderCronForMissingInformation() {
    this.logger.debug('Handle reminder cron for missing information');
    try {
      const endDate = new Date();
      const expiryHours =
        this.configService.get<number>('OFFER_EXPIRY_HOURS') || 0.0167;
      const startDate = new Date(0);
      const checkDate = new Date(
        endDate.getTime() - expiryHours * 60 * 60 * 1000,
      );

      this.logger.debug(`Kontrol tarihi: ${checkDate}`);
      const offers = await this.offerService.getOfferList({
        status: OfferStatusType.OFFER_MISSING_INFORMATION,
        startDate,
        endDate: checkDate,
      });

      this.logger.debug(`${offers.data.length} adet yeni teklif bulundu`);

      try {
        for (const offer of offers.data) {
          // Burada eksik bilgileri olan teklifler için hatırlatma maili gönderilecek
          this.logger.debug(
            `Hatırlatma maili gönderilecek teklif: ${offer.offerNo}`,
          );

          const isReminded = offer.mailLogs.find(
            mailLog =>
              mailLog.type ===
              MailStatusType.CUSTOMER_REQUEST_CORRECTION_REMINDED,
          );

          if (isReminded) {
            this.logger.warn(
              `Offer ${offer.offerNo} already reminded`,
              isReminded,
            );
            continue;
          }

          const mailLog = offer.mailLogs.find(
            mailLog =>
              mailLog.type === MailStatusType.CUSTOMER_REQUEST_CORRECTION,
          );

          if (!mailLog) {
            this.logger.warn(`No mail log found for offer: ${offer.offerNo}`);
            continue;
          }

          const email = mailLog.to;

          await this.mailService.sendMissingOfferMail({
            offerNo: offer.offerNo,
            content: mailLog.contentBody,
            contentTitle: mailLog.contentTitle,
            contact: {
              name: '',
              email,
              gender: '',
            },
            ccMails: mailLog.cc.split(','),
            language: mailLog.language,
            logType: MailStatusType.CUSTOMER_REQUEST_CORRECTION_REMINDED,
          });
        }
      } catch (error) {
        this.logger.error('Mail gönderimi sırasında hata oluştu:', error);
      }
    } catch (error) {
      this.logger.error('Zamanlanmış görev hatası:', error);
    }
  }

  @Cron('*/1 * * * *')
  async handleReminderCronForSupplierOffer() {
    this.logger.debug('Handle reminder cron for supplier offer');
    try {
      const endDate = new Date();
      const expiryHours =
        this.configService.get<number>('OFFER_EXPIRY_HOURS') || 0.0167;
      const startDate = new Date(0);
      const checkDate = new Date(
        endDate.getTime() - expiryHours * 60 * 60 * 1000,
      );

      this.logger.debug(`Kontrol tarihi: ${checkDate}`);

      const offerList = await this.offerService.getOfferList({
        status: OfferStatusType.FEE_REQUEST_FOR_OFFER,
        startDate,
        endDate,
        limit: 1000,
        offset: 0,
      });

      this.logger.debug(`${offerList.data.length} adet teklif bulundu`);

      try {
        for (const offer of offerList.data) {
          // Burada eksik bilgileri olan teklifler için hatırlatma maili gönderilecek
          this.logger.debug(`Reminder for offer: ${offer.offerNo}`);

          const mailLogs = offer.mailLogs.filter(
            mailLog => mailLog.type === MailStatusType.FEE_REQUEST_FOR_OFFER,
          );

          if (mailLogs.length === 0) {
            this.logger.warn(`No mail log found for offer: ${offer.offerNo}`);
            continue;
          }

          for (const mailLog of mailLogs) {
            const isReminded = offer.mailLogs.find(
              mail =>
                mail.type === MailStatusType.FEE_REQUEST_FOR_OFFER_REMINDED &&
                mail.to === mailLog.to,
            );

            if (isReminded) {
              this.logger.warn(`Offer ${offer.offerNo} already reminded`);
              continue;
            }

            const email = mailLog.to;
            const supplier = offer.SupplierOffer.find(
              so => so.supplierContact.email === email,
            );

            await this.mailService.sendPriceRequestToSupplier({
              offerNo: offer.offerNo,
              mailContent: mailLog.contentBody,
              mailTitle: mailLog.contentTitle,
              supplier: {
                name: supplier.supplierContact.name,
                email,
                gender: supplier.supplierContact.gender,
              },
              language: mailLog.language,
              type: MailStatusType.FEE_REQUEST_FOR_OFFER_REMINDED,
              ccMails: mailLog.cc.split(','),
            });
          }

          const supplierOffers = offer.SupplierOffer;

          // Find the lowest non-null price from supplier offers
          const validPrices = supplierOffers
            .filter(so => so.price !== null && !so.supplierContact.deletedAt)
            .map(so => ({
              price: so.price,
              supplierContact: so.supplierContact,
            }));

          if (validPrices.length > 0) {
            // Extract numeric value from price string (assuming format like "59 euro")
            const lowestPriceOffer = validPrices.reduce((lowest, current) => {
              const currentPrice = parseFloat(current.price.split(' ')[0]);
              const lowestPrice = parseFloat(lowest.price.split(' ')[0]);
              return currentPrice < lowestPrice ? current : lowest;
            }, validPrices[0]);

            // Calculate final price with margins
            const calculatedPrice = await this.offerService.calculateOffer(
              lowestPriceOffer.price,
            );

            // Send email with calculated price
            await this.mailService.sendCalculatedPriceEmail({
              offerNo: offer.offerNo,
              originalPrice: lowestPriceOffer.price,
              calculatedPrice: calculatedPrice.finalPrice,
              rate: calculatedPrice.rate,
              profitMargin: calculatedPrice.profitMargin,
              supplierContact: lowestPriceOffer.supplierContact,
            });
          }
        }
      } catch (error) {
        this.logger.error('Mail gönderimi sırasında hata oluştu:', error);
      }
    } catch (error) {
      this.logger.error('Zamanlanmış görev hatası:', error);
    }
  }

  @Cron('*/1 * * * *')
  async handleSendOfferMail() {
    this.logger.debug('Handle send offer mail');
    try {
      const endDate = new Date();
      const expiryHours =
        this.configService.get<number>('OFFER_EXPIRY_MINUTE_FOR_COMPLETE') ||
        10;
      const startDate = new Date(0);
      const checkDate = new Date(endDate.getTime() - expiryHours * 60 * 1000);
      const offerList = await this.offerService.getOfferList({
        status: OfferStatusType.WAITING_COMPLETE_FOR_OFFER,
        startDate,
        endDate: checkDate,
        limit: 1000,
        offset: 0,
      });

      this.logger.debug(`${offerList.data.length} adet teklif bulundu`);

      for (const offer of offerList.data) {
        const supplierOffers = offer.SupplierOffer;
        if (supplierOffers && supplierOffers.length > 0) {
          // Filter valid prices (non-null and supplier not deleted)
          const validPrices = supplierOffers
            .filter(so => so.price !== null && !so.supplierContact.deletedAt)
            .map(so => ({
              price: so.price,
              supplierContact: so.supplierContact,
            }));

          if (validPrices.length > 0) {
            // Find the lowest price offer
            const lowestPriceOffer = validPrices.reduce((lowest, current) => {
              const currentPrice = parseFloat(current.price.split(' ')[0]);
              const lowestPrice = parseFloat(lowest.price.split(' ')[0]);
              return currentPrice < lowestPrice ? current : lowest;
            }, validPrices[0]);

            // Calculate final price with margins
            const calculatedPrice = await this.offerService.calculateOffer(
              lowestPriceOffer.price,
            );

            // Get customer email from the first customer request mail log
            const customerMailLog = await this.mailService.getMailLogs({
              offerNo: offer.offerNo,
              type: MailStatusType.CUSTOMER_NEW_OFFER_REQUEST,
              startDate: new Date(0),
              endDate: new Date(),
              limit: 1,
              offset: 0,
            });

            if (customerMailLog.data.length > 0) {
              // Send email with calculated price
              await this.mailService.sendCalculatedPriceEmail({
                offerNo: offer.offerNo,
                originalPrice: lowestPriceOffer.price,
                calculatedPrice: calculatedPrice.finalPrice,
                rate: calculatedPrice.rate,
                profitMargin: calculatedPrice.profitMargin,
                supplierContact: lowestPriceOffer.supplierContact,
              });

              // Update offer status
              await this.offerService.updateOffer(offer.offerNo, {
                status: OfferStatusType.OFFER_COMPLETED,
              });

              this.logger.debug(
                `Calculated price sent to customer for offer ${offer.offerNo}`,
              );
            } else {
              this.logger.warn(
                `No customer mail found for offer ${offer.offerNo}`,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Mail gönderimi sırasında hata oluştu:', error);
    }
  }
}
