import {
  Controller,
  Get,
  Param,
  Query,
  Put,
  Body,
  UseGuards,
  Post,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { MailStatusType } from './types/mail.status.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OfferStatusType } from './types/offer.status.type';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Get()
  async getOfferList(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: MailStatusType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.offerService.getOfferList({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('configuration')
  async getOfferConfiguration() {
    return await this.offerService.getOfferConfiguration();
  }

  @Get('/:id')
  async getOffer(@Param('id') id: number) {
    return await this.offerService.getOffer(id);
  }

  @Post('calculate')
  async calculateOffer(@Body() body: { price: string }) {
    return await this.offerService.calculateOffer(body.price);
  }

  @Put('configuration')
  async updateOfferConfiguration(
    @Body() body: { rate: string; profitMargin: string; isEnabled: boolean },
  ) {
    return await this.offerService.updateOfferConfiguration(
      body.rate,
      body.profitMargin,
      body.isEnabled,
    );
  }

  @Post(':offerNo/status')
  async updateOfferStatus(
    @Param('offerNo') offerNo: string,
    @Body('status') status: OfferStatusType,
  ) {
    return await this.offerService.updateOfferStatus(offerNo, status);
  }
}
