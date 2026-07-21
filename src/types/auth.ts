export const AUTH_ROUTES = {
  signIn: "/auth/signin",
  signOut: "/auth/signout",
  error: "/auth/error",
  dashboard: "/dashboard",
  home: "/",
} as const;

export const PROTECTED_ROUTES = ["/dashboard"] as const;
export const AUTH_API_PREFIX = "/api/auth";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}
