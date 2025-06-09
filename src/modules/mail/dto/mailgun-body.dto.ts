import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class MailgunBodyDto {
    @IsString()
    @IsNotEmpty()
    sender: string;

    @IsString()
    @IsNotEmpty()
    from: string;

    @IsString()
    @IsNotEmpty()
    recipient: string;

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsNotEmpty()
    'body-plain': string;

    @IsNumber()
    @IsNotEmpty()
    timestamp: number;

    @IsString()
    @IsOptional()
    'Message-Id'?: string;
} 