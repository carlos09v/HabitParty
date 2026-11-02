#!/bin/sh
set -e

# Garante que o diretório de uploads exista e pertença ao appuser
# Evita chown recursivo lento em todo boot caso o diretório raiz já pertença ao appuser
mkdir -p /app/uploads
if [ "$(stat -c '%U' /app/uploads 2>/dev/null)" != "appuser" ]; then
  chown -R appuser:appgroup /app/uploads
fi
chmod 775 /app/uploads

# Executa o Java 25 com usuário appuser (não-root) e flags otimizadas para containers de baixa latência
exec su-exec appuser java \
  -Djava.net.preferIPv4Stack=true \
  -Djava.net.preferIPv4Addresses=true \
  -Dnetworkaddress.cache.negative.ttl=0 \
  -Djdk.httpclient.keepalive.timeout=30 \
  -Djava.security.egd=file:/dev/./urandom \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseCompactObjectHeaders \
  -XX:+UseStringDeduplication \
  -XX:+ExitOnOutOfMemoryError \
  -jar app.jar
