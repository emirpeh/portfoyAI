import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';
import { generateFileNotificationTemplate } from './templates/file-notification.template';
import { ConfigService } from '@nestjs/config';
import { SupportedLanguages } from '../offer/types/supported.languages.type';
import { createTurkishNoSupplierInfoTemplate } from './templates/languages/turkish/no-supplier.to.maxi-logistics';
import { createTurkishNoSupplierInfoTitleTemplate } from './templates/languages/turkish/no-supplier.to.maxi-logistics';
import {
  createTurkishRequestPriceTitleTemplate,
  createTurkishRequestPriceTemplate,
} from './templates/languages/turkish/request.price.from.supplier';
import {
  createTurkishCalculatedPriceTitleTemplate,
  createTurkishCalculatedPriceTemplate,
} from './templates/languages/turkish/calculated.price.to.maxi-logistics';
import {
  createEnglishCalculatedPriceTitleTemplate,
  createEnglishCalculatedPriceTemplate,
} from './templates/languages/english/calculated.price.to.maxi-logistics';
import {
  createCroatianCalculatedPriceTitleTemplate,
  createCroatianCalculatedPriceTemplate,
} from './templates/languages/croatian/calculated.price.to.maxi-logistics';
import {
  createBosnianCalculatedPriceTitleTemplate,
  createBosnianCalculatedPriceTemplate,
} from './templates/languages/bosnian/calculated.price.to.maxi-logistics';
import {
  createMacedonianCalculatedPriceTitleTemplate,
  createMacedonianCalculatedPriceTemplate,
} from './templates/languages/macedonian/calculated.price.to.maxi-logistics';
import {
  createSlovenianCalculatedPriceTitleTemplate,
  createSlovenianCalculatedPriceTemplate,
} from './templates/languages/slovenian/calculated.price.to.maxi-logistics';
import {
  createCroatianRequestPriceTitleTemplate,
  createCroatianRequestPriceTemplate,
} from './templates/languages/croatian/request.price.from.supplier';
import {
  createSlovenianRequestPriceTitleTemplate,
  createSlovenianRequestPriceTemplate,
} from './templates/languages/slovenian/request.price.from.supplier';
import {
  createBosnianRequestPriceTitleTemplate,
  createBosnianRequestPriceTemplate,
} from './templates/languages/bosnian/request.price.from.supplier';
import {
  createMacedonianRequestPriceTitleTemplate,
  createMacedonianRequestPriceTemplate,
} from './templates/languages/macedonian/request.price.from.supplier';
import { createEnglishRequestPriceTemplate } from './templates/languages/english/request.price.from.supplier';
import { createEnglishRequestPriceTitleTemplate } from './templates/languages/english/request.price.from.supplier';
import { CustomerService } from '../customer/customer.service';
import { OfferService } from '../offer/offer.service';
import { SupplierService } from '../supplier/supplier.service';
import { createTurkishExpiredOfferTemplate } from './templates/languages/turkish/expired.offer.to.maxi-logistics';
import { createWaitingForPricingTitleTemplate } from './templates/languages/turkish/waiting-for-pricing.to.maxi-logistics';
import { createWaitingForPricingTemplate } from './templates/languages/turkish/waiting-for-pricing.to.maxi-logistics';
import { createTurkishLateSupplierOfferTemplate } from './templates/languages/turkish/late.supplier.offer.to.maxi-logistics';
import { createTurkishLateSupplierOfferTitleTemplate } from './templates/languages/turkish/late.supplier.offer.to.maxi-logistics';
import { GptService } from '../gpt/gpt.service';
import { OfferStatusType } from '../offer/types/offer.status.type';
import { MailStatusType } from '../offer/types/mail.status.type';

interface FileWithEmails {
  id: number;
  pozNo: string;
  DosyaAdi: string;
  customer: string;
  sender: string;
  receiver: string;
  tarih: Date;
  aciklama: string;
  firma: string;
  yol: string;
  Tip: string;
  belge: string;
  ftpyol: string;
  emails: string[];
}

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
  constructor(
    private mailerService: MailerService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private customerService: CustomerService,
    @Inject(forwardRef(() => OfferService))
    private offerService: OfferService,
    private supplierService: SupplierService,
    private gptService: GptService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    this.defaultMailList =
      this.configService.get<string>('DEFAULT_MAIL_LIST').split(',') || [];

    this.defaultMail = this.configService.get<string>('DEFAULT_MAIL');
    this.logger = new Logger(MailService.name);
  }

  async processMail(mail: GetMail) {
    try {
      const startDate = new Date();
      startDate.setHours(
        startDate.getHours() -
          this.configService.get<number>('OFFER_EXPIRY_HOURS_FOR_ALL'),
      );
      const getMailLogList = await this.getMailLogs({
        to: mail.from[0].address,
        startDate,
        endDate: new Date(),
        limit: 1,
        offset: 0,
      });

      const getMailLog = getMailLogList.data[0];

      let offer;
      if (getMailLog && getMailLog.externalId) {
        this.logger.log('Mail log found for mail', mail);
        offer = await this.offerService.findOffer(getMailLog.externalId);
      }

      const userPrompt = `
        Gelen mail bilgileri:
        From Email Address: ${JSON.stringify(mail.from, null, 2)}
        To Email Address: ${JSON.stringify(mail.to, null, 2)}
        Subject: ${mail.subject}
        Body: ${JSON.stringify(mail.body, null, 2)}
        Date: ${mail.date}
        cc: ${JSON.stringify(mail.cc, null, 2)}
        Önceki Mail Log: ${JSON.stringify(getMailLog, null, 2)},
        Offer: ${JSON.stringify(offer, null, 2)}
      `;

      const response = await this.gptService.generateResponse(
        userPrompt,
        'user',
        'gpt-4o',
      );

      const jsonResponse = JSON.parse(response);

      await this.offerService.processOffer(jsonResponse, offer);
    } catch (error) {
      this.logger.error(`Email analysis error: ${error.message}`);
      throw error;
    }
  }

  async sendFileNotification(files: FileWithEmails[]) {
    for (const file of files) {
      const htmlContent = generateFileNotificationTemplate({
        file,
        baseUrl: this.baseUrl,
      });

      if (!file.emails || file.emails.length === 0) {
        console.warn(
          `No valid email addresses found for file: ${file.DosyaAdi} (${file.pozNo})`,
        );
        continue;
      }

      for (const email of file.emails) {
        // E-posta adresinin geçerli olduğunu kontrol et
        if (!email || typeof email !== 'string' || email.trim() === '') {
          console.warn(
            `Invalid email address: ${email} for file: ${file.DosyaAdi}`,
          );
          continue;
        }

        try {
          const title = `Yeni Dosya Bildirimi / New File Notification ${file.sender} - ${file.receiver}`;
          await this.mailerService.sendMail({
            to: email,
            subject: title,
            html: htmlContent,
          });
          const customerContact =
            await this.customerService.getCustomerContact(email);
          await this.createMailLog({
            type: MailStatusType.FILE_NOTIFICATION,
            externalId: file.id.toString(),
            from: this.defaultMail,
            to: email,
            cc: [],
            contentTitle: title,
            contentBody: htmlContent,
            supplierOfferId: file.id,
            customerMailListId: customerContact?.id,
            supplierContactId: customerContact?.id,
            language: 'turkish',
          });
          console.log(
            `Mail successfully sent to ${email} for file: ${file.DosyaAdi}`,
          );
        } catch (error) {
          console.error(`Mail gönderimi başarısız - ${email}:`, error);
        }
      }
    }
  }

  async createMailLog({
    type,
    externalId,
    from,
    to,
    cc,
    contentTitle,
    contentBody,
    supplierOfferId,
    customerMailListId,
    supplierContactId,
    offerId,
    language,
  }: {
    type: MailStatusType;
    externalId: string;
    from: string;
    to: string;
    cc: string[];
    contentTitle: string;
    contentBody: string;
    supplierOfferId?: number;
    customerMailListId?: number;
    supplierContactId?: number;
    offerId?: number;
    language?: string;
  }) {
    const data: any = {
      externalId,
      type,
      from,
      to,
      cc: cc.join(','),
      contentTitle,
      contentBody,
      language,
    };

    if (customerMailListId) {
      data.customerMailListId = customerMailListId;
    }

    if (supplierOfferId) {
      data.supplierOfferId = supplierOfferId;
    }

    if (supplierContactId) {
      data.supplierContactId = supplierContactId;
    }

    if (offerId) {
      data.offerId = offerId;
    }

    return await this.prisma.mailLogs.create({
      data,
    });
  }

  async getMailLogs({
    customerId,
    startDate,
    endDate,
    type,
    offerNo,
    limit,
    offset,
    to,
    includeSupplierOffer,
    includeOffer,
    includeCustomer,
  }: {
    customerId?: number;
    startDate: Date;
    endDate: Date;
    type?: MailStatusType;
    externalId?: string;
    offerNo?: string;
    limit: number;
    offset: number;
    to?: string;
    includeSupplierOffer?: boolean;
    includeOffer?: boolean;
    includeCustomer?: boolean;
  }) {
    const where = {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
      deletedAt: null,
      ...(customerId && { customerMailListId: customerId }),
      ...(type && { type }),
      ...(offerNo && { externalId: { contains: offerNo } }),
      ...(to && { to }),
    };

    const [total, data] = await Promise.all([
      this.prisma.mailLogs.count({ where }),
      this.prisma.mailLogs.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          ...(includeSupplierOffer && { supplierOffer: true }),
          ...(includeOffer && { offer: true }),
          ...(includeCustomer && { customerMailList: true }),
        },
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  getMailTypes() {
    return [...Object.values(MailStatusType)];
  }

  async sendMissingOfferMail({
    offerNo,
    content,
    contentTitle,
    contact,
    logType,
    ccMails,
    language,
  }: {
    offerNo: string;
    content: string;
    contentTitle: string;
    contact: {
      name: string;
      email: string;
      gender: string;
    };
    logType: MailStatusType;
    ccMails?: string[];
    language?: string;
  }) {
    try {
      const mailOptions = {
        to: contact.email,
        cc: ccMails || [],
      };

      await this.mailerService.sendMail({
        ...mailOptions,
        subject: contentTitle,
        html: content,
      });

      const supplierContact = await this.supplierService.findByEmail(
        contact.email,
      );

      const offer = await this.offerService.findOffer(offerNo);

      await this.createMailLog({
        type: logType,
        externalId: offerNo,
        from: this.defaultMail,
        to: contact.email,
        cc: ccMails || [],
        contentTitle: contentTitle,
        contentBody: content,
        offerId: offer.id,
        supplierContactId: supplierContact?.id,
        language: language || 'turkish',
      });
    } catch (error) {
      console.error(`Mail gönderimi başarısız - ${contact.email}:`, error);
    }
  }

  async sendNoSupplierMail(
    offerNo: string,
    customerMail: string,
    questions: object,
  ) {
    try {
      const mailOptions = {
        to: this.defaultMail,
        cc: this.defaultMailList,
      };
      const title = createTurkishNoSupplierInfoTitleTemplate(offerNo);
      const htmlContent = createTurkishNoSupplierInfoTemplate({
        baseUrl: this.baseUrl,
        offerNo,
        customerMail,
        questions,
      });
      await this.mailerService.sendMail({
        ...mailOptions,
        subject: title,
        html: htmlContent,
      });

      const offer = await this.offerService.findOffer(offerNo);

      await this.createMailLog({
        type: MailStatusType.CUSTOMER_REQUEST_CORRECTION,
        externalId: offerNo,
        from: this.defaultMail,
        to: customerMail,
        cc: this.defaultMailList,
        contentTitle: title,
        contentBody: htmlContent,
        offerId: offer.id,
        language: 'turkish',
      });
    } catch (error) {
      console.error(`Mail gönderimi başarısız - ${customerMail}:`, error);
    }
  }

  async sendPriceRequestToSupplier({
    offerNo,
    mailContent,
    mailTitle,
    supplier,
    language,
    type,
    ccMails,
  }: {
    offerNo: string;
    mailContent: string;
    mailTitle: string;
    supplier: {
      name: string;
      email: string;
      gender: string;
    };
    language: string;
    type: MailStatusType;
    ccMails?: string[];
  }) {
    try {
      const mailOptions = {
        to: supplier.email,
        cc: ccMails || [],
      };

      // Find or create supplier contact
      let supplierContact = await this.supplierService.findByEmail(
        supplier.email,
      );
      if (!supplierContact) {
        supplierContact = await this.prisma.supplierContactList.create({
          data: {
            name: supplier.name,
            email: supplier.email,
            gender: supplier.gender,
            companyName: '', // You might want to add this to the supplier parameter
            countries: '', // You might want to add this to the supplier parameter
            foreignTrades: '', // You might want to add this to the supplier parameter
            language: language,
          },
        });
      }

      // Find the offer
      const offer = await this.offerService.findOffer(offerNo);
      if (!offer) {
        throw new Error(`Offer ${offerNo} not found`);
      }

      // Find or create supplier offer
      let supplierOffer = await this.prisma.supplierOffer.findFirst({
        where: {
          offerId: offer.id,
          supplierContactId: supplierContact.id,
          deletedAt: null,
        },
      });

      if (!supplierOffer) {
        supplierOffer = await this.prisma.supplierOffer.create({
          data: {
            offerId: offer.id,
            supplierContactId: supplierContact.id,
          },
        });
      }

      await this.mailerService.sendMail({
        ...mailOptions,
        subject: mailTitle,
        html: mailContent,
      });

      await this.createMailLog({
        type,
        externalId: offerNo,
        from: this.defaultMail,
        to: supplier.email,
        cc: ccMails || [],
        contentTitle: mailTitle,
        contentBody: mailContent,
        supplierOfferId: supplierOffer.id,
        supplierContactId: supplierContact.id,
        offerId: offer.id,
        language: language || 'turkish',
      });
    } catch (error) {
      console.error(
        `Fiyat teklifi maili gönderimi başarısız - ${supplier.email}:`,
        error,
      );
    }
  }

  async sendWaitingForPricingMail(offerNo: string, offerExpiryHours: number) {
    try {
      const mailOptions = {
        to: this.defaultMail,
        cc: this.defaultMailList,
      };

      const title = createWaitingForPricingTitleTemplate(offerNo);
      const htmlContent = createWaitingForPricingTemplate({
        baseUrl: this.baseUrl,
        offerNo,
        offerExpiryHours,
      });

      await this.mailerService.sendMail({
        ...mailOptions,
        subject: title,
        html: htmlContent,
      });

      const offer = await this.offerService.findOffer(offerNo);

      await this.createMailLog({
        type: MailStatusType.INTERNAL_INFORMATION,
        externalId: offer.id.toString(),
        from: this.defaultMail,
        to: this.defaultMail,
        cc: this.defaultMailList,
        contentTitle: title,
        contentBody: htmlContent,
        offerId: offer.id,
        language: 'turkish',
      });
    } catch (error) {
      console.error(
        `Waiting for pricing maili gönderimi başarısız - ${this.defaultMail}:`,
        error,
      );
    }
  }

  async sendExpiredOfferMail(
    offerNo: string,
    contact: {
      name: string;
      email: string;
      gender: string;
    },
    hours: number,
  ) {
    try {
      const mailOptions = {
        to: this.defaultMail,
        cc: this.defaultMailList,
      };

      const title = `${hours} Saat Geçti - Teklif Düzeltme / ${hours} Hours Passed - Offer Correction ${offerNo}`;
      const htmlContent = createTurkishExpiredOfferTemplate({
        baseUrl: this.baseUrl,
        offerNo,
      });

      await this.mailerService.sendMail({
        ...mailOptions,
        subject: title,
        html: htmlContent,
      });

      const offer = await this.offerService.findOffer(offerNo);

      await this.createMailLog({
        type: MailStatusType.INTERNAL_INFORMATION,
        externalId: offerNo,
        from: this.defaultMail,
        to: contact.email,
        cc: this.defaultMailList,
        contentTitle: title,
        contentBody: htmlContent,
        offerId: offer.id,
        language: 'turkish',
      });
    } catch (error) {
      console.error(`An error occurred while sending internal mail:`, error);
    }
  }

  async sendLateSupplierOfferMail(
    offerNo: string,
    supplierInfo: {
      from: string;
      contentTitle: string;
      contentHtml: string;
    },
    hours: number,
  ) {
    try {
      const mailOptions = {
        to: this.defaultMail,
        cc: this.defaultMailList,
      };

      const title = createTurkishLateSupplierOfferTitleTemplate(offerNo, hours);
      const htmlContent = createTurkishLateSupplierOfferTemplate({
        baseUrl: this.baseUrl,
        offerNo,
        hours,
        supplierEmail: supplierInfo.from,
        supplierTitle: supplierInfo.contentTitle,
        supplierContent: supplierInfo.contentHtml,
      });

      await this.mailerService.sendMail({
        ...mailOptions,
        subject: title,
        html: htmlContent,
      });

      const offer = await this.offerService.findOffer(offerNo);

      await this.createMailLog({
        type: MailStatusType.SUPPLIER_NEW_OFFER,
        externalId: offerNo,
        from: this.defaultMail,
        to: this.defaultMail,
        cc: this.defaultMailList,
        contentTitle: title,
        contentBody: htmlContent,
        offerId: offer.id,
        language: 'turkish',
      });
    } catch (error) {
      console.error(`Late supplier offer mail gönderimi başarısız:`, error);
    }
  }

  async sendMail(
    to: string,
    subject: string,
    content: string,
    cc: string[] = [],
    supplierContactId?: number,
    supplierOfferId?: number,
    price?: string,
    note?: string,
    language?: string,
  ) {
    try {
      // Save supplier result if supplierContactId and price are provided
      if (supplierContactId && price) {
        const supplierContact =
          await this.prisma.supplierContactList.findUnique({
            where: { id: supplierContactId },
            include: {
              supplierOffers: {
                where: {
                  deletedAt: null,
                  id: supplierOfferId,
                },
                include: {
                  offer: true,
                },
              },
            },
          });

        if (supplierContact && supplierContact.supplierOffers.length > 0) {
          const offer = supplierContact.supplierOffers[0].offer;
          await this.prisma.offerResult.create({
            data: {
              offerId: offer.id,
              supplierContactId,
              price,
              note,
            },
          });

          // Update offer status to OFFER_COMPLETED
          await this.prisma.offer.update({
            where: { id: offer.id },
            data: {
              status: OfferStatusType.OFFER_COMPLETED,
            },
          });
        }
      }

      await this.mailerService.sendMail({
        to,
        cc,
        subject,
        html: content,
      });

      await this.createMailLog({
        type: MailStatusType.OTHER,
        externalId: '',
        from: this.defaultMail,
        to,
        cc,
        contentTitle: subject,
        contentBody: content,
        language: language || 'turkish',
      });

      return { success: true, message: 'Mail sent successfully' };
    } catch (error) {
      this.logger.error(`Mail gönderimi başarısız - ${to}:`, error);
      throw error;
    }
  }

  async sendCalculatedPriceEmail({
    offerNo,
    originalPrice,
    calculatedPrice,
    rate,
    profitMargin,
    supplierContact,
  }: {
    offerNo: string;
    originalPrice: string;
    calculatedPrice: string;
    rate: string;
    profitMargin: string;
    supplierContact: {
      name: string;
      email: string;
      companyName: string;
      gender: string;
      language?: string;
    };
  }) {
    try {
      const offer = await this.offerService.findOffer(offerNo);
      if (!offer) {
        throw new Error(`Offer ${offerNo} not found`);
      }

      // Get customer email from the first customer request mail log
      const customerMailLog = await this.getMailLogs({
        offerNo,
        type: MailStatusType.CUSTOMER_NEW_OFFER_REQUEST,
        startDate: new Date(0),
        endDate: new Date(),
        limit: 1,
        offset: 0,
      });

      if (!customerMailLog.data.length) {
        throw new Error(`No customer mail found for offer ${offerNo}`);
      }

      const customerEmail = customerMailLog.data[0].from;

      const mailOptions = {
        to: customerEmail,
        cc: this.defaultMailList,
      };

      let title: string;
      let htmlContent: string;

      const templateProps = {
        offerNo,
        originalPrice,
        calculatedPrice,
        rate,
        profitMargin,
        supplierContact,
      };

      // Use customer's language preference if available, otherwise use supplier's language
      const language =
        customerMailLog.data[0].language || supplierContact.language;

      switch (language) {
        case SupportedLanguages.ENGLISH:
          title = createEnglishCalculatedPriceTitleTemplate(offerNo);
          htmlContent = createEnglishCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.CROATIAN:
          title = createCroatianCalculatedPriceTitleTemplate(offerNo);
          htmlContent = createCroatianCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.BOSNIAN:
          title = createBosnianCalculatedPriceTitleTemplate(offerNo);
          htmlContent = createBosnianCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.MACEDONIAN:
          title = createMacedonianCalculatedPriceTitleTemplate(offerNo);
          htmlContent = createMacedonianCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.SLOVENIAN:
          title = createSlovenianCalculatedPriceTitleTemplate(offerNo);
          htmlContent = createSlovenianCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.TURKISH:
        default:
          title = createTurkishCalculatedPriceTitleTemplate(offerNo);
          htmlContent = createTurkishCalculatedPriceTemplate(templateProps);
          break;
      }

      await this.mailerService.sendMail({
        ...mailOptions,
        subject: title,
        html: htmlContent,
      });

      await this.createMailLog({
        type: MailStatusType.CUSTOMER_OFFER_RESULT,
        externalId: offerNo,
        from: this.defaultMail,
        to: customerEmail,
        cc: this.defaultMailList,
        contentTitle: title,
        contentBody: htmlContent,
        offerId: offer.id,
        language: language || 'turkish',
      });

      // Update offer status
      await this.offerService.updateOffer(offerNo, {
        status: OfferStatusType.OFFER_COMPLETED,
      });
    } catch (error) {
      console.error(`Calculated price mail sending failed - ${error.message}`);
      throw error;
    }
  }

  async getEmailTemplate(params: {
    language: SupportedLanguages;
    offerNo: string;
    type: 'REQUEST_PRICE' | 'CALCULATED_PRICE';
    supplierContact?: {
      name: string;
      email: string;
      companyName: string;
      gender: string;
    };
    details?: {
      originalPrice?: string;
      calculatedPrice?: string;
      rate?: string;
      profitMargin?: string;
    };
    deadline?: string;
  }) {
    const { language, offerNo, type, supplierContact, details, deadline } =
      params;

    let title: string;
    let content: string;

    if (type === 'REQUEST_PRICE') {
      switch (language) {
        case SupportedLanguages.TURKISH:
          title = createTurkishRequestPriceTitleTemplate(offerNo);
          content = createTurkishRequestPriceTemplate({
            name: supplierContact.name,
            offerNo,
            details,
            deadline,
          });
          break;

        case SupportedLanguages.ENGLISH:
          title = createEnglishRequestPriceTitleTemplate(offerNo);
          content = createEnglishRequestPriceTemplate({
            name: supplierContact.name,
            offerNo,
            details,
            deadline,
          });
          break;

        case SupportedLanguages.CROATIAN:
          title = createCroatianRequestPriceTitleTemplate(offerNo);
          content = createCroatianRequestPriceTemplate({
            name: supplierContact.name,
            offerNo,
            details,
            deadline,
          });
          break;

        case SupportedLanguages.SLOVENIAN:
          title = createSlovenianRequestPriceTitleTemplate(offerNo);
          content = createSlovenianRequestPriceTemplate({
            name: supplierContact.name,
            offerNo,
            details,
            deadline,
          });
          break;

        case SupportedLanguages.BOSNIAN:
          title = createBosnianRequestPriceTitleTemplate(offerNo);
          content = createBosnianRequestPriceTemplate({
            name: supplierContact.name,
            offerNo,
            details,
            deadline,
          });
          break;

        case SupportedLanguages.MACEDONIAN:
          title = createMacedonianRequestPriceTitleTemplate(offerNo);
          content = createMacedonianRequestPriceTemplate({
            name: supplierContact.name,
            offerNo,
            details,
            deadline,
          });
          break;

        default:
          title = createEnglishRequestPriceTitleTemplate(offerNo);
          content = createEnglishRequestPriceTemplate({
            name: supplierContact.name,
            offerNo,
            details,
            deadline,
          });
      }
    } else if (type === 'CALCULATED_PRICE') {
      const templateProps = {
        offerNo,
        originalPrice: details.originalPrice,
        calculatedPrice: details.calculatedPrice,
        rate: details.rate,
        profitMargin: details.profitMargin,
        supplierContact,
      };

      switch (language) {
        case SupportedLanguages.TURKISH:
          title = createTurkishCalculatedPriceTitleTemplate(offerNo);
          content = createTurkishCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.ENGLISH:
          title = createEnglishCalculatedPriceTitleTemplate(offerNo);
          content = createEnglishCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.CROATIAN:
          title = createCroatianCalculatedPriceTitleTemplate(offerNo);
          content = createCroatianCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.BOSNIAN:
          title = createBosnianCalculatedPriceTitleTemplate(offerNo);
          content = createBosnianCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.MACEDONIAN:
          title = createMacedonianCalculatedPriceTitleTemplate(offerNo);
          content = createMacedonianCalculatedPriceTemplate(templateProps);
          break;

        case SupportedLanguages.SLOVENIAN:
          title = createSlovenianCalculatedPriceTitleTemplate(offerNo);
          content = createSlovenianCalculatedPriceTemplate(templateProps);
          break;

        default:
          title = createEnglishCalculatedPriceTitleTemplate(offerNo);
          content = createEnglishCalculatedPriceTemplate(templateProps);
      }
    }

    return {
      title,
      content,
    };
  }

  getMailForSupplier(supplierName: string, mailContent: string) {
    return mailContent.replace('{SUPPLIER_NAME}', ` ${supplierName} `);
  }
}
