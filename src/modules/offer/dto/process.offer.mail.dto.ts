import {
  IsString,
  IsOptional,
  IsDate,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
  IsEmail,
  IsArray,
} from 'class-validator';
import { MailStatusType } from '../types/mail.status.type';

export class CustomerContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  gender?: string;
}

export class ProcessRequestOfferMailDto {
  @IsDate()
  @IsOptional()
  loadDate?: Date;

  @IsString()
  @IsOptional()
  loadCountry?: string;

  @IsString()
  @IsOptional()
  loadCity?: string;

  @IsString()
  @IsOptional()
  packagingType?: string;

  @IsNumber()
  @IsOptional()
  numOfContainers?: number;

  @IsString()
  @IsOptional()
  containerType?: string;

  @IsString()
  @IsOptional()
  containerDimensions?: string;

  @IsString()
  @IsOptional()
  goodsType?: string;

  @IsBoolean()
  @IsOptional()
  isStackable?: string;

  @IsString()
  @IsOptional()
  deliveryCity?: string;

  @IsString()
  @IsOptional()
  deliveryCountry?: string;

  @IsDate()
  @IsOptional()
  deliveryDate?: Date;

  @IsString()
  @IsOptional()
  foreignTrade?: 'IM' | 'EX' | 'TRN';
}

export class ProcessResponseOfferMailDto {
  @IsArray()
  @IsOptional()
  prices?: {
    price: number;
    note: string;
  }[];
}

export class ProcessSupplierOfferMailDto {
  @IsString()
  @IsOptional()
  price: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsNumber()
  @IsOptional()
  supplierContactId: number;
}

export class ProcessOfferMailDto {
  @IsEnum(MailStatusType)
  @IsOptional()
  type?: MailStatusType;

  @IsString()
  @IsOptional()
  offerNo?: string;

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
  request?: ProcessRequestOfferMailDto;

  @IsArray()
  @IsOptional()
  offer?: ProcessResponseOfferMailDto;

  @IsString()
  @IsOptional()
  modelResponseTitle?: string;

  @IsString()
  @IsOptional()
  modelResponseMail?: string;

  @IsBoolean()
  @IsOptional()
  isThereMissingOrIncorrectInformation?: boolean;

  @IsNumber()
  @IsOptional()
  calculatedVolume?: number;

  @IsNumber()
  @IsOptional()
  calculatedLdm?: number;

  @IsString()
  @IsOptional()
  customs?: string;

  @IsObject()
  @IsOptional()
  supplierMails?: {
    turkish?: {
      modelResponseTitle: string;
      modelResponseMail: string;
    };
    english?: {
      modelResponseTitle: string;
      modelResponseMail: string;
    };
    croatian?: {
      modelResponseTitle: string;
      modelResponseMail: string;
    };
    slovenian?: {
      modelResponseTitle: string;
      modelResponseMail: string;
    };
    bosnian?: {
      modelResponseTitle: string;
      modelResponseMail: string;
    };
    macedonian?: {
      modelResponseTitle: string;
      modelResponseMail: string;
    };
  };
}
