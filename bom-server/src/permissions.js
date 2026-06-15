export const ROLE_PERMISSIONS = {
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canApprove: true,
    canExport: true,
    canManageUsers: true,
    canManageModules: true
  },
  editor: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canApprove: false,
    canExport: true,
    canManageUsers: false,
    canManageModules: true
  },
  viewer: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canExport: false,
    canManageUsers: false,
    canManageModules: false
  }
};

export function hasPermission(actor, permission) {
  if (!actor) {
    return false;
  }

  return Boolean(ROLE_PERMISSIONS[actor.role]?.[permission]);
}

export function getActorName(actor) {
  return actor?.displayName || actor?.username || "System";
}
