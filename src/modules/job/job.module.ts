import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';
import { DatabaseModule } from '../database/database.module';
import { JobService } from './job.service';
import { PositionModule } from '../position/position.module';
import { MailModule } from '../mail/mail.module';
import { CustomerModule } from '../customer/customer.module';
import { OfferModule } from '../offer/offer.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    DatabaseModule,
    PositionModule,
    CustomerModule,
    MailModule,
    OfferModule,
    ConfigModule,
  ],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
