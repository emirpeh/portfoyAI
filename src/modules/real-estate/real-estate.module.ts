import { Module } from '@nestjs/common';
import { RealEstateService } from './real-estate.service';
import { RealEstateController } from './real-estate.controller';
import { CustomerModule } from '../customer/customer.module';
import { DatabaseModule } from '../database/database.module';
import { GptModule } from '../gpt/gpt.module';

@Module({
  imports: [CustomerModule, DatabaseModule, GptModule],
  controllers: [RealEstateController],
  providers: [RealEstateService],
  exports: [RealEstateService],
})
export class RealEstateModule { }
