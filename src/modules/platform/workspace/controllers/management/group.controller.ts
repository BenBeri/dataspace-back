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
} from '@nestjs/common';
import { GroupProvider } from '../../providers/group.provider';
import { CreateGroupDto } from '../../dto/create-group.dto';
import { UpdateGroupRequestDto } from '../../dto/update-group-request.dto';
import { GroupResponseDto } from '../../dto/group-response.dto';

@Controller('workspaces/:workspaceId/groups')
export class GroupController {
  constructor(private readonly groupProvider: GroupProvider) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    return await this.groupProvider.createGroup(workspaceId, createGroupDto);
  }

  @Get()
  async getWorkspaceGroups(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
  ): Promise<GroupResponseDto[]> {
    return await this.groupProvider.getWorkspaceGroups(workspaceId);
  }

  @Get(':id')
  async getGroupById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupResponseDto> {
    return await this.groupProvider.getGroupById(id);
  }

  @Patch(':id')
  async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGroupDto: UpdateGroupRequestDto,
  ): Promise<GroupResponseDto> {
    // Implementation depends on what UpdateGroupRequestDto contains
    // This would need to be implemented based on your specific requirements
    throw new Error('Method not implemented yet');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    // Implementation would need current user ID for authorization
    // This would need to be implemented based on your auth system
    throw new Error('Method not implemented yet');
  }
}
