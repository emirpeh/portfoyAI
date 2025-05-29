import {
  Controller,
  Get,
  UseGuards,
  Query,
  ValidationPipe,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PositionService } from './position.service';
import { GetPositionsDto } from './dto/get-positions.dto';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get('dashboard/stats')
  async getDashboardStats(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.positionService.getDashboardStats(
      startDate,
      endDate,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get('dashboard/monthly-stats')
  async getMonthlyStats(
    @Req() req,
    @Query('companyName') companyName?: string,
  ) {
    return await this.positionService.getMonthlyStats(
      companyName,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get()
  async getPositions(
    @Req() req,
    @Query(new ValidationPipe({ transform: true }))
    getPositionsDto: GetPositionsDto,
  ) {
    return await this.positionService.getPositions(
      getPositionsDto,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get(':positionNo')
  async getPositionByPositionNo(
    @Req() req,
    @Param('positionNo') positionNo: string,
  ) {
    return await this.positionService.getPositionByPositionNo(
      positionNo,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get(':positionNo/loading-unloading-information')
  async getLoadingUnloadingInformationByPositionNo(
    @Req() req,
    @Param('positionNo') positionNo: string,
  ) {
    return await this.positionService.getLoadingUnloadingInformationByPositionNo(
      positionNo,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get(':positionNo/cargo-details')
  async getCargoDetailsByPositionNo(
    @Req() req,
    @Param('positionNo') positionNo: string,
  ) {
    return await this.positionService.getCargoDetailsByPositionNo(
      positionNo,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get(':positionNo/partial-loads')
  async getPositionPartialLoads(
    @Req() req,
    @Param('positionNo') positionNo: string,
  ) {
    return await this.positionService.getPositionPartialLoads(
      positionNo,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get(':positionNo/files')
  async getPositionFiles(@Param('positionNo') positionNo: string) {
    return this.positionService.getPositionFilesByPositionNo(positionNo);
  }

  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    try {
      console.log(`Dosya indirme isteği: ID=${id}`);

      // Dosya yolunu veritabanından al
      const files = await this.positionService.getPositionFilesById(id);

      if (!files || files.length === 0) {
        console.log(`Dosya bulunamadı: ID=${id}`);
        return res.status(404).json({ message: 'Dosya bulunamadı' });
      }

      const filePath = files[0].path;
      const positionId = files[0].pozNo || '';

      console.log(
        `Dosya bilgileri: Path=${filePath}, PositionID=${positionId}`,
      );

      // Dosyanın var olup olmadığını kontrol et
      if (!fs.existsSync(filePath)) {
        console.log(`Dosya sistemde bulunamadı: ${filePath}`);
        return res.status(404).json({ message: 'Dosya sistemde bulunamadı' });
      }

      // Dosya adını al
      const fileName = path.basename(filePath);
      const fileExt = path.extname(fileName);
      const encryptedFileName = `${fileName.replace(fileExt, '')}_encrypted${fileExt}`;

      // Şifreleme için parola oluştur
      const password = `${positionId}${id}`;
      console.log(`Şifreleme parolası oluşturuldu: ${password}`);

      // Geçici dosya yolu oluştur
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const encryptedFilePath = path.join(tempDir, encryptedFileName);

      // Dosya tipini belirle
      const ext = path.extname(fileName).toLowerCase();
      const mimeType =
        {
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.txt': 'text/plain',
        }[ext] || 'application/octet-stream';

      // Dosyayı şifrele
      try {
        // Dosyayı oku
        const fileData = fs.readFileSync(filePath);

        // Şifreleme için crypto modülünü kullan
        // const crypto = require('crypto'); // Bu satırı kaldırın

        // Şifreleme algoritması ve anahtar oluştur
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(password, 'salt', 32); // 32 bytes = 256 bits
        const iv = crypto.randomBytes(16); // Initialization vector

        // Şifreleme işlemi
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(fileData);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // IV'yi şifrelenmiş verinin başına ekle (şifre çözme için gerekli)
        const encryptedWithIV = Buffer.concat([iv, encrypted]);

        // Şifrelenmiş dosyayı kaydet
        fs.writeFileSync(encryptedFilePath, encryptedWithIV);

        console.log(`Dosya şifrelendi: ${encryptedFilePath}`);

        // Response headers'ı ayarla
        res.setHeader('Content-Type', mimeType);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(encryptedFileName)}"`,
        );

        // Dosya boyutunu al
        const stats = fs.statSync(encryptedFilePath);
        res.setHeader('Content-Length', stats.size);

        // Şifrelenmiş dosyayı stream olarak gönder
        const fileStream = fs.createReadStream(encryptedFilePath);
        fileStream.pipe(res);

        // Dosya gönderildikten sonra geçici dosyayı temizle
        fileStream.on('end', () => {
          try {
            fs.unlinkSync(encryptedFilePath);
            console.log(
              `Geçici şifrelenmiş dosya silindi: ${encryptedFilePath}`,
            );
          } catch (cleanupError) {
            console.error('Geçici dosya silme hatası:', cleanupError);
          }
        });

        // Hata durumunda
        fileStream.on('error', error => {
          console.error('Şifrelenmiş dosya okuma hatası:', error);
          try {
            fs.unlinkSync(encryptedFilePath);
          } catch (cleanupError) {
            console.error('Geçici dosya silme hatası:', cleanupError);
          }
          if (!res.headersSent) {
            res.status(500).json({ message: 'Dosya okuma hatası' });
          }
        });
      } catch (encryptionError) {
        console.error('Dosya şifreleme hatası:', encryptionError);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Dosya şifreleme hatası' });
        }
      }
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Sunucu hatası' });
      }
    }
  }

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get(':positionNo/truck-detail')
  async getTruckDetailByPositionNo(@Param('positionNo') positionNo: string) {
    return await this.positionService.getTruckDetailByPositionNo(positionNo);
  }
}
