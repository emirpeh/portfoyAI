import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GptService } from './gpt.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [ConfigModule, OpenAIModule],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule {}
