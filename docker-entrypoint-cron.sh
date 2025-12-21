#!/bin/sh
set -e

echo "Starting crond..."

# Create log file if it doesn't exist (volume mount may override it)
touch /var/log/cron-audit-cleanup.log

# Start crond in background
crond -l 2

# Follow the log file
tail -f /var/log/cron-audit-cleanup.log
