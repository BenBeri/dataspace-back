import { Group } from '../../entities/workspace/group.entity';
import { GroupResponseDto } from '../dto/group-response.dto';

export class GroupTransformer {
  static toResponseDto(group: Group): GroupResponseDto {
    const responseDto = new GroupResponseDto();
    responseDto.id = group.id;
    responseDto.name = group.name;
    responseDto.permissions = group.permissions;
    responseDto.createdAt = group.createdAt;
    responseDto.updatedAt = group.updatedAt;
    return responseDto;
  }

  static toResponseDtoArray(groups: Group[]): GroupResponseDto[] {
    return groups.map((group) => this.toResponseDto(group));
  }
}
