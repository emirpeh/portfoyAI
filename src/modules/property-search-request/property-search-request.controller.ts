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
import { PropertySearchRequestService } from './property-search-request.service';
import { CreatePropertySearchRequestDto } from './dto/create-property-search-request.dto';
import { Prisma } from '@prisma/client';

@Controller('property-search-requests')
export class PropertySearchRequestController {
  constructor(
    private readonly propertySearchRequestService: PropertySearchRequestService,
  ) { }

  @Post()
  create(@Body() createDto: CreatePropertySearchRequestDto) {
    // Note: The service method 'createSearchRequest' expects a different structure.
    // This assumes the DTO provides all necessary fields for 'CreatePropertySearchRequestData'.
    return this.propertySearchRequestService.createSearchRequest(createDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertySearchRequestService.findSearchRequestById(id);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const orderByObj = orderBy ? JSON.parse(orderBy) : undefined;

    return this.propertySearchRequestService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: orderByObj,
    });
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: { status: string }) {
    return this.propertySearchRequestService.update(id, body);
  }

  // A generic findAll method is missing from the service. If needed, it should be added.
  // For now, I will comment out the previous non-functional methods.

  // @Get()
  // findAll() { /* ... implementation ... */ }

  // @Patch(':id')
  // update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: any) {
  //   // update method is missing in service
  // }

  // @Delete(':id')
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   // remove method is missing in service
  // }
}
