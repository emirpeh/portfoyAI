import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma, MailLogs } from '@prisma/client';

@Injectable()
export class MailLogService {
  private readonly logger = new Logger(MailLogService.name);

  constructor(private readonly database: DatabaseService) { }

  /**
   * Yeni bir mail logu oluşturur.
   */
  async createLog(data: Prisma.MailLogsCreateInput): Promise<MailLogs> {
    try {
      this.logger.log(
        `Creating mail log for type: ${data.type}, externalId: ${data.externalId}`,
      );
      const newLog = await this.database.mailLogs.create({ data });
      return newLog;
    } catch (error) {
      this.logger.error(
        `Failed to create mail log: ${error.message}`,
        JSON.stringify({
          stack: error.stack,
          data,
        }),
      );
      throw error;
    }
  }

  /**
   * Mevcut bir mail logunu ID ile günceller.
   */
  async updateLog(
    logId: string,
    data: Prisma.MailLogsUpdateInput,
  ): Promise<MailLogs> {
    try {
      this.logger.log(`Updating mail log with ID: ${logId}`);
      return await this.database.mailLogs.update({
        where: { id: logId },
        data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update mail log with ID ${logId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Bir mail logunu ID'sine göre bulur.
   */
  async getLogById(id: string): Promise<MailLogs | null> {
    return this.database.mailLogs.findUnique({ where: { id } });
  }

  /**
   * Bir mail logunu externalId'sine (örn: message-id) göre bulur.
   */
  async getLogByExternalId(externalId: string): Promise<MailLogs | null> {
    return this.database.mailLogs.findFirst({
      where: { externalId },
    });
  }
}
