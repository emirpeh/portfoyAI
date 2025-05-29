import { Controller, Get, Param, Res, Body, Post } from '@nestjs/common';
import { PositionService } from '../position/position.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('download')
export class DownloadController {
  constructor(private readonly positionService: PositionService) {}

  @Get(':id/info')
  async getFileInfo(@Param('id') id: string) {
    try {
      console.log('Dosya bilgisi isteği başladı:', id);

      // Dosya bilgilerini veritabanından al
      const files = await this.positionService.getPositionFilesById(id);
      console.log('Veritabanından gelen dosya bilgileri:', files);

      if (!files || files.length === 0) {
        console.log('Dosya bulunamadı');
        return { success: false, message: 'Dosya bulunamadı' };
      }

      const positionId = files[0].positionId || '';
      const fileName = files[0].fileName || '';
      return {
        success: true,
        fileName: fileName,
        positionId: positionId,
        fileId: id,
        passwordFormat: 'pozisyonNo + dosyaId',
      };
    } catch (error) {
      console.error('Dosya bilgisi hatası:', error);
      return { success: false, message: 'Sunucu hatası' };
    }
  }

  @Post(':id')
  async downloadFile(
    @Param('id') id: string,
    @Body() body: { password: string },
    @Res() res: Response,
  ) {
    try {
      console.log('Download isteği başladı:', id);
      console.log('Gönderilen şifre:', body.password);

      const files = await this.positionService.getPositionFilesById(id);
      console.log('Veritabanından gelen dosya bilgileri:', files);

      if (!files || files.length === 0) {
        console.log('Dosya bulunamadı');
        return res.status(404).json({ message: 'Dosya bulunamadı' });
      }

      const filePath = files[0].path;
      const positionId = files[0].positionId || '';
      console.log('Dosya yolu:', filePath);
      console.log('Pozisyon ID:', positionId);

      // Doğru şifreyi oluştur
      const correctPassword = `${positionId}${id}`;
      console.log('Doğru şifre:', correctPassword);

      // Şifre kontrolü
      if (body.password !== correctPassword) {
        console.log('Şifre yanlış');
        return res.status(401).json({ message: 'Password is wrong' });
      }

      // Dosyanın var olup olmadığını kontrol et
      if (!fs.existsSync(filePath)) {
        console.log('Dosya sistemde bulunamadı:', filePath);
        return res.status(404).json({ message: 'File not found' });
      }

      // Dosya adını al
      const fileName = path.basename(filePath);
      console.log('Dosya adı:', fileName);

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
      console.log('MIME type:', mimeType);

      // Response headers'ı ayarla
      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileName)}"`,
      );

      // Dosya boyutunu al
      const stats = fs.statSync(filePath);
      res.setHeader('Content-Length', stats.size);
      console.log('Dosya boyutu:', stats.size);

      // Dosyayı stream olarak gönder
      console.log('Dosya stream başlıyor...');
      const fileStream = fs.createReadStream(filePath);

      // Stream'i response'a pipe et
      fileStream.pipe(res);

      // Stream bittiğinde
      fileStream.on('end', () => {
        console.log(`Dosya başarıyla gönderildi: ${fileName}`);
      });

      // Stream hatası durumunda
      fileStream.on('error', error => {
        console.error('Dosya okuma hatası:', error);
        // Stream'i temizle
        fileStream.destroy();
        if (!res.headersSent) {
          res.status(500).json({ message: 'Dosya okuma hatası' });
        }
      });
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Sunucu hatası' });
      }
    }
  }
}
