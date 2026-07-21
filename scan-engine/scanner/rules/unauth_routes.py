import re

from scanner.models import CandidateFinding

RULE_ID = "unauth_routes"
SEVERITY = "high"

CONTEXT_LINES = 25

HTTP_METHODS = ("GET", "POST", "PUT", "DELETE", "PATCH")

_HANDLER_PATTERN = re.compile(
    r"export\s+(?:async\s+)?function\s+(" + "|".join(HTTP_METHODS) + r")\s*\(",
)

_AUTH_INDICATORS = (
    "auth(",
    "getSession(",
    "requireUser(",
    "getServerSession",
    "getToken",
    "verifyToken",
    "middleware",
    "authenticate",
)

ROUTE_FILE_HINTS = ("route.ts", "route.js")


def _is_route_file(path: str) -> bool:
    if any(path.endswith(hint) for hint in ROUTE_FILE_HINTS):
        return True
    return "/api/" in path or path.startswith("api/")


def _surrounding_code(lines: list[str], line_idx: int) -> str:
    start = max(0, line_idx - CONTEXT_LINES)
    end = min(len(lines), line_idx + CONTEXT_LINES + 1)
    return "\n".join(lines[start:end])


def _extract_handler_body(lines: list[str], start_idx: int) -> str:
    """Roughly extract the handler function body via brace matching."""
    depth = 0
    started = False
    body_lines: list[str] = []

    for idx in range(start_idx, min(len(lines), start_idx + 200)):
        line = lines[idx]
        body_lines.append(line)

        for ch in line:
            if ch == "{":
                depth += 1
                started = True
            elif ch == "}":
                depth -= 1

        if started and depth <= 0:
            break

    return "\n".join(body_lines)


def scan(files: dict[str, str]) -> list[CandidateFinding]:
    findings: list[CandidateFinding] = []

    for path, content in files.items():
        if not _is_route_file(path):
            continue

        lines = content.splitlines()

        for line_idx, line in enumerate(lines):
            match = _HANDLER_PATTERN.search(line)
            if not match:
                continue

            method = match.group(1)
            handler_body = _extract_handler_body(lines, line_idx)

            has_auth = any(indicator in handler_body for indicator in _AUTH_INDICATORS)
            if has_auth:
                continue

            findings.append(
                CandidateFinding(
                    ruleId=RULE_ID,
                    severity=SEVERITY,
                    title=f"Unauthenticated {method} route",
                    description=(
                        f"The `{method}` handler in `{path}` does not appear to "
                        "check authentication before running, so anyone can call it."
                    ),
                    filePath=path,
                    lineNumber=line_idx + 1,
                    matchedContent=line.strip(),
                    surroundingCode=_surrounding_code(lines, line_idx),
                )
            )

    return findings
