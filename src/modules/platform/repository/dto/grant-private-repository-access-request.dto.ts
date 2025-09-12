import {
  IsString,
  IsObject,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RepositoryPermissionsDto {
  @IsBoolean()
  read: boolean;

  @IsBoolean()
  write: boolean;

  @IsBoolean()
  delete: boolean;
}

export class GrantPrivateRepositoryAccessDto {
  @IsString()
  userId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => RepositoryPermissionsDto)
  permissions: RepositoryPermissionsDto;

  @IsOptional()
  @IsEnum(['invited', 'owner', 'admin'])
  accessReason?: 'invited' | 'owner' | 'admin';
}
