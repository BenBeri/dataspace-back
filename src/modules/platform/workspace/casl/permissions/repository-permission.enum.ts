/**
 * Repository specific permissions
 */
export enum RepositoryPermission {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  
  // Custom repository actions (add as needed)
  // CLONE = 'clone',
  // FORK = 'fork',
  // PUSH = 'push',
  // PULL = 'pull',
}
