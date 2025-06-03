import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { RealEstateService, RealEstateStatus } from './real-estate.service';

@Controller('real-estate')
export class RealEstateController {
  constructor(private readonly realEstateService: RealEstateService) {}

  // İlan oluşturma
  @Post('listings')
  async createListing(@Body() data: any) {
    return this.realEstateService.createListing(data);
  }

  // İlanları listeleme
  @Get('listings')
  async getListings(
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('propertyType') propertyType?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minSize') minSize?: number,
    @Query('maxSize') maxSize?: number,
    @Query('status') status?: RealEstateStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.realEstateService.getListings({
      city,
      district,
      propertyType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minSize: minSize ? Number(minSize) : undefined,
      maxSize: maxSize ? Number(maxSize) : undefined,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  // İlan detayı getirme
  @Get('listings/:listingNo')
  async getListing(@Param('listingNo') listingNo: string) {
    return this.realEstateService.findListing(listingNo);
  }

  // İlan durumunu güncelleme
  @Put('listings/:listingNo/status')
  async updateListingStatus(
    @Param('listingNo') listingNo: string,
    @Body('status') status: RealEstateStatus,
  ) {
    return this.realEstateService.updateListingStatus(listingNo, status);
  }

  // Alıcı için uygun emlak eşleşmelerini bulma
  @Get('matches')
  async findMatches(
    @Query('buyerId') buyerId: number,
    @Query('propertyTypes') propertyTypes?: string, // Virgülle ayrılmış
    @Query('cities') cities?: string, // Virgülle ayrılmış
    @Query('districts') districts?: string, // Virgülle ayrılmış
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minSize') minSize?: number,
    @Query('features') features?: string, // Virgülle ayrılmış
  ) {
    return this.realEstateService.findMatchesForBuyer(buyerId, {
      propertyTypes: propertyTypes?.split(','),
      cities: cities?.split(','),
      districts: districts?.split(','),
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minSize: minSize ? Number(minSize) : undefined,
      features: features?.split(','),
    });
  }

  // Konfigürasyon ayarlarını getirme
  @Get('configuration')
  async getConfiguration() {
    return this.realEstateService.getConfiguration();
  }

  // Konfigürasyon ayarlarını güncelleme
  @Put('configuration')
  async updateConfiguration(@Body() config: any) {
    return this.realEstateService.updateConfiguration(config);
  }
  
  // E-posta işleme
  @Post('process-email')
  async processEmail(@Body() emailData: any) {
    return this.realEstateService.processEmail(emailData);
  }
  
  // İlan güncelleme (tüm alanlar)
  @Put('listings/:listingNo')
  async updateListing(
    @Param('listingNo') listingNo: string,
    @Body() data: any
  ) {
    const existingListing = await this.realEstateService.findListing(listingNo);
    if (!existingListing) {
      throw new Error(`Listing with ID ${listingNo} not found`);
    }
    
    return this.realEstateService.processSellerListing({ 
      from: data.sellerEmail,
      customer: { name: data.sellerName, email: data.sellerEmail },
      property: data,
      type: 'SELLER_LISTING'
    }, existingListing);
  }
  
  // Görüntüleme talebi oluşturma
  @Post('viewing-request')
  async createViewingRequest(@Body() viewingData: any) {
    const emailData = {
      from: viewingData.buyerEmail,
      type: 'PROPERTY_VIEWING_REQUEST',
      viewingRequest: {
        propertyId: viewingData.listingNo,
        preferredDate: viewingData.preferredDate,
        message: viewingData.message
      }
    };
    
    return this.realEstateService.processViewingRequest(emailData);
  }
} 