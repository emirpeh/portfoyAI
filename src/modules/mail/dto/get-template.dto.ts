import { IsEnum } from 'class-validator';
import { IsString } from 'class-validator';
import { IsOptional } from 'class-validator';
import { SupportedLanguages } from '../../offer/types/supported.languages.type';

export class GetTemplateDto {
  @IsEnum(SupportedLanguages)
  language: SupportedLanguages;

  @IsString()
  offerNo: string;

  @IsOptional()
  supplierContact?: {
    name: string;
    email: string;
    companyName: string;
    gender: string;
  };

  @IsOptional()
  details?: {
    originalPrice?: string;
    calculatedPrice?: string;
    rate?: string;
    profitMargin?: string;
  };

  @IsOptional()
  deadline?: string;
}
