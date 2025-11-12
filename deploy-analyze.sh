#!/bin/bash
set -e

echo "Deploying analyze-ad function..."

cd /tmp/cc-agent/59966544/project

# Read the function file
FUNCTION_CONTENT=$(cat supabase/functions/analyze-ad/index.ts)

echo "Function file size: $(echo "$FUNCTION_CONTENT" | wc -c) bytes"
echo "First 100 chars: $(echo "$FUNCTION_CONTENT" | head -c 100)"

echo "Done!"
