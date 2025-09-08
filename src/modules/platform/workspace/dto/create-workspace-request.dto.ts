import { IsNotEmpty, IsString, MaxLength, Matches, IsOptional } from 'class-validator';

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
}
