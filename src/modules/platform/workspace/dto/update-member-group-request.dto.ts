import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMemberGroupRequestDto {
  @IsString()
  @IsNotEmpty()
  groupName: string;
}
