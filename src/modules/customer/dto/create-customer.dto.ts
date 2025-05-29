import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  externalId?: string;
}
