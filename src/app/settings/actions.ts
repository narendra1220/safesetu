"use server";

import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function deleteAccount(): Promise<{ error?: string } | void> {
  const user = await requireUser();
  try {
    await prisma.user.delete({ where: { id: user.id } });
    await signOut({ redirectTo: "/" });
  } catch {
    return { error: "Failed to delete account. Please try again." };
  }
}
