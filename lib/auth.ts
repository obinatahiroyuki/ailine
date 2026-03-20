import type { Session } from "next-auth";

export const ROLE_SYSTEM_ADMIN = "system_admin";
export const ROLE_CONTENT_ADMIN = "content_admin";

export function isSystemAdmin(session: Session | null): boolean {
  return !!session?.user?.roles?.includes(ROLE_SYSTEM_ADMIN);
}
