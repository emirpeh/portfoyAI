import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/modules/database/database.service';
import { CustomerService, CustomerType } from '../src/modules/customer/customer.service';
import { PropertySearchRequestService } from '../src/modules/property-search-request/property-search-request.service';
import { RealEstateService } from '../src/modules/real-estate/real-estate.service';
import { RealEstateEmailAnalysis } from '../src/modules/gpt/schemas/real-estate-email-analysis.schema';

describe('Direct Service Call E2E Test', () => {
    let app: INestApplication;
    let databaseService: DatabaseService;
    let customerService: CustomerService;
    let propertySearchRequestService: PropertySearchRequestService;
    let realEstateService: RealEstateService;

    jest.setTimeout(20000);

    const createdIds = {
        customerIds: new Set<string>(),
        searchRequestIds: new Set<string>(),
        realEstateIds: new Set<string>(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        databaseService = app.get(DatabaseService);
        customerService = app.get(CustomerService);
        propertySearchRequestService = app.get(PropertySearchRequestService);
        realEstateService = app.get(RealEstateService);
    });

    afterAll(async () => {
        for (const id of createdIds.searchRequestIds) {
            await databaseService.propertySearchRequest.deleteMany({ where: { id } });
        }
        for (const id of createdIds.realEstateIds) {
            await databaseService.realEstateListing.deleteMany({ where: { id } });
        }
        for (const id of createdIds.customerIds) {
            await databaseService.customer.deleteMany({ where: { id } });
        }
        await app.close();
    });

    it('should create a BUYER and their search request via direct service calls', async () => {
        const testEmail = `direct-buyer-${Date.now()}@test.com`;
        const analysis: RealEstateEmailAnalysis = {
            type: 'BUYER_INQUIRY',
            customer: { name: 'Direkt Alıcı', phone: '05551234567', customerType: 'BUYER' },
            buyerPreferences: { locations: ['Test-Konum'], roomCount: 3, maxPrice: 100000, propertyTypes: ['APARTMENT'], minPrice: null, minSize: null, maxSize: null, districts: null, features: [] },
            property: null, viewingRequest: null, summary: '',
        };

        // 1. Create Customer
        const customer = await customerService.findOrCreateCustomerFromAnalysis(analysis.customer, testEmail);
        expect(customer).toBeDefined();
        expect(customer.name).toBe('Direkt Alıcı');
        createdIds.customerIds.add(customer.id);

        // 2. Create Search Request
        const { buyerPreferences } = analysis;
        const searchRequest = await propertySearchRequestService.createSearchRequest({
            customerId: customer.id,
            status: 'ACTIVE',
            propertyRequest: {
                locations: buyerPreferences.locations,
                propertyTypes: buyerPreferences.propertyTypes,
                minRooms: buyerPreferences.roomCount,
                maxPrice: buyerPreferences.maxPrice,
                minPrice: buyerPreferences.minPrice,
                minSize: buyerPreferences.minSize,
                maxSize: buyerPreferences.maxSize,
                features: buyerPreferences.features,
                notes: `E2E Test: ${analysis.summary}`,
            },
        });
        expect(searchRequest).toBeDefined();
        expect(searchRequest.customerId).toBe(customer.id);
        expect(searchRequest.maxPrice).toBe(100000);
        createdIds.searchRequestIds.add(searchRequest.id);
    });

    it('should create a SELLER and their listing via direct service calls', async () => {
        const testEmail = `direct-seller-${Date.now()}@test.com`;
        const analysis: RealEstateEmailAnalysis = {
            type: 'SELLER_LISTING',
            customer: { name: 'Direkt Satıcı', phone: '05557654321', customerType: 'SELLER' },
            property: { location: 'Satılık-Konum', price: 200000, currency: 'TRY', size: 120, roomCount: 4, propertyType: 'VILLA', bathroomCount: 2, city: 'Test-Sehir', district: 'Test-Ilce', neighborhood: 'Test-Mahalle', description: 'Açıklama', hasGarage: false, hasGarden: true, hasPool: false, isFurnished: false, yearBuilt: 2020, features: [] },
            buyerPreferences: null, viewingRequest: null, summary: '',
        };

        // 1. Create Customer
        const customer = await customerService.findOrCreateCustomerFromAnalysis(analysis.customer, testEmail);
        expect(customer).toBeDefined();
        expect(customer.name).toBe('Direkt Satıcı');
        createdIds.customerIds.add(customer.id);

        // 2. Create Real Estate Listing
        const listing = await realEstateService.findOrCreateFromAnalysis(analysis.property, customer.id);
        expect(listing).toBeDefined();
        expect(listing.sellerId).toBe(customer.id);
        expect(listing.price).toBe(200000);
        createdIds.realEstateIds.add(listing.id);
    });
}); 