import { Module, forwardRef } from '@nestjs/common';
import { PropertySearchRequestService } from './property-search-request.service';
import { PropertySearchRequestController } from './property-search-request.controller';
import { MailModule } from '../mail/mail.module';
// import { SupplierModule } from '../supplier/supplier.module'; // KALDIRILDI
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerModule } from '../customer/customer.module';
import { RealEstateModule } from '../real-estate/real-estate.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    forwardRef(() => MailModule),
    // forwardRef(() => SupplierModule), // KALDIRILDI
    forwardRef(() => CustomerModule),
    forwardRef(() => RealEstateModule),
    PrismaModule,
    ConfigModule,
  ],
  controllers: [PropertySearchRequestController],
  providers: [PropertySearchRequestService],
  exports: [PropertySearchRequestService],
})
export class PropertySearchRequestModule {}
