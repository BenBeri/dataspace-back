import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateDataSourceRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}
