export interface AuthUser {
  id:              number;
  uuid:            string;
  name:            string;
  email:           string;
  status:          string;
  roles:           string[];
  permissions:     string[];
  emailVerifiedAt: string | null;
}

export interface LoginRequest {
  email:      string;
  password:   string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name:     string;
  email:    string;
  password: string;
  phone?:   string;
}

export interface AuthResponse {
  user:        AuthUser;
  accessToken: string;
  expiresIn:   number;
}

export interface AuthState {
  user:        AuthUser | null;
  accessToken: string | null;
  isLoading:   boolean;
  isLoggedIn:  boolean;
}
