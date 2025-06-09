import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/modules/database/database.service';
import { MailgunBodyDto } from '../src/modules/mail/dto/mailgun-body.dto';
import { Customer, PropertySearchRequest, RealEstateListing } from '@prisma/client';
import { waitFor } from './helpers/wait-for.helper';

describe('Mailgun Webhook E2E Test (POST /api/mail/inbound-webhook)', () => {
    let app: INestApplication;
    let databaseService: DatabaseService;
    let server: any;

    // Give OpenAI more time to respond
    jest.setTimeout(30000);

    // Store created record IDs for cleanup
    const createdIds = {
        customerIds: new Set<string>(),
        searchRequestIds: new Set<string>(),
        realEstateIds: new Set<string>(),
        mailLogIds: new Set<string>(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
        server = app.getHttpServer();

        databaseService = app.get(DatabaseService);
    });

    afterAll(async () => {
        // Clean up database records
        for (const id of createdIds.searchRequestIds) {
            await databaseService.propertySearchRequest.deleteMany({ where: { id } });
        }
        for (const id of createdIds.realEstateIds) {
            await databaseService.realEstateListing.deleteMany({ where: { id } });
        }
        for (const id of createdIds.customerIds) {
            await databaseService.customer.deleteMany({ where: { id } });
        }
        for (const id of createdIds.mailLogIds) {
            await databaseService.mailLogs.deleteMany({ where: { id } });
        }
        await app.close();
    });

    it('should process a buyer inquiry email from the webhook', async () => {
        const emailBody = 'Merhaba, ben 2+1, Beşiktaş veya Şişli civarında, en fazla 5 milyon TL bütçeli bir daire arıyorum. Teşekkürler.';
        const fromEmail = `buyer-webhook-${Date.now()}@example.com`;
        const fromName = 'Webhook Alıcı';

        const mailgunPayload: MailgunBodyDto = {
            sender: fromEmail,
            recipient: 'inbound@portfoyai.com',
            from: `"${fromName}" <${fromEmail}>`,
            'body-plain': emailBody,
            subject: 'Daire Arayışı',
            'Message-Id': `<${Date.now()}@mailgun.org>`,
            timestamp: Math.floor(Date.now() / 1000),
        };

        // Act
        const response = await request(server)
            .post('/api/mail/inbound-webhook')
            .send(mailgunPayload)
            .expect(201); // Expect HTTP 201 Created

        // Assert
        // Müşterinin veritabanında oluşturulmasını bekle
        const customer = await waitFor(async () => {
            const c = await databaseService.customer.findUnique({
                where: { email: fromEmail },
            });
            return c; // Eğer müşteri varsa döngü durur, yoksa null döner ve devam eder
        });

        expect(customer).toBeDefined();
        // Geliştirilmiş prompt ile artık bu alanların doğru çıkarılmasını bekliyoruz.
        expect(customer.name).toBe(fromName);
        expect(customer.customerType).toBe('BUYER');
        createdIds.customerIds.add(customer.id);

        // 2. Check Property Search Request
        const searchRequest = await databaseService.propertySearchRequest.findFirst({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
        });
        expect(searchRequest).toBeDefined();
        // Geliştirilmiş prompt ile artık bu alanların doğru çıkarılmasını bekliyoruz.
        expect(searchRequest.maxPrice).toBe(5000000);
        expect(searchRequest.minRooms).toBe(2);
        const locations = searchRequest.locations as string[];
        expect(locations).toEqual(expect.arrayContaining(['Beşiktaş', 'Şişli']));
        createdIds.searchRequestIds.add(searchRequest.id);

        // 3. Check Mail Log
        const mailLog = await databaseService.mailLogs.findFirst({
            where: { from: { contains: fromEmail } },
        });
        expect(mailLog).toBeDefined();
        expect(mailLog.contentBody).toBe(emailBody);
        createdIds.mailLogIds.add(mailLog.id);
    });
}); 