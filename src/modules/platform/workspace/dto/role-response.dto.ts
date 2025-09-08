export class RoleResponseDto {
  id: string;
  name: string;
  permissions: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
