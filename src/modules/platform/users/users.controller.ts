import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserProvider } from './providers/user.provider';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserSession } from '../auth/models/user-session.model';
import { PaginatedResponseDto } from '../../../core/dto/paginated-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userProvider: UserProvider) {}

  @Post()
  @Public() // Allow public registration
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserRequestDto): Promise<UserResponseDto> {
    return await this.userProvider.createUser(createUserDto);
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() userSession: UserSession): Promise<CurrentUserResponseDto> {
    return await this.userProvider.getCurrentUser(userSession);
  }

  @Get()
  async getAllUsers(@Query() query: GetUsersQueryDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    return await this.userProvider.getUsersWithFiltersAndPagination(query);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return await this.userProvider.getUserById(id);
  }

  @Get(':id/exists')
  async checkUserExists(@Param('id', ParseUUIDPipe) id: string): Promise<{ exists: boolean }> {
    return await this.userProvider.checkUserExists(id);
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    return await this.userProvider.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return await this.userProvider.deleteUser(id);
  }
}
