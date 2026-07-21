import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FindingCard } from "@/app/scan/[id]/finding-card";
import { cn } from "@/lib/utils";
import {
  sortFindingsBySeverity,
  countBySeverity,
  formatScanDate,
  formatDuration,
  getScoreDisplay,
} from "@/lib/scan-utils";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const scan = await prisma.scan.findFirst({
    where: { id, userId: user.id },
    include: {
      findings: true,
      repo: true,
    },
  });

  if (!scan) {
    notFound();
  }

  if (scan.status === "scanning" || scan.status === "pending") {
    return (
      <>
        <meta httpEquiv="refresh" content="5" />
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Link
            href="/dashboard"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <Loader2 className="size-10 animate-spin text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Scan in progress...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Scanning {scan.repo.fullName}. This page auto-refreshes every
                  5 seconds.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (scan.status === "failed") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <div>
              <p className="text-lg font-medium">Scan failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Something went wrong while scanning {scan.repo.fullName}. Try
                running the scan again from the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedFindings = sortFindingsBySeverity(scan.findings);
  const severityCounts = countBySeverity(sortedFindings);
  const displayScore =
    sortedFindings.length === 0 ? 100 : (scan.score ?? 0);
  const scoreInfo = getScoreDisplay(displayScore);
  const scanDate = scan.completedAt ?? scan.createdAt;
  const duration = formatDuration(scan.startedAt, scan.completedAt);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Scan results</h1>
            <a
              href={scan.repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
            >
              {scan.repo.fullName}
              <ExternalLink className="size-3.5" />
            </a>
            <p className="text-sm text-muted-foreground">
              {formatScanDate(scanDate)}
              {duration && (
                <span className="text-muted-foreground/80">
                  {" "}
                  · completed in {duration}
                </span>
              )}
            </p>
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-col items-center justify-center rounded-full px-8 py-6",
              scoreInfo.className,
            )}
          >
            <span className="text-4xl font-bold tabular-nums">
              {displayScore}
            </span>
            <span className="mt-1 text-sm font-medium">{scoreInfo.verdict}</span>
          </div>
        </div>

        {sortedFindings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <ShieldCheck className="size-10 text-green-600" />
              <p className="text-lg font-medium">
                No security issues found! Score: 100
              </p>
              <p className="text-sm text-muted-foreground">
                {scan.repo.fullName} passed all security checks.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Finding summary</CardTitle>
                <CardDescription>
                  {severityCounts.critical} critical, {severityCounts.high}{" "}
                  high, {severityCounts.medium} medium, {severityCounts.low} low
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {severityCounts.critical > 0 && (
                  <Badge
                    variant="outline"
                    className="border-red-200 bg-red-100 text-red-700"
                  >
                    {severityCounts.critical} critical
                  </Badge>
                )}
                {severityCounts.high > 0 && (
                  <Badge
                    variant="outline"
                    className="border-orange-200 bg-orange-100 text-orange-700"
                  >
                    {severityCounts.high} high
                  </Badge>
                )}
                {severityCounts.medium > 0 && (
                  <Badge
                    variant="outline"
                    className="border-yellow-200 bg-yellow-100 text-yellow-700"
                  >
                    {severityCounts.medium} medium
                  </Badge>
                )}
                {severityCounts.low > 0 && (
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-100 text-blue-700"
                  >
                    {severityCounts.low} low
                  </Badge>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">
                Findings ({sortedFindings.length})
              </h2>
              {sortedFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  repoUrl={scan.repo.url}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
