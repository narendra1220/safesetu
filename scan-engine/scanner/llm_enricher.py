import json
import logging
import os

import httpx

from scanner.models import CandidateFinding, Finding

logger = logging.getLogger("scanner.llm")

def _ollama_url() -> str:
    return os.getenv("OLLAMA_URL", "http://localhost:11434")

def _ollama_model() -> str:
    return os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")


async def enrich_finding(candidate: CandidateFinding) -> Finding | None:
    """Send candidate to Ollama for validation and enrichment."""
    ollama_url = _ollama_url()
    ollama_model = _ollama_model()
    logger.info(
        "[LLM] Enriching candidate: rule=%s file=%s:%s model=%s url=%s",
        candidate.ruleId, candidate.filePath, candidate.lineNumber,
        ollama_model, ollama_url,
    )

    prompt = f"""You are a security auditor reviewing code from a web application.

A static analysis rule flagged the following potential security issue:

Rule: {candidate.ruleId}
File: {candidate.filePath}
Line: {candidate.lineNumber}
Matched content: {candidate.matchedContent}

Surrounding code:
```
{candidate.surroundingCode}
```

Respond in JSON with these fields:
- "is_valid": boolean — is this a real security issue or a false positive?
- "title": string — a short, plain-English title (e.g., "Your Stripe secret key is visible in the browser")
- "description": string — 1-2 sentence explanation a non-technical founder would understand
- "fix_prompt": string — a copy-paste prompt for Cursor/Claude to fix this issue
- "fix_diff": string — the minimal code change as a unified diff

Respond ONLY with the JSON object, no markdown fences."""

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            logger.info("[LLM] Sending request to Ollama...")
            resp = await client.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            result = resp.json()
            raw_response = result["response"]
            logger.info("[LLM] Raw response: %s", raw_response[:500])
            llm_output = json.loads(raw_response)

            if not llm_output.get("is_valid", True):
                logger.info("[LLM] Marked as false positive — discarding")
                return None

            finding = Finding(
                ruleId=candidate.ruleId,
                severity=candidate.severity,
                title=llm_output.get("title", candidate.title),
                description=llm_output.get("description", candidate.description),
                filePath=candidate.filePath,
                lineNumber=candidate.lineNumber,
                fixPrompt=llm_output.get("fix_prompt"),
                fixDiff=llm_output.get("fix_diff"),
            )
            logger.info(
                "[LLM] Enriched: title=%s hasFixPrompt=%s hasFixDiff=%s",
                finding.title, finding.fixPrompt is not None, finding.fixDiff is not None,
            )
            return finding
    except Exception as exc:
        logger.error("[LLM] Failed for %s:%s — %s: %s", candidate.filePath, candidate.lineNumber, type(exc).__name__, exc)
        return Finding(
            ruleId=candidate.ruleId,
            severity=candidate.severity,
            title=candidate.title,
            description=candidate.description,
            filePath=candidate.filePath,
            lineNumber=candidate.lineNumber,
            fixPrompt=None,
            fixDiff=None,
        )


async def enrich_findings(candidates: list[CandidateFinding]) -> list[Finding]:
    """Enrich candidates sequentially (CPU-bound Ollama can't handle parallel)."""
    logger.info("[LLM] Enriching %d candidates sequentially...", len(candidates))
    findings = []
    for i, candidate in enumerate(candidates, 1):
        logger.info("[LLM] Processing %d/%d", i, len(candidates))
        finding = await enrich_finding(candidate)
        if finding is not None:
            findings.append(finding)
    logger.info("[LLM] Done — %d findings after enrichment (from %d candidates)", len(findings), len(candidates))
    return findings
