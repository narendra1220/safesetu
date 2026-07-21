import logging

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from scanner import run_scan
from scanner.models import ScanRequest, ScanResult

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


async def _run_scan_and_callback(request: ScanRequest):
    """Run scan in background, POST results to callback URL."""
    try:
        logger.info("[BG] Starting background scan for %s (scanId=%s)", request.repoFullName, request.scanId)
        result = await run_scan(request)
        logger.info("[BG] Scan complete: score=%d, findings=%d", result.score, len(result.findings))

        if request.callbackUrl:
            payload = {
                "scanId": request.scanId,
                "score": result.score,
                "verdict": result.verdict,
                "findings": [f.model_dump() for f in result.findings],
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(request.callbackUrl, json=payload)
                logger.info("[BG] Callback response: %d", resp.status_code)
    except Exception as exc:
        logger.error("[BG] Scan failed: %s", exc)
        if request.callbackUrl and request.scanId:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(request.callbackUrl, json={
                        "scanId": request.scanId,
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
