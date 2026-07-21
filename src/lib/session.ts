import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AUTH_ROUTES } from "@/types/auth";
import type { SessionUser } from "@/types/auth";

export async function getSession() {
  return auth();
}

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect(AUTH_ROUTES.signIn);
  }
  return session.user as SessionUser;
}
