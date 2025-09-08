import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateRoleRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;
}
