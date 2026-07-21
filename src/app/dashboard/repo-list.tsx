import Link from "next/link";
import { disconnectRepo } from "@/app/dashboard/actions";
import { ScanButton } from "@/app/dashboard/scan-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, History, GitBranch } from "lucide-react";

interface RepoListProps {
  repos: Array<{
    id: string;
    name: string;
    fullName: string;
    url: string;
    provider: string;
    connectedAt: Date;
    latestScan?: {
      id: string;
      status: string;
      score: number | null;
      createdAt: Date;
      _count: { findings: number };
    } | null;
  }>;
}

function formatConnectedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function scoreBadgeClassName(score: number): string {
  if (score >= 80) return "bg-green-600 text-white hover:bg-green-600/90";
  if (score >= 50) return "bg-yellow-500 text-white hover:bg-yellow-500/90";
  return "bg-red-600 text-white hover:bg-red-600/90";
}

function ScoreBadge({ scan }: { scan: NonNullable<RepoListProps["repos"][number]["latestScan"]> }) {
  if (scan.status === "scanning" || scan.status === "pending") {
    return <span className="text-xs text-muted-foreground">Scanning...</span>;
  }
  if (scan.status === "failed") {
    return <Badge variant="destructive" className="text-xs">Failed</Badge>;
  }
  if (scan.status === "completed" && scan.score !== null) {
    return (
      <Badge className={scoreBadgeClassName(scan.score)}>
        {scan.score}
      </Badge>
    );
  }
  return null;
}

export function RepoList({ repos }: RepoListProps) {
  if (repos.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 py-16 text-center">
        <GitBranch className="mx-auto mb-3 size-8 text-muted-foreground/40" />
        <p className="text-muted-foreground">
          No repositories connected yet. Connect one to start scanning.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => (
        <div
          key={repo.id}
          className="repo-tile group flex flex-col rounded-xl border border-border/50 bg-card p-5"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-muted-foreground">
              <GitBranch className="size-4" />
            </div>
            {repo.latestScan && <ScoreBadge scan={repo.latestScan} />}
          </div>

          <h3 className="mb-1 truncate text-sm font-semibold text-foreground">
            {repo.name}
          </h3>

          <p className="mb-1 truncate text-xs text-muted-foreground">
            {repo.fullName}
          </p>

          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground/60">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {repo.provider}
            </Badge>
            <span>{formatConnectedDate(repo.connectedAt)}</span>
            {repo.latestScan?.status === "completed" && repo.latestScan._count && (
              <span>{repo.latestScan._count.findings} findings</span>
            )}
          </div>

          <div className="relative z-10 mt-auto flex items-center gap-1.5 border-t border-border/30 pt-3">
            <ScanButton repoId={repo.id} />
            {repo.latestScan?.status === "completed" && repo.latestScan.id && (
              <Link href={`/scan/${repo.latestScan.id}`}>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                  <ExternalLink className="size-3" />
                  View
                </Button>
              </Link>
            )}
            {repo.latestScan && (
              <Link href={`/dashboard/repo/${repo.id}/history`}>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                  <History className="size-3" />
                </Button>
              </Link>
            )}
            <form
              className="ml-auto"
              action={async () => {
                "use server";
                await disconnectRepo(repo.id);
              }}
            >
              <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-red-400">
                Disconnect
              </Button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
