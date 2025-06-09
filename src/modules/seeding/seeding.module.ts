import { Module } from '@nestjs/common';
import { SeedingService } from './seeding.service';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [UserModule, DatabaseModule],
    providers: [SeedingService],
    exports: [SeedingService],
})
export class SeedingModule { } 