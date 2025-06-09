import {
    IsString,
    IsOptional,
    IsNumber,
    IsUUID,
    IsBoolean,
    IsInt,
    IsEnum,
} from 'class-validator';
import { Prisma, ListingStatus } from '@prisma/client';

export class UpdateRealEstateListingDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsEnum(ListingStatus)
    @IsOptional()
    status?: ListingStatus;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    city?: string;

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
    @IsOptional()
    propertyType?: string;

    @IsUUID()
    @IsOptional()
    sellerId?: string;

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
} 