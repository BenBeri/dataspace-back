import { IsObject, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class RepositoryPermissionsDto {
  @IsBoolean()
  read: boolean;

  @IsBoolean()
  write: boolean;

  @IsBoolean()
  delete: boolean;
}

export class UpdatePrivateRepositoryPermissionsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => RepositoryPermissionsDto)
  permissions: RepositoryPermissionsDto;
}
