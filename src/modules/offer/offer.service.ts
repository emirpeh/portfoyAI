/* eslint-disable prettier/prettier */
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import {
  ProcessOfferMailDto,
  ProcessRequestOfferMailDto,
  ProcessSupplierOfferMailDto,
} from './dto/process.offer.mail.dto';
import { MailService } from '../mail/mail.service';
import { SupplierService } from '../supplier/supplier.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { OfferStatusType } from './types/offer.status.type';
import { MailStatusType } from './types/mail.status.type';
import { Offer } from '@prisma/client';

interface OfferConfiguration {
  id: number;
  isEnabled: boolean;
  rate: string;
  profitMargin: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OfferService {
  private readonly logger: Logger;
  private readonly defaultMail: string;
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MailService))
    private mailService: MailService,
    private supplierService: SupplierService,
    private configService: ConfigService,
  ) {
    this.logger = new Logger(OfferService.name);
    this.defaultMail = this.configService.get<string>('DEFAULT_MAIL');
  }

  async processOffer(input: ProcessOfferMailDto, offer: Offer) {
    // Check if the system is enabled
    const offerConfig =
      (await this.prisma.offerConfiguration.findFirst()) as OfferConfiguration | null;
    if (!offerConfig?.isEnabled) {
      this.logger.warn(
        'Offer processing is disabled. Skipping email processing.',
      );
      return;
    }

    const { type } = input;
    switch (type) {
      case MailStatusType.CUSTOMER_NEW_OFFER_REQUEST:
        await this.processCustomerNewRequest(input);
        return;
      case MailStatusType.CUSTOMER_REQUEST_CORRECTION_FROM_CUSTOMER:
        await this.processCustomerRequestCorrection(input);
        return;
      case MailStatusType.SUPPLIER_NEW_OFFER:
        await this.processSupplierNewOffer(input);
        return;
      case MailStatusType.OTHER:
        this.logger.log('Other offer mail type is ignored');
        break;
      default:
        this.logger.log('Invalid offer mail type', input);
        return;
    }

    await this.mailService.createMailLog({
      type: type,
      externalId: input.offerNo,
      from: input.from,
      to: this.defaultMail,
      cc: input.cc,
      contentTitle: input.contentTitle,
      contentBody: input.contentHtml,
      offerId: offer?.id,
    });
  }

  async processCustomerNewRequest(input: ProcessOfferMailDto) {
    const {
      request,
      customer,
      language,
      modelResponseMail,
      modelResponseTitle,
      isThereMissingOrIncorrectInformation,
      supplierMails,
    } = input;

    const { name, email, gender } = customer;

    request.loadDate = request.loadDate ? new Date(request.loadDate) : null;
    request.deliveryDate = request.deliveryDate
      ? new Date(request.deliveryDate)
      : null;

    const offerNo = await this.createOffer(request);

    if (isThereMissingOrIncorrectInformation) {
      await this.mailService.sendMissingOfferMail({
        offerNo,
        content: modelResponseMail,
        contentTitle: modelResponseTitle + ' - ' + offerNo,
        contact: {
          name,
          email,
          gender,
        },
        logType: MailStatusType.CUSTOMER_REQUEST_CORRECTION,
        ccMails: input.cc,
        language,
      });
      await this.updateOfferStatus(
        offerNo,
        OfferStatusType.OFFER_MISSING_INFORMATION,
      );
      this.logger.warn(`Offer ${offerNo} has missing information`);
      return;
    }

    const availableSuppliers = await this.supplierService.findAll({
      countries: [request.loadCountry, request.deliveryCountry],
      foreignTrades: [request.foreignTrade],
    });

    this.logger.log('Available Suppliers: ', availableSuppliers);
    this.logger.log('Request: ', request);

    if (availableSuppliers.data.length === 0) {
      await this.mailService.sendNoSupplierMail(
        offerNo,
        customer.email,
        request,
      );
      await this.updateOfferStatus(
        offerNo,
        OfferStatusType.NO_SUPPLIER_FOR_OFFER,
      );
      this.logger.log(`Offer ${offerNo} has no suppliers`);
      return;
    }

    await this.updateOfferStatus(
      offerNo,
      OfferStatusType.FEE_REQUEST_FOR_OFFER,
    );

    for (const supplier of availableSuppliers.data) {
      const supplierLanguage = supplier.language;
      const supplierMail = supplierMails[supplierLanguage];
      if (!supplierMail) {
        this.logger.log(`Supplier ${supplier.name} has no mail content`);
        continue;
      }

      const supplierMailContent = this.mailService.getMailForSupplier(
        supplier.name,
        supplierMail.modelResponseMail,
      );

      const supplierMailTitle =
        supplierMail.modelResponseTitle + ' - ' + offerNo;

      await this.mailService.sendPriceRequestToSupplier({
        offerNo,
        mailContent: supplierMailContent,
        mailTitle: supplierMailTitle,
        supplier: {
          name: supplier.name || '',
          email: supplier.email,
          gender: supplier.gender,
        },
        language: supplier.language,
        type: MailStatusType.FEE_REQUEST_FOR_OFFER,
      });
    }

    this.logger.log(`Offer ${offerNo} processed`);
  }

  async processCustomerRequestCorrection(input: ProcessOfferMailDto) {
    const {
      request,
      customer,
      cc,
      from,
      language,
      offerNo,
      modelResponseMail,
      modelResponseTitle,
      isThereMissingOrIncorrectInformation,
      supplierMails,
    } = input;

    const { name, gender } = customer;

    this.logger.log('New Values From Customer: ', request);

    const offer = await this.findOffer(offerNo);
    if (!offer) {
      this.logger.log(`Offer ${offerNo} not found`);
      return;
    }

    const offerCreationDate = new Date(offer.createdAt);
    const now = new Date();
    const hoursPassed =
      (now.getTime() - offerCreationDate.getTime()) / (1000 * 60 * 60);
    const offerExpiryHours =
      this.configService.get<number>('OFFER_EXPIRY_HOURS') || 24;

    if (isThereMissingOrIncorrectInformation) {
      await this.mailService.sendMissingOfferMail({
        offerNo,
        content: modelResponseMail,
        contentTitle: modelResponseTitle + ' - ' + offerNo,
        contact: {
          name,
          email: from,
          gender,
        },
        logType: MailStatusType.CUSTOMER_REQUEST_CORRECTION,
        ccMails: cc,
        language,
      });

      // Update offer number if foreignTrade is present
      if (request.foreignTrade) {
        const week = offerNo.substring(0, 2);
        const random = offerNo.substring(4);
        const newOfferNo = `${week}${request.foreignTrade}${random}`;

        await this.updateOffer(offerNo, {
          ...request,
          offerNo: newOfferNo,
        });
      } else {
        await this.updateOffer(offerNo, {
          ...request,
        });
      }

      this.logger.log(`Offer request correction has missing information`);
      return;
    }

    if (hoursPassed >= offerExpiryHours) {
      await this.mailService.sendExpiredOfferMail(
        offerNo,
        {
          name,
          email: from,
          gender,
        },
        offerExpiryHours,
      );
      this.logger.log(
        `Internal mail sent for offer ${offerNo} after ${offerExpiryHours} hours`,
      );
      return;
    }

    const updatedOffer = await this.updateOffer(offerNo, {
      ...request,
      status: OfferStatusType.OFFER_CREATED,
    });

    const availableSuppliers = await this.supplierService.findAll({
      countries: [updatedOffer.loadCountry, updatedOffer.deliveryCountry],
      foreignTrades: [updatedOffer.foreignTrade],
    });

    if (availableSuppliers.data.length === 0) {
      await this.mailService.sendNoSupplierMail(
        offerNo,
        customer.email,
        updatedOffer,
      );

      await this.updateOfferStatus(
        offerNo,
        OfferStatusType.NO_SUPPLIER_FOR_OFFER,
      );
      this.logger.log(`Offer ${offerNo} has no suppliers`);
      return;
    }

    console.log('Supplier Mails: ', supplierMails);

    for (const supplier of availableSuppliers.data) {
      const supplierLanguage = supplier.language;
      const supplierMail = supplierMails[supplierLanguage];
      if (!supplierMail) {
        this.logger.log(`Supplier ${supplier.name} has no mail content`);
        continue;
      }

      const supplierMailContent = this.mailService.getMailForSupplier(
        supplier.name,
        supplierMail.modelResponseMail,
      );

      const supplierMailTitle =
        supplierMail.modelResponseTitle + ' - ' + offerNo;

      await this.mailService.sendPriceRequestToSupplier({
        offerNo,
        mailContent: supplierMailContent,
        mailTitle: supplierMailTitle,
        supplier: {
          name: supplier.name || '',
          email: supplier.email,
          gender: supplier.gender,
        },
        language: supplier.language,
        type: MailStatusType.FEE_REQUEST_FOR_OFFER,
      });
    }

    await this.updateOfferStatus(
      offerNo,
      OfferStatusType.FEE_REQUEST_FOR_OFFER,
    );

    this.logger.log(`Offer ${offerNo} updated with new information`);
  }

  async processSupplierNewOffer(input: ProcessOfferMailDto) {
    const { offerNo, from, contentTitle, contentHtml, offer } = input;

    const existingOffer = await this.findOffer(offerNo);
    if (!existingOffer) {
      this.logger.log(`Offer ${offerNo} not found`);
      return;
    }

    const offerCreationDate = new Date(existingOffer.createdAt);
    const now = new Date();
    const hoursPassed =
      (now.getTime() - offerCreationDate.getTime()) / (1000 * 60 * 60);
    const offerExpiryHours =
      this.configService.get<number>('OFFER_EXPIRY_HOURS_FOR_SUPPLIER') || 12;

    if (hoursPassed >= offerExpiryHours) {
      await this.mailService.sendLateSupplierOfferMail(
        offerNo,
        {
          from,
          contentTitle,
          contentHtml,
        },
        offerExpiryHours,
      );
      this.logger.log(
        `Late supplier offer notification sent for offer ${offerNo} after ${offerExpiryHours} hours`,
      );
      return;
    }

    const supplierContact = await this.getSupplierContactByMail(from);

    if (!supplierContact) {
      this.logger.log(`Supplier contact not found for offer ${offerNo}`);
      return;
    }

    for (const offerDetail of offer.prices || []) {
      await this.createSupplierOffer(
        {
          price: offerDetail.price.toString(),
          supplierContactId: supplierContact.id,
          note: offerDetail.note,
        },
        existingOffer.id,
      );
    }

    const isOfferCompleted = await this.checkOfferCompletion(offerNo);

    if (isOfferCompleted) {
      this.logger.log(`Offer ${offerNo} is completed: ${isOfferCompleted}`);
      await this.updateOfferStatus(
        offerNo,
        OfferStatusType.WAITING_COMPLETE_FOR_OFFER,
      );
    } else {
      this.logger.log(
        `Offer ${offerNo} is not completed yet: ${isOfferCompleted}`,
      );
    }

    this.logger.log(`Supplier offer processed for offer ${offerNo}`);
  }

  async checkOfferCompletion(offerNo: string) {
    const offer = await this.findOffer(offerNo);
    if (!offer) {
      this.logger.log(`Offer ${offerNo} not found`);
      return;
    }

    const supplierOfferList = await this.prisma.supplierOffer.findMany({
      where: {
        offerId: offer.id,
      },
    });

    const startDate = new Date(offer.createdAt);
    const endDate = new Date(offer.createdAt);
    endDate.setHours(
      endDate.getHours() +
        this.configService.get<number>('OFFER_EXPIRY_HOURS_FOR_ALL'),
    );

    const mailLogList = await this.mailService.getMailLogs({
      offerNo: offerNo,
      type: MailStatusType.SUPPLIER_NEW_OFFER,
      startDate,
      endDate,
      limit: 1000,
      offset: 0,
    });

    const totalMailLogCount = mailLogList.pagination.total;

    if (totalMailLogCount === 0) {
      this.logger.log(`Offer ${offerNo} has no mail logs`);
      return;
    }

    if (supplierOfferList.length === 0) {
      this.logger.log(`Offer ${offerNo} has no supplier offers`);
      return;
    }

    const offerCompletion = supplierOfferList.every(
      supplierOffer => supplierOffer.price,
    );

    const offerCompletionPercentage =
      (supplierOfferList.length / totalMailLogCount) * 100;

    if (
      offerCompletionPercentage >=
        this.configService.get<number>('OFFER_COMPLETION_PERCENTAGE') ||
      offerCompletion
    ) {
      return true;
    }
    return false;
  }

  async createOffer(offer: ProcessRequestOfferMailDto) {
    const offerNo = this.createOfferNo(offer.foreignTrade);
    await this.prisma.offer.create({
      data: {
        offerNo: offerNo,
        status: OfferStatusType.OFFER_CREATED,
        ...offer,
      },
    });
    return offerNo;
  }

  async updateOffer(offerNo: string, data: any) {
    const offer = await this.findOffer(offerNo);

    // Convert empty strings to null and format dates
    const processedData = {
      ...data,
      ...(data.loadDate && {
        loadDate: data.loadDate ? new Date(data.loadDate).toISOString() : null,
      }),
      ...(data.deliveryDate && {
        deliveryDate: data.deliveryDate
          ? new Date(data.deliveryDate).toISOString()
          : null,
      }),
      ...(data.isStackable && { isStackable: data.isStackable }),
      ...(data.foreignTrade && { foreignTrade: data.foreignTrade }),
      ...(data.deliveryCountry && { deliveryCountry: data.deliveryCountry }),
      ...(data.deliveryCity && { deliveryCity: data.deliveryCity }),
    };

    await this.prisma.offer.update({
      where: { id: offer.id },
      data: processedData,
    });
    return await this.findOffer(offerNo);
  }

  async findOffer(offerNo: string) {
    return await this.prisma.offer.findFirst({
      where: { offerNo: offerNo },
    });
  }

  createOfferNo(type: 'IM' | 'EX' | 'TRN') {
    const now = new Date();
    const week = Math.ceil(
      (now.getDate() +
        new Date(now.getFullYear(), now.getMonth(), 1).getDay()) /
        7,
    )
      .toString()
      .padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `${week}${type}${random}`;
  }

  async createSupplierOffer(
    offer: ProcessSupplierOfferMailDto,
    offerId: number,
  ) {
    return await this.prisma.supplierOffer.create({
      data: {
        offerId,
        price: offer.price,
        ...(offer.note && { note: offer.note }),
        supplierContactId: offer.supplierContactId,
      },
    });
  }

  async getSupplierContactByMail(mail: string) {
    return await this.prisma.supplierContactList.findFirst({
      where: { email: mail },
    });
  }

  async getOfferList({
    startDate,
    endDate,
    status,
    limit = 10,
    offset = 0,
  }: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where = {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
      deletedAt: null,
      ...(status && { status }),
    };

    const [total, data] = await Promise.all([
      this.prisma.offer.count({ where }),
      this.prisma.offer.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          mailLogs: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          OfferResult: true,
          SupplierOffer: {
            include: {
              supplierContact: true,
            },
          },
        },
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

  async getOffer(id: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        mailLogs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        SupplierOffer: {
          include: {
            supplierContact: true,
          },
        },
        OfferResult: true,
      },
    });

    if (offer) {
      // Group mailLogs by either 'to' or 'from' fields
      const groupedMailLogs = offer.mailLogs.reduce((acc, log) => {
        // Create two keys - one for 'to' and one for 'from'
        const toKey = `to-${log.to}`;
        const fromKey = `from-${log.from}`;

        // Add to both groups if they exist
        if (!acc[toKey]) {
          acc[toKey] = [];
        }
        if (!acc[fromKey]) {
          acc[fromKey] = [];
        }

        acc[toKey].push(log);
        acc[fromKey].push(log);
        return acc;
      }, {});

      return {
        ...offer,
        mailLogs: Object.entries(groupedMailLogs).map(([key, logs]) => {
          const [type, address] = key.split('-');
          return {
            type, // 'to' or 'from'
            address,
            logs,
          };
        }),
      };
    }

    return offer;
  }

  async getOfferConfiguration() {
    const config = await this.prisma.offerConfiguration.findFirst();
    if (!config) {
      // Create default configuration if none exists
      return await this.prisma.offerConfiguration.create({
        data: {
          rate: '10',
          profitMargin: '0',
          isEnabled: true,
        },
      });
    }
    return config;
  }

  async updateOfferConfiguration(
    rate: string,
    profitMargin: string,
    isEnabled: boolean,
  ) {
    const config = await this.prisma.offerConfiguration.findFirst();
    if (config) {
      return await this.prisma.offerConfiguration.update({
        where: { id: config.id },
        data: {
          rate,
          profitMargin,
          isEnabled,
        },
      });
    }
    return await this.prisma.offerConfiguration.create({
      data: {
        rate,
        profitMargin,
        isEnabled,
      },
    });
  }

  async calculateOffer(
    price: string,
  ): Promise<{ finalPrice: string; rate: string; profitMargin: string }> {
    const config = await this.getOfferConfiguration();
    const basePrice = parseFloat(price);
    const rate = parseFloat(config.rate);
    const profitMargin = parseFloat(config.profitMargin);

    // Calculate final price: basePrice * (1 + rate/100) * (1 + profitMargin/100)
    let finalPrice = basePrice * (1 + rate / 100) * (1 + profitMargin / 100);

    // Round to nearest multiple of 5
    finalPrice = Math.round(finalPrice / 5) * 5;

    return {
      finalPrice: finalPrice.toFixed(2),
      rate: config.rate,
      profitMargin: config.profitMargin,
    };
  }

  async updateOfferStatus(offerNo: string, status: OfferStatusType) {
    const offer = await this.findOffer(offerNo);
    if (!offer) {
      throw new Error(`Offer ${offerNo} not found`);
    }

    await this.prisma.offer.update({
      where: { id: offer.id },
      data: { status },
    });

    return await this.findOffer(offerNo);
  }
}
