from scanner.rules.unauth_routes import scan

def test_detects_unauth_get():
    files = {"app/api/users/route.ts": "export async function GET() { return Response.json([]); }"}
    findings = scan(files)
    assert len(findings) >= 1
    assert findings[0].severity == "high"

def test_allows_auth_checked_route():
    files = {"app/api/users/route.ts": "export async function GET() { const s = await auth(); return Response.json([]); }"}
    findings = scan(files)
    assert len(findings) == 0
