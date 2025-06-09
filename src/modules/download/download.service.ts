import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DownloadService {
  constructor(private readonly database: DatabaseService) { }

  async getFileInfo(id: string) {
    const file = await this.database.realEstateFile.findUnique({
      where: { id },
    });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found.`);
    }
    return file;
  }
}
