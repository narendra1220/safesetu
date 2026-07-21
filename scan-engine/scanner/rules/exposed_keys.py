import re

from scanner.models import CandidateFinding

# Patterns to detect in CLIENT-REACHABLE files
PATTERNS = [
    (r"service_role\b", "Supabase service_role key"),
    (r"sk[-_]live[-_][a-zA-Z0-9]{20,}", "Stripe live secret key"),
    (r"sk[-_]test[-_][a-zA-Z0-9]{20,}", "Stripe test secret key"),
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key ID"),
    (r"ghp_[a-zA-Z0-9]{36}", "GitHub personal access token"),
    (r"glpat-[a-zA-Z0-9\-_]{20,}", "GitLab personal access token"),
    (r"xoxb-[0-9]{10,}", "Slack bot token"),
    (r"eyJhbGciOi[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+", "Hardcoded JWT"),
]

_COMPILED_PATTERNS = [(re.compile(pattern), label) for pattern, label in PATTERNS]

# Only scan client-reachable files (not server-only files)
CLIENT_FILE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"}

RULE_ID = "exposed_keys"
SEVERITY = "critical"

CONTEXT_LINES = 25


def is_client_file(path: str) -> bool:
    """Heuristic: files that are NOT server-only"""
    # Server-only indicators
    server_indicators = [
        "route.ts",
        "route.js",
        "actions.ts",
        "middleware.ts",
        "server/",
        "api/",
        ".server.",
    ]
    if any(ind in path for ind in server_indicators):
        return False
    # Must have client extension
    return any(path.endswith(ext) for ext in CLIENT_FILE_EXTENSIONS)


def _surrounding_code(lines: list[str], line_idx: int) -> str:
    start = max(0, line_idx - CONTEXT_LINES)
    end = min(len(lines), line_idx + CONTEXT_LINES + 1)
    return "\n".join(lines[start:end])


def scan(files: dict[str, str]) -> list[CandidateFinding]:
    findings: list[CandidateFinding] = []

    for path, content in files.items():
        if not is_client_file(path):
            continue

        lines = content.splitlines()

        for line_idx, line in enumerate(lines):
            for compiled_pattern, label in _COMPILED_PATTERNS:
                match = compiled_pattern.search(line)
                if not match:
                    continue

                findings.append(
                    CandidateFinding(
                        ruleId=RULE_ID,
                        severity=SEVERITY,
                        title=f"{label} exposed in client-side code",
                        description=(
                            f"A {label.lower()} was found in `{path}`, which is "
                            "shipped to the browser and readable by anyone."
                        ),
                        filePath=path,
                        lineNumber=line_idx + 1,
                        matchedContent=line.strip(),
                        surroundingCode=_surrounding_code(lines, line_idx),
                    )
                )

    return findings
