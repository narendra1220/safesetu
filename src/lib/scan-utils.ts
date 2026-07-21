export function getSeverityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "border-red-200 bg-red-100 text-red-700";
    case "high":
      return "border-orange-200 bg-orange-100 text-orange-700";
    case "medium":
      return "border-yellow-200 bg-yellow-100 text-yellow-700";
    case "low":
      return "border-blue-200 bg-blue-100 text-blue-700";
    default:
      return "";
  }
}

export function getScoreDisplay(score: number): {
  className: string;
  verdict: string;
} {
  if (score >= 80) {
    return {
      className: "text-green-600 bg-green-50",
      verdict: "Ship it",
    };
  }
  if (score >= 50) {
    return {
      className: "text-amber-600 bg-amber-50",
      verdict: "Fix first",
    };
  }
  return {
    className: "text-red-600 bg-red-50",
    verdict: "Do not ship",
  };
}

export function formatScanDate(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(
  startedAt: Date | null,
  completedAt: Date | null,
): string | null {
  if (!startedAt || !completedAt) return null;
  const ms = completedAt.getTime() - startedAt.getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

export const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortFindingsBySeverity<T extends { severity: string }>(
  findings: T[],
): T[] {
  return [...findings].sort((a, b) => {
    const aOrder = SEVERITY_ORDER[a.severity.toLowerCase()] ?? 99;
    const bOrder = SEVERITY_ORDER[b.severity.toLowerCase()] ?? 99;
    return aOrder - bOrder;
  });
}

export function countBySeverity(
  findings: { severity: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const finding of findings) {
    const key = finding.severity.toLowerCase();
    if (key in counts) {
      counts[key]++;
    }
  }
  return counts;
}
