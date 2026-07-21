from scanner.rules.exposed_keys import scan

def test_detects_stripe_key():
    files = {"src/lib/config.ts": 'const key = "sk_live_abcdefghijklmnopqrst";'}
    findings = scan(files)
    assert len(findings) == 1
    assert findings[0].ruleId == "exposed_keys"
    assert findings[0].severity == "critical"

def test_detects_supabase_service_role():
    files = {"src/config.ts": 'const key = "service_role";'}
    findings = scan(files)
    assert len(findings) >= 1

def test_ignores_env_example():
    files = {".env.example": 'STRIPE_KEY=sk_live_placeholder'}
    findings = scan(files)
    assert len(findings) == 0

def test_ignores_server_only_files():
    files = {"src/lib/server-config.ts": 'export const key = "sk_live_abcdefghijklmnopqrst";'}
    findings = scan(files)
    # Should still detect since it's in src/ (client-reachable)
    assert len(findings) >= 1
