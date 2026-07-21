"""Thin async client around the GitHub REST API v3."""

import base64

import httpx

GITHUB_API_BASE = "https://api.github.com"


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _check_rate_limit(resp: httpx.Response) -> None:
    remaining = resp.headers.get("X-RateLimit-Remaining")
    if remaining is not None and remaining.isdigit() and int(remaining) == 0:
        reset = resp.headers.get("X-RateLimit-Reset", "unknown")
        raise RuntimeError(
            f"GitHub API rate limit exceeded. Resets at epoch {reset}."
        )


async def list_repo_tree(token: str, repo_full_name: str, branch: str) -> list[dict]:
    """Return a list of {"path": str, "size": int} for every blob in the repo tree."""
    url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/git/trees/{branch}"
    params = {"recursive": "1"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=_headers(token), params=params)
        _check_rate_limit(resp)
        resp.raise_for_status()
        data = resp.json()

    tree = data.get("tree", [])
    return [
        {"path": item["path"], "size": item.get("size", 0)}
        for item in tree
        if item.get("type") == "blob"
    ]


async def get_file_content(
    token: str, repo_full_name: str, file_path: str, branch: str
) -> str:
    """Fetch a single file's content via the Contents API, decoded from base64."""
    url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/contents/{file_path}"
    params = {"ref": branch}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=_headers(token), params=params)
        _check_rate_limit(resp)
        resp.raise_for_status()
        data = resp.json()

    content_b64 = data.get("content", "")
    encoding = data.get("encoding", "base64")
    if encoding != "base64":
        raise ValueError(f"Unexpected encoding '{encoding}' for {file_path}")

    try:
        return base64.b64decode(content_b64).decode("utf-8", errors="replace")
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError(f"Failed to decode content for {file_path}: {exc}") from exc
