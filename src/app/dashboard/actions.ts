"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getGitHubToken, fetchGitHubRepos } from "@/lib/github";
import type { GitHubRepo } from "@/lib/github";
import { triggerScan } from "@/lib/scanner";

export interface RepoWithStatus extends GitHubRepo {
  connected: boolean;
  repoId: string | null;
}

export async function getGitHubRepos(): Promise<{
  repos: RepoWithStatus[];
  error?: string;
}> {
  const user = await requireUser();

  const token = await getGitHubToken(user.id);
  if (!token) {
    return { repos: [], error: "no-github-account" };
  }

  try {
    const githubRepos = await fetchGitHubRepos(token);

    const connectedRepos = await prisma.repo.findMany({
      where: { userId: user.id },
    });
    const connectedByFullName = new Map(
      connectedRepos.map((repo) => [repo.fullName, repo.id]),
    );

    const repos: RepoWithStatus[] = githubRepos.map((repo) => {
      const repoId = connectedByFullName.get(repo.fullName) ?? null;
      return {
        ...repo,
        connected: repoId !== null,
        repoId,
      };
    });

    return { repos };
  } catch {
    return { repos: [], error: "token-expired" };
  }
}

export async function connectRepos(
  repos: { name: string; fullName: string; url: string }[],
): Promise<void> {
  const user = await requireUser();

  const token = await getGitHubToken(user.id);
  if (!token) throw new Error("No GitHub token found");

  const githubRepos = await fetchGitHubRepos(token);
  const githubReposByFullName = new Map(
    githubRepos.map((repo) => [repo.fullName, repo]),
  );

  const existing = await prisma.repo.findMany({
    where: { userId: user.id },
    select: { fullName: true },
  });
  const existingFullNames = new Set(existing.map((repo) => repo.fullName));

  const newRepos = repos.filter(
    (repo) =>
      !existingFullNames.has(repo.fullName) &&
      githubReposByFullName.has(repo.fullName),
  );

  if (newRepos.length === 0) {
    return;
  }

  await prisma.repo.createMany({
    data: newRepos.map((repo) => ({
      userId: user.id,
      name: repo.name,
      fullName: repo.fullName,
      url: repo.url,
      provider: "github",
      defaultBranch:
        githubReposByFullName.get(repo.fullName)?.defaultBranch ?? "main",
    })),
  });

  revalidatePath("/dashboard");
}

export async function disconnectRepo(repoId: string): Promise<void> {
  const user = await requireUser();

  await prisma.repo.delete({
    where: { id: repoId, userId: user.id },
  });

  revalidatePath("/dashboard");
}

export async function startScan(
  repoId: string,
): Promise<{ scanId?: string; error?: string }> {
  const user = await requireUser();
  try {
    const scanId = await triggerScan(repoId, user.id);
    revalidatePath("/dashboard");
    return { scanId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Scan failed" };
  }
}

export async function getScanHistory(repoId: string) {
  const user = await requireUser();
  return prisma.scan.findMany({
    where: { repoId, userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      _count: { select: { findings: true } },
    },
  });
}
