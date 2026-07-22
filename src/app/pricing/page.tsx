import Link from "next/link";
import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For side projects and experimentation",
    features: [
      "5 scans per month",
      "Public repositories",
      "11 security rules",
      "Fix prompts included",
      "Score verdicts",
    ],
    cta: "Get Started",
    href: "/auth/signin",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For builders shipping to production",
    features: [
      "Unlimited scans",
      "Public + private repos",
      "All security rules",
      "Priority LLM analysis",
      "Scan history + trends",
      "Email notifications",
      "Export reports",
    ],
    cta: "Coming Soon",
    href: "#",
    highlighted: true,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free. Upgrade when you ship to production.
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "flex flex-col rounded-xl border p-8",
              tier.highlighted
                ? "border-primary bg-primary/5"
                : "border-border",
            )}
          >
            <h2 className="text-xl font-bold">{tier.name}</h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold tabular-nums">
                {tier.price}
              </span>
              <span className="text-sm text-muted-foreground">
                {tier.period}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {tier.description}
            </p>

            <ul className="mt-8 flex flex-col gap-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              {tier.href === "#" ? (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full cursor-not-allowed opacity-60",
                  )}
                >
                  {tier.cta}
                </span>
              ) : (
                <Link
                  href={tier.href}
                  className={cn(
                    buttonVariants({
                      variant: tier.highlighted ? "default" : "outline",
                      size: "lg",
                    }),
                    "w-full gap-2",
                  )}
                >
                  {tier.cta}
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
