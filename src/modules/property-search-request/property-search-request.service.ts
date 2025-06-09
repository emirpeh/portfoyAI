import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  Prisma,
  PropertySearchRequest,
} from '@prisma/client';
import { CustomerService } from '../customer/customer.service';
import {
  CreatePropertySearchRequestData,
} from './types/property-search-request.types';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmailAnalysisBuyerPreferences,
  EmailAnalysisProperty,
} from '../gpt/schemas/real-estate-email-analysis.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PropertySearchRequestService {
  private readonly logger = new Logger(PropertySearchRequestService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly customerService: CustomerService,
    private readonly mailService: MailService,
  ) { }

  @OnEvent('buyer.inquiry')
  async handleBuyerInquiryEvent(payload: any) {
    this.logger.log(
      `Handling buyer.inquiry event for: ${payload.mail.from[0]?.address}`,
    );
    const { mail, analysisResult, mailLogId } = payload;

    this.logger.debug(
      'OpenAI Analysis Result:',
      JSON.stringify(analysisResult, null, 2),
    );

    const customer = await this.customerService.findOrCreateCustomerFromAnalysis(
      analysisResult.customer,
      mail.from[0]?.address,
    );

    if (!customer) {
      this.logger.error('Could not find or create customer from the email. Aborting.');
      return;
    }

    if (analysisResult.buyerPreferences) {
      const prefs = analysisResult.buyerPreferences;

      const propertyRequestData = {
        notes: `E-postadan gelen talep: ${mail.subject}. Müşteri notları: ${prefs.features?.join(', ') || 'Yok'}`,
        propertyTypes: Array.isArray(prefs.propertyTypes)
          ? prefs.propertyTypes
          : (prefs.propertyTypes ? [prefs.propertyTypes] : []),
        locations: Array.isArray(prefs.locations)
          ? prefs.locations
          : (prefs.locations ? [prefs.locations] : []),
        minPrice: prefs.minPrice,
        maxPrice: prefs.maxPrice,
        minRooms: prefs.roomCount || prefs.minRooms,
        minSize: prefs.minSize,
        maxSize: prefs.maxSize,
        features: prefs.features,
        transactionType: prefs.transactionType,
      };

      const data: CreatePropertySearchRequestData = {
        customerId: customer.id,
        status: 'ACTIVE',
        propertyRequest: propertyRequestData,
      };
      const newSearchRequest = await this.createSearchRequest(data);

      if (mailLogId) {
        this.logger.log(`Mail log ${mailLogId} arama talebi ${newSearchRequest.id} ile güncelleniyor.`);
        await this.mailService.updateMailLog(mailLogId, {
          propertySearchRequest: {
            connect: { id: newSearchRequest.id },
          },
        });
      }
    }
  }

  async findOrCreateFromAnalysis(
    buyerPreferences: EmailAnalysisBuyerPreferences,
    customerId: string,
  ): Promise<PropertySearchRequest> {
    const propertyRequestData = {
      notes: `Web formundan gelen talep. Müşteri özellikleri: ${buyerPreferences.features?.join(', ') || 'Yok'}`,
      propertyTypes: Array.isArray(buyerPreferences.propertyTypes)
        ? buyerPreferences.propertyTypes
        : (buyerPreferences.propertyTypes ? [buyerPreferences.propertyTypes] : []),
      locations: Array.isArray(buyerPreferences.locations)
        ? buyerPreferences.locations
        : (buyerPreferences.locations ? [buyerPreferences.locations] : []),
      maxPrice: buyerPreferences.maxPrice,
      minPrice: buyerPreferences.minPrice,
      minRooms: buyerPreferences.roomCount,
      minSize: buyerPreferences.minSize,
      maxSize: buyerPreferences.maxSize,
      features: buyerPreferences.features,
      transactionType: buyerPreferences.transactionType,
    };

    const data: CreatePropertySearchRequestData = {
      customerId: customerId,
      status: 'ACTIVE',
      propertyRequest: propertyRequestData,
    };

    const where: Prisma.PropertySearchRequestWhereInput = {
      customerId,
      status: 'ACTIVE',
      maxPrice: data.propertyRequest.maxPrice,
      minRooms: data.propertyRequest.minRooms,
      transactionType: data.propertyRequest.transactionType,
    };

    if (data.propertyRequest.locations && data.propertyRequest.locations.length > 0) {
      where.locations = { equals: data.propertyRequest.locations };
    }

    const existing = await this.database.propertySearchRequest.findFirst({
      where,
    });

    if (existing) {
      this.logger.log(`Benzer bir arama talebi zaten mevcut: ${existing.requestNo}. Yeni talep oluşturulmuyor.`);
      return existing;
    }

    return this.createSearchRequest(data);
  }

  async createSearchRequest(
    data: CreatePropertySearchRequestData,
  ): Promise<PropertySearchRequest> {
    const { customerId, status, notes, propertyRequest } = data;

    const requestNo =
      data.requestNo ||
      `REQ-${customerId.slice(0, 4)}-${Date.now().toString().slice(-5)}`;

    try {
      const newSearchRequest = await this.database.propertySearchRequest.create({
        data: {
          requestNo,
          status,
          transactionType: propertyRequest.transactionType,
          customer: { connect: { id: customerId } },
          propertyTypes: propertyRequest.propertyTypes,
          locations: propertyRequest.locations,
          minPrice: propertyRequest.minPrice,
          maxPrice: propertyRequest.maxPrice,
          minRooms: propertyRequest.minRooms,
          minSize: propertyRequest.minSize,
          maxSize: propertyRequest.maxSize,
          requiredFeatures: propertyRequest.features,
          notes: propertyRequest.notes,
        },
      });
      this.logger.log(`Created new search request: ${newSearchRequest.requestNo}`);
      return newSearchRequest;
    } catch (error) {
      this.logger.error(
        `Failed to create property search request: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not create property search request.');
    }
  }

  async findSearchRequestById(id: string): Promise<PropertySearchRequest> {
    const request = await this.database.propertySearchRequest.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });
    if (!request) {
      throw new NotFoundException(`Search Request with ID ${id} not found.`);
    }
    return request;
  }

  async update(id: string, data: Prisma.PropertySearchRequestUpdateInput): Promise<PropertySearchRequest> {
    this.logger.log(`Updating search request ${id}`);
    try {
      const updatedRequest = await this.database.propertySearchRequest.update({
        where: { id },
        data,
      });
      return updatedRequest;
    } catch (error) {
      this.logger.error(`Failed to update search request ${id}`, error.stack);
      // Prisma'nın fırlatabileceği belirli hataları kontrol edebilirsiniz (örn. kayıt bulunamadı)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Search Request with ID ${id} not found.`);
      }
      throw new InternalServerErrorException('Could not update search request.');
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PropertySearchRequestWhereUniqueInput;
    where?: Prisma.PropertySearchRequestWhereInput;
    orderBy?: Prisma.PropertySearchRequestOrderByWithRelationInput;
  }): Promise<{ data: PropertySearchRequest[]; pagination: { total: number } }> {
    const { skip, take, cursor, where, orderBy } = params;
    const [data, total] = await this.database.$transaction([
      this.database.propertySearchRequest.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include: {
          customer: true, // Müşteri bilgilerini de çekiyoruz
        },
      }),
      this.database.propertySearchRequest.count({ where }),
    ]);

    return { data, pagination: { total } };
  }
}