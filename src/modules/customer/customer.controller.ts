import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Query,
  Post,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // Kullanıcı ID'sine göre müşteriyi getir
  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async findByUserId(@Param('id', ParseUUIDPipe) id: string) {
    return await this.customerService.findByUserId(id);
  }

  // Yeni ilan takibi/e-posta kaydı
  @Post(':id/property-subscription')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async addPropertySubscription(
    @Param('id') id: string,
    @Body() body: { mail: string; isSend: boolean; propertyId?: string }, // propertyId?: string burada kalabilir, belki ileride kullanılır
  ) {
    return await this.customerService.createCustomerMail(
      id, // CustomerService.createCustomerMail ID olarak string bekliyor olabilir, kontrol edilecek
      body.mail,
      body.isSend,
    );
  }

  // Mevcut takip/e-posta bilgisini güncelle
  @Put(':id/property-subscription')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async updatePropertySubscription(
    @Param('id') id: string,
    @Body() body: { mail: string; isSend: boolean },
  ) {
    return await this.customerService.createCustomerMail(
      id, // CustomerService.createCustomerMail ID olarak string bekliyor olabilir, kontrol edilecek
      body.mail,
      body.isSend,
    );
  }

  // Müşteri bilgilerini güncelle
  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return await this.customerService.updateCustomer(id, {
      name: updateCustomerDto.name,
      email: updateCustomerDto.email,
      phone: updateCustomerDto.phone,
      company: updateCustomerDto.company,
      customerType: updateCustomerDto.customerType,
      externalId: updateCustomerDto.externalId, // updateCustomerDto'da externalId varsa CustomerService.updateCustomer bunu işlemeli
    });
  }
}
