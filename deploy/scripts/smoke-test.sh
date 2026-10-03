#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
echo "Running smoke tests against: ${BASE_URL}"

# 1. Healthcheck
echo -n "Checking API health endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/actuator/health")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 401 ]; then
    echo "OK (HTTP ${HTTP_CODE})"
else
    echo "FAILED (HTTP ${HTTP_CODE})"
    exit 1
fi

# 2. Check OpenAPI Docs
echo -n "Checking OpenAPI swagger endpoint... "
DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/v3/api-docs")
if [ "$DOCS_CODE" -eq 200 ]; then
    echo "OK (HTTP ${DOCS_CODE})"
else
    echo "FAILED (HTTP ${DOCS_CODE})"
    exit 1
fi

echo "Smoke tests passed successfully!"
