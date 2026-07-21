from scanner.rules.unverified_webhooks import scan

def test_detects_unverified_webhook():
    files = {"app/api/webhooks/stripe/route.ts": "export async function POST(req: Request) { const body = await req.json(); }"}
    findings = scan(files)
    assert len(findings) >= 1

def test_allows_verified_webhook():
    files = {"app/api/webhooks/stripe/route.ts": "export async function POST(req: Request) { const sig = headers.get('stripe-signature'); stripe.webhooks.constructEvent(body, sig, secret); }"}
    findings = scan(files)
    assert len(findings) == 0
