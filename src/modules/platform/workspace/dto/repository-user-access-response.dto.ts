export interface RepositoryAccessPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export class RepositoryUserAccessDto {
  userId: string;
  username: string;
  email: string;
  groupName: string;
  accessSource: 'group' | 'user-override' | 'both';
  permissions: RepositoryAccessPermissions;
}

export class RepositoryUserAccessResponseDto {
  repositoryId: string;
  repositoryName: string;
  isPrivate: boolean;
  usersWithAccess: RepositoryUserAccessDto[];
}
