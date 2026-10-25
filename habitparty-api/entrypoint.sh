#!/bin/sh
set -e

# Garante que o diretório de uploads exista e pertença ao appuser
# Mesmo quando sobreposto por um Volume persistente do Railway montado como root em runtime
mkdir -p /app/uploads
chown -R appuser:appgroup /app/uploads
chmod 775 /app/uploads

# Executa o Java com usuário appuser (não-root) de forma segura
exec su-exec appuser java -Djava.net.preferIPv4Stack=true -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -jar app.jar
