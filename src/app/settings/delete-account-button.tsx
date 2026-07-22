"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAccount } from "@/app/settings/actions";

export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAccount();
    if (result?.error) {
      toast.error(result.error);
      setDeleting(false);
      setConfirming(false);
      return;
    }
    router.push("/");
  }

  if (!confirming) {
    return (
      <Button variant="destructive" onClick={() => setConfirming(true)}>
        Delete Account
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-destructive">Are you sure? This is permanent.</p>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
        Yes, delete everything
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={deleting}
      >
        Cancel
      </Button>
    </div>
  );
}
