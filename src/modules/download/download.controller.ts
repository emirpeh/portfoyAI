import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DownloadService } from './download.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from '../database/database.service';

@Controller('download')
export class DownloadController {
  constructor(
    private readonly downloadService: DownloadService,
    private readonly database: DatabaseService, // for fetching listingNo
  ) { }

  @Get(':id/info')
  async getFileInfo(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const file = await this.downloadService.getFileInfo(id);
      const listing = await this.database.realEstateListing.findUnique({
        where: { id: file.listingId },
        select: { listingNo: true },
      });

      if (!listing) {
        throw new NotFoundException(`Associated listing for file ID ${id} not found.`);
      }

      return {
        success: true,
        fileName: file.fileName,
        listingId: listing.listingNo,
        fileId: file.id,
        passwordFormat: 'listingNo + fileId',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error getting file info.');
    }
  }

  @Post(':id')
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { password: string },
    @Res() res: Response,
  ) {
    try {
      const file = await this.downloadService.getFileInfo(id);
      const listing = await this.database.realEstateListing.findUnique({
        where: { id: file.listingId },
        select: { listingNo: true },
      });

      if (!listing) {
        throw new NotFoundException(`Associated listing for file ID ${id} not found.`);
      }

      const correctPassword = `${listing.listingNo}${file.id}`;

      if (body.password !== correctPassword) {
        throw new UnauthorizedException('Incorrect password.');
      }

      const filePath = path.resolve(file.path);
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('File not found on the server.');
      }

      const fileName = path.basename(filePath);
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileName)}"`,
      );
      const stats = fs.statSync(filePath);
      res.setHeader('Content-Length', stats.size);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error downloading file.');
    }
  }
}
