from scanner.rules.insecure_config import scan


def test_detects_wildcard_image_domains():
    files = {
        "next.config.js": "images: { domains: ['*'] },"
    }
    findings = scan(files)
    assert len(findings) == 1
    assert findings[0].ruleId == "insecure_config"
    assert findings[0].severity == "medium"


def test_detects_wildcard_remote_patterns():
    files = {
        "next.config.mjs": 'images: { remotePatterns: ["*"] },'
    }
    findings = scan(files)
    assert len(findings) == 1


def test_detects_debug_true():
    files = {
        "config.ts": "const config = { debug: true, verbose: false };"
    }
    findings = scan(files)
    assert len(findings) == 1


def test_detects_node_env_debug():
    files = {
        "app.ts": 'if (NODE_ENV !== "production") { debug("enabled"); }'
    }
    findings = scan(files)
    assert len(findings) == 1


def test_ignores_debug_false():
    files = {
        "config.ts": "const config = { debug: false };"
    }
    findings = scan(files)
    assert len(findings) == 0


def test_ignores_non_target_files():
    files = {
        "README.md": "debug: true"
    }
    findings = scan(files)
    assert len(findings) == 0
