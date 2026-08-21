#!/usr/bin/env bash
# Mechanical invariant checks for appcast.xml (batiflow-os/06 §2).
# Covers invariants 1, 3, 5, 7. Invariants 2, 4, 6 (bundle version match, EdDSA signature,
# minimumSystemVersion policy) require the app bundle and the release key: verify them in the
# source repository and disclose them as gaps here.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
FEED="appcast.xml"
fail=0
note() { printf '%s\n' "$*"; }
bad()  { printf 'FAIL: %s\n' "$*"; fail=1; }

# 7 — well-formed XML
if command -v xmllint >/dev/null 2>&1; then
  xmllint --noout "$FEED" && note "PASS  well-formed XML" || bad "XML is not well-formed"
else
  note "SKIP  xmllint not installed — XML well-formedness NOT CHECKED"
fi

# 1 — sparkle:version strictly decreasing down the file (newest first)
versions=$(grep -o '<sparkle:version>[0-9]*</sparkle:version>' "$FEED" \
           | grep -o '[0-9]\+' || true)
note "      builds in feed: $(echo "$versions" | tr '\n' ' ')"
prev=""; order_ok=1
for v in $versions; do
  if [ -n "$prev" ] && [ "$v" -ge "$prev" ]; then
    bad "build $v is not lower than the preceding entry $prev (feed must list newest first, strictly increasing versions)"
    order_ok=0
  fi
  prev="$v"
done
[ "$order_ok" -eq 1 ] && note "PASS  build numbers strictly ordered"

# 3 + 5 — enclosure reachable and declared length matches the real artifact.
# A ranged GET is used rather than HEAD: GitHub redirects release assets to a signed
# object store that rejects HEAD, and the total size comes back in Content-Range.
url=$(grep -o 'url="[^"]*"' "$FEED" | head -1 | cut -d'"' -f2)
declared=$(grep -o 'length="[0-9]*"' "$FEED" | head -1 | grep -o '[0-9]\+')
note "      enclosure: $url"
note "      declared length: ${declared:-<none>}"
if [ -z "$url" ] || [ -z "$declared" ]; then
  bad "enclosure url or length missing from the newest item"
else
  probe=$(curl -sL -r 0-0 -o /dev/null -D - -w 'FINAL:%{http_code}' --max-time 60 "$url" 2>/dev/null)
  code=$(printf '%s' "$probe" | grep -o 'FINAL:[0-9]*' | cut -d: -f2)
  actual=$(printf '%s' "$probe" | grep -i '^content-range:' | tail -1 | sed 's|.*/||' | tr -dc '0-9')
  case "$code" in
    200|206) note "PASS  enclosure reachable (HTTP $code)" ;;
    "")      note "SKIP  no network — enclosure reachability and size NOT CHECKED" ;;
    *)       bad  "enclosure not reachable (HTTP $code)" ;;
  esac
  if [ -n "$actual" ]; then
    [ "$actual" = "$declared" ] && note "PASS  length matches artifact ($actual)" \
                                || bad "length mismatch: declared $declared, actual $actual"
  elif [ -n "$code" ]; then
    note "SKIP  no Content-Range in response — artifact size NOT CHECKED"
  fi
fi

# 4 — signature presence (not verification)
grep -q 'sparkle:edSignature="[^"]\+"' "$FEED" \
  && note "PASS  edSignature present (NOT verified here — needs the release key)" \
  || bad "edSignature missing"

exit "$fail"
