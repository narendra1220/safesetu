from scanner.rules.sql_injection import scan


def test_detects_raw_query_interpolation():
    files = {
        "src/db.ts": 'const result = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;'
    }
    findings = scan(files)
    assert len(findings) == 1
    assert findings[0].ruleId == "sql_injection"
    assert findings[0].severity == "critical"


def test_detects_execute_raw_interpolation():
    files = {
        "src/db.ts": 'await prisma.$executeRaw`DELETE FROM sessions WHERE id = ${sessionId}`;'
    }
    findings = scan(files)
    assert len(findings) == 1


def test_detects_sql_string_concat():
    files = {
        "src/query.ts": 'const q = "SELECT * FROM users WHERE id = " + id;'
    }
    findings = scan(files)
    assert len(findings) == 1


def test_detects_query_template_interpolation():
    files = {
        "src/db.js": 'db.query(`SELECT * FROM users WHERE name = ${name}`);'
    }
    findings = scan(files)
    assert len(findings) == 1


def test_ignores_prisma_sql_tagged():
    files = {
        "src/db.ts": 'const result = await prisma.$queryRaw(Prisma.sql`SELECT * FROM users WHERE id = ${userId}`);'
    }
    findings = scan(files)
    assert len(findings) == 0


def test_ignores_non_target_files():
    files = {
        "README.md": '$queryRaw`SELECT ${id}`'
    }
    findings = scan(files)
    assert len(findings) == 0
