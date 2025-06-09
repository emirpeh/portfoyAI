import { Type } from 'class-transformer'
import {
    IsString,
    IsEmail,
    IsOptional,
    IsNotEmpty,
    IsEnum,
    IsNumber,
    Min,
    ValidateNested,
    MaxLength,
} from 'class-validator'

// Frontend'den 'SATILIK' veya 'KİRALIK' gelecek.
enum TransactionTypeVM {
    SATILIK = 'SATILIK',
    KIRALIK = 'KİRALIK',
}

class SellerDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsEmail()
    email: string

    @IsString()
    @IsOptional()
    phone?: string
}

export class CreateRealEstateListingDto {
    @ValidateNested()
    @Type(() => SellerDto)
    seller: SellerDto

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title: string

    @IsEnum(TransactionTypeVM)
    transactionType: TransactionTypeVM // Corresponds to `status` in the form

    @IsString()
    @IsNotEmpty()
    propertyType: string

    @IsNumber()
    @Min(0)
    price: number

    @IsString()
    @IsNotEmpty()
    location: string

    @IsNumber()
    @IsOptional()
    @Min(0)
    size?: number

    @IsString()
    @IsOptional()
    roomCount?: string

    @IsString()
    @IsOptional()
    description?: string
} 