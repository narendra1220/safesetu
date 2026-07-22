import logging

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from scanner import run_scan, run_scan_streaming
from scanner.models import ScanRequest, ScanResult
from scanner.scorer import calculate_score

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

logger = logging.getLogger("scanner.main")

app = FastAPI(title="SafeSetu Scan Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


async def _send_callback(url: str, payload: dict) -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        logger.info("[BG] Callback response: %d", resp.status_code)


async def _run_scan_and_callback(request: ScanRequest):
    """Run scan in background, POST partial results per-rule, then final score."""
    try:
        logger.info("[BG] Starting background scan for %s (scanId=%s)", request.repoFullName, request.scanId)
        all_findings = []

        async for rule_findings in run_scan_streaming(request):
            all_findings.extend(rule_findings)
            if request.callbackUrl:
                await _send_callback(request.callbackUrl, {
                    "scanId": request.scanId,
                    "callbackToken": request.callbackToken,
                    "status": "partial",
                    "findings": [f.model_dump() for f in rule_findings],
                })
                logger.info("[BG] Sent %d partial findings (%d total so far)", len(rule_findings), len(all_findings))

        score, verdict = calculate_score(all_findings)
        logger.info("[BG] Scan complete: score=%d, findings=%d", score, len(all_findings))

        if request.callbackUrl:
            await _send_callback(request.callbackUrl, {
                "scanId": request.scanId,
                "callbackToken": request.callbackToken,
                "status": "completed",
                "score": score,
                "verdict": verdict,
            })
    except Exception as exc:
        logger.error("[BG] Scan failed: %s", exc)
        if request.callbackUrl and request.scanId:
            try:
                await _send_callback(request.callbackUrl, {
                    "scanId": request.scanId,
                    "callbackToken": request.callbackToken,
                    "error": str(exc),
                })
            except Exception:
                logger.error("[BG] Failed to send error callback")


@app.post("/scan")
async def scan(request: ScanRequest, background_tasks: BackgroundTasks):
    if request.callbackUrl:
        background_tasks.add_task(_run_scan_and_callback, request)
        return {"status": "accepted", "scanId": request.scanId}
    else:
        result = await run_scan(request)
        return result
