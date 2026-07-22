import re

from scanner.models import CandidateFinding

RULE_ID = "insecure_config"
SEVERITY = "medium"

CONTEXT_LINES = 25

_TARGET_EXTENSIONS = (".ts", ".js", ".mjs")

_PATTERNS = [
    (
        re.compile(r"""(?:remotePatterns|domains)\s*:.*['"]\*['"]"""),
        "Wildcard in image domains configuration",
    ),
    (
        re.compile(r"""debug\s*:\s*true"""),
        "Debug mode enabled in configuration",
    ),
    (
        re.compile(
            r"""NODE_ENV\s*[!=]==?\s*['"]production['"].*(?:debug|verbose|log)"""
            r"""|(?:debug|verbose|log).*NODE_ENV\s*[!=]==?\s*['"]production['"]""",
            re.IGNORECASE,
        ),
        "Debug features toggled by NODE_ENV check",
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
                                f"`{path}` contains an insecure configuration "
                                f"({label.lower()}). This could expose sensitive "
                                "information or weaken security in production."
                            ),
                            filePath=path,
                            lineNumber=line_idx + 1,
                            matchedContent=line.strip(),
                            surroundingCode=_surrounding_code(lines, line_idx),
                        )
                    )
                    break

    return findings
