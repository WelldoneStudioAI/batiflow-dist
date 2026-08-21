#!/usr/bin/env bash
# Structural checks for the operating system documents in batiflow-os/.
# Verifies presence, section structure of the department processes, and that every
# cross-reference and relative link resolves. Content quality is a human job; this
# only guarantees the system is navigable and complete.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
OS_DIR="batiflow-os"
fail=0
note() { printf '%s\n' "$*"; }
bad()  { printf 'FAIL: %s\n' "$*"; fail=1; }

# --- 1. core protocol files -------------------------------------------------
CORE="README.md
01_AGENT_OPERATING_POLICY.md
02_IMPACT_MAPPING_PROTOCOL.md
03_REGRESSION_VALIDATION_PROTOCOL.md
04_DEFINITION_OF_DONE.md
05_CHANGE_REQUEST_TEMPLATE.md
06_LIVING_APP_MAP.md
07_COMPLETION_REPORT_TEMPLATE.md
08_ADOPTION_GUIDE.md"
missing=0
for f in $CORE; do
  [ -f "$OS_DIR/$f" ] || { bad "missing $OS_DIR/$f"; missing=1; }
done
[ "$missing" -eq 0 ] && note "PASS  core protocol files present (9)"

# --- 2. department files ----------------------------------------------------
DEPTS=$(ls "$OS_DIR/departments"/D[0-9][0-9]_*.md 2>/dev/null)
count=$(printf '%s\n' "$DEPTS" | grep -c '\.md$')
[ -f "$OS_DIR/departments/README.md" ] || bad "missing $OS_DIR/departments/README.md"
if [ "$count" -lt 1 ]; then
  bad "no department files found"
else
  note "PASS  department files present ($count)"
fi

# --- 3. department section structure ---------------------------------------
SECTIONS="## 1. Mandate
## 2. Seniority bar
## 3. Inputs and outputs
## 4. Process
## 5. Risk tier and escalation
## 6. Evidence standard
## 7. Anti-patterns
## 8. Handoff contract
## 9. Department checklist
## 10. BatiFlow notes"
struct_ok=1
for f in $DEPTS; do
  n=1
  while IFS= read -r want; do
    got=$(grep -n '^## ' "$f" | sed -n "${n}p" | cut -d: -f2-)
    case "$got" in
      "$want"*) ;;
      *) bad "$f — section $n should start with '$want', found '${got:-<none>}'"; struct_ok=0 ;;
    esac
    n=$((n + 1))
  done <<< "$SECTIONS"
done
[ "$struct_ok" -eq 1 ] && note "PASS  every department file has the 10 canonical sections in order"

# --- 4. relative markdown links resolve ------------------------------------
links_ok=1
while IFS= read -r src; do
  dir=$(dirname "$src")
  for target in $(grep -o '](\([A-Za-z0-9_./-]*\.md\))' "$src" | sed 's/^](//;s/)$//'); do
    [ -f "$dir/$target" ] || { bad "$src → broken link: $target"; links_ok=0; }
  done
done < <(find "$OS_DIR" -name '*.md')
[ "$links_ok" -eq 1 ] && note "PASS  every relative markdown link resolves"

# --- 5. protocol references resolve ----------------------------------------
refs_ok=1
# \b keeps department filenames (D01_…) from matching as protocol references.
for ref in $(grep -rhoE '\b0[0-9]_[A-Z_]+\.md' --include='*.md' . | sort -u); do
  [ -f "$OS_DIR/$ref" ] || { bad "referenced protocol file does not exist: $ref"; refs_ok=0; }
done
[ "$refs_ok" -eq 1 ] && note "PASS  every referenced protocol file exists"

# --- 6. department index lists every department ----------------------------
index_ok=1
for f in $DEPTS; do
  base=$(basename "$f")
  grep -q "$base" "$OS_DIR/departments/README.md" \
    || { bad "departments/README.md does not list $base"; index_ok=0; }
done
[ "$index_ok" -eq 1 ] && note "PASS  department index lists every department"

# --- 7. referenced scripts exist -------------------------------------------
# Scripts the docs prescribe for the *private source* repository cannot exist here;
# they are listed so the exemption is visible rather than silent.
EXTERNAL_SCRIPTS=" scripts/check.sh "
scripts_ok=1
for s in $(grep -rhoE 'scripts/[a-z_]+\.sh' --include='*.md' . | sort -u); do
  case "$EXTERNAL_SCRIPTS" in
    *" $s "*) note "      note: $s is prescribed for the app repository — not expected here" ; continue ;;
  esac
  [ -f "$s" ] || { bad "referenced script does not exist: $s"; scripts_ok=0; }
done
[ "$scripts_ok" -eq 1 ] && note "PASS  every referenced script exists"

exit "$fail"
