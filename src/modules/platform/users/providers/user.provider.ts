import { Injectable } from '@nestjs/common';
import { UsersService } from '../users.service';
import { UserTransformer } from '../transformers/user.transformer';
import { CreateUserRequestDto } from '../dto/create-user-request.dto';
import { UpdateUserRequestDto } from '../dto/update-user-request.dto';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { CurrentUserResponseDto } from '../dto/current-user-response.dto';
import { UserSession } from '../../auth/models/user-session.model';
import { PaginatedResponseDto } from '../../../../core/dto/paginated-response.dto';

@Injectable()
export class UserProvider {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  async createUser(createUserDto: CreateUserRequestDto): Promise<UserResponseDto> {
    const user = await this.usersService.createUser(createUserDto);
    return UserTransformer.toResponseDto(user);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersService.getAllUsers();
    return UserTransformer.toResponseDtoArray(users);
  }

  async getUsersWithFiltersAndPagination(query: GetUsersQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { users, total } = await this.usersService.getUsersWithFiltersAndPagination(query);
    const userDtos = UserTransformer.toResponseDtoArray(users);
    
    return new PaginatedResponseDto(
      userDtos,
      query.offset || 0,
      query.limit || 10,
      total
    );
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.usersService.getUserById(id);
    return UserTransformer.toResponseDto(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserRequestDto): Promise<UserResponseDto> {
    const user = await this.usersService.updateUser(id, updateUserDto);
    return UserTransformer.toResponseDto(user);
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    await this.usersService.deleteUser(id);
    return { message: 'User successfully deleted' };
  }

  async checkUserExists(id: string): Promise<{ exists: boolean }> {
    const exists = await this.usersService.userExists(id);
    return { exists };
  }

  async getCurrentUser(userSession: UserSession): Promise<CurrentUserResponseDto> {
    return UserTransformer.toCurrentUserResponseDto(userSession);
  }
}
