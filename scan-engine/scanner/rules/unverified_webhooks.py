import re

from scanner.models import CandidateFinding

RULE_ID = "unverified_webhooks"
SEVERITY = "high"

CONTEXT_LINES = 25

_HANDLER_PATTERN = re.compile(
    r"export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(",
)

_REQUEST_PARAM_PATTERN = re.compile(r"\(\s*(req|request)\b", re.IGNORECASE)

_VERIFICATION_INDICATORS = (
    "constructEvent",
    "timingSafeEqual",
    "verify",
    "validateWebhook",
    "verifySignature",
)


def _is_webhook_file(path: str) -> bool:
    return "webhook" in path.lower()


def _surrounding_code(lines: list[str], line_idx: int) -> str:
    start = max(0, line_idx - CONTEXT_LINES)
    end = min(len(lines), line_idx + CONTEXT_LINES + 1)
    return "\n".join(lines[start:end])


def _extract_handler_body(lines: list[str], start_idx: int) -> str:
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


def _looks_like_handler(line: str) -> re.Match | None:
    handler_match = _HANDLER_PATTERN.search(line)
    if handler_match:
        return handler_match
    if _REQUEST_PARAM_PATTERN.search(line) and ("function" in line or "=>" in line):
        return _REQUEST_PARAM_PATTERN.search(line)
    return None


def scan(files: dict[str, str]) -> list[CandidateFinding]:
    findings: list[CandidateFinding] = []

    for path, content in files.items():
        if not _is_webhook_file(path):
            continue

        lines = content.splitlines()

        for line_idx, line in enumerate(lines):
            match = _looks_like_handler(line)
            if not match:
                continue

            handler_body = _extract_handler_body(lines, line_idx)
            has_verification = any(
                indicator in handler_body for indicator in _VERIFICATION_INDICATORS
            )
            if has_verification:
                continue

            findings.append(
                CandidateFinding(
                    ruleId=RULE_ID,
                    severity=SEVERITY,
                    title="Webhook handler missing signature verification",
                    description=(
                        f"The webhook handler in `{path}` does not verify the "
                        "request signature, so anyone could forge webhook events."
                    ),
                    filePath=path,
                    lineNumber=line_idx + 1,
                    matchedContent=line.strip(),
                    surroundingCode=_surrounding_code(lines, line_idx),
                )
            )

    return findings
