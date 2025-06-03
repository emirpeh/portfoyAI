import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailStatusType } from '../property-search-request/types/mail.status.type';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('analyze')
  async analyzeEmail(
    @Body() emailData: { content: string; subject: string; from: string }
  ) {
    return await this.mailService.analyzeSimpleEmail(
      emailData.content,
      emailData.subject,
      emailData.from
    );
  }

  @Post('send')
  async sendMail(
    @Body() mailData: {
      to: string;
      subject: string;
      content: string;
      cc?: string[];
    }
  ) {
    return await this.mailService.sendMail(
      mailData.to,
      mailData.subject,
      mailData.content,
      mailData.cc || []
    );
  }

  @Get('logs')
  async getMailLogs(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('limit') limitStr: string,
    @Query('offset') offsetStr: string,
    @Query('type') typeStr: string,
    @Query('offerNo') offerNoQueryParam: string,
    @Query('to') to: string
  ) {
    // Varsayılan değerler ve tip dönüşümleri
    const startDate = startDateStr 
      ? new Date(startDateStr) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Son 30 gün
    
    const endDate = endDateStr 
      ? new Date(endDateStr) 
      : new Date();
    
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    // Mail tipi doğrulama
    let type: MailStatusType | undefined;
    if (typeStr && Object.values(MailStatusType).includes(typeStr as MailStatusType)) {
      type = typeStr as MailStatusType;
    }

    return this.mailService.getMailLogs({
      startDate,
      endDate,
      limit,
      offset,
      type,
      externalId: offerNoQueryParam,
      to
    });
  }
} 