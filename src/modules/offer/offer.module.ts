import { Module, forwardRef } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { MailModule } from '../mail/mail.module';
import { SupplierModule } from '../supplier/supplier.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    forwardRef(() => MailModule),
    forwardRef(() => SupplierModule),
    PrismaModule,
  ],
  controllers: [OfferController],
  providers: [OfferService],
  exports: [OfferService],
})
export class OfferModule {}
