import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateRoleRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  permissions: Record<string, any>;
}
