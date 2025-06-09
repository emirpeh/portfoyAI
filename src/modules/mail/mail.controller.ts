import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { MailService, GetMail } from './mail.service';
import { MailgunBodyDto } from './dto/mailgun-body.dto';
import { Public } from '../auth/decorators/public.decorator';
import { MailLogType } from './types/mail-log.type.enum';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) { }

  /**
   * Mailgun gibi bir e-posta yönlendirme servisinden gelen webhook'ları karşılar.
   * Gelen veriyi sistemin anlayacağı formata dönüştürür ve işlem kuyruğuna ekler.
   * Bu endpoint public olmalıdır çünkü harici bir servis tarafından çağrılacaktır.
   */
  @Public()
  @Post('inbound-webhook')
  async inboundWebhook(@Body() mailgunData: MailgunBodyDto) {
    const mailToProcess: GetMail = {
      id: mailgunData['Message-Id'] || `webhook-${new Date().getTime()}`,
      date: new Date(mailgunData.timestamp * 1000).toISOString(),
      from: [{ address: mailgunData.sender, name: mailgunData.from }],
      to: [{ address: mailgunData.recipient, name: '' }],
      cc: [],
      body: mailgunData['body-plain'],
      subject: mailgunData.subject,
    };

    // Asıl işi yapan processMail metodunu çağır
    // await kullanmıyoruz ki Mailgun'a anında 200 OK dönebilelim.
    this.mailService.processMail(mailToProcess);

    // Endpoint'in anında yanıt vermesi için bir mesaj döndür,
    // asıl işlem arka planda asenkron çalışsın.
    return {
      message: 'Email accepted for processing.',
      trackingId: mailToProcess.id,
    };
  }

  @Post('analyze')
  async analyzeEmail(@Body() emailData: { text: string }) {
    // Gelen basit veriyi processMail'in beklediği GetMail formatına dönüştür
    const fromEmail = `testuser-${Date.now()}@example.com`; // Test için geçici bir e-posta
    const mailToProcess: GetMail = {
      id: `api-${Date.now()}`,
      date: new Date().toISOString(),
      from: [{ address: fromEmail, name: fromEmail }], // Hem isim hem adres için aynı
      to: [{ address: 'system@portfolioai.com', name: 'System' }],
      cc: [],
      body: emailData.text,
      subject: 'API Analiz İsteği', // Sabit veya gelen veriden türetilebilir
    };

    // Asıl işi yapan processMail metodunu çağır
    this.mailService.processMail(mailToProcess);

    // Endpoint'in anında yanıt vermesi için bir mesaj döndür
    return {
      message: 'Email analysis has been queued.',
      trackingId: mailToProcess.id,
    };
  }

  @Post('send')
  async sendMail(
    @Body()
    mailData: {
      to: string;
      subject: string;
      content: string;
      cc?: string;
    },
  ) {
    return await this.mailService.sendMail(
      mailData.to,
      mailData.subject,
      mailData.content,
      mailData.cc,
    );
  }

  @Get('logs')
  async getMailLogs(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Query('limit') limitStr: string,
    @Query('offset') offsetStr: string,
    @Query('type') typeStr: string,
    @Query('externalId') externalId: string,
    @Query('to') to: string,
  ) {
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    let type: MailLogType | undefined;
    if (typeStr && Object.values(MailLogType).includes(typeStr as MailLogType)) {
      type = typeStr as MailLogType;
    }

    return this.mailService.getMailLogs({
      startDate,
      endDate,
      limit,
      offset,
      type,
      externalId: externalId,
      to,
    });
  }
}
