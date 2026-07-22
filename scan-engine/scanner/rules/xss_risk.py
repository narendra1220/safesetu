import re

from scanner.models import CandidateFinding

RULE_ID = "xss_risk"
SEVERITY = "high"

CONTEXT_LINES = 25

_TARGET_EXTENSIONS = (".tsx", ".jsx")

_DANGEROUS_HTML = re.compile(r"dangerouslySetInnerHTML")


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
            if _DANGEROUS_HTML.search(line):
                findings.append(
                    CandidateFinding(
                        ruleId=RULE_ID,
                        severity=SEVERITY,
                        title="dangerouslySetInnerHTML usage detected",
                        description=(
                            f"`{path}` uses `dangerouslySetInnerHTML`, which "
                            "bypasses React's XSS protection. If the HTML content "
                            "comes from user input, this is a cross-site scripting "
                            "vulnerability."
                        ),
                        filePath=path,
                        lineNumber=line_idx + 1,
                        matchedContent=line.strip(),
                        surroundingCode=_surrounding_code(lines, line_idx),
                    )
                )

    return findings
