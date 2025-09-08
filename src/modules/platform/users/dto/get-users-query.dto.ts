import { IsOptional, IsBoolean, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../../core/dto/pagination.dto';

export class GetUsersQueryDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'Email filter must be a string' })
  @Transform(({ value }) => value?.trim())
  email?: string;

  @IsOptional()
  @IsString({ message: 'First name filter must be a string' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name filter must be a string' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive filter must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'createdAfter must be a valid date string' })
  createdAfter?: string;

  @IsOptional()
  @IsDateString({}, { message: 'createdBefore must be a valid date string' })
  createdBefore?: string;

  @IsOptional()
  @IsDateString({}, { message: 'updatedAfter must be a valid date string' })
  updatedAfter?: string;

  @IsOptional()
  @IsDateString({}, { message: 'updatedBefore must be a valid date string' })
  updatedBefore?: string;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }) => value?.trim())
  search?: string; // For searching across multiple fields (email, firstName, lastName)
}
