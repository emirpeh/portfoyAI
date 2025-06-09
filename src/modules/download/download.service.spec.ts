import { Test, TestingModule } from '@nestjs/testing';
import { DownloadService } from './download.service';
import { DatabaseService } from '../database/database.service';

describe('DownloadService', () => {
  let service: DownloadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DownloadService, DatabaseService],
    }).compile();

    service = module.get<DownloadService>(DownloadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
