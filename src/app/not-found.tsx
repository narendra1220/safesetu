import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold tabular-nums">404</p>
      <p className="mt-4 text-lg text-muted-foreground">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "outline" }), "mt-8 gap-2")}
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
    </div>
  );
}
