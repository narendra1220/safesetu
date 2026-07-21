"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { startScan } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { ScanSearch, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ScanButtonProps {
  repoId: string;
}

export function ScanButton({ repoId }: ScanButtonProps) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  const handleScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);

    const result = await startScan(repoId);

    if (result.error) {
      toast.error(result.error);
      setScanning(false);
      return;
    }

    if (result.scanId) {
      toast.success("Scan started");
      router.push(`/scan/${result.scanId}`);
    }

    setScanning(false);
  }, [repoId, scanning, router]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleScan}
      disabled={scanning}
    >
      {scanning ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ScanSearch className="size-3.5" />
      )}
      {scanning ? "Starting..." : "Scan"}
    </Button>
  );
}
