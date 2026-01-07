/**
 * User utility functions
 */

export interface UserWithRoles {
  role?: string;
  roles?: Array<{ name: string } | string>;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: UserWithRoles | null | undefined, roleName: string): boolean {
  if (!user) return false;

  // Check single role property
  if (user.role === roleName) {
    return true;
  }

  // Check roles array
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some((role) => {
      if (typeof role === 'string') {
        return role === roleName;
      }
      if (typeof role === 'object' && role !== null) {
        return (role as any).name === roleName;
      }
      return false;
    });
  }

  return false;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: UserWithRoles | null | undefined): boolean {
  return hasRole(user, 'admin');
}

/**
 * Get user's primary role
 */
export function getUserRole(user: UserWithRoles | null | undefined): string | null {
  if (!user) return null;

  // Check single role property
  if (user.role) {
    return user.role;
  }

  // Get first role from roles array
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0];
    if (typeof firstRole === 'string') {
      return firstRole;
    }
    if (typeof firstRole === 'object' && firstRole !== null) {
      return (firstRole as any).name || null;
    }
  }

  return null;
}

