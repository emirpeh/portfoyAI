import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConnectionPool, connect } from 'mssql';
import { getDatabaseConfig } from '../../config/database.config';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: ConnectionPool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const dbConfig = getDatabaseConfig(this.configService);
    try {
      this.pool = await connect(dbConfig);
      console.log(
        `Connected to database: ${dbConfig.database} on server: ${dbConfig.server}`,
      );
    } catch (error) {
      console.error('Failed to connect to database:', error);
    }
  }

  async onModuleDestroy() {
    await this.pool?.close();
  }

  getPool(): ConnectionPool {
    return this.pool;
  }
}
