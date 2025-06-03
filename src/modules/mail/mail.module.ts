import { forwardRef, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { PrismaModule } from '../prisma/prisma.module';
import { GptModule } from '../gpt/gpt.module';
import { CustomerModule } from '../customer/customer.module';
import { RealEstateModule } from '../real-estate/real-estate.module';
import { PropertySearchRequestModule } from '../property-search-request/property-search-request.module';
import { MailLogService } from './mail-log.service';
import { MailProcessingService } from './mail-processing.service';

@Module({
  imports: [
    ConfigModule,
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: parseInt(configService.get('MAIL_PORT')),
          secure: configService.get('MAIL_SECURE') === 'true',
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: configService.get('MAIL_FROM'),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    forwardRef(() => CustomerModule),
    forwardRef(() => RealEstateModule),
    GptModule,
    forwardRef(() => PropertySearchRequestModule),
  ],
  controllers: [MailController],
  providers: [MailService, MailLogService, MailProcessingService],
  exports: [MailService, MailLogService, MailProcessingService],
})
export class MailModule {}
