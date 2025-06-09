import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { DatabaseModule } from './modules/database/database.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { PropertySearchRequestModule } from './modules/property-search-request/property-search-request.module';
import { GptModule } from './modules/gpt/gpt.module';
import { OpenAIModule } from './modules/openai/openai.module';
import { RealEstateModule } from './modules/real-estate/real-estate.module';
import { SellerModule } from './modules/seller/seller.module';
import { DownloadModule } from './modules/download/download.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LeadModule } from './modules/lead/lead.module';
import { SeedingModule } from './modules/seeding/seeding.module';
import { RequestModule } from './modules/request/request.module';

@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV || 'development'}`],
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    SeedingModule,

    // Feature Modules that LISTEN to events
    CustomerModule,
    PropertySearchRequestModule,
    RealEstateModule,

    // Feature Modules that EMIT events or have other dependencies
    MailModule,
    GptModule,
    OpenAIModule,

    // Other Modules
    AuthModule,
    UserModule,
    SellerModule,
    DownloadModule,
    LeadModule,

    // Mailer configuration should be here, it's a provider for MailModule mostly
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM,
      },
      template: {
        dir: join(__dirname, 'modules/mail/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),

    RequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
