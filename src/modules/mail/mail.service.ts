import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import { GptService } from '../gpt/gpt.service';
import * as nodemailer from 'nodemailer';
import { Prisma, MailLogs } from '@prisma/client';
import { MailLogType } from './types/mail-log.type.enum';
import { MailStatusType } from '../property-search-request/types/property-search-request.types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Mail {
  address: string;
  name: string;
}
export interface GetMail {
  id: string;
  date: string;
  from: Mail[];
  to: Mail[];
  cc: Mail[];
  body: string;
  subject: string;
}

@Injectable()
export class MailService {
  private readonly baseUrl: string;
  private readonly defaultMailList: string[];
  private readonly defaultMail: string;
  private readonly logger: Logger;
  private mailTransporter: nodemailer.Transporter;

  constructor(
    private mailerService: MailerService,
    private database: DatabaseService,
    private configService: ConfigService,
    private gptService: GptService,
    private eventEmitter: EventEmitter2,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    this.defaultMailList =
      this.configService.get<string>('DEFAULT_MAIL_LIST')?.split(',') || [];

    this.defaultMail = this.configService.get<string>('DEFAULT_MAIL');
    this.logger = new Logger(MailService.name);

    this.mailTransporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: this.configService.get('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async processMail(mail: GetMail) {
    try {
      const startDate = new Date();
      startDate.setHours(
        startDate.getHours() -
        this.configService.get<number>('OFFER_EXPIRY_HOURS_FOR_ALL', 24),
      );
      const getMailLogList = await this.getMailLogs({
        to: mail.from[0].address,
        startDate,
        endDate: new Date(),
        limit: 1,
        offset: 0,
      });

      const getMailLog = getMailLogList.data[0];
      if (getMailLog && getMailLog.externalId) {
        this.logger.log(
          'Eski mail logu bulundu, ilgili ilan detayları çekiliyor (varsa):',
          getMailLog.externalId,
        );
      }

      this.logger.log(
        `processMail: GptService.analyzeRealEstateEmail çağrılıyor. Subject: ${mail.subject}`,
      );
      const analysisResult = await this.gptService.analyzeRealEstateEmail(
        mail.body,
        mail.from[0]?.address || 'unknown@example.com',
        mail.from[0]?.name || mail.from[0]?.address || 'Unknown Sender',
        mail.subject,
      );

      // Yapay zeka çıktısını dosyaya loglama
      if (analysisResult) {
        try {
          const logDir = path.join(process.cwd(), 'logs');
          const logFile = path.join(logDir, 'ai_analysis_output.jsonl');
          const logEntry = {
            timestamp: new Date().toISOString(),
            from: mail.from[0]?.address,
            subject: mail.subject,
            analysis: analysisResult,
          };
          await fs.mkdir(logDir, { recursive: true }); // Dizin yoksa oluştur
          await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
          this.logger.error(
            'Yapay zeka analiz sonucu dosyaya yazılamadı',
            error,
          );
        }
      }

      this.logger.log(`GPT analizi tamamlandı. Sonuç: ${analysisResult ? 'Başarılı' : 'Başarısız/Null'}`);
      if (analysisResult) {
        this.logger.debug(`Analiz Sonucu Detayları: ${JSON.stringify(analysisResult, null, 2)}`);
      }

      if (analysisResult) {
        this.logger.log(
          'GPT analysis successful. Emitting events based on analysis type.',
        );

        let initialLog: MailLogs;
        if (analysisResult.type === 'BUYER_INQUIRY' || analysisResult.type === 'SELLER_LISTING') {
          initialLog = await this.createMailLog({
            type: MailLogType.PROCESSING,
            from: mail.from[0]?.address || 'unknown@example.com',
            to: mail.to.map((t) => t.address).join(', '),
            contentTitle: `İŞLENİYOR: ${mail.subject}`,
            contentBody: mail.body,
          });
          this.logger.log(`Ön mail logu oluşturuldu: ${initialLog.id}`);
        }

        const eventPayload = {
          mail,
          analysisResult,
          mailLogId: initialLog?.id,
        };

        if (analysisResult.type === 'BUYER_INQUIRY') {
          this.logger.log('buyer.inquiry olayı yayınlanıyor...');
          this.eventEmitter.emit('buyer.inquiry', eventPayload);
          this.logger.log('buyer.inquiry olayı yayınlandı.');
        } else if (analysisResult.type === 'SELLER_LISTING') {
          this.logger.log('seller.listing olayı yayınlanıyor...');
          this.eventEmitter.emit('seller.listing', eventPayload);
          this.logger.log('seller.listing olayı yayınlandı.');
        } else {
          this.logger.warn(
            `Unhandled analysis type: ${analysisResult.type}. No event emitted.`,
          );
        }

        if (initialLog) {
          await this.updateMailLog(initialLog.id, {
            type: MailLogType.GPT_ANALYSIS_SUCCESS,
            contentTitle: `ANALİZ BAŞARILI: ${mail.subject}`,
            parsedData: {
              analysis: analysisResult,
              mailId: mail.id,
            } as Prisma.JsonValue,
          });
        } else {
          await this.createMailLog({
            type: MailLogType.GPT_ANALYSIS_SUCCESS,
            from: mail.from[0]?.address || 'unknown@example.com',
            to: mail.to.map((t) => t.address).join(', '),
            contentTitle: `ANALİZ BAŞARILI: ${mail.subject}`,
            contentBody: mail.body,
            parsedData: {
              analysis: analysisResult,
              mailId: mail.id,
            } as Prisma.JsonValue,
          });
        }
      } else {
        this.logger.error(
          'GPT analizi başarısız oldu veya null sonuç döndürdü.',
        );
        await this.createMailLog({
          type: MailLogType.GPT_ANALYSIS_FAILED,
          from: mail.from[0]?.address || 'unknown@example.com',
          to: mail.to.map((t) => t.address).join(', '),
          cc: mail.cc?.map((c) => c.address).join(', '),
          contentTitle: `ANALİZ HATASI: ${mail.subject}`,
          contentBody: mail.body,
          parsedData: {
            error: 'GPT analysis returned null or failed.',
            mailId: mail.id,
          } as Prisma.JsonValue,
        });
      }
    } catch (error) {
      this.logger.error(
        `Email analysis error in processMail: ${error.message}`,
        error.stack,
      );
      await this.createMailLog({
        type: MailLogType.ERROR_PROCESSING_MAIL,
        from: mail.from[0]?.address || 'unknown@example.com',
        to: mail.to.map((t) => t.address).join(', '),
        cc: mail.cc?.map((c) => c.address).join(', '),
        contentTitle: `İŞLEME HATASI: ${mail.subject}`,
        contentBody: mail.body,
        parsedData: {
          error: error.message,
          mailId: mail.id,
          stack: error.stack,
        } as Prisma.JsonValue,
      });
    }
  }

  async createMailLog(data: {
    type: MailLogType | string;
    externalId?: string;
    from: string;
    to: string;
    cc?: string | string[];
    contentTitle?: string;
    contentBody?: string;
    searchRequestId?: string;
    parsedData?: Prisma.JsonValue;
    language?: string;
  }) {
    // Ensure cc is always a string for the database
    const ccString = Array.isArray(data.cc) ? data.cc.join(', ') : data.cc;
    try {
      return await this.database.mailLogs.create({
        data: {
          type: data.type.toString(),
          externalId: data.externalId,
          from: data.from,
          to: data.to,
          cc: ccString,
          contentTitle: data.contentTitle,
          contentBody: data.contentBody,
          language: data.language,
          parsedData: data.parsedData,
          propertySearchRequest: data.searchRequestId
            ? { connect: { id: data.searchRequestId } }
            : undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Error creating mail log: ${error.message}`, {
        data,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  async getMailLogs({
    customerId,
    startDate,
    endDate,
    type,
    limit,
    offset,
    to,
    includeCustomer,
    searchRequestId,
    externalId,
  }: {
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: MailLogType | string;
    externalId?: string;
    limit: number;
    offset: number;
    to?: string;
    includeCustomer?: boolean;
    searchRequestId?: string;
  }) {
    const where: Prisma.MailLogsWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(type && { type: type.toString() }),
      ...(to && { to }),
      ...(externalId && { externalId }),
      ...(searchRequestId && { searchRequestId }),
    };

    const [total, data] = await this.database.$transaction([
      this.database.mailLogs.count({ where }),
      this.database.mailLogs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          propertySearchRequest: {
            include: {
              customer: includeCustomer,
            },
          },
        },
      }),
    ]);
    return {
      total,
      data: data as MailLogs[],
    };
  }

  getMailTypes() {
    return Object.values(MailLogType);
  }

  async sendMail(
    to: string,
    subject: string,
    content: string,
    cc?: string,
    language?: string,
    searchRequestId?: string,
    mailLogType?: MailLogType | string,
  ) {
    const mailData = {
      from: this.defaultMail,
      to,
      cc,
      subject,
      html: content,
    };
    try {
      await this.mailTransporter.sendMail(mailData);
      this.logger.log(`Mail sent to: ${to}, subject: ${subject}`);

      await this.createMailLog({
        type: mailLogType || MailLogType.UNKNOWN,
        from: this.defaultMail,
        to: to,
        cc,
        contentTitle: subject,
        contentBody: content,
        language: language,
        searchRequestId: searchRequestId,
      });
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${error.message}`, {
        mailData,
        errorStack: error.stack,
      });
      throw error;
    }
  }

  async findLogEntry(
    referenceId: string,
    logType: MailStatusType,
  ): Promise<MailLogs | null> {
    const whereClause: Prisma.MailLogsWhereInput = {
      type: logType.toString(),
      parsedData: {
        path: 'referenceId',
        equals: referenceId,
      },
    };

    return this.database.mailLogs.findFirst({
      where: whereClause,
    });
  }

  async sendGenericReminderMail(options: {
    to: string;
    subject: string;
    htmlBody: string;
    referenceId: string;
    logType: MailStatusType;
  }) {
    this.logger.log(
      `Sending generic reminder mail to ${options.to}, reference: ${options.referenceId}`,
    );

    try {
      await this.sendMail(
        options.to,
        options.subject,
        options.htmlBody,
        undefined, // cc
        undefined, // language
        undefined, // searchRequestId
        options.logType,
      );

      // Log'a referans ID'sini ekle
      const logEntry = await this.findLogEntry(
        options.referenceId,
        options.logType,
      );
      if (logEntry) {
        await this.database.mailLogs.update({
          where: { id: logEntry.id },
          data: {
            parsedData: {
              ...(logEntry.parsedData as Prisma.JsonObject),
              status: 'SENT',
            },
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error sending generic reminder mail: ${error.message}`,
        {
          options,
          errorStack: error.stack,
        },
      );
    }
  }

  async updateMailLog(
    id: string,
    data: Prisma.MailLogsUpdateInput,
  ): Promise<MailLogs> {
    try {
      this.logger.log(`Mail log güncelleniyor: ${id}`);
      return await this.database.mailLogs.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error(`Mail log güncellenirken hata: ${id}`, error.stack);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`MailLog with id ${id} not found`);
      }
      throw new InternalServerErrorException('Mail log güncellenemedi.');
    }
  }
}