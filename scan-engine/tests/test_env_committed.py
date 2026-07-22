from scanner.rules.env_committed import scan


def test_detects_env_with_real_values():
    files = {".env": "DATABASE_URL=postgresql://localhost:5432/mydb\nSECRET_KEY=abc123\n"}
    findings = scan(files)
    assert len(findings) == 1
    assert findings[0].ruleId == "env_committed"
    assert findings[0].severity == "critical"


def test_ignores_env_example():
    files = {".env.example": "DATABASE_URL=your_key_here\nSECRET_KEY=changeme\n"}
    findings = scan(files)
    assert len(findings) == 0


def test_ignores_env_sample():
    files = {".env.sample": "API_KEY=xxx\n"}
    findings = scan(files)
    assert len(findings) == 0


def test_ignores_env_local_example():
    files = {".env.local.example": "KEY=placeholder\n"}
    findings = scan(files)
    assert len(findings) == 0


def test_ignores_placeholder_values():
    files = {".env": "API_KEY=your_key_here\nDB_PASS=changeme\nTOKEN=TODO\n"}
    findings = scan(files)
    assert len(findings) == 0


def test_detects_nested_env():
    files = {"config/.env": "SECRET=real_value_123\n"}
    findings = scan(files)
    assert len(findings) == 1
