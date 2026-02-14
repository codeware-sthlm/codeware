#!/bin/bash
set -e

# Script to update health check configuration on existing Fly apps
# This updates the health check path from / or /admin to /api/health
# and adds grace_period if missing.

APPS=(
  "cdwr-cms"
  # Add other tenant apps here
)

echo "This script will update health check configuration on the following apps:"
printf '%s\n' "${APPS[@]}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

for app in "${APPS[@]}"; do
  echo "================================"
  echo "Updating health checks for: $app"
  echo "================================"

  config_file=tmp/fly."$app".toml

  # Pull current config
  fly config save -a "$app" -c "$config_file" -y

  # The config is saved to fly.toml in current directory
  # We need to update the health check path
  if [ -f "$config_file" ]; then
    # Use sed to update the health check path
    # This preserves all other settings
    sed -i.bak "s|path = '/'|path = '/api/health'|g" "$config_file"
    sed -i.bak "s|path = '/admin'|path = '/api/health'|g" "$config_file"

    # Add grace_period if the line doesn't exist
    if ! grep -q "grace_period" "$config_file"; then
      # Insert grace_period after the checks line
      sed -i.bak '/\[\[http_service\.checks\]\]/a\
  grace_period = "10s"' "$config_file"
    fi

    echo "Updated config:"
    grep -A 5 "http_service.checks" "$config_file" || echo "No health checks found"
    echo ""

    read -p "Apply this config to $app? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      # Get current image to avoid rebuilding
      echo "Getting current image..."
      current_image=$(fly status -a "$app" --json 2>/dev/null | jq -r '.Machines[0].config.image // empty')

      if [ -n "$current_image" ]; then
        echo "Reusing image: $current_image"
        # Deploy with existing image (config-only update)
        fly deploy -a "$app" --config "$config_file" --image "$current_image"
      else
        echo "⚠️  Could not determine current image, rebuilding..."
        # Fallback to rebuild if image detection fails
        fly deploy -a "$app" --config "$config_file"
      fi
      echo "✅ Updated $app"
    else
      echo "⏭️  Skipped $app"
    fi

    # Cleanup
    #rm -f "$config_file" "$config_file.bak"
  else
    echo "⚠️  Could not save config for $app"
  fi

  echo ""
done

echo "================================"
echo "Done!"
echo "================================"
