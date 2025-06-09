import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertySearchRequestStatus } from '../types/property-search-request.status.enum';
import { IRequestedLocation } from '../types/property-search-request.types';

// IRequestedLocation DTO'su (nested validation için)
export class RequestedLocationDto implements IRequestedLocation {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;
}

export class CreatePropertySearchRequestDto {
  @IsInt()
  @IsNotEmpty()
  customerId: number; // Admin oluşturuyorsa veya belirli bir müşteri içinse zorunlu

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyTypes?: string[]; // Örn: ["DAİRE", "VİLLA"]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestedLocationDto)
  locations?: RequestedLocationDto[]; // Örn: [{ city: "İstanbul", district: "Kadıköy"}]

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string; // TRY, USD, EUR

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSize?: number; // m2

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSize?: number; // m2

  @IsOptional()
  @IsInt()
  @Min(0)
  minRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxRooms?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredFeatures?: string[]; // Örn: ["BALKON", "GARAJ"]

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PropertySearchRequestStatus)
  status?: PropertySearchRequestStatus;
}

export class UpdatePropertySearchRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyTypes?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestedLocationDto)
  locations?: RequestedLocationDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSize?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxRooms?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredFeatures?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PropertySearchRequestStatus)
  status?: PropertySearchRequestStatus;
}
