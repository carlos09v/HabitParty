#!/bin/sh
set -e

# Garante que o diretório de uploads exista e pertença ao appuser (UID/GID 1001)
# Evita chown recursivo lento em todo boot caso o diretório raiz já pertença ao appuser
mkdir -p /app/uploads
if [ "$(stat -c '%U' /app/uploads 2>/dev/null)" != "appuser" ]; then
  chown -R appuser:appgroup /app/uploads
fi
chmod 775 /app/uploads

EXEC_AS="gosu"
if ! command -v gosu >/dev/null 2>&1; then
  EXEC_AS="su-exec"
fi

# Orçamento de memória calibrado para containers de 1GB (evita OOMKill):
# ~480MB Heap + ~200MB Metaspace + ~64MB CodeCache + ~64MB DirectMemory + ~80MB GC/Threads < 1000MB
# G1PeriodicGCInterval devolve páginas ociosas de Heap ao kernel após 60s.
INITIAL_RAM_PERCENTAGE="${JAVA_INITIAL_RAM_PERCENTAGE:-25.0}"
MAX_RAM_PERCENTAGE="${JAVA_MAX_RAM_PERCENTAGE:-48.0}"
MAX_METASPACE_SIZE="${JAVA_MAX_METASPACE_SIZE:-200m}"
RESERVED_CODE_CACHE_SIZE="${JAVA_RESERVED_CODE_CACHE_SIZE:-64m}"
MAX_DIRECT_MEMORY_SIZE="${JAVA_MAX_DIRECT_MEMORY_SIZE:-64m}"

# Executa o Java 25 com usuário appuser (não-root) e flags otimizadas para containers de baixa latência
exec "$EXEC_AS" appuser java \
  -Djava.net.preferIPv4Stack=true \
  -Djava.net.preferIPv4Addresses=true \
  -Dnetworkaddress.cache.negative.ttl=0 \
  -Djdk.httpclient.keepalive.timeout=30 \
  -Djava.security.egd=file:/dev/./urandom \
  -XX:+UseContainerSupport \
  -XX:InitialRAMPercentage="$INITIAL_RAM_PERCENTAGE" \
  -XX:MaxRAMPercentage="$MAX_RAM_PERCENTAGE" \
  -XX:MaxMetaspaceSize="$MAX_METASPACE_SIZE" \
  -XX:ReservedCodeCacheSize="$RESERVED_CODE_CACHE_SIZE" \
  -XX:MaxDirectMemorySize="$MAX_DIRECT_MEMORY_SIZE" \
  -Xss512k \
  -XX:+UseG1GC \
  -XX:G1PeriodicGCInterval=60000 \
  -XX:+UseCompactObjectHeaders \
  -XX:+UseStringDeduplication \
  -XX:+ExitOnOutOfMemoryError \
  -XshowSettings:vm \
  -jar app.jar
