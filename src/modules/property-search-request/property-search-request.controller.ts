import {
  Controller,
  Get,
  Param,
  Query,
  Put,
  Body,
  UseGuards,
  Post,
  Patch,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PropertySearchRequestService } from './property-search-request.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PropertySearchRequestStatus } from './types/property-search-request.status.enum';
import { ProcessParsedPropertyEmailDto } from './dto/process.property-email.dto';
import { CreatePropertySearchRequestDto, UpdatePropertySearchRequestDto, RequestedLocationDto } from './dto/property-search-request.dto';
import { IPropertySearchRequest, IRequestedLocation } from './types/property-search-request.types';
import { PropertySearchRequest } from '@prisma/client';

function mapToIPropertySearchRequest(prismaRequest: PropertySearchRequest): IPropertySearchRequest {
  if (!prismaRequest) return null;
  return {
    ...prismaRequest,
    propertyTypes: prismaRequest.propertyTypes ? JSON.parse(prismaRequest.propertyTypes as string) as string[] : undefined,
    locations: prismaRequest.locations ? JSON.parse(prismaRequest.locations as string) as IRequestedLocation[] : undefined,
    requiredFeatures: prismaRequest.requiredFeatures ? JSON.parse(prismaRequest.requiredFeatures as string) as string[] : undefined,
    status: prismaRequest.status as PropertySearchRequestStatus,
  };
}

@Controller('property-search-requests')
@UseGuards(JwtAuthGuard)
export class PropertySearchRequestController {
  constructor(private readonly propertySearchRequestService: PropertySearchRequestService) {}

  @Post('/process-parsed-email')
  @HttpCode(HttpStatus.OK)
  async processParsedEmail(@Body() parsedEmailDto: ProcessParsedPropertyEmailDto) {
    return await this.propertySearchRequestService.processParsedEmail(parsedEmailDto);
  }

  @Post()
  async createPropertySearchRequest(
    @Body() createDto: CreatePropertySearchRequestDto
  ): Promise<IPropertySearchRequest> {
    const prismaRequest = await this.propertySearchRequestService.createPropertySearchRequest(createDto);
    return mapToIPropertySearchRequest(prismaRequest);
  }

  @Get()
  async listPropertySearchRequests(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: PropertySearchRequestStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('customerId') customerId?: string,
    @Query('requestNo') requestNo?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const parsedCustomerId = customerId ? parseInt(customerId, 10) : undefined;

    return await this.propertySearchRequestService.listPropertySearchRequests({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      limit: parsedLimit,
      offset: parsedOffset,
      customerId: parsedCustomerId,
      requestNo,
    });
  }

  @Get('/:id')
  async getPropertySearchRequestById(@Param('id', ParseIntPipe) id: number): Promise<IPropertySearchRequest | null> {
    const request = await this.propertySearchRequestService.getPropertySearchRequestById(id);
    if (!request) throw new NotFoundException('Property search request not found');
    return request;
  }
  
  @Get('/by-request-no/:requestNo')
  async getPropertySearchRequestByRequestNo(@Param('requestNo') requestNo: string): Promise<IPropertySearchRequest | null> {
    const request = await this.propertySearchRequestService.findPropertySearchRequestByRequestNo(requestNo);
    if (!request) throw new NotFoundException('Property search request not found by request number');
    return request;
  }

  @Put('/:id')
  async updatePropertySearchRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePropertySearchRequestDto
  ): Promise<IPropertySearchRequest> {
    throw new Error('Update method not fully implemented yet.');
  }

  @Patch('/:id/status')
  async updatePropertySearchRequestStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PropertySearchRequestStatus,
  ): Promise<PropertySearchRequest> {
    const request = await this.propertySearchRequestService.getPropertySearchRequestById(id);
    if (!request) throw new NotFoundException('Property search request not found to update status');
    return await this.propertySearchRequestService.updatePropertySearchRequestStatus(request.requestNo, status);
  }
}
