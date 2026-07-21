from scanner.rules.client_writable import scan

def test_detects_role_update():
    files = {"src/components/settings.tsx": "await supabase.from('users').update({ role: 'admin' })"}
    findings = scan(files)
    assert len(findings) >= 1
    assert findings[0].severity == "medium"

def test_ignores_safe_update():
    files = {"src/components/profile.tsx": "await supabase.from('users').update({ name: 'test' })"}
    findings = scan(files)
    assert len(findings) == 0
