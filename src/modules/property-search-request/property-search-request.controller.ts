import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PropertySearchRequestService } from './property-search-request.service';
import { CreatePropertySearchRequestDto } from './dto/create-property-search-request.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('property-search-requests')
@UseGuards(JwtAuthGuard)
export class PropertySearchRequestController {
  constructor(
    private readonly propertySearchRequestService: PropertySearchRequestService,
  ) { }

  @Post()
  create(@Body() createPropertySearchRequestDto: CreatePropertySearchRequestDto) {
    return this.propertySearchRequestService.create(createPropertySearchRequestDto);
  }

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    const where = customerId ? { customerId } : {};
    return this.propertySearchRequestService.findAll({ where });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertySearchRequestService.findSearchRequestById(id);
  }
}
