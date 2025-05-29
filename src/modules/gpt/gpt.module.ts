import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GptService } from './gpt.service';
import { SupplierModule } from '../supplier/supplier.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SupplierModule)],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule {}
