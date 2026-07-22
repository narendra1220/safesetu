from collections.abc import AsyncGenerator

from scanner.llm_enricher import enrich_findings
from scanner.models import CandidateFinding, Finding, ScanRequest, ScanResult
from scanner.repo_reader import read_repo_files
from scanner.rules import ALL_RULES
from scanner.scorer import calculate_score


async def run_scan(request: ScanRequest) -> ScanResult:
    """Orchestrate a full scan: read repo, run rules, enrich, score."""
    files = await read_repo_files(
        request.githubToken,
        request.repoFullName,
        request.defaultBranch,
        repo_url=request.repoUrl,
    )

    candidates: list[CandidateFinding] = []
    for rule in ALL_RULES:
        candidates.extend(rule.scan(files))

    findings = await enrich_findings(candidates)

    score, verdict = calculate_score(findings)

    return ScanResult(findings=findings, score=score, verdict=verdict)


async def run_scan_streaming(
    request: ScanRequest,
) -> AsyncGenerator[list[Finding], None]:
    """Yield enriched findings per-rule so callers can stream partial results."""
    files = await read_repo_files(
        request.githubToken,
        request.repoFullName,
        request.defaultBranch,
        repo_url=request.repoUrl,
    )

    for rule in ALL_RULES:
        candidates = rule.scan(files)
        if not candidates:
            continue
        enriched = await enrich_findings(candidates)
        if enriched:
            yield enriched


__all__ = ["run_scan", "run_scan_streaming"]
