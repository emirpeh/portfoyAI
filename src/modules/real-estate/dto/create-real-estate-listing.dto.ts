import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsUUID,
    IsBoolean,
    IsInt,
    IsEnum,
} from 'class-validator';
import { Prisma, TransactionType } from '@prisma/client';

export class CreateRealEstateListingDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsOptional()
    district?: string;

    @IsString()
    @IsOptional()
    neighborhood?: string;

    @IsNumber()
    @IsOptional()
    size?: number;

    @IsInt()
    @IsOptional()
    roomCount?: number;

    @IsInt()
    @IsOptional()
    bathroomCount?: number;

    @IsString()
    @IsNotEmpty()
    propertyType: string;

    @IsUUID()
    @IsNotEmpty()
    sellerId: string;

    @IsInt()
    @IsOptional()
    floor?: number;

    @IsInt()
    @IsOptional()
    totalFloors?: number;

    @IsBoolean()
    @IsOptional()
    hasGarage?: boolean;

    @IsBoolean()
    @IsOptional()
    hasGarden?: boolean;

    @IsBoolean()
    @IsOptional()
    hasPool?: boolean;

    @IsBoolean()
    @IsOptional()
    isFurnished?: boolean;

    @IsInt()
    @IsOptional()
    yearBuilt?: number;

    @IsOptional()
    features?: Prisma.JsonValue;

    @IsOptional()
    images?: Prisma.JsonValue;

    @IsOptional()
    videos?: Prisma.JsonValue;

    @IsString()
    @IsOptional()
    virtualTour?: string;

    @IsEnum(TransactionType)
    @IsOptional()
    transactionType?: TransactionType;
} 