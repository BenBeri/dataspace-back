export interface RepositoryPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface PrivateRepositoryPermissions {
  repositoryKey: string;
  permissions: RepositoryPermissions;
}

export interface WorkspacePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  users: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  repository: {
    read: boolean;
    write: boolean;
    delete: boolean;
    privateRepositories: PrivateRepositoryPermissions[];
  };
}
