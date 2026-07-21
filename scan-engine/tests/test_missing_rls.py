from scanner.rules.missing_rls import scan

def test_detects_using_true():
    files = {"supabase/migrations/001.sql": "CREATE POLICY p ON t USING (true);"}
    findings = scan(files)
    assert len(findings) >= 1
    assert findings[0].ruleId == "missing_rls"

def test_ignores_proper_rls():
    files = {"supabase/migrations/001.sql": "CREATE POLICY p ON t USING (auth.uid() = user_id);"}
    findings = scan(files)
    assert len(findings) == 0
