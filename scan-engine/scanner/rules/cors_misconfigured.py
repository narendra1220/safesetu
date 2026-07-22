import re

from scanner.models import CandidateFinding

RULE_ID = "cors_misconfigured"
SEVERITY = "high"

CONTEXT_LINES = 25

_TARGET_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx")

_PATTERNS = [
    (
        re.compile(r"""Access-Control-Allow-Origin\b.*['"]\*['"]"""),
        "Access-Control-Allow-Origin set to wildcard *",
    ),
    (
        re.compile(r"""origin\s*:\s*['"]\*['"]"""),
        "CORS origin configured as wildcard *",
    ),
    (
        re.compile(r"""origin\s*:\s*true"""),
        "CORS origin configured as true (reflects any origin)",
    ),
    (
        re.compile(r"""allowedOrigins\s*:\s*\[\s*['"]\*['"]\s*\]"""),
        "Next.js allowedOrigins includes wildcard *",
    ),
]


def _surrounding_code(lines: list[str], line_idx: int) -> str:
    start = max(0, line_idx - CONTEXT_LINES)
    end = min(len(lines), line_idx + CONTEXT_LINES + 1)
    return "\n".join(lines[start:end])


def scan(files: dict[str, str]) -> list[CandidateFinding]:
    findings: list[CandidateFinding] = []

    for path, content in files.items():
        if not any(path.endswith(ext) for ext in _TARGET_EXTENSIONS):
            continue

        lines = content.splitlines()

        for line_idx, line in enumerate(lines):
            for pattern, label in _PATTERNS:
                if pattern.search(line):
                    findings.append(
                        CandidateFinding(
                            ruleId=RULE_ID,
                            severity=SEVERITY,
                            title=label,
                            description=(
                                f"`{path}` has a permissive CORS configuration "
                                f"({label.lower()}). This allows any website to "
                                "make authenticated requests to your API."
                            ),
                            filePath=path,
                            lineNumber=line_idx + 1,
                            matchedContent=line.strip(),
                            surroundingCode=_surrounding_code(lines, line_idx),
                        )
                    )
                    break

    return findings
