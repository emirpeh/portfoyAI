import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ZodSchema, z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { analyzeEmailPrompt } from './consts/analyze.const';
import { MailStatusType } from '../offer/types/mail.status.type';
import { SupplierService } from '../supplier/supplier.service';

const processOfferMailSchema = z.object({
  type: z.nativeEnum(MailStatusType).optional(),
  offerNo: z.string().optional(),
  from: z.string().email().optional(),
  contentTitle: z.string().optional(),
  contentHtml: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  customer: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      gender: z.enum(['MALE', 'FEMALE']).optional(),
    })
    .optional(),
  language: z
    .enum([
      'turkish',
      'english',
      'croatian',
      'slovenian',
      'bosnian',
      'macedonian',
    ])
    .optional(),
  request: z
    .object({
      loadDate: z.date().optional(),
      loadCountry: z.string().optional(),
      loadCity: z.string().optional(),
      packagingType: z.string().optional(),
      numOfContainers: z.number().optional(),
      containerType: z.string().optional(),
      containerDimensions: z.string().optional(),
      goodsType: z.string().optional(),
      isStackable: z.enum(['true', 'false']).optional(),
      deliveryCity: z.string().optional(),
      deliveryCountry: z.string().optional(),
      foreignTrade: z.enum(['IM', 'EX', 'TRN', '']).optional(),
      deliveryDate: z.date().optional(),
      customs: z.string().optional(),
      deliveryPostalCode: z.string().optional(),
      calculatedVolume: z.number().optional(),
      calculatedLdm: z.number().optional(),
    })
    .optional(),
  offer: z
    .object({
      prices: z
        .array(
          z.object({
            price: z.number(),
            note: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  modelResponseTitle: z.string().optional(),
  modelResponseMail: z.string().optional(),
  isThereMissingOrIncorrectInformation: z.boolean().optional(),
  supplierMails: z
    .object({
      turkish: z
        .object({
          modelResponseTitle: z.string(),
          modelResponseMail: z.string(),
        })
        .optional(),
      english: z
        .object({
          modelResponseTitle: z.string(),
          modelResponseMail: z.string(),
        })
        .optional(),
      croatian: z
        .object({
          modelResponseTitle: z.string(),
          modelResponseMail: z.string(),
        })
        .optional(),
      slovenian: z
        .object({
          modelResponseTitle: z.string(),
          modelResponseMail: z.string(),
        })
        .optional(),
      bosnian: z
        .object({
          modelResponseTitle: z.string(),
          modelResponseMail: z.string(),
        })
        .optional(),
      macedonian: z
        .object({
          modelResponseTitle: z.string(),
          modelResponseMail: z.string(),
        })
        .optional(),
    })
    .optional(),
});

@Injectable()
export class GptService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(GptService.name);

  constructor(
    private configService: ConfigService,
    private supplierService: SupplierService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(
    prompt: string,
    role: 'user' | 'assistant' | 'system',
    model = 'gpt-3.5-turbo',
    schema: ZodSchema = processOfferMailSchema,
    brokerList: string[] = [],
  ): Promise<string> {
    try {
      const schemaJson = JSON.stringify(zodToJsonSchema(schema));
      const systemPrompt = `Please respond in JSON format matching this schema:\n${schemaJson}`;
      const assistantPrompt = analyzeEmailPrompt(brokerList);

      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'assistant', content: assistantPrompt },
          { role, content: prompt },
        ],
        model,
        temperature: 0.75,
        response_format: { type: 'json_object' },
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      this.logger.error(`GPT API Error: ${error.message}`);
      throw error;
    }
  }

  async generateEmailResponse(
    context: {
      originalEmail: string;
      customerName: string;
      offerDetails?: any;
      language?: string;
    },
    type: 'inquiry' | 'followup' | 'confirmation' | 'rejection',
  ): Promise<string> {
    try {
      const prompt = `
        Generate a professional email response in ${context.language || 'English'} for the following scenario:
        Type: ${type}
        Customer: ${context.customerName}
        Original Email: ${context.originalEmail}
        ${context.offerDetails ? `Offer Details: ${JSON.stringify(context.offerDetails)}` : ''}

        The response should be:
        1. Professional and courteous
        2. Address the specific points in the original email
        3. Include relevant offer details if provided
        4. End with an appropriate call to action
      `;

      const brokerList = await this.supplierService.getAllCustoms();

      return await this.generateResponse(
        prompt,
        'user',
        'gpt-3.5-turbo',
        undefined,
        brokerList as unknown as string[],
      );
    } catch (error) {
      this.logger.error(`Email generation error: ${error.message}`);
      throw error;
    }
  }
}
