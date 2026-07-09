// ============================================================
// Auth Types — mirrors backend API contracts
// ============================================================

export type UserRole = "admin" | "staff" | "user" | "creator";

export interface ApiRoleRef {
  _id: string;
  roleName?: string;
  name?: string;
}

export interface ApiUserProfile {

  _id?: string;
  userId?: string;
  username: string;
  email: string;
  phone?: string;
  fullName: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  address?: string;
  status?: "ACTIVE" | "INACTIVE" | "LOCKED";
  roleId: ApiRoleRef | string;
  avatar?: string | { url: string; publicId: string };
  createdAt?: string;
  updatedAt?: string;
  enrolled?: string[];
}

export interface User {
  id: string;
  userId: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  address: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  roleId: UserRole;
  status?: "ACTIVE" | "INACTIVE" | "LOCKED";
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  enrolled?: string[];
}

export interface AuthTokens { accessToken: string; refreshToken: string; }

export interface DecodedToken {
  userId: string; roleName: string; roleId: string; fullName: string; deviceId?: string; jti?: string; exp: number; iat?: number;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  email: string;
}

export interface ForgotPasswordResetRequest {
  uuid: string;
  newPassword: string;
}

export interface MessageResponseData {
  message?: string;
}

export interface LoginResponseData {
  accessToken: string; refreshToken: string; subscription?: string;
  user?: { userId: string; fullName: string; email: string; username: string };
}

export interface RegisterResponseData {
  userId: string; username: string; email: string; subscription: string;
}

export function mapRoleNameToUserRole(roleName: string): UserRole {
  const map: Record<string, UserRole> = { Admin: "admin", Staff: "staff", User: "user", Customer: "user", Creator: "creator" };
  return map[roleName] || "user";
}

export function normalizeApiUserProfile(profile: ApiUserProfile): User {
  const roleName =
    typeof profile.roleId === "string"
      ? profile.roleId
      : profile.roleId.roleName || profile.roleId.name || "User";
  const avatar =
    typeof profile.avatar === "object" ? profile.avatar.url : profile.avatar;

  const userId = profile.userId || profile._id || "";

  return {

    id: userId,
    userId,
    email: profile.email,
    username: profile.username,
    fullName: profile.fullName,
    phone: profile.phone || "",
    address: profile.address || "",
    gender: profile.gender || "OTHER",
    dateOfBirth: profile.dateOfBirth || "",
    roleId: mapRoleNameToUserRole(roleName),
    status: profile.status,
    avatar,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    enrolled: profile.enrolled || [],
  };
}

// ---- Request DTOs ----
export interface LoginRequest { username?: string; email?: string; password: string; }

export interface RegisterRequest {
  username: string; email: string; password: string; fullName: string; phone: string;
  address?: string; gender?: "MALE" | "FEMALE" | "OTHER"; dateOfBirth?: string;
}

// ---- Response DTOs ----
export interface ApiResponse<T> { status: "success" | "error"; data: T; message?: string; }
export interface ApiErrorResponse { status: "error"; message: string; errors?: Record<string, string[]>; }

// ---- Auth Store State ----
export interface AuthState {
  user: User | null; accessToken: string | null; refreshToken: string | null;
  isAuthenticated: boolean; isLoading: boolean;
  initialize: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<string>;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
}