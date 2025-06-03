import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';
import { JobService } from './job.service';
import { MailModule } from '../mail/mail.module';
import { CustomerModule } from '../customer/customer.module';
import { PropertySearchRequestModule } from '../property-search-request/property-search-request.module';
import { RealEstateModule } from '../real-estate/real-estate.module';
import { GptModule } from '../gpt/gpt.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    PrismaModule,
    CustomerModule,
    RealEstateModule,
    PropertySearchRequestModule,
    GptModule,
    MailModule,
  ],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
