export class RepositoryPermissionsResponseDto {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export class PrivateRepositoryAccessResponseDto {
  id: string;
  userId: string;
  repositoryId: string;
  permissions: RepositoryPermissionsResponseDto;
  accessReason: 'invited' | 'owner' | 'admin';
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  repository?: {
    id: string;
    name: string;
    description: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
