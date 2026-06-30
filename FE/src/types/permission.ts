// ============================================================
// Permission Types — matches backend API contracts
// ============================================================

export interface Permission {
  _id: string;
  name: string;
  resource: string;  // User, Role, Permission, Kit, Course, Lesson, Product, Video, Category, DIYPost, Order, Log, Mail
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionsListResponse {
  permissions: Permission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PermissionStatistics {
  totalPermissions: number;
  byResource: { resource: string; count: number }[];
  byAction: { action: string; count: number }[];
}

export interface CreatePermissionRequest {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}