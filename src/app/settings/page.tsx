import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteAccountButton } from "@/app/settings/delete-account-button";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await requireUser();

  const account = await prisma.account.findFirst({
    where: { userId: user.id, provider: "github" },
    select: { providerAccountId: true },
  });

  const repoCount = await prisma.repo.count({ where: { userId: user.id } });
  const scanCount = await prisma.scan.count({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="mt-8 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? "User"}
              />
              <AvatarFallback className="text-lg">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name ?? "User"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <p className="text-xs text-muted-foreground">
                  {account
                    ? `Connected (ID: ${account.providerAccountId})`
                    : "Not connected"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  account
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {account ? "Active" : "Inactive"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold tabular-nums">{repoCount}</p>
              <p className="text-xs text-muted-foreground">
                Connected repositories
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{scanCount}</p>
              <p className="text-xs text-muted-foreground">Total scans</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete your account, all connected repositories, and
              scan history. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
