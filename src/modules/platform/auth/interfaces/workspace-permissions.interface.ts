export interface RepositoryPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
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
    read: boolean; // Public repositories only
    write: boolean; // Public repositories only
    delete: boolean; // Public repositories only
  };
}

/**
 * Missions:
 */
// 1. users permission should be stronger than all permission. if there is no users permission, then its undefined and we take from the other roles.
// 2. how to fetch all the users that connect to repo ( table users_repositories maybe?)
