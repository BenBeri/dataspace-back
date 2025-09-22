import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateDataSourceRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  configuration: Record<string, any>;
}
