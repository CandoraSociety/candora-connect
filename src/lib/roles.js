// Role hierarchy: admin > manager > staff
export const ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

const ROLE_RANK = { staff: 1, manager: 2, admin: 3 };

// Returns true if userRole meets the minimum required role
export const hasRole = (userRole, requiredRole) => {
  const userRank = ROLE_RANK[userRole] ?? 0;
  const requiredRank = ROLE_RANK[requiredRole] ?? 99;
  return userRank >= requiredRank;
};

// What each role can access
export const ROUTE_PERMISSIONS = {
  '/': ROLES.MANAGER,
  '/menu': ROLES.STAFF,
  '/orders': ROLES.MANAGER,
  '/inventory': ROLES.MANAGER,
  '/recipes': ROLES.STAFF,
  '/catering': ROLES.ADMIN,
  '/customers': ROLES.ADMIN,
};

export const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};