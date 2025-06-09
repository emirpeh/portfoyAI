import { Module } from '@nestjs/common';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';
import { RealEstateModule } from '../real-estate/real-estate.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [RealEstateModule, DatabaseModule],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class DownloadModule { }
