import { Module, forwardRef } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerModule } from '../customer/customer.module';
import { OfferModule } from '../offer/offer.module';
import { SupplierModule } from '../supplier/supplier.module';
import { GptModule } from '../gpt/gpt.module';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: configService.get('GMAIL_USER'),
            pass: configService.get('GMAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get('GMAIL_USER'),
        },
      }),
    }),
    PrismaModule,
    CustomerModule,
    forwardRef(() => OfferModule),
    SupplierModule,
    GptModule,
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
