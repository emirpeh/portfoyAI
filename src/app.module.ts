import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PositionModule } from './modules/position/position.module';
import { JobModule } from './modules/job/job.module';
import { MailModule } from './modules/mail/mail.module';
import { DownloadModule } from './modules/download/download.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    DatabaseModule,
    UserModule,
    CustomerModule,
    AuthModule,
    PositionModule,
    JobModule,
    MailModule,
    DownloadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
