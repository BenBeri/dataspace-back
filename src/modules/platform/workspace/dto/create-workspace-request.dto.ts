import { IsNotEmpty, IsString, MaxLength, Matches, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRoleDto } from './create-role.dto';

export class CreateWorkspaceRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'name_key can only contain lowercase letters, numbers, and single dashes (not at start/end)'
  })
  name_key?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoleDto)
  roles?: CreateRoleDto[];
}
