import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
  IsEmail,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { MailStatusType } from '../types/mail.status.type';
import { Type } from 'class-transformer';
import { MailLogType } from '../../../modules/mail/types/mail-log.type.enum';

export class CustomerContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  gender?: string;
}

export class ProcessPropertyRequestDto {
  @IsString()
  @IsOptional()
  propertyType?: string; // Ev, Villa, Arsa, vb.

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
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @IsString()
  @IsOptional()
  currency?: string; // TL, USD, EUR, vb.

  @IsNumber()
  @IsOptional()
  minSize?: number;

  @IsNumber()
  @IsOptional()
  maxSize?: number;

  @IsNumber()
  @IsOptional()
  roomCount?: number;

  @IsNumber()
  @IsOptional()
  bathroomCount?: number;

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
}

export class ProcessPropertyListingDto {
  @IsString()
  @IsOptional()
  propertyType?: string;

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
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  size?: number;

  @IsNumber()
  @IsOptional()
  roomCount?: number;

  @IsNumber()
  @IsOptional()
  bathroomCount?: number;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsNumber()
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

  @IsNumber()
  @IsOptional()
  yearBuilt?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  features?: string[];
}

export class ProcessOfferMailDto {
  @IsEnum(MailStatusType)
  @IsOptional()
  type?: MailStatusType;

  @IsString()
  @IsOptional()
  listingNo?: string;

  @IsString()
  @IsEmail()
  from?: string;

  @IsArray()
  @IsOptional()
  cc?: string[];

  @IsString()
  @IsOptional()
  contentTitle?: string;

  @IsString()
  @IsOptional()
  contentHtml?: string;

  @IsObject()
  @IsOptional()
  customer?: CustomerContactDto;

  @IsString()
  @IsOptional()
  language?: string;

  @IsObject()
  @IsOptional()
  propertyRequest?: ProcessPropertyRequestDto;

  @IsObject()
  @IsOptional()
  propertyListing?: ProcessPropertyListingDto;

  @IsString()
  @IsOptional()
  modelResponseTitle?: string;

  @IsString()
  @IsOptional()
  modelResponseMail?: string;

  @IsBoolean()
  @IsOptional()
  isThereMissingOrIncorrectInformation?: boolean;

  @IsObject()
  @IsOptional()
  agentMails?: {
    turkish?: {
      modelResponseTitle: string;
      modelResponseMail: string;
    };
    english?: {
      modelResponseTitle: string;
      modelResponseMail: string;
    };
  };
}

// Alıcının emlak arama talebi için DTO
export class PropertyRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  minSize?: number; // m2

  @IsOptional()
  @IsNumber()
  maxSize?: number; // m2

  @IsOptional()
  @IsNumber()
  minRooms?: number;

  @IsOptional()
  @IsNumber()
  maxRooms?: number;

  @IsOptional()
  @IsString()
  requiredFeatures?: string; // Örn: "Balkon, Garaj" (AI parse edebilir)

  @IsOptional()
  @IsString()
  notes?: string;
}

// Satıcının emlak ilanı için DTO
export class PropertyListingDto {
  @IsString()
  propertyType: string; // Örn: "Daire"

  @IsString()
  location: string; // Örn: "İstanbul, Beşiktaş, Yıldız Mah."

  @IsOptional()
  @IsString()
  listingNo?: string; // AI tarafından sağlanabilir

  @IsOptional()
  @IsString()
  city?: string; // AI tarafından location'dan çıkarılabilir

  @IsOptional()
  @IsString()
  district?: string; // AI tarafından location'dan çıkarılabilir

  @IsOptional()
  @IsString()
  neighborhood?: string; // AI tarafından location'dan çıkarılabilir

  @IsNumber()
  price: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsNumber()
  size?: number; // m2

  @IsOptional()
  @IsNumber()
  roomCount?: number;

  @IsOptional()
  @IsNumber()
  bathroomCount?: number;

  @IsOptional()
  @IsNumber()
  floor?: number;

  @IsOptional()
  @IsNumber()
  totalFloors?: number;

  @IsOptional()
  @IsBoolean()
  hasGarage?: boolean;

  @IsOptional()
  @IsBoolean()
  hasGarden?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPool?: boolean;

  @IsOptional()
  @IsBoolean()
  isFurnished?: boolean;

  @IsOptional()
  @IsNumber()
  yearBuilt?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  features?: string | string[]; // AI'dan string veya array gelebilir, serviste handle edilecek

  // Satıcı bilgileri (e-postadan çıkarılabilirse)
  @IsOptional()
  @IsString()
  sellerName?: string;

  @IsOptional()
  @IsEmail()
  sellerEmail?: string;

  @IsOptional()
  @IsString()
  sellerPhone?: string;
}

// AI tarafından e-posta analizi sonucu oluşturulacak ana DTO
export class ProcessParsedPropertyEmailDto {
  @IsEmail()
  from: string; // E-postayı gönderen

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  to?: string[]; // E-postanın alıcıları

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body: string; // E-postanın ham içeriği (AI'ın işlediği)

  @IsEnum(MailLogType) // E-postanın AI tarafından belirlenen genel türü
  emailType: MailLogType;

  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyRequestDto)
  propertyRequest?: PropertyRequestDto; // Eğer emailType alıcı talebi ise bu doldurulur

  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyListingDto)
  propertyListing?: PropertyListingDto; // Eğer emailType satıcı ilanı ise bu doldurulur

  @IsOptional()
  @IsString()
  language?: string; // E-postanın dili (tr, en vb.)

  @IsOptional()
  @IsObject() // AI'dan gelen ek, yapılandırılmamış veriler için
  additionalRawData?: Record<string, any>;
}
