import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getGitHubToken } from "@/lib/github";

const SCAN_ENGINE_URL = process.env.SCAN_ENGINE_URL ?? "http://localhost:8000";
const CALLBACK_BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function triggerScan(
  repoId: string,
  userId: string,
): Promise<string> {
  const repo = await prisma.repo.findUniqueOrThrow({
    where: { id: repoId, userId },
  });

  const token = await getGitHubToken(userId);
  if (!token) throw new Error("No GitHub token found");

  const callbackToken = crypto.randomBytes(32).toString("hex");

  const scan = await prisma.scan.create({
    data: {
      repoId,
      userId,
      status: "scanning",
      startedAt: new Date(),
      callbackToken,
    },
  });

  try {
    const response = await fetch(`${SCAN_ENGINE_URL}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoFullName: repo.fullName,
        repoUrl: repo.url,
        githubToken: token,
        defaultBranch: repo.defaultBranch,
        callbackUrl: `${CALLBACK_BASE}/api/scan/callback`,
        callbackToken,
        scanId: scan.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Scan engine returned ${response.status}`);
    }
  } catch (error) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }

  return scan.id;
}
