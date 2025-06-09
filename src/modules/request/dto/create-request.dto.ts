import { IsString, IsEmail, IsEnum, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { CustomerType } from '../../customer/customer.service';

export class CreateRequestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsEnum(CustomerType)
    @IsNotEmpty()
    requestType: CustomerType;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(500)
    message: string;
} 