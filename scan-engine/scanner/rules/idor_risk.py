import re

from scanner.models import CandidateFinding

RULE_ID = "idor_risk"
SEVERITY = "high"

CONTEXT_LINES = 25

_TARGET_FILES = ("actions.ts", "route.ts", "route.js")

_PRISMA_QUERY = re.compile(
    r"\.(findUnique|findFirst|update|delete)\s*\("
)

_ID_PARAM = re.compile(r"\b\w*[Ii]d\b")


def _surrounding_code(lines: list[str], line_idx: int) -> str:
    start = max(0, line_idx - CONTEXT_LINES)
    end = min(len(lines), line_idx + CONTEXT_LINES + 1)
    return "\n".join(lines[start:end])


def _get_where_block(lines: list[str], start_idx: int, span: int = 10) -> str:
    end = min(len(lines), start_idx + span)
    return "\n".join(lines[start_idx:end])


def scan(files: dict[str, str]) -> list[CandidateFinding]:
    findings: list[CandidateFinding] = []

    for path, content in files.items():
        if not any(path.endswith(f) for f in _TARGET_FILES):
            continue

        lines = content.splitlines()

        for line_idx, line in enumerate(lines):
            query_match = _PRISMA_QUERY.search(line)
            if not query_match:
                continue

            where_block = _get_where_block(lines, line_idx)

            if not _ID_PARAM.search(where_block):
                continue

            if "userId" in where_block or "user_id" in where_block:
                continue

            method = query_match.group(1)
            findings.append(
                CandidateFinding(
                    ruleId=RULE_ID,
                    severity=SEVERITY,
                    title=f"Potential IDOR: `.{method}()` without user scoping",
                    description=(
                        f"`{path}` calls `.{method}()` using an ID parameter "
                        "but does not include `userId` in the where clause. "
                        "An attacker could access or modify another user's data "
                        "by supplying a different ID."
                    ),
                    filePath=path,
                    lineNumber=line_idx + 1,
                    matchedContent=line.strip(),
                    surroundingCode=_surrounding_code(lines, line_idx),
                )
            )

    return findings
