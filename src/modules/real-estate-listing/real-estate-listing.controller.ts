import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { RealEstateListingService } from './real-estate-listing.service'
import { CreateRealEstateListingDto } from './dto/create-real-estate-listing.dto'
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard'

@Controller('real-estate-listings')
@UseGuards(JwtAuthGuard)
export class RealEstateListingController {
    constructor(
        private readonly realEstateListingService: RealEstateListingService,
    ) { }

    @Post()
    create(@Body() createRealEstateListingDto: CreateRealEstateListingDto) {
        return this.realEstateListingService.create(createRealEstateListingDto)
    }
} 