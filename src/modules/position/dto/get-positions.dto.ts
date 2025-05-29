import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPositionsDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  customer?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(['G', 'D', 'T'], {
    message: 'Position type must be either G, D or T',
  })
  @IsOptional()
  positionType?: 'G' | 'D' | 'T';

  @IsString()
  @IsOptional()
  sender?: string;

  @IsString()
  @IsOptional()
  receiver?: string;
}
