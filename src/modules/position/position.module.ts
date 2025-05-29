import { Module, forwardRef } from '@nestjs/common';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { DatabaseModule } from '../database/database.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => CustomerModule)],
  providers: [PositionService],
  controllers: [PositionController],
  exports: [PositionService],
})
export class PositionModule {}
