from scanner.models import Finding

SEVERITY_WEIGHTS = {"critical": 20, "high": 15, "medium": 10, "low": 5}


def calculate_score(findings: list[Finding]) -> tuple[int, str]:
    score = 100
    for f in findings:
        score -= SEVERITY_WEIGHTS.get(f.severity, 5)
    score = max(0, score)

    if score >= 80:
        verdict = "Ship it"
    elif score >= 50:
        verdict = "Fix first"
    else:
        verdict = "Do not ship"

    return score, verdict
