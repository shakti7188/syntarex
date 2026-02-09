import type { User, Session } from "@supabase/supabase-js";

/**
 * Application user type with role information
 */
export type AppUser = {
  id: string;
  email: string | undefined;
  role: "user" | "admin" | "super_admin";
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

/**
 * Check if a user has super admin role
 */
export function isSuperAdmin(user: AppUser | null | undefined): boolean {
  return !!user && user.role === "super_admin" && user.isSuperAdmin === true;
}

/**
 * Check if a user has admin role (includes super_admin)
 * This is the single source of truth for admin checks
 */
export function isAdmin(user: AppUser | null | undefined): boolean {
  return !!user && (user.role === "admin" || user.role === "super_admin") && user.isAdmin === true;
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: AppUser | null | undefined, role: "user" | "admin" | "super_admin"): boolean {
  return !!user && user.role === role;
}

/**
 * Convert Supabase user + role info to AppUser
 */
export function toAppUser(
  user: User | null,
  userRole: string | null,
  isAdminFlag: boolean,
  isSuperAdminFlag: boolean = false
): AppUser | null {
  if (!user) return null;

  const role = userRole === "super_admin" ? "super_admin" : userRole === "admin" ? "admin" : "user";

  return {
    id: user.id,
    email: user.email,
    role,
    isAdmin: isAdminFlag,
    isSuperAdmin: isSuperAdminFlag,
  };
}
