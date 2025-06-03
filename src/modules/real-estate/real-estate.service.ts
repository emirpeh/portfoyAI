import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CustomerService, CustomerType } from '../customer/customer.service';
import { MailService } from '../mail/mail.service';
import { GptService } from '../gpt/gpt.service';
import {
  Prisma,
  RealEstateListing as PrismaRealEstateListing,
  PropertySearchRequest as PrismaPropertySearchRequest,
} from '@prisma/client';
import type { EmailAnalysisProperty } from '../gpt/schemas/real-estate-email-analysis.schema';

// Emlak sektörü için tip tanımları
export type RealEstateStatus = 
  | 'ACTIVE' 
  | 'SOLD' 
  | 'RENTED' 
  | 'PENDING' 
  | 'WITHDRAWN';

export type RealEstateConfiguration = {
  id: number;
  isEnabled: boolean;
  commissionRate: string; // Komisyon oranı
  defaultCurrency: string; // Varsayılan para birimi
  createdAt: Date;
  updatedAt: Date;
};

// Modelleri doğrudan Prisma'dan kullanalım
@Injectable()
export class RealEstateService {
  private readonly logger = new Logger(RealEstateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => MailService))
    private readonly mailService: MailService,
    private readonly gptService: GptService,
  ) {}

  // Konfigürasyon ayarları
  async getConfiguration(): Promise<RealEstateConfiguration | null> {
    const config = await this.prisma.$queryRaw`
      SELECT * FROM RealEstateConfiguration 
      LIMIT 1
    `;
    
    if (!config || !Array.isArray(config) || config.length === 0) {
      // Varsayılan konfigürasyon oluştur
      return await this.prisma.$queryRaw`
        INSERT INTO RealEstateConfiguration (isEnabled, commissionRate, defaultCurrency)
        VALUES (1, '3', 'TL')
        RETURNING *
      `;
    }
    
    return config[0];
  }

  // Konfigürasyon güncelleme
  async updateConfiguration(config: {
    commissionRate: string;
    defaultCurrency: string;
    isEnabled: boolean;
  }): Promise<RealEstateConfiguration> {
    const existingConfig = await this.prisma.$queryRaw`
      SELECT * FROM RealEstateConfiguration 
      LIMIT 1
    `;
    
    const existingConfigArray = existingConfig as any[];

    if (existingConfigArray && existingConfigArray.length > 0) {
      const id = existingConfigArray[0].id;
      return await this.prisma.$queryRaw`
        UPDATE RealEstateConfiguration
        SET commissionRate = ${config.commissionRate},
            defaultCurrency = ${config.defaultCurrency},
            isEnabled = ${config.isEnabled ? 1 : 0}
        WHERE id = ${id}
        RETURNING *
      `;
    }

    return await this.prisma.$queryRaw`
      INSERT INTO RealEstateConfiguration (isEnabled, commissionRate, defaultCurrency)
      VALUES (${config.isEnabled ? 1 : 0}, ${config.commissionRate}, ${config.defaultCurrency})
      RETURNING *
    `;
  }

  // Yeni emlak ilanı oluştur
  async createListing(data: {
    listingNo?: string;
    status?: RealEstateStatus;
    sellerId: number;
    propertyType: string;
    location: string;
    city: string;
    district?: string;
    neighborhood?: string;
    price: number;
    currency: string;
    size?: number;
    roomCount?: number;
    bathroomCount?: number;
    floor?: number;
    totalFloors?: number;
    hasGarage?: boolean;
    hasGarden?: boolean;
    hasPool?: boolean;
    isFurnished?: boolean;
    yearBuilt?: number;
    description: string;
    features?: string;
  }): Promise<any> {
    // İlan numarası oluştur (eğer verilmemişse)
    const listingNo = data.listingNo || `RE-${Date.now().toString().slice(-6)}`;
    
    // Tüm veri alanlarını hazırlayalım
    const listing = {
      listingNo,
      status: data.status || 'ACTIVE',
      sellerId: data.sellerId,
      propertyType: data.propertyType,
      location: data.location,
      city: data.city,
      district: data.district,
      neighborhood: data.neighborhood,
      price: data.price,
      currency: data.currency,
      size: data.size,
      roomCount: data.roomCount,
      bathroomCount: data.bathroomCount,
      floor: data.floor,
      totalFloors: data.totalFloors,
      hasGarage: data.hasGarage || false,
      hasGarden: data.hasGarden || false,
      hasPool: data.hasPool || false,
      isFurnished: data.isFurnished || false,
      yearBuilt: data.yearBuilt,
      description: data.description,
      features: data.features,
    };
    
    // Dinamik değerler için güvenli bir sorgu oluşturalım
    const fields = Object.keys(listing).join(', ');
    const placeholders = Object.keys(listing).map(k => `@${k}`).join(', ');
    
    // Raw SQL kullanarak veri ekleme
    const result = await this.prisma.$queryRawUnsafe(`
      INSERT INTO RealEstateListing (${fields})
      VALUES (${placeholders})
      RETURNING *
    `, ...Object.values(listing));
    
    return Array.isArray(result) ? result[0] : result;
  }

  // İlan durumunu güncelle
  async updateListingStatus(
    listingNo: string,
    status: RealEstateStatus,
  ): Promise<any> {
    const result = await this.prisma.$queryRaw`
      UPDATE RealEstateListing
      SET status = ${status}
      WHERE listingNo = ${listingNo}
      RETURNING *
    `;
    
    if (!result || (Array.isArray(result) && result.length === 0)) {
      throw new Error(`Listing ${listingNo} not found`);
    }
    
    return Array.isArray(result) ? result[0] : result;
  }

  // İlanı ID ile bul
  async findListing(listingNo: string): Promise<any> {
    const listing = await this.prisma.$queryRaw`
      SELECT l.*, 
             c.id as seller_id, 
             c.name as seller_name, 
             c.email as seller_email
      FROM RealEstateListing l
      LEFT JOIN Customer c ON l.sellerId = c.id
      WHERE l.listingNo = ${listingNo}
    `;
    
    // İlgili ilanlara ait ilgi bilgilerini de alalım
    if (listing && Array.isArray(listing) && listing.length > 0) {
      const interests = await this.prisma.$queryRaw`
        SELECT i.*, 
               c.id as buyer_id,
               c.name as buyer_name,
               c.email as buyer_email
        FROM RealEstateInterest i
        LEFT JOIN Customer c ON i.buyerId = c.id
        WHERE i.listingId = ${listing[0].id}
      `;
      
      // Sonuçları birleştirelim
      return {
        ...listing[0],
        seller: {
          id: listing[0].seller_id,
          name: listing[0].seller_name,
          email: listing[0].seller_email,
        },
        interests: Array.isArray(interests) ? interests.map(i => ({
          ...i,
          buyer: {
            id: i.buyer_id,
            name: i.buyer_name,
            email: i.buyer_email,
          }
        })) : [],
      };
    }
    
    return null;
  }

  // İlanları listeleme (filtrelemeli)
  async getListings({
    city,
    district,
    propertyType,
    minPrice,
    maxPrice,
    minSize,
    maxSize,
    status,
    limit = 10,
    offset = 0,
  }: {
    city?: string;
    district?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minSize?: number;
    maxSize?: number;
    status?: RealEstateStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; pagination: { total: number; limit: number; offset: number } }> {
    // Filtre koşullarını oluşturalım
    const conditions = [];
    const params: any[] = [];
    
    if (city) {
      conditions.push(`city = ?`);
      params.push(city);
    }
    
    if (district) {
      conditions.push(`district = ?`);
      params.push(district);
    }
    
    if (propertyType) {
      conditions.push(`propertyType = ?`);
      params.push(propertyType);
    }
    
    if (status) {
      conditions.push(`status = ?`);
      params.push(status);
    }
    
    if (minPrice) {
      conditions.push(`price >= ?`);
      params.push(minPrice);
    }
    
    if (maxPrice) {
      conditions.push(`price <= ?`);
      params.push(maxPrice);
    }
    
    if (minSize) {
      conditions.push(`size >= ?`);
      params.push(minSize);
    }
    
    if (maxSize) {
      conditions.push(`size <= ?`);
      params.push(maxSize);
    }
    
    conditions.push(`deletedAt IS NULL`);
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    // Toplam sayıyı al
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM RealEstateListing 
      ${whereClause}
    `;
    
    const countResult = await this.prisma.$queryRawUnsafe(countQuery, ...params);
    const total = countResult[0].total;
    
    // Verileri al
    const dataQuery = `
      SELECT l.*, 
             c.id as seller_id, 
             c.name as seller_name, 
             c.email as seller_email
      FROM RealEstateListing l
      LEFT JOIN Customer c ON l.sellerId = c.id
      ${whereClause}
      ORDER BY l.createdAt DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const listings = await this.prisma.$queryRawUnsafe(dataQuery, ...params);
    
    // İlanlar için ilgi bilgilerini toplu olarak alalım
    const listingIds = (listings as any[]).map((l) => l.id);
    
    let interests: any[] = [];
    if (listingIds.length > 0) {
      const interestsQuery = `
        SELECT i.*, 
               c.id as buyer_id,
               c.name as buyer_name,
               c.email as buyer_email,
               i.listingId
        FROM RealEstateInterest i
        LEFT JOIN Customer c ON i.buyerId = c.id
        WHERE i.listingId IN (${listingIds.map(() => '?').join(', ')})
      `;
      
      interests = await this.prisma.$queryRawUnsafe(interestsQuery, ...listingIds);
    }
    
    // Sonuçları birleştirelim
    const data = (listings as any[]).map((listing) => {
      const listingInterests = interests.filter((i: any) => i.listingId === listing.id)
        .map((i: any) => ({
          ...i,
          buyer: {
            id: i.buyer_id,
            name: i.buyer_name,
            email: i.buyer_email,
          }
        }));
      
      return {
        ...listing,
        seller: {
          id: listing.seller_id,
          name: listing.seller_name,
          email: listing.seller_email,
        },
        interests: listingInterests,
      };
    });
    
    return {
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  // Alıcı için uygun emlak eşleşmelerini bul - PropertySearchRequest kullanacak şekilde güncellendi
  async findMatchesForBuyer(
    buyerId: number,
    preferences: {
      propertyTypes?: string[];
      cities?: string[];
      districts?: string[];
      minPrice?: number;
      maxPrice?: number;
      minSize?: number;
      features?: string[];
    },
  ): Promise<PrismaRealEstateListing[]> {
    this.logger.log(`Alıcı ${buyerId} için eşleşmeler aranıyor, tercihler: ${JSON.stringify(preferences)}`);

    if (!buyerId || !preferences) {
      this.logger.warn('findMatchesForBuyer çağrısında buyerId veya preferences eksik.');
      return [];
    }

    const whereConditions: Prisma.RealEstateListingWhereInput[] = [];

    // Property Types
    if (preferences.propertyTypes && preferences.propertyTypes.length > 0) {
      whereConditions.push({
        propertyType: { in: preferences.propertyTypes },
      });
    }

    // Location (Cities or Districts)
    const locationConditions: Prisma.RealEstateListingWhereInput[] = [];
    if (preferences.cities && preferences.cities.length > 0) {
      preferences.cities.forEach(city => {
        locationConditions.push({ city: { contains: city } });
      });
    }
    if (preferences.districts && preferences.districts.length > 0) {
      preferences.districts.forEach(district => {
        locationConditions.push({ district: { contains: district } });
      });
    }
    if (locationConditions.length > 0) {
      whereConditions.push({ OR: locationConditions });
    }

    // Price
    if (preferences.minPrice !== undefined) {
      whereConditions.push({ price: { gte: preferences.minPrice } });
    }
    if (preferences.maxPrice !== undefined) {
      whereConditions.push({ price: { lte: preferences.maxPrice } });
    }

    // Size
    if (preferences.minSize !== undefined) {
      whereConditions.push({ size: { gte: preferences.minSize } });
    }

    // Features (Linter hatasını önlemek için basitleştirildi/kaldırıldı)
    if (preferences.features && preferences.features.length > 0) {
      preferences.features.forEach(feature => {
        whereConditions.push({
          description: { contains: feature }
        });
      });
    }

    whereConditions.push({ status: 'ACTIVE' });

    const finalWhereClause = whereConditions.length > 0 ? { AND: whereConditions } : {};
    this.logger.debug(`findMatchesForBuyer - Prisma query where clause: ${JSON.stringify(finalWhereClause)}`);

    return this.prisma.realEstateListing.findMany({
      where: finalWhereClause,
      take: 20,
    });
  }

  // E-posta yanıtlarını işle
  async processEmail(emailData: any, existingListing?: any): Promise<any> {
    try {
      // AI analizi sonucuna göre işlem yap
      const type = emailData.type;
      
      if (type === 'BUYER_INQUIRY') {
        // Alıcı taleplerini işle
        return await this.processBuyerInquiry(emailData);
      } else if (type === 'SELLER_LISTING') {
        // Satıcı ilanlarını işle
        return await this.processSellerListing(emailData, existingListing);
      } else if (type === 'PROPERTY_VIEWING_REQUEST') {
        // Görüntüleme taleplerini işle
        return await this.processViewingRequest(emailData);
      }
      
      return { message: 'Email processed', type };
    } catch (error) {
      this.logger.error(`E-posta işleme hatası: ${error.message}`);
      throw error;
    }
  }

  // Alıcı taleplerini işle
  async processBuyerInquiry(emailData: any): Promise<any> {
    // Gelen e-postadan müşteri bilgilerini al
    const customerEmail = emailData.from;
    const customerName = emailData.customer?.name || '';
    
    // Müşteriyi kontrol et veya oluştur
    let customer = await this.customerService.findByEmail(customerEmail);
    
    if (!customer) {
      // Yeni müşteri oluştur
      customer = await this.customerService.create({
        name: customerName,
        email: customerEmail,
        customerType: CustomerType.BUYER,
      });
    }
    
    // Alıcı tercihlerini kaydet
    const preferences = emailData.buyerPreferences || {};
    
    // Tercihleri güncelle veya oluştur
    const existingPreference = await this.prisma.$queryRaw`
      SELECT * FROM BuyerPreference WHERE buyerId = ${customer.id}
    `;
    
    const preferredLocations = Array.isArray(preferences.locations) ? 
      JSON.stringify(preferences.locations) : null;
    
    const preferredDistricts = Array.isArray(preferences.districts) ? 
      JSON.stringify(preferences.districts) : null;
    
    const propertyTypes = Array.isArray(preferences.propertyTypes) ? 
      JSON.stringify(preferences.propertyTypes) : null;
    
    if (existingPreference && Array.isArray(existingPreference) && existingPreference.length > 0) {
      // Tercihleri güncelle
      await this.prisma.$queryRaw`
        UPDATE BuyerPreference
        SET 
          preferredLocations = ${preferredLocations},
          preferredDistricts = ${preferredDistricts},
          minPrice = ${preferences.minPrice || null},
          maxPrice = ${preferences.maxPrice || null},
          minSize = ${preferences.minSize || null},
          maxSize = ${preferences.maxSize || null},
          propertyTypes = ${propertyTypes},
          roomCountMin = ${preferences.roomCount || null},
          hasGarage = ${preferences.features?.includes('garage') ? 1 : null},
          hasGarden = ${preferences.features?.includes('garden') ? 1 : null},
          hasPool = ${preferences.features?.includes('pool') ? 1 : null},
          isFurnished = ${preferences.features?.includes('furnished') ? 1 : null}
        WHERE buyerId = ${customer.id}
      `;
    } else {
      // Yeni tercih oluştur
      await this.prisma.$queryRaw`
        INSERT INTO BuyerPreference (
          buyerId, 
          preferredLocations,
          preferredDistricts,
          minPrice,
          maxPrice,
          minSize,
          maxSize,
          propertyTypes,
          roomCountMin,
          hasGarage,
          hasGarden,
          hasPool,
          isFurnished
        )
        VALUES (
          ${customer.id},
          ${preferredLocations},
          ${preferredDistricts},
          ${preferences.minPrice || null},
          ${preferences.maxPrice || null},
          ${preferences.minSize || null},
          ${preferences.maxSize || null},
          ${propertyTypes},
          ${preferences.roomCount || null},
          ${preferences.features?.includes('garage') ? 1 : null},
          ${preferences.features?.includes('garden') ? 1 : null},
          ${preferences.features?.includes('pool') ? 1 : null},
          ${preferences.features?.includes('furnished') ? 1 : null}
        )
      `;
    }
    
    // Tercihlere göre eşleşen gayrimenkulleri bul
    const matchingProperties = await this.findMatchesForBuyer(customer.id, preferences);
    
    // Müşteriye e-posta gönder
    if (matchingProperties.length > 0) {
      await this.mailService.sendToBuyer(customer, matchingProperties);
    } else {
      // Eşleşme bulunamadı, sadece alındı bilgisi gönder
      await this.mailService.sendToBuyer(customer, []);
    }
    
    return {
      success: true,
      message: 'Buyer inquiry processed',
      customerId: customer.id,
      preferences,
      matchCount: matchingProperties.length
    };
  }
  
  // Satıcı ilanlarını işle - public yapalım
  async processSellerListing(emailData: any, existingListing?: any): Promise<any> {
    // Gelen e-postadan müşteri bilgilerini al
    const customerEmail = emailData.from;
    const customerName = emailData.customer?.name || '';
    
    // Müşteriyi kontrol et veya oluştur
    let customer = await this.customerService.findByEmail(customerEmail);
    
    if (!customer) {
      // Yeni müşteri oluştur
      customer = await this.customerService.create({
        name: customerName,
        email: customerEmail,
        customerType: CustomerType.SELLER,
      });
    } else if (customer.customerType === 'BUYER') {
      // Müşteriyi güncelle, artık hem alıcı hem satıcı
      await this.customerService.updateCustomer(customer.id.toString(), {
        customerType: CustomerType.BOTH
      });
    }
    
    // Gayrimenkul bilgilerini al
    const property = emailData.property || {};
    
    // AI tarafından oluşturulan veya gelen açıklama metnini zenginleştir
    if (!property.description || property.description.trim() === '') {
      property.description = await this.gptService.generateListingDescription(property);
    }
    
    // Yeni ilan veya güncelleme
    let listing;
    
    if (existingListing) {
      // Mevcut ilanı güncelle
      const result = await this.prisma.$queryRaw`
        UPDATE RealEstateListing
        SET 
          propertyType = ${property.propertyType || existingListing.propertyType},
          location = ${property.location || existingListing.location},
          city = ${property.city || existingListing.city},
          district = ${property.district || existingListing.district},
          neighborhood = ${property.neighborhood || existingListing.neighborhood},
          price = ${property.price || existingListing.price},
          currency = ${property.currency || existingListing.currency},
          size = ${property.size || existingListing.size},
          roomCount = ${property.roomCount || existingListing.roomCount},
          bathroomCount = ${property.bathroomCount || existingListing.bathroomCount},
          floor = ${property.floor || existingListing.floor},
          totalFloors = ${property.totalFloors || existingListing.totalFloors},
          hasGarage = ${property.hasGarage !== undefined ? (property.hasGarage ? 1 : 0) : existingListing.hasGarage},
          hasGarden = ${property.hasGarden !== undefined ? (property.hasGarden ? 1 : 0) : existingListing.hasGarden},
          hasPool = ${property.hasPool !== undefined ? (property.hasPool ? 1 : 0) : existingListing.hasPool},
          isFurnished = ${property.isFurnished !== undefined ? (property.isFurnished ? 1 : 0) : existingListing.isFurnished},
          yearBuilt = ${property.yearBuilt || existingListing.yearBuilt},
          description = ${property.description || existingListing.description},
          features = ${property.features || existingListing.features}
        WHERE id = ${existingListing.id}
        RETURNING *
      `;
      
      listing = Array.isArray(result) ? result[0] : result;
      
      // İlan güncellemesi hakkında satıcıya bildirim gönder
      await this.mailService.sendToSeller(customer, property, listing.listingNo);
      
    } else {
      // Yeni ilan oluştur
      const listingNo = `RE-${Date.now().toString().slice(-6)}`;
      
      const result = await this.prisma.$queryRaw`
        INSERT INTO RealEstateListing (
          listingNo,
          status,
          sellerId,
          propertyType,
          location,
          city,
          district,
          neighborhood,
          price,
          currency,
          size,
          roomCount,
          bathroomCount,
          floor,
          totalFloors,
          hasGarage,
          hasGarden,
          hasPool,
          isFurnished,
          yearBuilt,
          description,
          features
        )
        VALUES (
          ${listingNo},
          'ACTIVE',
          ${customer.id},
          ${property.propertyType || 'APARTMENT'},
          ${property.location || ''},
          ${property.city || ''},
          ${property.district || null},
          ${property.neighborhood || null},
          ${property.price || 0},
          ${property.currency || 'TL'},
          ${property.size || null},
          ${property.roomCount || null},
          ${property.bathroomCount || null},
          ${property.floor || null},
          ${property.totalFloors || null},
          ${property.hasGarage ? 1 : 0},
          ${property.hasGarden ? 1 : 0},
          ${property.hasPool ? 1 : 0},
          ${property.isFurnished ? 1 : 0},
          ${property.yearBuilt || null},
          ${property.description || ''},
          ${property.features ? JSON.stringify(property.features) : null}
        )
        RETURNING *
      `;
      
      listing = Array.isArray(result) ? result[0] : result;
      
      // Yeni ilan hakkında satıcıya bildirim gönder
      await this.mailService.sendToSeller(customer, property, listing.listingNo);
      
      // Eşleşen alıcıları bul ve bildirim gönder
      await this.notifyMatchingBuyers(listing);
    }
    
    return {
      success: true,
      message: 'Seller listing processed',
      customerId: customer.id,
      listingId: listing.id,
      listingNo: listing.listingNo
    };
  }

  // İlanla eşleşen alıcılara bildirim gönder
  private async notifyMatchingBuyers(listing: any): Promise<void> {
    // Alıcı tercihlerini kontrol et
    const buyerPreferences = await this.prisma.$queryRaw`
      SELECT * FROM BuyerPreference
    `;
    
    const buyerPreferencesArray = buyerPreferences as any[];
    for (const preference of buyerPreferencesArray) {
      let isMatch = true;
      
      // Şehir kontrolü
      if (preference.preferredLocations) {
        const locations = JSON.parse(preference.preferredLocations);
        if (Array.isArray(locations) && locations.length > 0) {
          if (!locations.includes(listing.city)) {
            isMatch = false;
          }
        }
      }
      
      // Bölge kontrolü
      if (isMatch && preference.preferredDistricts && listing.district) {
        const districts = JSON.parse(preference.preferredDistricts);
        if (Array.isArray(districts) && districts.length > 0) {
          if (!districts.includes(listing.district)) {
            isMatch = false;
          }
        }
      }
      
      // Fiyat aralığı kontrolü
      if (isMatch && preference.minPrice && listing.price < preference.minPrice) {
        isMatch = false;
      }
      
      if (isMatch && preference.maxPrice && listing.price > preference.maxPrice) {
        isMatch = false;
      }
      
      // Metrekare kontrolü
      if (isMatch && preference.minSize && listing.size < preference.minSize) {
        isMatch = false;
      }
      
      // Özellik tipi kontrolü
      if (isMatch && preference.propertyTypes) {
        const types = JSON.parse(preference.propertyTypes);
        if (Array.isArray(types) && types.length > 0) {
          if (!types.includes(listing.propertyType)) {
            isMatch = false;
          }
        }
      }
      
      // Diğer özellikler (opsiyonel)
      if (isMatch && preference.hasGarage === true && !listing.hasGarage) {
        isMatch = false;
      }
      
      if (isMatch && preference.hasGarden === true && !listing.hasGarden) {
        isMatch = false;
      }
      
      if (isMatch && preference.hasPool === true && !listing.hasPool) {
        isMatch = false;
      }
      
      if (isMatch && preference.isFurnished === true && !listing.isFurnished) {
        isMatch = false;
      }
      
      // Eşleşme varsa, alıcıya bildirim gönder
      if (isMatch) {
        const buyer = await this.customerService.findById(preference.buyerId);
        if (buyer) {
          const seller = await this.customerService.findById(listing.sellerId);
          await this.mailService.sendPropertyMatch(buyer, listing, seller);
          
          // İlgi kaydı oluştur
          await this.prisma.$queryRaw`
            INSERT INTO RealEstateInterest (
              buyerId,
              listingId,
              status
            )
            VALUES (
              ${buyer.id},
              ${listing.id},
              'NEW'
            )
          `;
        }
      }
    }
  }

  // Görüntüleme taleplerini işle
  async processViewingRequest(emailData: any): Promise<any> {
    const { from, property, viewingRequest } = emailData;
    
    // Müşteriyi kontrol et
    const customer = await this.customerService.findByEmail(from);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // İlanı bul
    const listing = await this.findListing(viewingRequest.propertyId);
    
    if (!listing) {
      throw new Error(`Listing ${viewingRequest.propertyId} not found`);
    }
    
    // Görüntüleme tarihi
    const viewingDate = viewingRequest.preferredDate ? 
      new Date(viewingRequest.preferredDate) : 
      new Date(Date.now() + 24 * 60 * 60 * 1000); // Varsayılan: yarın
    
    // İlgi kaydını güncelle veya oluştur
    const interest = await this.prisma.$queryRaw`
      SELECT * FROM RealEstateInterest WHERE buyerId = ${customer.id} AND listingId = ${listing.id}
    `;
    
    if (interest && Array.isArray(interest) && interest.length > 0) {
      await this.prisma.$queryRaw`
        UPDATE RealEstateInterest
        SET 
          status = 'VIEWING_SCHEDULED',
          viewingDate = ${viewingDate},
          notes = ${viewingRequest.message || interest[0].notes}
        WHERE id = ${interest[0].id}
      `;
    } else {
      await this.prisma.$queryRaw`
        INSERT INTO RealEstateInterest (
          buyerId,
          listingId,
          status,
          viewingDate,
          notes
        )
        VALUES (
          ${customer.id},
          ${listing.id},
          'VIEWING_SCHEDULED',
          ${viewingDate},
          ${viewingRequest.message}
        )
      `;
    }
    
    // Görüntüleme onayı gönder
    await this.mailService.sendViewingConfirmation(customer, listing, viewingDate);
    
    return {
      success: true,
      message: 'Viewing request processed',
      customerId: customer.id,
      listingId: listing.id,
      viewingDate,
    };
  }

  async createOrUpdateListingFromAnalysis(
    customerId: number,
    analysisProperty: EmailAnalysisProperty | null,
    generateDescriptionIfMissing = true, // Opsiyonel: Açıklama yoksa GPT ile üret
  ): Promise<PrismaRealEstateListing | null> {
    if (!analysisProperty) {
      this.logger.warn(
        `createOrUpdateListingFromAnalysis: Müşteri ID ${customerId} için analiz emlak bilgisi boş.`,      );
      return null;
    }

    this.logger.log(
      `Müşteri ID ${customerId} için emlak ilanı oluşturuluyor/güncelleniyor.`,    );

    try {
      const listingNo = `RE-${Date.now().toString().slice(-7)}`; // Benzersiz ilan no

      let description = analysisProperty.description;
      if (!description && generateDescriptionIfMissing) {
        this.logger.log(`İlan için açıklama eksik, GPT ile üretiliyor...`);
        // GptService'in çağrılabilmesi için constructor'da inject edilmiş olmalı.
        // Mevcut constructor'da gptService zaten var.
        try {
          const propertyInfoForGpt = {
            type: analysisProperty.propertyType,
            location: analysisProperty.location,
            city: analysisProperty.city,
            district: analysisProperty.district,
            price: analysisProperty.price,
            size: analysisProperty.size,
            roomCount: analysisProperty.roomCount,
            features: analysisProperty.features,
          };
          description = await this.gptService.generateListingDescription(
            propertyInfoForGpt,
          );
          this.logger.log(`GPT ile ilan açıklaması üretildi.`);
        } catch (gptError) {
          this.logger.error(
            `GPT ile ilan açıklaması üretilemedi: ${gptError.message}`,
            gptError.stack,
          );
          // Açıklama üretilemezse bile devam et, null kalabilir veya varsayılan bir metin atanabilir.
        }
      }

      const createData: Prisma.RealEstateListingCreateInput = {
        listingNo,
        seller: { connect: { id: customerId } },
        status: 'ACTIVE', // Varsayılan durum, RealEstateStatus enum kullanılabilir
        propertyType: analysisProperty.propertyType || 'UNKNOWN',
        location: analysisProperty.location || 'Belirtilmedi',
        city: analysisProperty.city || 'Belirtilmedi',
        district: analysisProperty.district,
        neighborhood: analysisProperty.neighborhood,
        price: analysisProperty.price || 0,
        currency: analysisProperty.currency || 'TRY',
        size: analysisProperty.size,
        roomCount: analysisProperty.roomCount,
        bathroomCount: analysisProperty.bathroomCount,
        floor: analysisProperty.floor,
        totalFloors: analysisProperty.totalFloors,
        hasGarage: analysisProperty.hasGarage || false,
        hasGarden: analysisProperty.hasGarden || false,
        hasPool: analysisProperty.hasPool || false,
        isFurnished: analysisProperty.isFurnished || false,
        yearBuilt: analysisProperty.yearBuilt,
        description: description || 'Açıklama girilmedi.',
        features: analysisProperty.features
          ? (analysisProperty.features as Prisma.JsonArray)
          : Prisma.JsonNull,
        // images, videos, virtualTour alanları şimdilik null bırakılıyor.
        // Bunlar için analiz şemasında ve GPT prompt'unda eklemeler yapılabilir.
        images: Prisma.JsonNull,
        videos: Prisma.JsonNull,
      };

      const newListing = await this.prisma.realEstateListing.create({
        data: createData,
      });

      this.logger.log(
        `Yeni emlak ilanı oluşturuldu: ${newListing.listingNo} - Müşteri ID: ${customerId}`,      );
      return newListing;
    } catch (error) {
      this.logger.error(
        `Müşteri ID ${customerId} için emlak ilanı oluşturulurken/güncellenirken hata: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
} 