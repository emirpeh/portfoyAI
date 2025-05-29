import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.create(createSupplierDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  createMany(@Body() createSupplierDtos: { suppliers: CreateSupplierDto[] }) {
    return this.supplierService.createMany(createSupplierDtos);
  }

  @Get()
  findAll(
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
    @Query('countries') countries?: string,
    @Query('foreignTrades') foreignTrades?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.supplierService.findAll({
      name,
      email,
      phone,
      countries: countries ? countries.split(',') : undefined,
      foreignTrades: foreignTrades ? foreignTrades.split(',') : undefined,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: Partial<CreateSupplierDto>,
  ) {
    return this.supplierService.update(+id, updateSupplierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.supplierService.remove(+id);
  }
}
