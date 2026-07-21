import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RepoList } from "@/app/dashboard/repo-list";
import { RepoPicker } from "@/app/dashboard/repo-picker";

export default async function DashboardPage() {
  const user = await requireUser();

  const repos = await prisma.repo.findMany({
    where: { userId: user.id },
    orderBy: { connectedAt: "desc" },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { _count: { select: { findings: true } } },
      },
    },
  });

  const reposWithScans = repos.map((repo) => ({
    ...repo,
    latestScan: repo.scans[0] ?? null,
  }));

  return (
    <div className="box-grid-corner min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 ring-1 ring-white/10">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? "User"}
              />
              <AvatarFallback className="bg-white/5 text-foreground">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {user.name ?? "there"}
              </h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <RepoPicker />
        </div>

        <RepoList repos={reposWithScans} />
      </div>
    </div>
  );
}
