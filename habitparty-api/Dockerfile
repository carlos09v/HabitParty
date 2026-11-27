# syntax=docker/dockerfile:1

# Stage 1: Dependencies cache
FROM eclipse-temurin:25-jdk-alpine AS deps
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Stage 2: Development stage (hot reload / development)
FROM eclipse-temurin:25-jdk-alpine AS dev
WORKDIR /app
COPY --from=deps /root/.m2 /root/.m2
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY src/ ./src/
ENV JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true -Djava.net.preferIPv4Addresses=true -Dnetworkaddress.cache.negative.ttl=0 -Djdk.httpclient.keepalive.timeout=30"
EXPOSE 8080
CMD ["./mvnw", "spring-boot:run"]

# Stage 3: Build stage
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
COPY --from=deps /root/.m2 /root/.m2
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY src/ ./src/
RUN ./mvnw clean package -DskipTests -B

# Stage 4: Production runner (minimal, non-root, hardened, glibc para controle previsível de RSS na JVM)
FROM eclipse-temurin:25-jre-noble AS production
WORKDIR /app

ENV MALLOC_ARENA_MAX=2

RUN apt-get update && \
    apt-get install -y --no-install-recommends gosu curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home --shell /usr/sbin/nologin appuser && \
    mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/target/habitparty-api-*.jar app.jar
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -fsS http://localhost:8080/health > /dev/null || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
