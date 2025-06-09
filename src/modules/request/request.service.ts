import { Injectable, Logger } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { GptService } from '../gpt/gpt.service';
import { CustomerService } from '../customer/customer.service';
import { RealEstateService } from '../real-estate/real-estate.service';
import { PropertySearchRequestService } from '../property-search-request/property-search-request.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RequestService {
    private readonly logger = new Logger(RequestService.name);

    constructor(
        private readonly mailService: MailService,
        private readonly gptService: GptService,
        private readonly customerService: CustomerService,
        private readonly realEstateService: RealEstateService,
        private readonly propertySearchRequestService: PropertySearchRequestService,
    ) { }

    async create(createRequestDto: CreateRequestDto) {
        this.logger.log(`Yeni bir form talebi alındı: ${createRequestDto.email}`);

        const analysisResult = await this.gptService.analyzeTextForRealEstate(createRequestDto.message);
        this.logger.log('GPT analizi tamamlandı.');

        // Akıllı kontrol: Talep türüne göre ilgili verinin varlığını kontrol et
        const isBuyerRequestValid = createRequestDto.requestType === 'BUYER' && analysisResult?.buyerPreferences;
        const isSellerRequestValid = createRequestDto.requestType === 'SELLER' && analysisResult?.property;

        if (!analysisResult || !analysisResult.customer || (!isBuyerRequestValid && !isSellerRequestValid)) {
            this.logger.error('GPT analizi başarısız oldu veya talep türü için yetersiz veri döndürdü.', analysisResult);
            return { message: 'Talebinizdeki bilgiler analiz edilemedi.' };
        }

        const customer = await this.customerService.findOrCreateCustomerFromAnalysis(
            analysisResult.customer,
            createRequestDto.email,
            createRequestDto.requestType,
            createRequestDto.name,
        );

        if (!customer) {
            this.logger.error('Müşteri oluşturulamadı veya bulunamadı.');
            return { message: 'Talebiniz işlenirken bir hata oluştu (müşteri).' };
        }

        this.logger.log(`Müşteri bulundu/oluşturuldu: ${customer.id}`);

        if (createRequestDto.requestType === 'SELLER') {
            this.logger.log('Satıcı talebi işleniyor...');
            await this.realEstateService.findOrCreateFromAnalysis(
                analysisResult.property,
                customer.id
            );
            this.logger.log(`Satıcı için emlak ilanı oluşturuldu: ${customer.id}`);
        } else if (createRequestDto.requestType === 'BUYER') {
            this.logger.log('Alıcı talebi işleniyor...');
            await this.propertySearchRequestService.findOrCreateFromAnalysis(
                analysisResult.buyerPreferences,
                customer.id
            );
            this.logger.log(`Alıcı için arama talebi oluşturuldu: ${customer.id}`);
        }

        // Form gönderimini MailLog'a kaydet
        await this.mailService.createMailLog({
            type: 'FORM_SUBMISSION',
            from: createRequestDto.email,
            to: 'system@portfoyai.com', // Sisteme geldiğini belirtir
            contentTitle: `Web Formu Talebi: ${createRequestDto.requestType}`,
            contentBody: createRequestDto.message,
            parsedData: {
                ...createRequestDto,
                analysis: analysisResult
            },
            // source ve status'u Prisma şeması yönetir, biz göndermiyoruz
        });

        return {
            message: 'Talebiniz başarıyla işlendi ve sisteme kaydedildi.',
            data: { customerId: customer.id }
        };
    }
} 