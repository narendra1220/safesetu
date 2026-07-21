"""Reads scannable source files out of a GitHub repo.

Uses the Contents API for small repos, and falls back to a shallow
`git clone` into a temp directory for large repos to avoid hammering
the GitHub API rate limit.
"""

import asyncio
import os
import shutil
import tempfile

import git

from scanner.github_client import get_file_content, list_repo_tree

SCANNABLE_EXTENSIONS = (
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".vue",
    ".svelte",
    ".sql",
)

MIGRATION_HINTS = ("migrations/", "migrate/", "prisma/")

EXCLUDED_DIR_PARTS = (
    "node_modules/",
    ".next/",
    "dist/",
    "build/",
)

EXCLUDED_FILE_MARKERS = (".test.", ".spec.")

CLONE_THRESHOLD = 200


def _is_migration_file(path: str) -> bool:
    lowered = path.lower()
    return any(hint in lowered for hint in MIGRATION_HINTS) and path.endswith(".sql")


def is_scannable_path(path: str) -> bool:
    lowered = path.lower()

    if any(part in lowered for part in EXCLUDED_DIR_PARTS):
        return False

    if "__tests__/" in lowered:
        return False

    if any(marker in lowered for marker in EXCLUDED_FILE_MARKERS):
        return False

    basename = path.rsplit("/", 1)[-1]
    if basename.startswith(".env") and basename != ".env.example":
        return False

    if path.endswith(SCANNABLE_EXTENSIONS):
        return True

    if _is_migration_file(path):
        return True

    return False


async def _read_via_contents_api(
    token: str, repo_full_name: str, branch: str, paths: list[str]
) -> dict[str, str]:
    results: dict[str, str] = {}

    semaphore = asyncio.Semaphore(10)

    async def _fetch(path: str) -> None:
        async with semaphore:
            try:
                content = await get_file_content(token, repo_full_name, path, branch)
                results[path] = content
            except Exception:
                # Skip files that fail to fetch (deleted, too large, binary, etc.)
                pass

    await asyncio.gather(*(_fetch(p) for p in paths))
    return results


def _read_via_clone(repo_url: str, token: str, branch: str, paths: list[str]) -> dict[str, str]:
    results: dict[str, str] = {}
    tmp_dir = tempfile.mkdtemp(prefix="safesetu-scan-")

    try:
        authed_url = repo_url
        if repo_url.startswith("https://") and token:
            authed_url = repo_url.replace("https://", f"https://x-access-token:{token}@", 1)

        git.Repo.clone_from(
            authed_url,
            tmp_dir,
            branch=branch,
            depth=1,
            single_branch=True,
        )

        wanted = set(paths)
        for path in wanted:
            full_path = os.path.join(tmp_dir, path)
            if not os.path.isfile(full_path):
                continue
            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    results[path] = f.read()
            except Exception:
                continue
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return results


async def read_repo_files(
    token: str, repo_full_name: str, branch: str, repo_url: str | None = None
) -> dict[str, str]:
    """Return a dict mapping scannable file_path -> file content for the repo."""
    tree = await list_repo_tree(token, repo_full_name, branch)
    scannable_paths = [item["path"] for item in tree if is_scannable_path(item["path"])]

    if not scannable_paths:
        return {}

    if len(scannable_paths) <= CLONE_THRESHOLD:
        return await _read_via_contents_api(token, repo_full_name, branch, scannable_paths)

    resolved_repo_url = repo_url or f"https://github.com/{repo_full_name}"
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None, _read_via_clone, resolved_repo_url, token, branch, scannable_paths
    )
