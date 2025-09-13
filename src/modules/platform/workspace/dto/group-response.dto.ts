export class GroupResponseDto {
  id: string;
  name: string;
  permissions: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
