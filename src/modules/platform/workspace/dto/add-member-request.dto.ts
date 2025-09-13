import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddMemberRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  groupName: string;
}
