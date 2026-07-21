import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  FileCheck2,
  GitBranch,
  Key,
  Lock,
  ScanSearch,
  Shield,
  UserX,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const detects = [
  {
    icon: Key,
    title: "Exposed Secrets",
    description:
      "Catches hardcoded service_role, sk_live, AWS, and API keys shipped in client bundles",
  },
  {
    icon: Shield,
    title: "Missing Row-Level Security",
    description:
      "Flags Supabase tables with USING(true) or no RLS policies at all",
  },
  {
    icon: Lock,
    title: "Unauthenticated Routes",
    description:
      "Detects API handlers that skip auth — the #1 cause of BOLA/IDOR",
  },
  {
    icon: CreditCard,
    title: "Unverified Webhooks",
    description:
      "Finds payment webhook handlers without signature verification",
  },
  {
    icon: UserX,
    title: "Client-Writable Fields",
    description:
      "Spots client code that writes to role, subscription, or admin fields",
  },
] as const;

const steps = [
  {
    icon: GitBranch,
    title: "Connect",
    description: "Link your GitHub repo with one click",
  },
  {
    icon: ScanSearch,
    title: "Scan",
    description: "We read your code and run 5 security checks",
  },
  {
    icon: FileCheck2,
    title: "Fix",
    description: "Get plain-English findings with copy-paste fix prompts",
  },
] as const;

const scoreRanges = [
  {
    range: "80-100",
    verdict: "Ship it",
    description: "No critical issues found",
    className:
      "border-green-200 bg-green-50 text-green-950 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100",
    badgeClassName: "bg-green-600 text-white dark:bg-green-500",
  },
  {
    range: "50-79",
    verdict: "Fix first",
    description: "Some issues need attention",
    className:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    badgeClassName: "bg-amber-500 text-white dark:bg-amber-400",
  },
  {
    range: "0-49",
    verdict: "Do not ship",
    description: "Critical vulnerabilities detected",
    className:
      "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
    badgeClassName: "bg-red-600 text-white dark:bg-red-500",
  },
] as const;

export default async function HomePage() {
  const session = await auth();
  const isSignedIn = !!session?.user;

  return (
    <div className="box-grid-corner flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center sm:py-32">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            SafeSetu
          </h1>
          <p className="mt-6 text-xl text-foreground/80 sm:text-2xl">
            One-click security scanner for AI-built apps
          </p>
          <p className="mt-3 text-base text-muted-foreground">
            Ship only when it&apos;s safe.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Go to Dashboard
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            )}
            <Link
              href="#detects"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              See what we detect
            </Link>
          </div>
        </section>

        {/* What it detects */}
        <section id="detects" className="border-t border-border/50 bg-white/[0.02] py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              5 security checks your AI coding tool missed
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {detects.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="repo-tile rounded-xl border border-border/50 bg-card p-6"
                >
                  <div className="relative z-10">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-white/5">
                      <Icon className="size-5 text-foreground/70" />
                    </div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Three steps to ship safely
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map(({ icon: Icon, title, description }, index) => (
                <div key={title} className="flex flex-col items-center text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {index + 1}
                  </div>
                  <div className="mt-4 flex size-12 items-center justify-center rounded-lg bg-white/5">
                    <Icon className="size-6 text-foreground/70" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Score */}
        <section className="border-t border-border/50 bg-white/[0.02] py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Your ship-or-don&apos;t verdict
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {scoreRanges.map(
                ({ range, verdict, description, className, badgeClassName }) => (
                  <div
                    key={range}
                    className={cn(
                      "flex flex-col items-center rounded-xl border p-8 text-center",
                      className,
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-semibold",
                        badgeClassName,
                      )}
                    >
                      {range}
                    </span>
                    <p className="mt-4 text-xl font-bold">{verdict}</p>
                    <p className="mt-2 text-sm opacity-80">{description}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-sm text-foreground/70">
            Built for builders shipping from Cursor, Lovable, Bolt, v0, and
            Replit.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            SafeSetu &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
