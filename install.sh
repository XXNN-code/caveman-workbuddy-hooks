#!/bin/sh
set -eu

REF="v4.2.0"
BASE="https://raw.githubusercontent.com/JuliusBrussee/caveman/${REF}/src/hooks"
DEST="${HOME}/.workbuddy/caveman-hooks"

mkdir -p "$DEST"
for f in caveman-config.js caveman-parse.js; do
  curl -fsSL "${BASE}/${f}" -o "${DEST}/${f}"
done
cp hooks/session-start.js hooks/user-prompt-submit.js "$DEST/"

echo "Installed WorkBuddy caveman hooks to $DEST"
echo "Add SessionStart and UserPromptSubmit entries to ~/.workbuddy/settings.json (see README.md)."
