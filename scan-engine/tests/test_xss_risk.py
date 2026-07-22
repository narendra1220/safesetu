from scanner.rules.xss_risk import scan


def test_detects_dangerous_inner_html():
    files = {
        "src/components/Post.tsx": '<div dangerouslySetInnerHTML={{ __html: content }} />'
    }
    findings = scan(files)
    assert len(findings) == 1
    assert findings[0].ruleId == "xss_risk"
    assert findings[0].severity == "high"


def test_detects_in_jsx():
    files = {
        "src/components/Render.jsx": '<span dangerouslySetInnerHTML={{ __html: data }} />'
    }
    findings = scan(files)
    assert len(findings) == 1


def test_ignores_normal_jsx():
    files = {
        "src/components/Safe.tsx": "<div>{sanitizedContent}</div>"
    }
    findings = scan(files)
    assert len(findings) == 0


def test_ignores_non_jsx_files():
    files = {
        "src/utils/helper.ts": "// dangerouslySetInnerHTML mentioned in comment"
    }
    findings = scan(files)
    assert len(findings) == 0


def test_multiple_occurrences():
    code = (
        '<div dangerouslySetInnerHTML={{ __html: a }} />\n'
        '<p dangerouslySetInnerHTML={{ __html: b }} />'
    )
    files = {"src/page.tsx": code}
    findings = scan(files)
    assert len(findings) == 2
