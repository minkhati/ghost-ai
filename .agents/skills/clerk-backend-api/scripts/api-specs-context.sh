#!/usr/bin/env bash

# Fetches all available BAPI spec versions, determines the latest,
# and extracts tags from it. Output is used as skill context.

set -euo pipefail

API_URL="https://api.github.com/repos/clerk/openapi-specs/contents/bapi"
RAW_BASE="https://raw.githubusercontent.com/clerk/openapi-specs/main/bapi"

# Fetch version list, parse dates, sort, pick latest
versions=$(curl -sf "$API_URL" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    let parsed;
    try { parsed = JSON.parse(d); } catch(e) {
      process.stderr.write('ERROR: failed to parse GitHub API response as JSON\n');
      process.exit(1);
    }
    if (!Array.isArray(parsed)) {
      process.stderr.write('ERROR: GitHub API response is not an array\n');
      process.exit(1);
    }
    const items = parsed
      .map(i=>i.name)
      .filter(n=>/^\d{4}-\d{2}-\d{2}\.yml$/.test(n))
      .sort();
    if (items.length === 0) {
      process.stderr.write('ERROR: no versioned spec files found\n');
      process.exit(1);
    }
    items.forEach(n=>console.log(n));
  });
") || { echo "ERROR: curl request to GitHub API failed" >&2; exit 1; }

if [[ -z "$versions" ]]; then
  echo "ERROR: no spec versions found" >&2
  exit 1
fi

latest=$(echo "$versions" | tail -1)

echo "AVAILABLE VERSIONS: $(echo "$versions" | tr '\n' ' ')"
echo "LATEST VERSION: $latest"
echo ""
echo "TAGS:"
curl -s "${RAW_BASE}/${latest}" | node "$(dirname "$0")/extract-tags.js"
