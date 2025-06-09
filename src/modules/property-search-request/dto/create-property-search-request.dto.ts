import { Type } from 'class-transformer';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsNotEmpty,
    IsEnum,
    IsNumber,
    Min,
    ValidateNested,
    IsIn,
} from 'class-validator';

enum TransactionType {
    SATILIK = 'SATILIK',
    KIRALIK = 'KIRALIK',
}

class BuyerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class CreatePropertySearchRequestDto {
    @ValidateNested()
    @Type(() => BuyerDto)
    buyer: BuyerDto;

    @IsString()
    @IsIn(['SALE', 'RENT'])
    transactionType: string;

    @IsString()
    @IsNotEmpty()
    propertyType: string;

    @IsString()
    @IsOptional()
    numberOfRooms?: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    minPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    maxPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    minSize?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    maxSize?: number;

    @IsString()
    @IsOptional()
    notes?: string;
} 