import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateWorkspaceRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

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
}
