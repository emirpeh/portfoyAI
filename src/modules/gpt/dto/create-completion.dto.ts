import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCompletionDto {
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;
} 