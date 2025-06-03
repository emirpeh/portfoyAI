import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MailLogs } from '@prisma/client';
import { RealEstateEmailAnalysis } from '../gpt/schemas/real-estate-email-analysis.schema';

@Injectable()
export class MailLogService {
  private readonly logger = new Logger(MailLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createInitialLog(
    data: Omit<
      Prisma.MailLogsCreateInput,
      'propertySearchRequest' | 'parsedData'
    >,
  ): Promise<MailLogs> {
    this.logger.log(
      `Creating initial mail log for sender: ${data.from}, subject: ${data.contentTitle}`,
    );
    try {
      return await this.prisma.mailLogs.create({
        data: {
          ...data,
          type: data.type || 'INCOMING_EMAIL', // Varsayılan tip
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating initial mail log: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateLogWithAnalysis(
    logId: number,
    analysisResult: RealEstateEmailAnalysis | null,
    status?: string, // Opsiyonel durum, ör: PROCESSED, FAILED_ANALYSIS
  ): Promise<MailLogs | null> {
    this.logger.log(
      `Updating mail log ID: ${logId} with analysis results. Status: ${status || 'N/A'}`,
    );
    try {
      const updateData: Prisma.MailLogsUpdateInput = {
        parsedData: analysisResult
          ? (analysisResult as Prisma.JsonObject)
          : Prisma.DbNull,
        updatedAt: new Date(),
      };

      if (analysisResult && analysisResult.type) {
        // Analiz tipini logun tipine de yansıtabiliriz, ya da ayrı bir alan ekleyebiliriz.
        // Şimdilik type'ı olduğu gibi bırakıp, parsedData'ya odaklanalım.
      }

      if (status) {
        // Prisma şemasında MailLogs için bir 'status' alanı ekleyebiliriz.
        // Şimdilik logluyoruz, ileride şemaya eklenebilir.
        this.logger.log(`Mail log ID: ${logId} status to be updated to: ${status}`);
      }

      return await this.prisma.mailLogs.update({
        where: { id: logId },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(
        `Error updating mail log ID ${logId} with analysis: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async getLogById(id: number): Promise<MailLogs | null> {
    return this.prisma.mailLogs.findUnique({ where: { id } });
  }

  // İleride PropertySearchRequest ile ilişkilendirmek için bir metod eklenebilir
  async linkToPropertySearchRequest(
    logId: number,
    searchRequestId: number,
  ): Promise<MailLogs | null> {
    this.logger.log(
      `Linking mail log ID: ${logId} to search request ID: ${searchRequestId}`,
    );
    try {
      return await this.prisma.mailLogs.update({
        where: { id: logId },
        data: {
          propertySearchRequest: {
            connect: { id: searchRequestId },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Error linking mail log ID ${logId} to search request ID ${searchRequestId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
} 