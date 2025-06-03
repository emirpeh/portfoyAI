import { Module, forwardRef } from '@nestjs/common';
import { RealEstateService } from './real-estate.service';
import { RealEstateController } from './real-estate.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerModule } from '../customer/customer.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
import { GptModule } from '../gpt/gpt.module';

@Module({
  imports: [
    PrismaModule,
    CustomerModule,
    ConfigModule,
    forwardRef(() => MailModule),
    forwardRef(() => GptModule),
  ],
  controllers: [RealEstateController],
  providers: [RealEstateService],
  exports: [RealEstateService],
})
export class RealEstateModule {} 