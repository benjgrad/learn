#!/usr/bin/env bash
# Installs the Palestra nginx vhosts and obtains certs. Run with sudo:
#   sudo ./deploy/install-nginx.sh
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/nginx" && pwd)"
AVAIL=/etc/nginx/sites-available
ENABLED=/etc/nginx/sites-enabled

for host in learning.gradyserver.com db.learning.gradyserver.com; do
  install -m 644 "$SRC/$host.conf" "$AVAIL/$host.conf"
  ln -sfn "$AVAIL/$host.conf" "$ENABLED/$host.conf"
  echo "installed $host"
done

nginx -t
systemctl reload nginx

# Adds the TLS server blocks and the :80 -> :443 redirects in place.
certbot --nginx -d learning.gradyserver.com -d db.learning.gradyserver.com

nginx -t
systemctl reload nginx
echo "done — https://learning.gradyserver.com"
