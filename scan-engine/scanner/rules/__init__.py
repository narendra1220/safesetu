from scanner.rules import (
    client_writable,
    cors_misconfigured,
    env_committed,
    exposed_keys,
    idor_risk,
    insecure_config,
    missing_rls,
    sql_injection,
    unauth_routes,
    unverified_webhooks,
    xss_risk,
)

ALL_RULES = [
    exposed_keys,
    missing_rls,
    unauth_routes,
    unverified_webhooks,
    client_writable,
    env_committed,
    cors_misconfigured,
    xss_risk,
    sql_injection,
    idor_risk,
    insecure_config,
]

__all__ = [
    "exposed_keys",
    "missing_rls",
    "unauth_routes",
    "unverified_webhooks",
    "client_writable",
    "env_committed",
    "cors_misconfigured",
    "xss_risk",
    "sql_injection",
    "idor_risk",
    "insecure_config",
    "ALL_RULES",
]
