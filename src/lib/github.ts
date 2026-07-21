import { prisma } from "@/lib/db";
import { Octokit } from "octokit";

export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
  });
  return account?.access_token ?? null;
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  url: string;
  private: boolean;
  defaultBranch: string;
  pushedAt: string;
  description: string | null;
}

export async function fetchGitHubRepos(token: string): Promise<GitHubRepo[]> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "pushed",
    direction: "desc",
    per_page: 100,
    type: "owner",
  });

  return data
    .filter((repo) => !repo.fork && !repo.archived)
    .map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      defaultBranch: repo.default_branch,
      pushedAt: repo.pushed_at ?? repo.updated_at ?? repo.created_at ?? "",
      description: repo.description,
    }));
}
