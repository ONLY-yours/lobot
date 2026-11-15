#!/usr/bin/env bash
# Decide whether a main commit ships an automatic patch release.
#
# Usage: planAutoRelease.sh <sha>
# Prints `release=true|false`, `version`, `tag` and `reason` as GitHub output
# lines; the caller appends them to $GITHUB_OUTPUT.
#
# - Base: the nearest `v*` tag reachable from <sha>; the commits after it are
#   what this release would ship. Looking at the whole range (not just the
#   pushed commits) keeps changes from superseded CI runs from being dropped.
# - Trigger: any of those commits is a user-facing type (feat / fix / style /
#   perf, with or without a leading gitmoji). `[skip release]` in the head
#   commit opts out.
# - Version: the highest plain `vX.Y.Z` tag plus 0.0.1, or 0.0.1 when only the
#   early date-stamped prereleases (v0.0.0-YYYYMMDD.N) exist.

set -euo pipefail

SHA="${1:?usage: planAutoRelease.sh <sha>}"
RELEASE_TYPES='feat|fix|style|perf'

skip() {
  echo "release=false"
  echo "reason=$1"
  exit 0
}

# Capture git output before grepping: `grep -q` exits on the first match, and
# under pipefail the writer's SIGPIPE would turn that match into a failure.
HEAD_TAGS="$(git tag --points-at "$SHA" --list 'v*')"
if [ -n "$HEAD_TAGS" ]; then
  skip "already tagged: ${HEAD_TAGS%%$'\n'*}"
fi

HEAD_MESSAGE="$(git log -1 --format=%B "$SHA")"
if grep -qiF '[skip release]' <<< "$HEAD_MESSAGE"; then
  skip 'head commit asks for [skip release]'
fi

BASE="$(git describe --tags --abbrev=0 --match 'v*' "$SHA" 2>/dev/null || true)"
RANGE="${BASE:+$BASE..}$SHA"

# Subjects look like `✨ feat: …`, `💄 style(scope): …` or plain `fix: …`.
SUBJECTS="$(git log --format=%s "$RANGE")"
if ! grep -Eq "^([^ ]+ )?(${RELEASE_TYPES})(\([^)]*\))?!?:" <<< "$SUBJECTS"; then
  skip "no ${RELEASE_TYPES//|/ / } commits since ${BASE:-the first commit}"
fi

TAGS="$(git tag --list 'v*')"
LATEST="$(grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' <<< "$TAGS" | sort -V | tail -1 || true)"
IFS=. read -r MAJOR MINOR PATCH <<< "${LATEST#v}"
VERSION="${MAJOR:-0}.${MINOR:-0}.$(( ${PATCH:-0} + 1 ))"

echo "release=true"
echo "version=${VERSION}"
echo "tag=v${VERSION}"
echo "reason=$(git rev-list --count "$RANGE") commits since ${BASE:-the first commit}, latest ${LATEST:-none}"
