from scanner.rules.cors_misconfigured import scan


def test_detects_wildcard_access_control():
    files = {
        "src/api/handler.ts": 'res.setHeader("Access-Control-Allow-Origin", "*");'
    }
    findings = scan(files)
    assert len(findings) == 1
    assert findings[0].ruleId == "cors_misconfigured"
    assert findings[0].severity == "high"


def test_detects_origin_star():
    files = {"server.ts": "const corsConfig = { origin: \"*\" };"}
    findings = scan(files)
    assert len(findings) == 1


def test_detects_origin_true():
    files = {"server.ts": "const corsConfig = { origin: true };"}
    findings = scan(files)
    assert len(findings) == 1


def test_detects_nextjs_allowed_origins():
    files = {"next.config.js": 'allowedOrigins: ["*"]'}
    findings = scan(files)
    assert len(findings) == 1


def test_ignores_proper_cors():
    files = {
        "server.ts": 'const corsConfig = { origin: "https://myapp.com" };'
    }
    findings = scan(files)
    assert len(findings) == 0


def test_ignores_non_target_files():
    files = {"README.md": 'Access-Control-Allow-Origin: *'}
    findings = scan(files)
    assert len(findings) == 0
