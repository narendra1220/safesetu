import re

from scanner.models import CandidateFinding

RULE_ID = "client_writable"
SEVERITY = "medium"

CONTEXT_LINES = 25

CLIENT_FILE_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte")

_WRITE_CALL_PATTERN = re.compile(r"\.(update|insert|upsert)\s*\(")

_SENSITIVE_FIELDS = ("role", "subscription", "is_admin", "plan", "credits", "tier")

_SERVER_INDICATORS = (
    "route.ts",
    "route.js",
    "actions.ts",
    "middleware.ts",
    "server/",
    "api/",
    ".server.",
)


def _is_client_file(path: str) -> bool:
    if any(ind in path for ind in _SERVER_INDICATORS):
        return False
    return any(path.endswith(ext) for ext in CLIENT_FILE_EXTENSIONS)


def _surrounding_code(lines: list[str], line_idx: int) -> str:
    start = max(0, line_idx - CONTEXT_LINES)
    end = min(len(lines), line_idx + CONTEXT_LINES + 1)
    return "\n".join(lines[start:end])


def _nearby_window(lines: list[str], line_idx: int, span: int = 5) -> str:
    start = max(0, line_idx - 1)
    end = min(len(lines), line_idx + span)
    return "\n".join(lines[start:end])


def scan(files: dict[str, str]) -> list[CandidateFinding]:
    findings: list[CandidateFinding] = []

    for path, content in files.items():
        if not _is_client_file(path):
            continue

        lines = content.splitlines()

        for line_idx, line in enumerate(lines):
            call_match = _WRITE_CALL_PATTERN.search(line)
            if not call_match:
                continue

            method = call_match.group(1)
            window = _nearby_window(lines, line_idx)

            matched_fields = [field for field in _SENSITIVE_FIELDS if field in window]
            if not matched_fields:
                continue

            findings.append(
                CandidateFinding(
                    ruleId=RULE_ID,
                    severity=SEVERITY,
                    title=f"Client-side `.{method}()` writes a sensitive field",
                    description=(
                        f"`{path}` calls `.{method}()` from client-side code "
                        f"touching sensitive field(s) ({', '.join(matched_fields)}), "
                        "which a user could tamper with in the browser."
                    ),
                    filePath=path,
                    lineNumber=line_idx + 1,
                    matchedContent=line.strip(),
                    surroundingCode=_surrounding_code(lines, line_idx),
                )
            )

    return findings
