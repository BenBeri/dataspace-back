/**
 * User management specific permissions
 */
export enum UserPermission {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  
  // Custom user actions (add as needed)
  // CHANGE_PASSWORD = 'change-password',
  // RESET_PASSWORD = 'reset-password',
}
