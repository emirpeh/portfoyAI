import { Module } from '@nestjs/common';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { GptModule } from '../gpt/gpt.module';
import { CustomerModule } from '../customer/customer.module';
import { RealEstateModule } from '../real-estate/real-estate.module';
import { PropertySearchRequestModule } from '../property-search-request/property-search-request.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        GptModule,
        CustomerModule,
        RealEstateModule,
        PropertySearchRequestModule,
        MailModule,
    ],
    controllers: [RequestController],
    providers: [RequestService]
})
export class RequestModule { } 