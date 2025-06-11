import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma, RealEstateListing, ListingStatus, TransactionType } from '@prisma/client';
import { GptService } from '../gpt/gpt.service';
import type { EmailAnalysisProperty } from '../gpt/schemas/real-estate-email-analysis.schema';
import { CreateRealEstateListingDto } from './dto/create-real-estate-listing.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { CustomerService } from '../customer/customer.service';
import { UpdateRealEstateListingDto } from './dto/update-real-estate-listing.dto';

@Injectable()
export class RealEstateService {
  private readonly logger = new Logger(RealEstateService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly gptService: GptService,
    private readonly customerService: CustomerService,
  ) { }

  @OnEvent('seller.listing')
  async handleSellerListingEvent(payload: any) {
    this.logger.log(
      `Handling seller.listing event for: ${payload.mail.from[0]?.address}`,
    );
    const { mail, analysisResult } = payload;

    const customer = await this.customerService.findOrCreateCustomerFromAnalysis(
      analysisResult.customer,
      mail.from[0]?.address,
    );

    if (customer) {
      await this.findOrCreateFromAnalysis(
        analysisResult.property,
        customer.id,
      );
      this.logger.log(`SELLER_LISTING processed for customer ${customer.id}`);
    } else {
      this.logger.error(
        'Could not find or create customer for SELLER_LISTING',
      );
    }
  }

  async getDashboardData() {
    this.logger.log('Kontrol paneli verileri alınıyor...');
    try {
      const [
        totalProperties,
        totalCustomers,
        activeRequests,
        recentRequests,
        recentActivities,
      ] = await this.database.$transaction([
        this.database.realEstateListing.count(),
        this.database.customer.count(),
        this.database.propertySearchRequest.count({
          where: { status: 'ACTIVE' },
        }),
        this.database.propertySearchRequest.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { customer: true },
        }),
        this.database.realEstateListing.findMany({
          where: {
            OR: [{ status: 'SOLD' }, { status: 'RENTED' }],
          },
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: { seller: true },
        }),
      ]);

      return {
        stats: {
          totalListings: totalProperties,
          totalCustomers,
          activeRequests,
        },
        leads: recentRequests,
        recentActivities,
      };
    } catch (error) {
      this.logger.error(
        `Dashboard verileri alınırken bir hata oluştu: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Dashboard verileri alınamadı.',
      );
    }
  }

  async create(
    dto: CreateRealEstateListingDto,
  ): Promise<RealEstateListing> {
    this.logger.log(`Yeni emlak ilanı oluşturuluyor...`);

    const listingNo = await this.generateListingNo(
      dto.propertyType,
      dto.city,
    );

    try {
      // DTO'dan sellerId'yi ayırıyoruz
      const { sellerId, ...restOfDto } = dto;

      // UncheckedCreateInput kullanarak foreign key'i doğrudan atıyoruz
      const data: Prisma.RealEstateListingUncheckedCreateInput = {
        ...restOfDto,
        listingNo,
        sellerId: sellerId,
        // status alanı şemadaki @default(ACTIVE) sayesinde otomatik olarak atanacak
      };

      const listing = await this.database.realEstateListing.create({ data });
      this.logger.log(`Emlak ilanı oluşturuldu: ${listing.listingNo}`);
      return listing;
    } catch (error) {
      this.logger.error(
        `Emlak ilanı oluşturma hatası: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Emlak ilanı oluşturulamadı.',
      );
    }
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    query?: string; // Genel arama sorgusu için
    status?: ListingStatus;
    transactionType?: TransactionType;
  }): Promise<{ data: RealEstateListing[]; pagination: { total: number; limit: number; offset: number } }> {
    const { limit = 10, offset = 0, query, status, transactionType } = options || {};

    const where: Prisma.RealEstateListingWhereInput = {
      deletedAt: null, // Sadece aktif (silinmemiş) ilanları getir
    };

    if (query) {
      // SQLite 'insensitive' modu desteklemediği için mode: 'insensitive' kaldırıldı.
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { location: { contains: query } },
        { listingNo: { contains: query } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    const [data, total] = await this.database.$transaction([
      this.database.realEstateListing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: +limit,
        skip: +offset,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.database.realEstateListing.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        limit: +limit,
        offset: +offset
      }
    };
  }

  async findOne(id: string): Promise<RealEstateListing | null> {
    const listing = await this.database.realEstateListing.findUnique({
      where: { id },
      include: {
        seller: true,
      },
    });
    if (!listing) {
      this.logger.warn(`İlan ID ${id} bulunamadı.`);
      throw new NotFoundException(`İlan ID ${id} bulunamadı.`);
    }
    return listing;
  }

  async update(
    id: string,
    data: UpdateRealEstateListingDto,
  ): Promise<RealEstateListing> {
    this.logger.log(`Emlak ilanı güncelleniyor: ${id}`);
    try {
      // Önce ilanın var olup olmadığını kontrol et
      await this.findOne(id);
      const updatedListing = await this.database.realEstateListing.update({
        where: { id },
        data,
        include: {
          seller: true,
        },
      });
      this.logger.log(`Emlak ilanı güncellendi: ${id}`);
      return updatedListing;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Emlak ilanı güncelleme hatası: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(`İlan ${id} güncellenemedi.`);
    }
  }

  async remove(id: string): Promise<RealEstateListing> {
    this.logger.log(`Emlak ilanı siliniyor: ${id}`);
    try {
      // Silmeden önce ilanın var olduğundan emin ol
      await this.findOne(id);
      return await this.database.realEstateListing.delete({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`İlan silinirken hata oluştu: ${id}`, error.stack);
      throw new InternalServerErrorException(`İlan ${id} silinemedi.`);
    }
  }

  async findOrCreateFromAnalysis(
    propertyData: EmailAnalysisProperty,
    sellerId: string,
  ): Promise<RealEstateListing> {
    if (!propertyData) {
      this.logger.warn('findOrCreateFromAnalysis çağrıldı ancak propertyData boş.');
      throw new InternalServerErrorException('Analizden emlak verisi alınamadı.');
    }

    // TODO: Benzer bir ilanın zaten var olup olmadığını kontrol et (örneğin, aynı satıcıdan benzer konum/m2)
    // const existingListing = await this.database.realEstateListing.findFirst(...);
    // if (existingListing) return existingListing;

    const listingNo = await this.generateListingNo(
      propertyData.propertyType || 'UNKNOWN',
      propertyData.city || 'UNKNOWN',
    );

    const title = `${propertyData.propertyType || 'Emlak'} - ${propertyData.location || propertyData.district || propertyData.city || 'Konumsuz'
      }`;

    try {
      this.logger.log('Yeni emlak ilanı oluşturuluyor (analizden)...');

      const data: Prisma.RealEstateListingCreateInput = {
        title,
        description: propertyData.description,
        price: propertyData.price ?? 0,
        currency: propertyData.currency || 'TRY',
        location: propertyData.location || `${propertyData.district}, ${propertyData.city}`,
        city: propertyData.city,
        district: propertyData.district,
        neighborhood: propertyData.neighborhood,
        size: propertyData.size,
        roomCount: propertyData.roomCount,
        bathroomCount: propertyData.bathroomCount,
        propertyType: propertyData.propertyType,
        isFurnished: propertyData.isFurnished || false,
        hasGarage: propertyData.hasGarage || false,
        hasGarden: propertyData.hasGarden || false,
        hasPool: propertyData.hasPool || false,
        yearBuilt: propertyData.yearBuilt,
        transactionType: propertyData.transactionType,
        listingNo,
        seller: {
          connect: {
            id: sellerId,
          },
        },
      };

      const listing = await this.database.realEstateListing.create({
        data,
      });

      this.logger.log(
        `Analizden yeni emlak ilanı oluşturuldu: ${listing.listingNo}`,
      );
      return listing;
    } catch (error) {
      this.logger.error(
        `findOrCreateFromAnalysis sırasında emlak ilanı oluşturma hatası: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Analizden emlak ilanı oluşturulamadı.',
      );
    }
  }

  async findListingsBySeller(sellerId: string): Promise<RealEstateListing[]> {
    return this.database.realEstateListing.findMany({
      where: { sellerId: sellerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async generateListingNo(
    type: string,
    city: string,
  ): Promise<string> {
    const typePrefix = (type ? type.slice(0, 3) : 'PRP').toUpperCase();
    const cityPrefix = (city ? city.slice(0, 3) : 'TR').toUpperCase();
    const prefix = `${typePrefix}${cityPrefix}`;
    const uniquePart = Date.now().toString().slice(-6);
    const count = await this.database.realEstateListing.count();
    return `${prefix}-${uniquePart}-${count + 1}`;
  }
}