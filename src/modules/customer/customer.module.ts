import { forwardRef, Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from '../database/database.module';
import { PositionModule } from '../position/position.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => UserModule),
    forwardRef(() => PositionModule),
  ],
  providers: [CustomerService],
  controllers: [CustomerController],
  exports: [CustomerService],
})
export class CustomerModule {}
