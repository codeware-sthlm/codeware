#!/bin/bash

############################################################
### Drop pull request database to be able to start fresh ###
############################################################

drop_db() {
  local app_name="pg-preview"
  local db_name="cdwr_cms_pr_$1"
  local password="$2"

  # Simple drop commands
  local connection_string="postgres://postgres:$password@localhost:5432"

  fly -a "$app_name" ssh console --command "psql $connection_string -c \"DROP DATABASE IF EXISTS \\\"$db_name\\\" WITH (FORCE);\""
}

# Example usage:
# ./drop-db.sh 201 cluster_password
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 pr_number cluster_password"
  exit 1
fi

drop_db "$1" "$2"
