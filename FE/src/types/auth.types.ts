// ============================================================
// Auth Types — mirrors backend API contracts
// ============================================================

export type UserRole = "admin" | "staff" | "user";

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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Decoded JWT payload — must match what the backend signs */
export interface DecodedToken {
  userId: string;
  role: UserRole;
  exp: number;
  iat?: number;
}

// ---- Request DTOs ----

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

// ---- Response DTOs ----

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

  initialize: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
}