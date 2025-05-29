import { Module } from '@nestjs/common';
import { DownloadController } from './download.controller';
import { PositionModule } from '../position/position.module';

@Module({
  imports: [PositionModule],
  controllers: [DownloadController],
})
export class DownloadModule {}
