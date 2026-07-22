from scanner.rules.idor_risk import scan


def test_detects_unscoped_find_unique():
    code = """\
export async function getRepo(repoId: string) {
  const repo = await prisma.repo.findUnique({
    where: { id: repoId },
  });
  return repo;
}
"""
    files = {"app/api/repos/route.ts": code}
    findings = scan(files)
    assert len(findings) == 1
    assert findings[0].ruleId == "idor_risk"
    assert findings[0].severity == "high"


def test_ignores_user_scoped_query():
    code = """\
export async function getRepo(repoId: string, userId: string) {
  const repo = await prisma.repo.findUnique({
    where: { id: repoId, userId: userId },
  });
  return repo;
}
"""
    files = {"app/api/repos/route.ts": code}
    findings = scan(files)
    assert len(findings) == 0


def test_detects_unscoped_delete():
    code = """\
export async function deleteItem(itemId: string) {
  await prisma.item.delete({
    where: { id: itemId },
  });
}
"""
    files = {"app/actions.ts": code}
    findings = scan(files)
    assert len(findings) == 1


def test_ignores_non_target_files():
    code = """\
const repo = await prisma.repo.findUnique({
  where: { id: repoId },
});
"""
    files = {"src/components/List.tsx": code}
    findings = scan(files)
    assert len(findings) == 0
