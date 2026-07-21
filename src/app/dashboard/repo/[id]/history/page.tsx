import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getScanHistory } from "@/app/dashboard/actions";
import { ScanButton } from "@/app/dashboard/scan-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDuration,
  formatScanDate,
  getScoreDisplay,
} from "@/lib/scan-utils";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-600 text-white hover:bg-green-600/90">Completed</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "scanning":
    case "pending":
      return <Badge variant="secondary">In progress</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function ScoreTrend({ scores }: { scores: number[] }) {
  if (scores.length === 0) return null;

  return (
    <div className="flex h-12 items-end gap-1.5">
      {scores.map((score, i) => {
        const height = Math.max(4, (score / 100) * 40);
        const color =
          score >= 80
            ? "bg-green-500"
            : score >= 50
              ? "bg-amber-500"
              : "bg-red-500";
        return (
          <div
            key={i}
            className={cn("w-2.5 rounded-t-sm", color)}
            style={{ height: `${height}px` }}
            title={`Score: ${score}`}
          />
        );
      })}
    </div>
  );
}

export default async function ScanHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const repo = await prisma.repo.findFirst({
    where: { id, userId: user.id },
  });

  if (!repo) {
    notFound();
  }

  const scans = await getScanHistory(repo.id);

  const trendScores = scans
    .filter((scan) => scan.status === "completed" && scan.score !== null)
    .map((scan) => scan.score as number)
    .reverse()
    .slice(-10);

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
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{repo.fullName}</p>
            <h1 className="text-2xl font-bold tracking-tight">Scan History</h1>
          </div>
          <ScanButton repoId={repo.id} />
        </div>

        {trendScores.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-2 py-4">
              <p className="text-sm font-medium text-muted-foreground">
                Score trend
              </p>
              <ScoreTrend scores={trendScores} />
            </CardContent>
          </Card>
        )}

        {scans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No scans yet. Run your first scan.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map((scan) => {
                    const scoreInfo =
                      scan.score !== null ? getScoreDisplay(scan.score) : null;
                    const duration = formatDuration(
                      scan.startedAt,
                      scan.completedAt,
                    );

                    return (
                      <TableRow key={scan.id}>
                        <TableCell>{formatScanDate(scan.createdAt)}</TableCell>
                        <TableCell>
                          {scoreInfo ? (
                            <Badge
                              variant="outline"
                              className={scoreInfo.className}
                            >
                              {scan.score}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{scan._count.findings}</TableCell>
                        <TableCell>{duration ?? "—"}</TableCell>
                        <TableCell>{statusBadge(scan.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/scan/${scan.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
