from scanner.rules import (
    client_writable,
    exposed_keys,
    missing_rls,
    unauth_routes,
    unverified_webhooks,
)

ALL_RULES = [
    exposed_keys,
    missing_rls,
    unauth_routes,
    unverified_webhooks,
    client_writable,
]

__all__ = [
    "exposed_keys",
    "missing_rls",
    "unauth_routes",
    "unverified_webhooks",
    "client_writable",
    "ALL_RULES",
]
