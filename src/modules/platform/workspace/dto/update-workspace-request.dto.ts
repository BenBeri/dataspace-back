import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkspaceRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
