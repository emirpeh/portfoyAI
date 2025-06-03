import { Injectable, Logger, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import {
  PropertyRequestDto,
  PropertyListingDto,
  ProcessParsedPropertyEmailDto,
} from './dto/process.property-email.dto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CustomerService, CustomerType } from '../customer/customer.service';
import { PropertySearchRequest, MatchedProperty, RealEstateListing, Prisma, Customer } from '@prisma/client';
import type { EmailAnalysisBuyerPreferences } from '../gpt/schemas/real-estate-email-analysis.schema';

// Enum'lar doğru ve tekil kaynaklardan import edilecek
import { PropertySearchRequestStatus } from './types/property-search-request.status.enum';
import { MatchedPropertyStatus } from './types/matched-property.status.enum';
import { MailLogType } from '../mail/types/mail-log.type.enum';

// Tipler .types.ts dosyasından gelecek (PropertySearchRequestStatus hariç)
import {
  IPropertySearchRequest,
  IRequestedLocation,
  IMatchedProperty,
  CreatePropertySearchRequestData,
  UpdatePropertySearchRequestData,
  CreateMatchedPropertyData,
  MailStatusType,
} from './types/property-search-request.types';

// RealEstateListing için durumları ve konfigürasyonu buraya alabiliriz veya RealEstateService'ten import edebiliriz.
// Şimdilik RealEstateListingStatus'ı doğrudan string olarak kullanacağız, idealde bu da bir enum olmalı.
// export type RealEstateStatus = 'ACTIVE' | 'SOLD' | 'RENTED' | 'PENDING' | 'WITHDRAWN';

// Emlak sektörü için tipler
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

import { RealEstateService } from '../real-estate/real-estate.service';

@Injectable()
export class PropertySearchRequestService {
  private readonly logger = new Logger(PropertySearchRequestService.name);
  private readonly defaultMail: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MailService))
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => RealEstateService))
    private readonly realEstateService: RealEstateService,
  ) {
    this.defaultMail = this.configService.get<string>('DEFAULT_MAIL');
  }

  async processParsedEmail(parsedEmail: ProcessParsedPropertyEmailDto): Promise<any> {
    try {
      const emailType = parsedEmail.emailType;
      
      this.logger.log(`Gelen e-posta işleniyor: ${parsedEmail.subject}, Tip: ${emailType}, Gönderen: ${parsedEmail.from}`);

      if (emailType === MailLogType.PROPERTY_INQUIRY_BUYER) {
        if (!parsedEmail.propertyRequest) {
          this.logger.warn('PROPERTY_INQUIRY_BUYER için propertyRequest alanı eksik.', parsedEmail);
          throw new Error('Alıcı emlak talebi detayı (propertyRequest) eksik.');
        }
        return await this.handleNewBuyerInquiry(parsedEmail.from, parsedEmail.propertyRequest as PropertyRequestDto, parsedEmail.additionalRawData);
      } else if (emailType === MailLogType.LISTING_SUBMISSION_SELLER) {
        if (!parsedEmail.propertyListing) {
          this.logger.warn('LISTING_SUBMISSION_SELLER için propertyListing alanı eksik.', parsedEmail);
          throw new Error('Satıcı emlak ilanı detayı (propertyListing) eksik.');
        }
        return await this.handleNewSellerListing(parsedEmail.from, parsedEmail.propertyListing as PropertyListingDto, parsedEmail.additionalRawData);
      } else if (emailType === MailLogType.VIEWING_REQUEST_BUYER) {
        this.logger.log(`Görüntüleme talebi alındı: ${parsedEmail.subject} - Gönderen: ${parsedEmail.from}`);
        return { message: 'Viewing request received and logged.', type: emailType };
      }
      
      this.logger.log(`İşlenmeyen veya genel e-posta tipi: ${emailType} - Başlık: ${parsedEmail.subject}`);

      await this.mailService.createMailLog({
        type: emailType.toString(),
        externalId: parsedEmail.additionalRawData?.messageId as string,
        from: parsedEmail.from,
        to: parsedEmail.to?.join(', ') || this.defaultMail,
        cc: parsedEmail.cc?.join(', '),
        contentTitle: parsedEmail.subject,
        contentBody: parsedEmail.body,
        language: parsedEmail.language,
        parsedData: parsedEmail.additionalRawData as Prisma.JsonValue,
      });

      return { message: 'Email processed with generic logging', type: emailType };
    } catch (error) {
      this.logger.error(`E-posta işleme hatası (${parsedEmail.subject}): ${error.message}`, error.stack);
      await this.mailService.createMailLog({
        type: parsedEmail.emailType?.toString() || MailLogType.OTHER.toString(),
        from: parsedEmail.from,
        to: parsedEmail.to?.join(', ') || this.defaultMail,
        contentTitle: `HATA: ${parsedEmail.subject}`,
        contentBody: `İşleme sırasında hata oluştu: ${error.message}\n\n${parsedEmail.body}`,
        parsedData: { error: error.message, stack: error.stack } as Prisma.JsonValue,
      }).catch(logError => this.logger.error('Hata logu yazılırken ek hata oluştu:', logError));
      
      throw error;
    }
  }

  private async handleNewBuyerInquiry(email: string, requestDto: PropertyRequestDto, senderDetails?: { name?: string }): Promise<any> {
    const customerEmail = email;
    const customerName = senderDetails?.name || 'Unknown Buyer';
    this.logger.log(`Yeni alıcı talebi işleniyor: ${customerEmail}`);
    if (!requestDto) {
      this.logger.warn('Alıcı talebi için özellik detayı (PropertyRequestDto) bulunamadı.', { email });
      throw new Error('Property request details (PropertyRequestDto) missing.');
    }

    let customer = await this.customerService.findByEmail(customerEmail);
    if (!customer) {
      customer = await this.customerService.create({
        email: customerEmail,
        name: customerName,
        customerType: CustomerType.BUYER,
      });
      this.logger.log(`Yeni alıcı müşteri oluşturuldu: ${customer.email}`);
    } else {
      this.logger.log(`Mevcut alıcı müşteri bulundu: ${customer.email}`);
    }

    const createData: CreatePropertySearchRequestData = {
      customerId: customer.id,
      notes: requestDto.notes,
      minPrice: requestDto.minPrice,
      maxPrice: requestDto.maxPrice,
      currency: requestDto.currency,
      minSize: requestDto.minSize,
      maxSize: requestDto.maxSize,
      minRooms: requestDto.minRooms,
      maxRooms: requestDto.maxRooms,
      propertyTypes: requestDto.propertyTypes ? requestDto.propertyTypes.split(',').map(s => s.trim()).filter(s => s) : undefined,
      locations: requestDto.locations ? this.parseLocationsString(requestDto.locations) : undefined,
      requiredFeatures: requestDto.requiredFeatures ? requestDto.requiredFeatures.split(',').map(s => s.trim()).filter(s => s) : undefined,
    };

    const newSearchRequest = await this.createPropertySearchRequest(createData);
    this.logger.log(`Alıcı talebi oluşturuldu: ${newSearchRequest.requestNo} - Müşteri: ${customer.email}`);
    return {
      success: true,
      message: 'Buyer inquiry processed and property search request created.',
      requestNo: newSearchRequest.requestNo,
      searchRequestId: newSearchRequest.id,
      customerId: customer.id,
    };
  }

  private parseLocationsString(locationsString: string): IRequestedLocation[] {
    try {
      // Örnek format: "İstanbul, Kadıköy; Ankara, Çankaya"
      // veya "İstanbul, Kadıköy, Göztepe; Ankara, Çankaya, Kızılay"
      return locationsString.split(';').map(part => {
        const items = part.split(',').map(s => s.trim());
        const location: IRequestedLocation = { city: items[0] };
        if (items[1]) location.district = items[1];
        if (items[2]) location.neighborhood = items[2];
        return location;
      }).filter(loc => loc.city); // Sadece city alanı olanları al
    } catch (e) {
      this.logger.warn(`Lokasyon string ayrıştırma hatası: "${locationsString}"`, e);
      // Hata durumunda orijinal string'i şehir olarak döndürmeyi deneyebiliriz veya boş array
      return [{ city: locationsString }]; // Veya daha iyi bir hata yönetimi
    }
  }

  private async handleNewSellerListing(
    email: string, 
    listingDto: PropertyListingDto, 
    senderDetails?: { name?: string, listingNo?: string, existingListingId?: number }
  ): Promise<any> {
    const customerEmail = email;
    const customerName = senderDetails?.name || listingDto.sellerName || 'Unknown Seller';
    const existingListingId = senderDetails?.existingListingId;
    this.logger.log(`Satıcı ilanı işleniyor: ${customerEmail}, Mevcut ID: ${existingListingId}`);

    if (!listingDto) {
      this.logger.warn('Satıcı ilanı için özellik detayı (PropertyListingDto) bulunamadı.', { email });
      throw new Error('Property listing details (PropertyListingDto) missing.');
    }

    let customer = await this.customerService.findByEmail(customerEmail);
    if (!customer) {
      customer = await this.customerService.create({
        email: customerEmail,
        name: customerName,
        customerType: CustomerType.SELLER,
      });
      this.logger.log(`Yeni satıcı müşteri oluşturuldu: ${customer.email}`);
    } else {
      // Müşteri varsa ve tipi alıcı ise, satıcı olarak güncelleyebiliriz veya hata verebiliriz.
      // Şimdilik sadece logluyoruz.
      this.logger.log(`Mevcut müşteri bulundu: ${customer.email}, Tipi: ${customer.customerType}`);
      if(customer.customerType !== CustomerType.SELLER && customer.customerType !== CustomerType.BOTH) {
         // Gerekirse müşteri tipini güncelle
         // await this.customerService.update(customer.id, { customerType: CustomerType.BOTH });
         this.logger.warn(`Müşteri ${customer.email} normalde ${customer.customerType} ancak şimdi satıcı işlemi yapıyor.`);
      }
    }

    let listing: RealEstateListing;
    const listingNoInput = senderDetails?.listingNo || `RE-${listingDto.city || 'CITY'}-${listingDto.district || 'DIST'}-${Date.now().toString().slice(-4)}`;

    let featuresAsJson: Prisma.JsonValue = null;
    if (listingDto.features) {
      if (Array.isArray(listingDto.features)) {
        featuresAsJson = JSON.parse(JSON.stringify(listingDto.features.filter(f => f))); // Boş stringleri filtrele
      } else if (typeof listingDto.features === 'string') {
        featuresAsJson = JSON.parse(JSON.stringify(listingDto.features.split(',').map(f => f.trim()).filter(f => f)));
      }
    }
    
    const dataToSave: Prisma.RealEstateListingUncheckedCreateInput | Prisma.RealEstateListingUpdateInput = {
      propertyType: listingDto.propertyType, // PropertyListingDto'da zorunlu
      location: listingDto.location, // PropertyListingDto'da zorunlu
      city: listingDto.city || undefined,
      district: listingDto.district || undefined,
      neighborhood: listingDto.neighborhood || undefined,
      price: listingDto.price, // PropertyListingDto'da zorunlu
      currency: listingDto.currency, // PropertyListingDto'da zorunlu
      size: listingDto.size ?? undefined,
      roomCount: listingDto.roomCount ?? undefined,
      bathroomCount: listingDto.bathroomCount ?? undefined,
      floor: listingDto.floor ?? undefined,
      totalFloors: listingDto.totalFloors ?? undefined,
      hasGarage: listingDto.hasGarage ?? false,
      hasGarden: listingDto.hasGarden ?? false,
      hasPool: listingDto.hasPool ?? false,
      isFurnished: listingDto.isFurnished ?? false,
      yearBuilt: listingDto.yearBuilt ?? undefined,
      description: listingDto.description,
      features: featuresAsJson,
      seller: { connect: { id: customer.id } },
      status: 'ACTIVE', // Varsayılan olarak aktif
    };

    if (existingListingId) {
      listing = await this.prisma.realEstateListing.update({
        where: { id: existingListingId },
        data: dataToSave,
      });
      this.logger.log(`Emlak ilanı güncellendi: ${listing.listingNo} (ID: ${listing.id}) - Satıcı: ${customer.email}`);
    } else {
      // Önce listingNo ile kontrol et (eğer AI tarafından sağlanmışsa)
      const existingByListingNo = listingDto.listingNo ? await this.prisma.realEstateListing.findUnique({ where: { listingNo: listingDto.listingNo }}) : null;

      if (existingByListingNo) {
        listing = await this.prisma.realEstateListing.update({
            where: { listingNo: listingDto.listingNo },
            data: dataToSave,
        });
        this.logger.log(`Mevcut emlak ilanı (listingNo ile bulundu: ${listingDto.listingNo}) güncellendi: ${listing.listingNo} - Satıcı: ${customer.email}`);
      } else {
        // Eğer AI listingNo sağlamadıysa veya o no ile bulunamadıysa, oluşturulan listingNoInput ile kontrol et
        const existingByGeneratedListingNo = await this.prisma.realEstateListing.findUnique({ where: { listingNo: listingNoInput }});
        if(existingByGeneratedListingNo) {
           listing = await this.prisma.realEstateListing.update({
              where: { listingNo: listingNoInput },
              data: dataToSave,
           });
           this.logger.log(`Mevcut emlak ilanı (oluşturulan No ile bulundu: ${listingNoInput}) güncellendi: ${listing.listingNo} - Satıcı: ${customer.email}`);
      } else {
        listing = await this.prisma.realEstateListing.create({
          data: {
            ...dataToSave,
              listingNo: listingDto.listingNo || listingNoInput, // AI'dan gelen listingNo öncelikli
            } as Prisma.RealEstateListingCreateInput,
        });
        this.logger.log(`Yeni emlak ilanı oluşturuldu: ${listing.listingNo} (ID: ${listing.id}) - Satıcı: ${customer.email}`);
      }
    }
    }
    return {
      success: true,
      message: existingListingId || (listingDto.listingNo && await this.prisma.realEstateListing.findUnique({where: {listingNo: listingDto.listingNo}})) ? 'Seller listing updated successfully.' : 'Seller listing created successfully.',
      listingId: listing.id,
      listingNo: listing.listingNo,
      customerId: customer.id,
    };
  }

  async createPropertySearchRequest(data: CreatePropertySearchRequestData): Promise<PropertySearchRequest> {
    const requestNo = this.createPropertyRequestNo();
    
    this.logger.log(`Yeni emlak arama talebi oluşturuluyor: No: ${requestNo}, Müşteri ID: ${data.customerId}`);

    try {
      const newSearchRequest = await this.prisma.propertySearchRequest.create({
        data: {
          requestNo: requestNo,
          status: data.status || PropertySearchRequestStatus.ACTIVE,
          customer: { connect: { id: data.customerId } },
          notes: data.notes,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          currency: data.currency,
          minSize: data.minSize,
          maxSize: data.maxSize,
          minRooms: data.minRooms,
          maxRooms: data.maxRooms,
          propertyTypes: data.propertyTypes ? JSON.stringify(data.propertyTypes) : null,
          locations: data.locations ? JSON.stringify(data.locations) : null,
          requiredFeatures: data.requiredFeatures ? JSON.stringify(data.requiredFeatures) : null,
        },
      });
      this.logger.log(`Emlak arama talebi başarıyla oluşturuldu: ${newSearchRequest.requestNo}`);
      return newSearchRequest;
    } catch (error) {
      this.logger.error(`PropertySearchRequest oluşturma hatası (No: ${requestNo}): ${error.message}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.warn(`requestNo çakışması: ${requestNo}.`);
        }
      }
      throw error;
    }
  }
  
  createPropertyRequestNo(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Yılın son iki hanesi
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Ay (01-12)
    const day = now.getDate().toString().padStart(2, '0'); // Gün (01-31)
    // Haftanın günü yerine gün kullanmak daha basit olabilir veya farklı bir sıralı numara
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PSR-${year}${month}${day}-${random}`;
  }

  async findPropertySearchRequestByRequestNo(requestNo: string): Promise<IPropertySearchRequest | null> {
    const searchRequest = await this.prisma.propertySearchRequest.findUnique({
      where: { requestNo },
      include: {
        customer: true, // İsteğe bağlı olarak müşteri bilgisini de al
        // mailLogs: true, // İsteğe bağlı
        // matchedProperties: true, // İsteğe bağlı
      },
    });

    if (!searchRequest) {
      return null;
    }

    // JSON alanlarını parse et
    // Bu casting işlemleri Prisma'nın JsonValue tipinden beklenen array/object tipine güvenli geçiş içindir.
    const parsedRequest: IPropertySearchRequest = {
      ...searchRequest,
      propertyTypes: searchRequest.propertyTypes ? JSON.parse(searchRequest.propertyTypes as string) as string[] : undefined,
      locations: searchRequest.locations ? JSON.parse(searchRequest.locations as string) as IRequestedLocation[] : undefined,
      requiredFeatures: searchRequest.requiredFeatures ? JSON.parse(searchRequest.requiredFeatures as string) as string[] : undefined,
      // Diğer alanlar zaten doğru tipte olmalı
      status: searchRequest.status as PropertySearchRequestStatus, // Enum tipine cast
    };
    return parsedRequest;
  }

  async getPropertySearchRequestById(id: number): Promise<IPropertySearchRequest | null> {
    const searchRequest = await this.prisma.propertySearchRequest.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!searchRequest) {
      throw new NotFoundException(`PropertySearchRequest with ID "${id}" not found`);
    }
    
    const parsedRequest: IPropertySearchRequest = {
      ...searchRequest,
      propertyTypes: searchRequest.propertyTypes ? JSON.parse(searchRequest.propertyTypes as string) as string[] : undefined,
      locations: searchRequest.locations ? JSON.parse(searchRequest.locations as string) as IRequestedLocation[] : undefined,
      requiredFeatures: searchRequest.requiredFeatures ? JSON.parse(searchRequest.requiredFeatures as string) as string[] : undefined,
      status: searchRequest.status as PropertySearchRequestStatus,
    };
    return parsedRequest;
  }

  async listPropertySearchRequests({
    startDate,
    endDate,
    status,
    limit = 10,
    offset = 0,
    customerId,
    requestNo,
  }: {
    startDate?: Date;
    endDate?: Date;
    status?: PropertySearchRequestStatus;
    limit?: number;
    offset?: number;
    customerId?: number;
    requestNo?: string;
  }): Promise<{ data: IPropertySearchRequest[]; pagination: { total: number; limit: number; offset: number; } }> {
    
    const where: Prisma.PropertySearchRequestWhereInput = {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(requestNo && { requestNo: { contains: requestNo } }),
    };

    const [total, searchRequests] = await this.prisma.$transaction([
      this.prisma.propertySearchRequest.count({ where }),
      this.prisma.propertySearchRequest.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          customer: true, 
        },
      }),
    ]);

    const parsedData: IPropertySearchRequest[] = searchRequests.map(sr => ({
      ...sr,
      propertyTypes: sr.propertyTypes ? JSON.parse(sr.propertyTypes as string) as string[] : undefined,
      locations: sr.locations ? JSON.parse(sr.locations as string) as IRequestedLocation[] : undefined,
      requiredFeatures: sr.requiredFeatures ? JSON.parse(sr.requiredFeatures as string) as string[] : undefined,
      status: sr.status as PropertySearchRequestStatus,
    }));

    return {
      data: parsedData,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async updatePropertySearchRequestStatus(requestNo: string, status: PropertySearchRequestStatus): Promise<PropertySearchRequest> {
    const searchRequest = await this.prisma.propertySearchRequest.findUnique({
      where: { requestNo },
    });

    if (!searchRequest) {
      throw new NotFoundException(`PropertySearchRequest with No "${requestNo}" not found`);
    }

    if (!Object.values(PropertySearchRequestStatus).includes(status)) {
        throw new Error(`Invalid status value: ${status}`);
    }

    return this.prisma.propertySearchRequest.update({
      where: { id: searchRequest.id },
      data: { status },
    });
  }

  async createOrUpdateSearchRequestFromAnalysis(
    customerId: number,
    analysisBuyerPreferences: EmailAnalysisBuyerPreferences | null,
    mailLogId?: number,
  ): Promise<PropertySearchRequest | null> {
    this.logger.debug(
      `createOrUpdateSearchRequestFromAnalysis çağrıldı. customerId: ${customerId}`,
    );
    if (!analysisBuyerPreferences) {
      this.logger.warn(
        'createOrUpdateSearchRequestFromAnalysis: analysisBuyerPreferences boş geldi, işlem iptal edildi.',
      );
      return null;
    }

    try {
      // EmailAnalysisBuyerPreferencesSchema'daki doğru alan adlarını kullan:
      const { 
        propertyTypes, 
        locations, // 'location' değil 'locations' (string[])
        districts, // 'districts' (string[])
        minPrice, 
        maxPrice, 
        // currency alanı EmailAnalysisBuyerPreferencesSchema'da yok
        minSize, 
        maxSize, 
        roomCount, // 'bedroomsMin' değil 'roomCount'
        features     // 'otherPreferences' değil 'features'
      } = analysisBuyerPreferences;

      const existingRequest = await this.prisma.propertySearchRequest.findFirst({
        where: {
          customerId,
          status: PropertySearchRequestStatus.ACTIVE, // .status.enum.ts'den gelen enum
        },
      });

      let notesContent = features?.join(', ') || '';
      if (locations && locations.length > 0) {
        const locationNotes = `Preferred general locations: ${locations.join(', ')}`;
        notesContent = notesContent ? `${notesContent}; ${locationNotes}` : locationNotes;
      }
      if (districts && districts.length > 0) {
        const districtNotes = `Preferred districts: ${districts.join(', ')}`;
        notesContent = notesContent ? `${notesContent}; ${districtNotes}` : districtNotes;
      }


      const data: Prisma.PropertySearchRequestCreateInput | Prisma.PropertySearchRequestUpdateInput = {
        customer: { connect: { id: customerId } },
        propertyTypes: propertyTypes || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        currency: undefined, // EmailAnalysisBuyerPreferencesSchema'da currency yok, Prisma şeması kontrol edilmeli
        minSize: minSize || undefined,
        maxSize: maxSize || undefined,
        minRooms: roomCount || undefined, // Prisma'da minRooms var, schema'da roomCount. Tek bir değer olduğu için minRooms'a atıyoruz. maxRooms schema'da yok.
        // locations alanı IRequestedLocation[] bekliyor, GPT'den gelen string[]
        // Şimdilik notes'a ekledik. Gerekirse dönüştürme/ayrıştırma mantığı eklenebilir.
        // requiredFeatures alanı Prisma'da var mı? Varsa features buraya atanabilir.
        // Şimdilik notes'a ekledik.
        notes: notesContent || undefined,
        status: PropertySearchRequestStatus.ACTIVE, // .status.enum.ts'den gelen enum
      };
      
      let searchRequest: PropertySearchRequest;
      if (existingRequest) {
        this.logger.log(`Mevcut aktif arama talebi güncelleniyor: ${existingRequest.id}`);
        searchRequest = await this.prisma.propertySearchRequest.update({
          where: { id: existingRequest.id },
          data,
        });
      } else {
        const requestNo = this.generateRequestNo(); // Benzersiz numara üretimi
        this.logger.log(`Yeni arama talebi oluşturuluyor müşteri için: ${customerId}, No: ${requestNo}`);
        searchRequest = await this.prisma.propertySearchRequest.create({
          data: {
            ...data,
            requestNo: requestNo,
          } as Prisma.PropertySearchRequestCreateInput,
        });
      }

      if (mailLogId) {
        // MailLogService enjekte edilip linkleme yapılmalı
        // await this.mailLogService.linkToPropertySearchRequest(mailLogId, searchRequest.id);
        this.logger.debug(`MailLog ID ${mailLogId} will be linked to SearchRequest ID ${searchRequest.id} (TODO: Implement MailLogService linkage)`);
      }
      return searchRequest;
    } catch (error) {
      this.logger.error(
        `createOrUpdateSearchRequestFromAnalysis sırasında hata: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  private generateRequestNo(): string {
    // Basit bir requestNo üretici, daha robust bir yapı kullanılabilir (örn: UUID veya tarih bazlı)
    return `SR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }

  async findMatchingSearchRequestsForListing(
    listing: RealEstateListing & { lister?: Customer },
  ): Promise<(PropertySearchRequest & { customer: Customer })[]> {
    this.logger.debug(`findMatchingSearchRequestsForListing çağrıldı. İlan ID: ${listing.id}`);
    // IPropertySearchRequest[] yerine doğrudan Prisma tipi ve customer include edilecek.
    const allActiveRequestsInternal = await this.prisma.propertySearchRequest.findMany({
      where: {
        status: PropertySearchRequestStatus.ACTIVE,
      },
      include: {
        customer: true,
      },
    });

    // Prisma'dan gelen JSON string'lerini parse edelim
    const allActiveRequests: IPropertySearchRequest[] = allActiveRequestsInternal.map(sr => ({
      ...sr,
      propertyTypes: sr.propertyTypes ? JSON.parse(sr.propertyTypes as string) as string[] : undefined,
      locations: sr.locations ? JSON.parse(sr.locations as string) as IRequestedLocation[] : undefined,
      requiredFeatures: sr.requiredFeatures ? JSON.parse(sr.requiredFeatures as string) as string[] : undefined,
      status: sr.status as PropertySearchRequestStatus, // Enum cast
      // customer zaten include edildiği için burada tekrar parse etmeye gerek yok.
    }));


    if (!allActiveRequests || allActiveRequests.length === 0) {
      this.logger.log('Aktif arama talebi bulunamadı.');
      return [];
    }

    const matchingRequestsInternal: (PropertySearchRequest & { customer: Customer })[] = [];

    for (const request of allActiveRequests) {
      if (!request.customer) {
        this.logger.warn(`Arama talebi ${request.id} için müşteri bilgisi eksik, atlanıyor.`);
        continue;
      }
      let match = true;

      // listing.price (Float) için parseFloat ve replace kullanımı
      const listingPriceStr = String(listing.price); // Önce string'e çevir
      const listingPrice = parseFloat(listingPriceStr.replace(/[^\d.-]/g, '')); // Sonra parse et

      if (isNaN(listingPrice)) {
        this.logger.warn(`İlan ${listing.id} için geçerli fiyat parse edilemedi ('${listing.price}'), fiyat eşleştirmesi atlanıyor.`);
      } else {
        if (request.minPrice != null && listingPrice < request.minPrice) match = false;
        if (request.maxPrice != null && listingPrice > request.maxPrice) match = false;
      }
      
      // request.propertyTypes (artık string[] | undefined) kontrolü
      const reqPropTypes = request.propertyTypes; // Bu artık string[] | undefined
      if (match && Array.isArray(reqPropTypes) && reqPropTypes.length > 0 && listing.propertyType) {
        if (!reqPropTypes.includes(listing.propertyType)) match = false;
      }

      // listing.roomCount (Int?) kullanımı (listing.bedrooms yerine)
      if (match && listing.roomCount !== null && listing.roomCount !== undefined) { 
          if (request.minRooms != null && listing.roomCount < request.minRooms) match = false;
          if (request.maxRooms != null && listing.roomCount > request.maxRooms) match = false; 
      } else if (match && (request.minRooms != null || request.maxRooms != null)) {
          // Eğer ilanda oda sayısı belirtilmemişse ama talepte oda sayısı kriteri varsa, eşleşmez.
          // this.logger.debug(`İlan ${listing.id} için oda sayısı (roomCount) belirtilmemiş ama talep ${request.id} oda sayısı kriteri içeriyor.`);
          // match = false; // Bu kuralı isteğe bağlı olarak aktif edebilirsiniz.
      }

      // Metrekare Kontrolü
      if (match && listing.size !== null && listing.size !== undefined) { // listing.size (Float?)
          if (request.minSize != null && listing.size < request.minSize) match = false;
          if (request.maxSize != null && listing.size > request.maxSize) match = false;
      } else if (match && (request.minSize != null || request.maxSize != null)) {
          // Eğer ilanda metrekare belirtilmemişse ama talepte metrekare kriteri varsa, eşleşmez.
          // this.logger.debug(`İlan ${listing.id} için metrekare (size) belirtilmemiş ama talep ${request.id} metrekare kriteri içeriyor.`);
          // match = false; // Bu kuralı isteğe bağlı olarak aktif edebilirsiniz.
      }
      
      // Lokasyon Kontrolü (IRequestedLocation[] vs RealEstateListing city, district, neighborhood)
      const reqLocations = request.locations; // Bu artık IRequestedLocation[] | undefined
      if (match && Array.isArray(reqLocations) && reqLocations.length > 0) {
          let locationMatch = false;
          for (const loc of reqLocations) {
              let currentLocMatch = true;
              if (loc.city && listing.city && !listing.city.toLowerCase().includes(loc.city.toLowerCase())) {
                  currentLocMatch = false;
              }
              if (currentLocMatch && loc.district && listing.district && !listing.district.toLowerCase().includes(loc.district.toLowerCase())) {
                  currentLocMatch = false;
              }
              if (currentLocMatch && loc.neighborhood && listing.neighborhood && !listing.neighborhood.toLowerCase().includes(loc.neighborhood.toLowerCase())) {
                  currentLocMatch = false;
              }
              if (currentLocMatch) {
                  locationMatch = true;
                  break; 
              }
          }
          if (!locationMatch) {
              match = false;
          }
      }
      
      // Özellik (Features) Kontrolü
      const reqFeatures = request.requiredFeatures; // Bu artık string[] | undefined
      if (match && Array.isArray(reqFeatures) && reqFeatures.length > 0) {
          if (!listing.features || !Array.isArray(listing.features)) { // İlanın özellikleri yoksa veya array değilse eşleşmez
              match = false;
          } else {
              const listingFeatures = (listing.features as Prisma.JsonArray).map(f => String(f).toLowerCase());
              for (const feature of reqFeatures) {
                  if (!listingFeatures.includes(feature.toLowerCase())) {
                      match = false;
                      break;
                  }
              }
          }
      }


      if (match) {
        // Orijinal Prisma tipini (customer dahil) döndürmek için allActiveRequestsInternal'dan bulalım.
        const originalRequest = allActiveRequestsInternal.find(r => r.id === request.id);
        if (originalRequest) {
            matchingRequestsInternal.push(originalRequest);
        }
      }
    }
    this.logger.log(`${matchingRequestsInternal.length} adet eşleşen talep bulundu ilan ${listing.id} için.`);
    return matchingRequestsInternal;
  }

  async findRequestsNeedingFollowUp(
    status: PropertySearchRequestStatus, // .status.enum.ts'den gelen enum
    olderThan: Date,
  ): Promise<(PropertySearchRequest & { customer: Customer })[]> {
    this.logger.debug(
      `findRequestsNeedingFollowUp çağrıldı: status=${status}, olderThan=${olderThan.toISOString()}`,
    );
    try {
      return await this.prisma.propertySearchRequest.findMany({
        where: {
          status: status,
          updatedAt: { 
            lt: olderThan, 
          },
        },
        include: {
          customer: true, 
        },
        orderBy: {
          updatedAt: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(
        `findRequestsNeedingFollowUp sırasında hata: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
  
  async findRequestsWithStatus(
    status: PropertySearchRequestStatus, // .status.enum.ts'den gelen enum
  ): Promise<(PropertySearchRequest & { customer: Customer })[]> {
    this.logger.debug(`findRequestsWithStatus çağrıldı: status=${status}`);
    try {
      return await this.prisma.propertySearchRequest.findMany({
        where: {
          status: status,
        },
        include: {
          customer: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(
        `findRequestsWithStatus sırasında hata: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async updateSearchRequestStatus(
    searchRequestId: number,
    newStatus: PropertySearchRequestStatus, // .status.enum.ts'den gelen enum
  ): Promise<PropertySearchRequest | null> {
    this.logger.debug(
      `updateSearchRequestStatus çağrıldı: searchRequestId=${searchRequestId}, newStatus=${newStatus}`
    );
    try {
      const request = await this.prisma.propertySearchRequest.findUnique({
        where: { id: searchRequestId },
      });
      if (!request) {
        this.logger.warn(`Güncellenecek arama talebi bulunamadı: ID=${searchRequestId}`);
        return null;
      }
      // ÖNEMLİ: updatePropertySearchRequestStatus metodu requestNo bekliyordu, bunu ID'ye çevirdim.
      // Eğer requestNo ile güncelleme yapılacaksa, o metot kullanılmalı veya bu metot ona göre adapte edilmeli.
      // JobService'deki handleSendPropertyMatchMail bu metodu searchRequestId (number) ile çağırıyor.
      return await this.prisma.propertySearchRequest.update({
        where: { id: searchRequestId },
        data: { status: newStatus },
      });
    } catch (error) {
      this.logger.error(
        `updateSearchRequestStatus (ID ile) sırasında hata: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  // Bu metot requestNo (string) ile çalışıyor, JobService'deki bir cron bunu kullanabilir
  // Eğer updateSearchRequestStatus (ID ile) metodu yeterliyse bu kaldırılabilir.
  async updatePropertySearchRequestStatusByRequestNo(requestNo: string, status: PropertySearchRequestStatus): Promise<PropertySearchRequest> {
    this.logger.log(`Arama talebi durumu güncelleniyor: ${requestNo} -> ${status}`);
    const updatedRequest = await this.prisma.propertySearchRequest.update({
      where: { requestNo },
      data: { status },
    });
    if (!updatedRequest) {
      throw new NotFoundException(`Arama talebi bulunamadı: ${requestNo}`);
    }
    return updatedRequest;
  }
}
