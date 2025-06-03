import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.CUSTOMER;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsOptional()
  name?: string = 'User'; // name alanı zorunlu
}
