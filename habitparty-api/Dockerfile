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
ENV JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true"
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

# Stage 4: Production runner (minimal, non-root, hardened)
FROM eclipse-temurin:25-jre-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/target/habitparty-api-*.jar app.jar

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/v3/api-docs || exit 1

ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
