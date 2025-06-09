import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RealEstateService } from './real-estate.service';
import { CreateRealEstateListingDto } from './dto/create-real-estate-listing.dto';
import { UpdateRealEstateListingDto } from './dto/update-real-estate-listing.dto';
import { ListingStatus, TransactionType } from '@prisma/client';

@Controller('real-estate')
export class RealEstateController {
  constructor(private readonly realEstateService: RealEstateService) { }

  @Get('dashboard')
  getDashboardData() {
    return this.realEstateService.getDashboardData();
  }

  @Post()
  create(@Body() createDto: CreateRealEstateListingDto) {
    return this.realEstateService.create(createDto);
  }

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('query') query?: string,
    @Query('status') status?: ListingStatus,
    @Query('transactionType') transactionType?: TransactionType,
  ) {
    return this.realEstateService.findAll({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      query,
      status,
      transactionType,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.realEstateService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRealEstateListingDto,
  ) {
    return this.realEstateService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.realEstateService.remove(id);
  }
}
