"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startScan } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ScanSearch,
  GitBranch,
  FileSearch,
  ShieldCheck,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SCAN_STEPS = [
  { id: "connect", label: "Connecting to repository", icon: GitBranch, delayMs: 800 },
  { id: "read", label: "Reading source files", icon: FileSearch, delayMs: 2000 },
  { id: "rules", label: "Running security checks", icon: ShieldCheck, delayMs: 3000 },
  { id: "enrich", label: "Analyzing findings", icon: Sparkles, delayMs: 2500 },
  { id: "score", label: "Calculating score", icon: BarChart3, delayMs: 1000 },
] as const;

type StepStatus = "pending" | "active" | "done";

interface ScanButtonProps {
  repoId: string;
}

export function ScanButton({ repoId }: ScanButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [scanDone, setScanDone] = useState(false);
  const [scanResult, setScanResult] = useState<{
    scanId?: string;
    error?: string;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanStarted = useRef(false);

  const advanceSteps = useCallback(() => {
    let current = 0;
    const advance = () => {
      current++;
      if (current < SCAN_STEPS.length) {
        setStepIndex(current);
        timerRef.current = setTimeout(advance, SCAN_STEPS[current].delayMs);
      }
    };
    timerRef.current = setTimeout(advance, SCAN_STEPS[0].delayMs);
  }, []);

  const handleScan = useCallback(async () => {
    if (scanStarted.current) return;
    scanStarted.current = true;

    setOpen(true);
    setStepIndex(0);
    setScanDone(false);
    setScanResult(null);

    advanceSteps();

    const result = await startScan(repoId);
    setScanResult(result);
    setScanDone(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    setStepIndex(SCAN_STEPS.length);
  }, [repoId, advanceSteps]);

  useEffect(() => {
    if (scanDone && scanResult?.scanId) {
      const t = setTimeout(() => {
        setOpen(false);
        router.push(`/scan/${scanResult.scanId}`);
      }, 1500);
      return () => clearTimeout(t);
    }
    if (scanDone && scanResult?.error) {
      toast.error(scanResult.error);
    }
  }, [scanDone, scanResult, router]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleOpenChange(next: boolean) {
    if (!next && !scanDone) return;
    setOpen(next);
    if (!next) {
      scanStarted.current = false;
    }
  }

  function getStepStatus(index: number): StepStatus {
    if (index < stepIndex) return "done";
    if (index === stepIndex && !scanDone) return "active";
    if (scanDone) return "done";
    return "pending";
  }

  const failed = scanDone && scanResult?.error;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleScan}
        disabled={open}
      >
        <ScanSearch className="size-3.5" />
        Scan
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5" />
              Security Scan
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-0 py-2">
            {SCAN_STEPS.map((step, i) => {
              const status = getStepStatus(i);
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border-2 transition-all duration-500",
                        status === "done" &&
                          "border-green-500 bg-green-500 text-white",
                        status === "active" &&
                          "border-primary bg-primary/10 text-primary",
                        status === "pending" &&
                          "border-muted-foreground/20 text-muted-foreground/40",
                      )}
                    >
                      {status === "done" ? (
                        <CheckCircle2 className="size-4" />
                      ) : status === "active" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    {i < SCAN_STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-8 w-0.5 transition-colors duration-500",
                          status === "done"
                            ? "bg-green-500"
                            : "bg-muted-foreground/20",
                        )}
                      />
                    )}
                  </div>

                  <div className="flex min-h-[4rem] items-start pt-1.5">
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        status === "done" && "text-green-600",
                        status === "active" && "text-foreground",
                        status === "pending" && "text-muted-foreground/50",
                      )}
                    >
                      {step.label}
                      {status === "active" && (
                        <span className="ml-1 inline-flex">
                          <span className="animate-pulse">.</span>
                          <span className="animate-pulse [animation-delay:200ms]">
                            .
                          </span>
                          <span className="animate-pulse [animation-delay:400ms]">
                            .
                          </span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {scanDone && !failed && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CheckCircle2 className="size-4 shrink-0" />
              Scan complete — loading results...
            </div>
          )}

          {failed && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <XCircle className="size-4 shrink-0" />
              {scanResult?.error}
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setOpen(false);
                  scanStarted.current = false;
                }}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
