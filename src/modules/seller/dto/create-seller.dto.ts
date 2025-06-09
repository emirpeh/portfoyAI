import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

// Kurallarda belirtildiği gibi, Customer modeli hem alıcı hem satıcıyı tutar.
// Bu yüzden 'customerType' alanı, bir müşterinin satıcı mı alıcı mı olduğunu belirtir.
enum CustomerType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  BOTH = 'BOTH',
}

export class CreateSellerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  company?: string;

  // Yeni bir satıcı oluşturulurken tipi her zaman 'SELLER' olmalı.
  @IsEnum(CustomerType)
  @IsOptional()
  customerType: CustomerType = CustomerType.SELLER;
}
