import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { CreateRealEstateListingDto } from './dto/create-real-estate-listing.dto'
import { TransactionType } from '@prisma/client'

@Injectable()
export class RealEstateListingService {
    constructor(private readonly prisma: DatabaseService) { }

    async create(createRealEstateListingDto: CreateRealEstateListingDto) {
        const { seller, transactionType, ...propertyData } = createRealEstateListingDto

        // Frontend'den gelen 'SATILIK'/'KİRALIK' değerini Prisma enum'una çevir
        const transactionTypeForDb: TransactionType =
            transactionType === 'SATILIK' ? 'SALE' : 'RENT'

        return this.prisma.$transaction(async (tx) => {
            // Satıcıyı bul veya oluştur
            const customer = await tx.customer.upsert({
                where: { email: seller.email },
                update: {
                    name: seller.name,
                    phone: seller.phone,
                    customerType: 'SELLER',
                },
                create: {
                    name: seller.name,
                    email: seller.email,
                    phone: seller.phone,
                    customerType: 'SELLER',
                },
            })

            // Mülk ilanını oluştur
            const listing = await tx.realEstateListing.create({
                data: {
                    ...propertyData,
                    listingNo: `LST-${Date.now()}`, // Benzersiz bir ilan no oluştur
                    sellerId: customer.id,
                    transactionType: transactionTypeForDb,
                    currency: 'TRY', // Varsayılan para birimi
                    roomCount: propertyData.roomCount ? parseInt(propertyData.roomCount, 10) : null,
                },
            })

            return listing
        })
    }
} 