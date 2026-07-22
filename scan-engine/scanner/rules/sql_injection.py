import re

from scanner.models import CandidateFinding

RULE_ID = "sql_injection"
SEVERITY = "critical"

CONTEXT_LINES = 25

_TARGET_EXTENSIONS = (".ts", ".js")

_RAW_QUERY_INTERP = re.compile(
    r"\.\$(queryRaw|executeRaw)\s*`[^`]*\$\{(?!.*Prisma\.sql)"
)

_SQL_CONCAT = re.compile(
    r"""(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s.*["']\s*\+\s*\w""",
    re.IGNORECASE,
)

_QUERY_TEMPLATE_INTERP = re.compile(
    r"""(?:query|execute)\s*\(\s*`[^`]*\$\{"""
)


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
            matched_label = None

            if _RAW_QUERY_INTERP.search(line):
                matched_label = "Prisma raw query with string interpolation"
            elif _SQL_CONCAT.search(line):
                matched_label = "SQL query built with string concatenation"
            elif _QUERY_TEMPLATE_INTERP.search(line):
                matched_label = "SQL query with template literal interpolation"

            if matched_label:
                findings.append(
                    CandidateFinding(
                        ruleId=RULE_ID,
                        severity=SEVERITY,
                        title=matched_label,
                        description=(
                            f"`{path}` constructs a SQL query using untrusted "
                            "input interpolation. Use parameterized queries or "
                            "`Prisma.sql` tagged templates instead."
                        ),
                        filePath=path,
                        lineNumber=line_idx + 1,
                        matchedContent=line.strip(),
                        surroundingCode=_surrounding_code(lines, line_idx),
                    )
                )

    return findings
