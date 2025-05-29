import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  @Get()
  getCustomers(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    @Query('customer') customer?: string,
  ) {
    return this.customerService.getCustomers(offset, limit, customer);
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async findByUserId(@Param('id', ParseUUIDPipe) id: string) {
    return await this.customerService.findByUserId(id);
  }

  @Get(':id/mail-list')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async getCustomerExternalMailList(@Param('id') id: number) {
    return await this.customerService.getCustomerExternalMailList(id);
  }

  @Put(':id/mail')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async updateCustomerExternalMailList(
    @Param('id') id: string,
    @Body() body: { mail: string; isSend: boolean },
  ) {
    return await this.customerService.createCustomerMail(
      id,
      body.mail,
      body.isSend,
    );
  }

  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return await this.customerService.update(id, updateCustomerDto);
  }
}
