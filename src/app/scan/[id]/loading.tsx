import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ScanLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Skeleton className="mb-8 h-5 w-32" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
