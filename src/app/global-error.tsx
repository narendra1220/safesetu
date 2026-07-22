"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-background text-foreground">
        <p className="text-2xl font-bold">Something went wrong</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
