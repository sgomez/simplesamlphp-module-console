FROM php:8.4-apache

ARG SSP_VERSION=2.5.4

RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev libldap2-dev unzip openssl \
    && docker-php-ext-install intl pdo_mysql bcmath ldap \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

RUN curl -fsSL "https://github.com/simplesamlphp/simplesamlphp/releases/download/v${SSP_VERSION}/simplesamlphp-${SSP_VERSION}-full.tar.gz" \
    | tar -xz -C /var \
    && mv /var/simplesamlphp-${SSP_VERSION} /var/simplesamlphp \
    && composer --working-dir=/var/simplesamlphp require --no-interaction --no-progress opis/json-schema:^2.6

# Throwaway keys for the local IdP and SP; never used outside this container.
RUN mkdir -p /var/simplesamlphp/cert \
    && openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -subj '/CN=console-dev' \
        -keyout /var/simplesamlphp/cert/server.key -out /var/simplesamlphp/cert/server.crt \
    && chown -R www-data:www-data /var/simplesamlphp/cert \
    && chmod 600 /var/simplesamlphp/cert/server.key

COPY config/ /var/simplesamlphp/config/
COPY metadata/ /var/simplesamlphp/metadata/
COPY apache.conf /etc/apache2/sites-available/000-default.conf

# Snapshot directory: node-local and writable by the web server only.
RUN mkdir -p /var/lib/simplesamlphp/console /var/cache/simplesamlphp /tmp/simplesamlphp /var/simplesamlphp/data /var/simplesamlphp/log \
    && chown -R www-data:www-data /var/lib/simplesamlphp /var/cache/simplesamlphp /tmp/simplesamlphp /var/simplesamlphp/data /var/simplesamlphp/log \
    && chmod 0700 /var/lib/simplesamlphp/console
