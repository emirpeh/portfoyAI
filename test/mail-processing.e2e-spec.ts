import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/modules/database/database.service';
import { CustomerType } from '../src/modules/customer/customer.service';
import { RealEstateEmailAnalysis } from '../src/modules/gpt/schemas/real-estate-email-analysis.schema';

describe('Mail Processing E2E Test', () => {
    let app: INestApplication;
    let databaseService: DatabaseService;
    let server: any;
    let createdCustomerId: string | null = null;
    let createdSearchRequestId: string | null = null;

    jest.setTimeout(30000);

    const sampleMailContent = `Merhaba, ben Test Alıcısı. 0555 987 6543 numaralı telefondan bana ulaşabilirsiniz. Kadıköy veya Beşiktaş civarında, en az 2 odalı, 3 milyon TL bütçeli bir daire arıyorum. E-posta adresim testalicisi@example.com`;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        server = app.getHttpServer();
        databaseService = app.get(DatabaseService);
    });

    afterAll(async () => {
        if (createdSearchRequestId) {
            await databaseService.propertySearchRequest.deleteMany({ where: { id: createdSearchRequestId } });
        }
        if (createdCustomerId) {
            await databaseService.customer.delete({ where: { id: createdCustomerId } });
        }
        await app.close();
    });

    it('should receive a buyer inquiry, trigger analysis, and create entries', async () => {
        const response = await request(server)
            .post('/api/mail/analyze')
            .send({ text: sampleMailContent });

        expect(response.status).toBe(201);

        // API yanıtı artık analiz sonucunu döndürmüyor, sadece işlemi kuyruğa alıyor.
        // Bu yüzden response.body'yi kontrol etmek yerine, doğrudan veritabanı sonucunu bekleyeceğiz.

        // Olayın işlenmesi için kısa bir süre bekle (asenkron)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const customer = await databaseService.customer.findFirst({
            where: { email: { contains: 'testalicisi' } },
        });

        expect(customer).toBeDefined();
        if (customer) {
            createdCustomerId = customer.id;
            expect(customer.name).toEqual('Test Alıcısı');
            expect(customer.phone).toEqual('0555 987 6543');
            expect(customer.customerType).toBe(CustomerType.BUYER);

            const searchRequest = await databaseService.propertySearchRequest.findFirst({
                where: { customerId: createdCustomerId },
            });
            expect(searchRequest).toBeDefined();
            if (searchRequest) {
                createdSearchRequestId = searchRequest.id;
            }
        }
    });
}); 