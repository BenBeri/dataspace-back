import { IsString, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';

export class UpdateRepositoryRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'repositoryNameKey can only contain lowercase letters, numbers, and single dashes (not at start/end)'
  })
  repositoryNameKey?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
