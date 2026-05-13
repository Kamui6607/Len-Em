// ============================================================
// Auth Types — mirrors backend API contracts
// ============================================================

/** User roles supported by the platform */
export type UserRole = "admin" | "staff" | "customer";

/** User profile returned from backend after login/profile fetch */
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  address: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  roleId: UserRole;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** JWT token pair returned on login/register/refresh */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ---- API Request DTOs ----

export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  roleId: UserRole;
}

// ---- API Response DTOs ----

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}

// ---- Auth Store State ----

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  initialize: () => Promise<void>;
}