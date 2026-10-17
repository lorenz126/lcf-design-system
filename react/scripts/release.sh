#!/usr/bin/env bash
# A release is a tag on a commit that carries the BUILT package.
#
#   bash scripts/release.sh 0.4.0
#
# WHY NOT BUILD ON INSTALL. Installed from git, the package used to build
# itself in `prepare`. pnpm stopped allowing that: measured with pnpm
# 12.14, a git dependency with a build script fails the install outright
# (ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED) until the app allowlists it in
# `allowBuilds` (pnpm 10: `onlyBuiltDependencies`). npm under @lcf is not
# an option — that scope belongs to an existing npm org — and GitHub
# Packages wants a token from every app, even for a public package.
#
# So the tag points at a commit made for it alone: the branch's tree,
# plus react/dist (built here, force-added past .gitignore), with the
# `prepare` script removed and the version set. Installing
# `github:…#v0.4.0&path:/react` then runs nothing. The branch itself never
# carries dist — the release commit hangs off it, reachable only through
# its tag.
#
# Everything is checked BEFORE anything is committed: the whole suite,
# and the package from the outside.
set -euo pipefail

version="${1:?usage: release.sh <version>, e.g. 0.4.0}"
tag="v$version"
here="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
cd "$repo"

branch="$(git branch --show-current)"
[ "$branch" = "react" ] || { echo "  release from branch react, not '$branch'"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "  the tree is not clean"; exit 1; }
if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then echo "  $tag exists already"; exit 1; fi
grep -q "^## $version — " react/CHANGELOG.md || { echo "  react/CHANGELOG.md has no '## $version — <date>' section"; exit 1; }

echo "  checking — the whole suite, then the package from outside"
(cd react && pnpm test && pnpm verify:consumer)

echo "  building"
(cd react && pnpm build)

base="$(git rev-parse HEAD)"
git switch -q --detach
trap 'git switch -q "$branch"' EXIT

node -e '
  const fs = require("fs"); const p = "react/package.json"
  const pkg = JSON.parse(fs.readFileSync(p, "utf8"))
  pkg.version = process.argv[1]
  delete pkg.scripts.prepare
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n")
' "$version"

git add -f react/dist react/package.json
git commit -q -m "release $tag — the built package, installable from git without a build step

Built from $(git rev-parse --short "$base") on branch $branch. react/dist is
committed here and nowhere else; react/package.json has no prepare script
and says $version.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git tag -a "$tag" -m "$tag"

echo "  tagged $tag at $(git rev-parse --short HEAD), built from $(git rev-parse --short "$base")"

# The promise, kept: the tag installs with the newest pnpm, from git,
# with nothing allowlisted, and arrives built.
echo "  installing $tag with the newest pnpm, nothing allowlisted"
app="$(mktemp -d)"
printf '{ "name": "release-check", "private": true, "type": "module", "dependencies": { "@lcf/design": "git+file://%s#%s&path:/react", "react": "^19.3.0", "react-dom": "^19.3.0" } }\n' "$repo" "$tag" > "$app/package.json"
if ! (cd "$app" && npx -y pnpm@latest install --silent >/dev/null 2>"$app/err.log") \
  || [ ! -f "$app/node_modules/@lcf/design/dist/components/Button/index.js" ]; then
  cat "$app/err.log" 2>/dev/null | tail -5
  echo "  $tag does not install built. Not pushed; remove it with: git tag -d $tag"
  exit 1
fi
(cd "$app" && node --input-type=module -e "import('@lcf/design/i18n').then(m => { if (m.createFormat('de-CH').number(10410, { minimumFractionDigits: 2 }) !== \"10'410.00\") process.exit(1) })") \
  || { echo "  $tag installs but does not import. Not pushed; remove it with: git tag -d $tag"; exit 1; }
echo "  $tag installs built and imports"
echo "  push it with:  git push origin $tag"
