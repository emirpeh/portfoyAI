import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseSeeder } from './database.seeder';
import { ConfigModule } from '../../config/config.module';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService, DatabaseSeeder],
  exports: [DatabaseService],
})
export class DatabaseModule {}
