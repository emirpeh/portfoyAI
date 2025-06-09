import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai'; // Artık OpenAIService üzerinden kullanılıyor
import { OpenAIService } from '../openai/openai.service';
import {
  RealEstateEmailAnalysisSchema,
  type RealEstateEmailAnalysis,
} from './schemas/real-estate-email-analysis.schema';
import {
  GENERATE_BUYER_RESPONSE_SYSTEM_PROMPT,
  GENERATE_LISTING_DESCRIPTION_SYSTEM_PROMPT,
  GENERATE_SELLER_RESPONSE_SYSTEM_PROMPT, // Ekledik
  getAnalyzeRealEstateEmailSystemPrompt,
} from './constants/gpt.constants';
import type { Customer, RealEstateListing } from '@prisma/client';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class GptService {
  private readonly logger = new Logger(GptService.name);
  private readonly model: string;

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly configService: ConfigService,
  ) {
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
  }

  async analyzeTextForRealEstate(
    content: string,
  ): Promise<RealEstateEmailAnalysis | null> {
    this.logger.log(`Metin analizi başlatılıyor...`);

    const systemPrompt = getAnalyzeRealEstateEmailSystemPrompt();

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'assistant',
        content: 'Evet, verilen metni analiz edip istenen JSON formatında doğru ve eksiksiz bir şekilde döndüreceğim.',
      },
      {
        role: 'user',
        content: `
        Lütfen aşağıdaki metni bir emlak talebi olarak analiz et. Metin bir e-posta değil, bir web formu aracılığıyla gönderilmiştir. Bu nedenle 'From', 'Subject' gibi başlık bilgileri yoktur. Sadece içeriğe odaklan.
        
        Metin İçeriği:
        ${content}
        `,
      },
    ];

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.model,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      this.logger.debug(`OpenAI Raw Response (JSON Mode): ${responseContent}`);

      const parsedResponse = RealEstateEmailAnalysisSchema.safeParse(
        JSON.parse(responseContent),
      );

      if (parsedResponse.success) {
        this.logger.log('Metin analiz sonucu başarıyla doğrulandı ve alındı');
        return parsedResponse.data;
      } else {
        this.logger.error(
          `JSON Zod doğrulama hatası: ${parsedResponse.error.errors.map(e => e.message).join(', ')}`,
        );
        this.logger.debug(`Doğrulanamayan JSON string: ${responseContent}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Metin analiz hatası: ${error.message}`, error.stack);
      return null;
    }
  }

  async analyzeRealEstateEmail(
    content: string,
    fromAddress: string,
    fromFull: string, // 'İsim <adres>' formatındaki tam 'from' bilgisi
    subject: string,
  ): Promise<RealEstateEmailAnalysis | null> {
    // Dönüş tipini güncelledik
    this.logger.log(`E-posta analizi başlatılıyor: ${subject}`);

    const systemPrompt = getAnalyzeRealEstateEmailSystemPrompt();

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'assistant',
        content: 'Evet, verilen e-postayı analiz edip istenen JSON formatında doğru ve eksiksiz bir şekilde döndüreceğim.',
      },
      {
        role: 'user',
        content: `
        From Header: ${fromFull}
        E-posta Adresi: ${fromAddress}
        E-posta Konusu: ${subject}
        E-posta İçeriği:
        ${content}
        `,
      },
    ];

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.model,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      this.logger.debug(`OpenAI Raw Response (JSON Mode): ${responseContent}`);

      const parsedResponse = RealEstateEmailAnalysisSchema.safeParse(
        JSON.parse(responseContent),
      );

      if (parsedResponse.success) {
        this.logger.log('E-posta analiz sonucu başarıyla doğrulandı ve alındı');
        return parsedResponse.data;
      } else {
        this.logger.error(
          `JSON Zod doğrulama hatası: ${parsedResponse.error.errors.map(e => e.message).join(', ')}`,
        );
        this.logger.debug(`Doğrulanamayan JSON string: ${responseContent}`);
        // Hata durumunda bile bir şeyler döndürmeye çalışabiliriz veya null dönebiliriz.
        // Şimdilik null dönelim, çağıran servis bu durumu ele almalı.
        return null;
      }
    } catch (error) {
      this.logger.error(`E-posta analiz hatası: ${error.message}`, error.stack);
      // throw new Error(`E-posta analiz edilirken bir hata oluştu: ${error.message}`);
      return null; // Hata durumunda null dön
    }
  }

  async generateListingDescription(
    propertyInfo: Partial<RealEstateListing>,
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: GENERATE_LISTING_DESCRIPTION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Bu gayrimenkul için çekici bir ilan açıklaması yazar mısın?
        
        Bilgiler:
        ${JSON.stringify(propertyInfo, null, 2)}`,
      },
    ];

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.model,
        messages,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(
        `İlan açıklaması oluşturma hatası: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `İlan açıklaması oluşturulurken bir hata oluştu: ${error.message}`,
      );
    }
  }

  async generateBuyerResponse(
    buyerInfo: Partial<Customer>,
    matchingProperties: Partial<RealEstateListing>[],
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: GENERATE_BUYER_RESPONSE_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `
        Alıcı Bilgileri:
        ${JSON.stringify(buyerInfo, null, 2)}
        
        Eşleşen Gayrimenkuller:
        ${JSON.stringify(matchingProperties, null, 2)}
        
        Lütfen bu alıcıya gönderilecek profesyonel bir e-posta yanıtı hazırla.`,
      },
    ];

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.model,
        messages,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(
        `Alıcı yanıtı oluşturma hatası: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Alıcı yanıtı oluşturulurken bir hata oluştu: ${error.message}`,
      );
    }
  }

  async generateSellerResponse(
    sellerInfo: Partial<Customer>,
    propertyInfo: Partial<RealEstateListing>,
    listingId: string | null,
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: GENERATE_SELLER_RESPONSE_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `
        Satıcı Bilgileri:
        ${JSON.stringify(sellerInfo, null, 2)}
        
        Mülk Bilgileri:
        ${JSON.stringify(propertyInfo, null, 2)}
        ${listingId ? `\nİlan Numarası: ${listingId}` : ''}
        
        Lütfen bu satıcıya gönderilecek profesyonel bir e-posta yanıtı hazırla.`,
      },
    ];

    try {
      const completion = await this.openaiService.createChatCompletion({
        model: this.model,
        messages,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(
        `Satıcı yanıtı oluşturma hatası: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Satıcı yanıtı oluşturulurken bir hata oluştu: ${error.message}`,
      );
    }
  }

  // Bu fonksiyon daha genel amaçlıydı, şimdilik yorum satırına alabiliriz veya kaldırabiliriz.
  // Eğer spesifik bir DTO ile kullanılmayacaksa, doğrudan openaiService.createChatCompletion çağrılabilir.
  /*
  async createCompletion(createCompletionDto: CreateCompletionDto): Promise<any> {
    this.logger.log(
      `Tamamlama isteği alindi: ${JSON.stringify(createCompletionDto)}`,
    );
    try {
      const completion = await this.openaiService.createChatCompletion({
        model: createCompletionDto.model || this.model,
        messages: createCompletionDto.messages,
        temperature: createCompletionDto.temperature || 0.7,
        max_tokens: createCompletionDto.max_tokens || 1500,
      });
      return completion.choices[0]?.message?.content;
    } catch (error) {
      this.logger.error(`Tamamlama hatasi: ${error.message}`, error.stack);
      throw new Error(`OpenAI tamamlama basarisiz oldu: ${error.message}`);
    }
  }
  */
}
