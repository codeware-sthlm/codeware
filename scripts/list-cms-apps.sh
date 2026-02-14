#!/bin/bash
# List all Fly apps starting with 'cdwr-cms' to help populate the update script

echo "Finding all CMS apps in your Fly account..."
echo ""

flyctl apps list --json | jq -r '.[] | select(.Name | startswith("cdwr-cms")) | .Name' | sort

echo ""
echo "Copy these app names into scripts/update-health-checks.sh"
