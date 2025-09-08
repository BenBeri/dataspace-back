import { Role } from '../../entities/workspace/role.entity';
import { RoleResponseDto } from '../dto/role-response.dto';

export class RoleTransformer {
  static toResponseDto(role: Role): RoleResponseDto {
    const responseDto = new RoleResponseDto();
    responseDto.id = role.id;
    responseDto.name = role.name;
    responseDto.permissions = role.permissions;
    responseDto.createdAt = role.createdAt;
    responseDto.updatedAt = role.updatedAt;
    return responseDto;
  }

  static toResponseDtoArray(roles: Role[]): RoleResponseDto[] {
    return roles.map(role => this.toResponseDto(role));
  }
}
