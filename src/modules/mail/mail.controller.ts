import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { GetMail, MailService } from './mail.service';
import { MailStatusType } from '../offer/types/mail.status.type';
import { GetTemplateDto } from './dto/get-template.dto';

@Controller('mails')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('process')
  async processMail(
    @Body() mail: GetMail,
    @Headers('x-api-key') apiKey: string,
  ) {
    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }
    this.mailService.processMail(mail);
    return { message: 'Mail processed' };
  }

  @Get()
  async getMailLogs(
    @Query('customerId') customerId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: MailStatusType,
    @Query('externalId') externalId?: string,
    @Query('offerNo') offerNo?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.mailService.getMailLogs({
      customerId: customerId ? Number(customerId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      type,
      externalId,
      offerNo: offerNo ? offerNo : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      includeOffer: true,
      includeCustomer: true,
      includeSupplierOffer: true,
    });
  }

  @Post('send')
  async sendMail(
    @Body()
    body: {
      to: string;
      subject: string;
      content: string;
      cc?: string[];
      supplierOfferId?: number;
      supplierContactId?: number;
      price?: string;
      note?: string;
    },
  ) {
    return await this.mailService.sendMail(
      body.to,
      body.subject,
      body.content,
      body.cc,
      body.supplierContactId,
      body.supplierOfferId,
      body.price,
      body.note,
    );
  }

  @Post('templates/request-price')
  async getRequestPriceTemplate(@Body() body: GetTemplateDto) {
    return await this.mailService.getEmailTemplate({
      ...body,
      type: 'REQUEST_PRICE',
    });
  }

  @Post('templates/calculated-price')
  async getCalculatedPriceTemplate(@Body() body: GetTemplateDto) {
    console.log(body);
    return await this.mailService.getEmailTemplate({
      ...body,
      type: 'CALCULATED_PRICE',
    });
  }
}
