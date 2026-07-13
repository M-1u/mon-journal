#!/usr/bin/env bash
# Lance Mon Journal (version production : charge dist/, sans serveur de dev).
cd "$(dirname "$0")" || exit 1
exec ./node_modules/.bin/electron . "$@"
