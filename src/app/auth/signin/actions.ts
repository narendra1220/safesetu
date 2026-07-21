"use server";

import { signIn } from "@/lib/auth";

export async function signInWithGithub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  await signIn("nodemailer", { email, redirectTo: "/dashboard" });
}
