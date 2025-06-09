import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
    private openai: OpenAI;
    private readonly logger = new Logger(OpenAIService.name);

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not set in the environment variables.');
        }
        this.openai = new OpenAI({ apiKey });
    }

    async createChatCompletion(
        params: OpenAI.Chat.ChatCompletionCreateParams,
    ): Promise<OpenAI.Chat.ChatCompletion> {
        this.logger.debug('Creating chat completion with params:', params);
        try {
            const completion = await this.openai.chat.completions.create({
                ...params,
                stream: false,
            });
            return completion;
        } catch (error) {
            this.logger.error('Error creating chat completion:', error);
            throw error;
        }
    }
} 