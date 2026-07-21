"use client";

import { useCallback, useMemo, useState } from "react";
import {
  connectRepos,
  getGitHubRepos,
  type RepoWithStatus,
} from "@/app/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, Globe, Lock, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export function RepoPicker() {
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<RepoWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadRepos = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setSelected(new Set());

    const result = await getGitHubRepos();
    setRepos(result.repos);
    setError(result.error);
    setLoading(false);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      void loadRepos();
    } else {
      setSearch("");
      setSelected(new Set());
      setError(undefined);
    }
  };

  const filteredRepos = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return repos;
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.fullName.toLowerCase().includes(query),
    );
  }, [repos, search]);

  const toggleRepo = (fullName: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(fullName);
      } else {
        next.delete(fullName);
      }
      return next;
    });
  };

  const handleConnect = async () => {
    const toConnect = repos
      .filter((repo) => selected.has(repo.fullName) && !repo.connected)
      .map((repo) => ({
        name: repo.name,
        fullName: repo.fullName,
        url: repo.url,
      }));

    if (toConnect.length === 0) return;

    setConnecting(true);
    try {
      await connectRepos(toConnect);
      toast.success(`Connected ${toConnect.length} repositor${toConnect.length === 1 ? "y" : "ies"}`);
      setOpen(false);
    } catch {
      toast.error("Failed to connect repositories");
    } finally {
      setConnecting(false);
    }
  };

  const selectedCount = repos.filter(
    (repo) => selected.has(repo.fullName) && !repo.connected,
  ).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Connect Repository
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="size-4" />
            Connect Repository
          </DialogTitle>
          <DialogDescription>
            Select GitHub repositories to scan for security issues.
          </DialogDescription>
        </DialogHeader>

        <div className="sticky top-0 z-10 bg-popover pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              disabled={loading || !!error}
            />
          </div>
        </div>

        {loading ? (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <Skeleton className="mt-0.5 size-4 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error === "no-github-account" ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Link your GitHub account by signing in with GitHub
          </p>
        ) : error === "token-expired" ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Re-authorize GitHub to refresh access
          </p>
        ) : filteredRepos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {search.trim()
              ? "No repositories match your search."
              : "No repositories found."}
          </p>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {filteredRepos.map((repo) => {
              const isConnected = repo.connected;
              const isChecked =
                isConnected || selected.has(repo.fullName);

              return (
                <Label
                  key={repo.fullName}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                    isConnected ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={isConnected}
                    onCheckedChange={(checked) =>
                      toggleRepo(repo.fullName, checked)
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{repo.name}</span>
                      <Badge variant="outline" className="shrink-0">
                        {repo.private ? (
                          <>
                            <Lock />
                            Private
                          </>
                        ) : (
                          <>
                            <Globe />
                            Public
                          </>
                        )}
                      </Badge>
                    </div>
                    {repo.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {repo.description}
                      </p>
                    )}
                  </div>
                </Label>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleConnect}
            disabled={
              loading ||
              connecting ||
              !!error ||
              selectedCount === 0
            }
          >
            {connecting ? "Connecting..." : "Connect selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
