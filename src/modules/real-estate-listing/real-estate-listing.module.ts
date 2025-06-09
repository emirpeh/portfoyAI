import { Module } from '@nestjs/common'
import { RealEstateListingService } from './real-estate-listing.service'
import { RealEstateListingController } from './real-estate-listing.controller'
import { DatabaseModule } from '../database/database.module'

@Module({
    imports: [DatabaseModule],
    controllers: [RealEstateListingController],
    providers: [RealEstateListingService],
})
export class RealEstateListingModule { } 