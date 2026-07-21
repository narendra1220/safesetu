interface DiffViewProps {
  diff: string;
}

function getLineClass(line: string): string {
  if (line.startsWith("+")) {
    return "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-400";
  }
  if (line.startsWith("-")) {
    return "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-400";
  }
  if (line.startsWith("@@")) {
    return "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
  }
  return "text-foreground";
}

export function DiffView({ diff }: DiffViewProps) {
  const lines = diff.split("\n");

  return (
    <pre className="overflow-x-auto rounded-md border bg-muted/30 font-mono text-xs leading-relaxed">
      {lines.map((line, index) => (
        <div
          key={index}
          className={`whitespace-pre px-3 py-0.5 ${getLineClass(line)}`}
        >
          {line.length > 0 ? line : "\u00A0"}
        </div>
      ))}
    </pre>
  );
}
