import re

from scanner.models import CandidateFinding

RULE_ID = "missing_rls"
SEVERITY = "high"

CONTEXT_LINES = 25

_PERMISSIVE_USING = re.compile(r"USING\s*\(\s*true\s*\)", re.IGNORECASE)
_PERMISSIVE_WITH_CHECK = re.compile(r"WITH\s+CHECK\s*\(\s*true\s*\)", re.IGNORECASE)
_FOR_ALL = re.compile(r"FOR\s+ALL\b", re.IGNORECASE)
_CREATE_TABLE = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[\"']?([\w.]+)[\"']?", re.IGNORECASE
)
_ENABLE_RLS = re.compile(
    r"ALTER\s+TABLE\s+[\"']?([\w.]+)[\"']?\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY",
    re.IGNORECASE,
)
_CREATE_POLICY = re.compile(r"CREATE\s+POLICY\b", re.IGNORECASE)

SQL_FILE_HINTS = (".sql",)
MIGRATION_DIR_HINTS = ("migrations/", "migrate/", "prisma/")


def _is_sql_or_migration(path: str) -> bool:
    lowered = path.lower()
    if lowered.endswith(SQL_FILE_HINTS):
        return True
    return any(hint in lowered for hint in MIGRATION_DIR_HINTS)


def _surrounding_code(lines: list[str], line_idx: int) -> str:
    start = max(0, line_idx - CONTEXT_LINES)
    end = min(len(lines), line_idx + CONTEXT_LINES + 1)
    return "\n".join(lines[start:end])


def _table_name(table_name: str) -> str:
    return table_name.rsplit(".", 1)[-1]


def scan(files: dict[str, str]) -> list[CandidateFinding]:
    findings: list[CandidateFinding] = []

    for path, content in files.items():
        if not _is_sql_or_migration(path):
            continue

        lines = content.splitlines()

        created_tables: list[tuple[str, int]] = []
        enabled_tables: set[str] = set()

        for line_idx, line in enumerate(lines):
            if _PERMISSIVE_USING.search(line):
                findings.append(
                    CandidateFinding(
                        ruleId=RULE_ID,
                        severity=SEVERITY,
                        title="Overly permissive Row Level Security policy",
                        description=(
                            f"`{path}` defines a policy with `USING (true)`, which "
                            "allows any user to read or write every row."
                        ),
                        filePath=path,
                        lineNumber=line_idx + 1,
                        matchedContent=line.strip(),
                        surroundingCode=_surrounding_code(lines, line_idx),
                    )
                )

            if _PERMISSIVE_WITH_CHECK.search(line):
                findings.append(
                    CandidateFinding(
                        ruleId=RULE_ID,
                        severity=SEVERITY,
                        title="Overly permissive Row Level Security policy",
                        description=(
                            f"`{path}` defines a policy with `WITH CHECK (true)`, "
                            "which allows any user to write any row."
                        ),
                        filePath=path,
                        lineNumber=line_idx + 1,
                        matchedContent=line.strip(),
                        surroundingCode=_surrounding_code(lines, line_idx),
                    )
                )

            if _FOR_ALL.search(line) and not _PERMISSIVE_USING.search(line):
                # FOR ALL without a USING clause on the same line is suspicious;
                # look a couple lines ahead for a USING clause before flagging.
                window = "\n".join(lines[line_idx : line_idx + 3])
                if "USING" not in window.upper():
                    findings.append(
                        CandidateFinding(
                            ruleId=RULE_ID,
                            severity=SEVERITY,
                            title="Policy applies to ALL commands without a USING clause",
                            description=(
                                f"`{path}` defines a `FOR ALL` policy with no "
                                "`USING` clause, so it may not restrict access."
                            ),
                            filePath=path,
                            lineNumber=line_idx + 1,
                            matchedContent=line.strip(),
                            surroundingCode=_surrounding_code(lines, line_idx),
                        )
                    )

            create_match = _CREATE_TABLE.search(line)
            if create_match:
                created_tables.append((create_match.group(1), line_idx))

            enable_match = _ENABLE_RLS.search(line)
            if enable_match:
                enabled_tables.add(_table_name(enable_match.group(1)))

            if _CREATE_POLICY.search(line):
                # Policies without USING(true)/WITH CHECK(true) still count as
                # "has RLS configured" — nothing further to flag here.
                pass

        for table_name, line_idx in created_tables:
            if _table_name(table_name) not in enabled_tables:
                findings.append(
                    CandidateFinding(
                        ruleId=RULE_ID,
                        severity=SEVERITY,
                        title=f"Table `{_table_name(table_name)}` has no Row Level Security enabled",
                        description=(
                            f"`{path}` creates table `{_table_name(table_name)}` but "
                            "never runs `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` "
                            "for it, so it may be readable/writable by anyone."
                        ),
                        filePath=path,
                        lineNumber=line_idx + 1,
                        matchedContent=lines[line_idx].strip(),
                        surroundingCode=_surrounding_code(lines, line_idx),
                    )
                )

    return findings
