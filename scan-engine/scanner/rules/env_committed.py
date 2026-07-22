import re

from scanner.models import CandidateFinding

RULE_ID = "env_committed"
SEVERITY = "critical"

CONTEXT_LINES = 25

_PLACEHOLDER_VALUES = re.compile(
    r"^(your_key_here|xxx+|changeme|TODO|CHANGE_ME|REPLACE_ME|placeholder|example)$",
    re.IGNORECASE,
)

_KV_LINE = re.compile(r"^([A-Z_][A-Z0-9_]*)=(.+)$")


def _surrounding_code(lines: list[str], line_idx: int) -> str:
    start = max(0, line_idx - CONTEXT_LINES)
    end = min(len(lines), line_idx + CONTEXT_LINES + 1)
    return "\n".join(lines[start:end])


def _is_env_file(path: str) -> bool:
    basename = path.rsplit("/", 1)[-1] if "/" in path else path
    return basename == ".env"


def _has_real_values(content: str) -> bool:
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = _KV_LINE.match(line)
        if m:
            value = m.group(2).strip().strip("\"'")
            if value and not _PLACEHOLDER_VALUES.match(value):
                return True
    return False


def scan(files: dict[str, str]) -> list[CandidateFinding]:
    findings: list[CandidateFinding] = []

    for path, content in files.items():
        if not _is_env_file(path):
            continue

        if not _has_real_values(content):
            continue

        lines = content.splitlines()
        findings.append(
            CandidateFinding(
                ruleId=RULE_ID,
                severity=SEVERITY,
                title=".env file with real secrets committed to repository",
                description=(
                    f"`{path}` is a `.env` file containing real configuration "
                    "values. This file should be in `.gitignore` and never committed."
                ),
                filePath=path,
                lineNumber=1,
                matchedContent=lines[0] if lines else "",
                surroundingCode=_surrounding_code(lines, 0),
            )
        )

    return findings
