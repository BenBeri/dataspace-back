import {
  WorkspacePermissions,
  PartialWorkspacePermissions,
} from '../../auth/interfaces/workspace-permissions.interface';

export class PermissionMergeHelper {
  /**
   * Deep merges permissions according to the rules:
   * - Only override primitive values (boolean, string, number, array)
   * - Objects are traversed recursively, not replaced wholesale
   *
   * Example:
   * Group has: { repository: { public: { read: true, write: true, delete: false } } }
   * User override has: { repository: { public: { delete: true } } }
   * Result: { repository: { public: { read: true, write: true, delete: true } } }
   */
  static deepMergePermissions(
    groupPermissions: WorkspacePermissions,
    userOverrides?: PartialWorkspacePermissions | null,
  ): WorkspacePermissions {
    if (!userOverrides) {
      return groupPermissions;
    }

    return this.deepMerge(
      groupPermissions,
      userOverrides,
    ) as WorkspacePermissions;
  }

  private static deepMerge(base: any, override: any): any {
    // If override is null/undefined, return base
    if (override === null || override === undefined) {
      return base;
    }

    // If override is a primitive or array, replace the base value
    if (this.isPrimitive(override) || Array.isArray(override)) {
      return override;
    }

    // If base is not an object, return override
    if (typeof base !== 'object' || base === null || Array.isArray(base)) {
      return override;
    }

    // Both are objects, merge recursively
    const result: any = { ...base };

    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        const overrideValue = override[key];
        const baseValue = base[key];

        // Only merge if override value is defined
        if (overrideValue !== undefined) {
          result[key] = this.deepMerge(baseValue, overrideValue);
        }
      }
    }

    return result;
  }

  private static isPrimitive(value: any): boolean {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    );
  }
}
