import { IsString, IsEmail, IsArray } from 'class-validator';
import { SupportedLanguages } from 'src/modules/offer/types/supported.languages.type';

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  gender: string;

  @IsString()
  companyName: string;

  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @IsArray()
  @IsString({ each: true })
  customs: string[];

  @IsArray()
  @IsString({ each: true })
  foreignTrades: string[];

  @IsString()
  language: SupportedLanguages;
}
