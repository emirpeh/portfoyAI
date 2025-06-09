import { Module, forwardRef } from '@nestjs/common';
import { PropertySearchRequestService } from './property-search-request.service';
import { PropertySearchRequestController } from './property-search-request.controller';
import { DatabaseModule } from '../database/database.module';
import { GptModule } from '../gpt/gpt.module';
import { CustomerModule } from '../customer/customer.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    DatabaseModule,
    GptModule,
    CustomerModule,
    ConfigModule,
    MailModule,
  ],
  controllers: [PropertySearchRequestController],
  providers: [PropertySearchRequestService],
  exports: [PropertySearchRequestService],
})
export class PropertySearchRequestModule { }
