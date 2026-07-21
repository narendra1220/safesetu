import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink, Terminal } from "lucide-react";
import { CopyButton } from "@/app/scan/[id]/copy-button";
import { DiffView } from "@/app/scan/[id]/diff-view";
import { getSeverityBadgeClass } from "@/lib/scan-utils";

interface FindingCardProps {
  finding: {
    id: string;
    ruleId: string;
    severity: string;
    title: string;
    description: string;
    filePath: string;
    lineNumber: number | null;
    fixPrompt: string | null;
    fixDiff: string | null;
  };
  repoUrl: string;
}

function buildFileUrl(
  repoUrl: string,
  filePath: string,
  lineNumber: number | null,
): string {
  const base = `${repoUrl}/blob/main/${filePath}`;
  return lineNumber ? `${base}#L${lineNumber}` : base;
}

function buildCursorDeepLink(filePath: string, lineNumber: number | null): string {
  return `cursor://file/${filePath}:${lineNumber ?? 1}`;
}

export function FindingCard({ finding, repoUrl }: FindingCardProps) {
  const fileUrl = buildFileUrl(repoUrl, finding.filePath, finding.lineNumber);
  const cursorUrl = buildCursorDeepLink(finding.filePath, finding.lineNumber);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={getSeverityBadgeClass(finding.severity)}
          >
            {finding.severity}
          </Badge>
          <span className="text-xs text-muted-foreground">{finding.ruleId}</span>
        </div>
        <CardTitle className="text-base font-bold">{finding.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed">{finding.description}</p>

        <div className="flex items-center gap-1.5">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
          >
            {finding.filePath}
            {finding.lineNumber != null && (
              <span className="text-muted-foreground">:{finding.lineNumber}</span>
            )}
            <ExternalLink className="size-3.5 shrink-0" />
          </a>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<a href={cursorUrl} className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" />}
              >
                <Terminal className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                Open in Cursor IDE (requires repo cloned locally)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {finding.fixPrompt && (
          <Collapsible className="rounded-lg border">
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/50 rounded-t-lg">
              <ChevronRight className="size-4 transition-transform duration-200 [[data-open]_&]:rotate-90" />
              Fix prompt
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 border-t px-4 py-3">
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
                {finding.fixPrompt}
              </pre>
              <CopyButton text={finding.fixPrompt} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {finding.fixDiff && (
          <Collapsible className="rounded-lg border">
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/50 rounded-t-lg">
              <ChevronRight className="size-4 transition-transform duration-200 [[data-open]_&]:rotate-90" />
              Suggested diff
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 border-t px-4 py-3">
              <DiffView diff={finding.fixDiff} />
              <CopyButton text={finding.fixDiff} label="Copy diff" />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
