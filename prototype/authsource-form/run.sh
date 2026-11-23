#!/bin/sh
# THROWAWAY PROTOTYPE. Starts the form prototype on http://localhost:8321
set -e
cd "$(dirname "$0")"
U="$(id -u):$(id -g)"
[ -d vendor ] || docker run --rm -u "$U" -e COMPOSER_HOME=/tmp/composer -v "$PWD":/app -w /app composer:2 install --no-interaction
exec docker run --rm --name authsource-form-prototype -u "$U" -p 8321:8321 -v "$PWD":/app -w /app php:8.3-cli-alpine php -S 0.0.0.0:8321 -t public
