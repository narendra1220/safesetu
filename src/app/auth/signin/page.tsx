import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "./signin-form";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">SafeSetu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Security scanning for modern apps
        </p>
      </div>
      <SignInForm />
    </main>
  );
}
