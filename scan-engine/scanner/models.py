from pydantic import BaseModel


class ScanRequest(BaseModel):
    repoFullName: str       # "user/repo"
    repoUrl: str            # "https://github.com/user/repo"
    githubToken: str        # GitHub OAuth token
    defaultBranch: str      # "main"
    callbackUrl: str | None = None  # POST results here when done
    callbackToken: str | None = None  # passed back in callback for auth
    scanId: str | None = None       # passed back in callback


class CandidateFinding(BaseModel):
    ruleId: str
    severity: str           # "critical", "high", "medium", "low"
    title: str              # templated title
    description: str        # templated description (overwritten by LLM if available)
    filePath: str
    lineNumber: int | None = None
    matchedContent: str     # the actual matched line/snippet for LLM context
    surroundingCode: str    # ~50 lines around the match for LLM context


class Finding(BaseModel):
    ruleId: str
    severity: str
    title: str
    description: str
    filePath: str
    lineNumber: int | None = None
    fixPrompt: str | None = None
    fixDiff: str | None = None


class ScanResult(BaseModel):
    findings: list[Finding]
    score: int
    verdict: str            # "Ship it", "Fix first", "Do not ship"
