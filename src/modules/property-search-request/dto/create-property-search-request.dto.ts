import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    IsArray,
    IsNumber,
    Min,
    ValidateNested,
} from 'class-validator';

class PropertyRequestDto {
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    propertyTypes?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    locations?: string[];

    @IsNumber()
    @IsOptional()
    minPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    maxPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    minRooms?: number;

    @IsNumber()
    @IsOptional()
    minSize?: number;

    @IsNumber()
    @IsOptional()
    maxSize?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    features?: string[];

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreatePropertySearchRequestDto {
    @IsString()
    @IsOptional()
    requestNo?: string;

    @IsUUID()
    @IsNotEmpty()
    customerId: string;

    @IsString()
    @IsOptional()
    status?: 'ACTIVE' | 'PENDING' | 'MATCH_FOUND' | 'CLOSED' | 'CANCELLED';

    @IsString()
    @IsOptional()
    notes?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => PropertyRequestDto)
    propertyRequest?: PropertyRequestDto;
} 