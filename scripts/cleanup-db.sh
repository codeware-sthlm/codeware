#!/bin/bash

#########################################################################
### Delete pull request database and user when the PR has been closed ###
### and the data is just dangling around, filling up the database.    ###
###                                                                   ###
### A smarter solution would be preferred but this simple script      ###
### will do the work for now.                                         ###
#########################################################################

cleanup_db() {
  local app_name="pg-preview"
  local db_name="cdwr_cms_pr_$1"
  local user_name="$db_name"
  local password="$2"

  # Simple drop commands
  local connection_string="postgres://postgres:$password@localhost:5432"

  fly -a "$app_name" ssh console --command "psql $connection_string -c \"DROP DATABASE IF EXISTS \\\"$db_name\\\" WITH (FORCE);\" -c \"DROP USER IF EXISTS \\\"$user_name\\\";\""
}

# Example usage:
# ./cleanup-db.sh 201 cluster_password
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 pr_number cluster_password"
  exit 1
fi

cleanup_db "$1" "$2"
