#!/bin/sh
set -e

echo "Starting crond..."

# Create log files if they don't exist (volume mount may override them)
touch /var/log/cron-audit-cleanup.log
touch /var/log/cron-trial-check.log

# Start crond in background
crond -l 2

# Follow both log files
tail -f /var/log/cron-audit-cleanup.log /var/log/cron-trial-check.log
