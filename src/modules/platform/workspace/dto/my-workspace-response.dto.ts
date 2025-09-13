export class MyWorkspaceResponseDto {
  workspaceId: string;
  nameKey: string;
  ownerUserId: string;
  group: {
    name: string;
    permissions: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
  logoUrl?: string | null;
}
