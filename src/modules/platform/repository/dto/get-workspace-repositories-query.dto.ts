import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../../core/dto/pagination.dto';

export class GetWorkspaceRepositoriesQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
