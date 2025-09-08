import { User } from '../../entities/user/user.entity';
import { CreateUserRequestDto } from '../dto/create-user-request.dto';
import { UpdateUserRequestDto } from '../dto/update-user-request.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { CurrentUserResponseDto } from '../dto/current-user-response.dto';
import { UserSession } from '../../auth/models/user-session.model';

export class UserTransformer {
  static toResponseDto(user: User): UserResponseDto {
    const responseDto = new UserResponseDto();
    responseDto.id = user.id;
    responseDto.email = user.email;
    responseDto.firstName = user.firstName;
    responseDto.lastName = user.lastName;
    responseDto.isActive = user.isActive;
    responseDto.createdAt = user.createdAt;
    responseDto.updatedAt = user.updatedAt;
    return responseDto;
  }

  static toResponseDtoArray(users: User[]): UserResponseDto[] {
    return users.map(user => this.toResponseDto(user));
  }

  static createRequestDtoToEntity(dto: CreateUserRequestDto, salt: string): Partial<User> {
    return {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      salt,
      isActive: dto.isActive ?? true,
    };
  }

  static updateRequestDtoToEntity(dto: UpdateUserRequestDto): Partial<User> {
    const entityData: Partial<User> = {};
    
    if (dto.email !== undefined) entityData.email = dto.email;
    if (dto.firstName !== undefined) entityData.firstName = dto.firstName;
    if (dto.lastName !== undefined) entityData.lastName = dto.lastName;
    if (dto.isActive !== undefined) entityData.isActive = dto.isActive;
    
    return entityData;
  }

  static toCurrentUserResponseDto(userSession: UserSession): CurrentUserResponseDto {
    const responseDto = new CurrentUserResponseDto();
    responseDto.id = userSession.userId;
    responseDto.email = userSession.email;
    responseDto.firstName = userSession.firstName;
    responseDto.lastName = userSession.lastName;
    responseDto.isActive = userSession.isActive;
    return responseDto;
  }
}
