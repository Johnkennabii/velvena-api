#!/bin/sh
set -e

echo "Starting crond..."
crond -l 2

tail -f /var/log/cron-audit-cleanup.log
