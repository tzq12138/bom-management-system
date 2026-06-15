// BOM 相关类型定义

export interface Part {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  refDes: string;
  manufacturer: string;
  footprint: string;
  status: 'verified' | 'outdated' | 'missing' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface BOMVersion {
  id: string;
  version: string;
  description: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  isActive: boolean;
}

export interface BOMProject {
  id: string;
  projectId: string; // e.g., PRJ-8901
  name: string;
  category: string;
  subAssembly?: string;
  currentVersion: string;
  author: string;
  authorInitials: string;
  status: 'approved' | 'pending' | 'draft' | 'error' | 'archived';
  lastModified: string;
  parts: Part[];
  versions: BOMVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  count: number;
  children?: MaterialCategory[];
}

export interface Material {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string;
  category: string;
  inventory: number;
  status: 'preferred' | 'alternate' | 'eol';
  createdAt: string;
}

export interface TeamActivity {
  id: string;
  user: string;
  userAvatar?: string;
  action: string;
  target: string;
  detail: string;
  timestamp: string;
  type: 'edit' | 'confirm' | 'system';
}

export interface DashboardStats {
  totalProjects: number;
  activeVersions: number;
  pendingReviews: number;
  materialsCount: number;
}

export interface ValidationError {
  partId: string;
  partNumber: string;
  type: 'missing' | 'duplicate' | 'outdated' | 'invalid';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 页面路由
export type PageRoute = 'dashboard' | 'projects' | 'materials' | 'activity' | 'modules' | 'settings' | 'help' | 'login';

// ============ 用户与权限 ============

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  initials: string;
  createdAt: string;
}

export interface Permission {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  canManageUsers: boolean;
  canManageModules: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canApprove: true,
    canExport: true,
    canManageUsers: true,
    canManageModules: true,
  },
  editor: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canApprove: false,
    canExport: true,
    canManageUsers: false,
    canManageModules: true,
  },
  viewer: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canExport: false,
    canManageUsers: false,
    canManageModules: false,
  },
};

// ============ 模块管理类型 ============

// 模块中的零件（可设置默认品牌和替代品牌）
export interface ModulePart {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string; // 默认品牌
  alternates: Array<{ // 替代品牌列表
    manufacturer: string;
    partNumber?: string;
    notes?: string;
  }>;
  quantity: number;
  refDes?: string;
  footprint?: string;
}

// 子模块
export interface SubModule {
  id: string;
  name: string;
  description?: string;
  parts: ModulePart[];
  createdAt: string;
  updatedAt: string;
}

// 大模块
export interface Module {
  id: string;
  name: string;
  description?: string;
  icon?: string; // material icon 名称
  subModules: SubModule[];
  createdAt: string;
  updatedAt: string;
}
