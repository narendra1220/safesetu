import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface CallbackPayload {
  scanId: string;
  score?: number;
  verdict?: string;
  error?: string;
  findings?: Array<{
    ruleId: string;
    severity: string;
    title: string;
    description: string;
    filePath: string;
    lineNumber: number | null;
    fixPrompt: string | null;
    fixDiff: string | null;
  }>;
}

export async function POST(request: Request) {
  const body: CallbackPayload = await request.json();

  if (!body.scanId) {
    return NextResponse.json({ error: "missing scanId" }, { status: 400 });
  }

  const scan = await prisma.scan.findUnique({ where: { id: body.scanId } });
  if (!scan) {
    return NextResponse.json({ error: "scan not found" }, { status: 404 });
  }

  if (body.error) {
    await prisma.scan.update({
      where: { id: body.scanId },
      data: { status: "failed", completedAt: new Date() },
    });
    return NextResponse.json({ status: "failed" });
  }

  if (body.findings && body.findings.length > 0) {
    await prisma.finding.createMany({
      data: body.findings.map((f) => ({
        scanId: body.scanId,
        ruleId: f.ruleId,
        severity: f.severity,
        title: f.title,
        description: f.description,
        filePath: f.filePath,
        lineNumber: f.lineNumber,
        fixPrompt: f.fixPrompt,
        fixDiff: f.fixDiff,
      })),
    });
  }

  await prisma.scan.update({
    where: { id: body.scanId },
    data: {
      status: "completed",
      score: body.score ?? 0,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ status: "completed" });
}
