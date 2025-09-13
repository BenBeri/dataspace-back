export interface RepositoryPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface WorkspacePermissions {
  // Workspace-level permissions
  read: boolean;
  write: boolean;
  delete: boolean;

  // Member management permissions (renamed from 'users')
  membersManagement: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };

  // Repository permissions
  repository: {
    // Permissions for all public repositories
    public: RepositoryPermissions;

    // Permissions for specific private repositories by ID
    private: {
      [repositoryId: string]: RepositoryPermissions;
    };
  };
}

// Type for partial permissions (used for user overrides in WorkspaceMember)
export type PartialWorkspacePermissions = {
  read?: boolean;
  write?: boolean;
  delete?: boolean;
  membersManagement?: {
    read?: boolean;
    write?: boolean;
    delete?: boolean;
  };
  repository?: {
    public?: {
      read?: boolean;
      write?: boolean;
      delete?: boolean;
    };
    private?: {
      [repositoryId: string]: {
        read?: boolean;
        write?: boolean;
        delete?: boolean;
      };
    };
  };
};
