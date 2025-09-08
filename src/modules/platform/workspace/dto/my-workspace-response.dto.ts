export class MyWorkspaceResponseDto {
  workspaceId: string;
  nameKey: string;
  ownerUserId: string;
  role: {
    name: string;
    permissions: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

