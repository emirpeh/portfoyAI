import { IsString, IsOptional } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  externalId?: string;
}
