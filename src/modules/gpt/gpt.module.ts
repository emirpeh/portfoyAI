import { Module } from '@nestjs/common';
import { GptService } from './gpt.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule { }
