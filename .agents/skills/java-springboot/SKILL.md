---
name: java-springboot
description: Architectural guidelines, Hexagonal/Ports & Adapters patterns, and Java best practices for habitparty-api.
---

# Java Spring Boot & Clean Architecture Patterns

This skill enforces architectural standards and coding practices for `habitparty-api`.

## Tech Stack Context
- **Framework**: Spring Boot 4.x / Spring 7
- **Java**: Java 25
- **Architecture**: Hexagonal Architecture / Ports & Adapters (Clean Architecture)
  - `application/`: Use cases and input/output port interfaces.
  - `core/`: Pure domain models, entities, and business exceptions. No framework dependencies.
  - `adapters/in/`: Inbound adapters (REST controllers, request/response DTOs).
  - `adapters/out/`: Outbound adapters (Spring Data JPA repositories, external clients).
  - `infrastructure/`: Framework configurations (Spring Security, JWT filters, OpenAPI, background jobs).
- **Database**: PostgreSQL with Spring Data JPA.
- **Security**: Spring Security + JWT (`java-jwt`).
- **Validation**: `spring-boot-starter-validation` (`@Valid`, `@NotNull`, `@NotBlank`, etc.).
- **Docs**: SpringDoc OpenAPI UI.

## Core Rules & Conventions

### 1. Hexagonal Layer Separation
- **Domain Independence**: Keep `core/domain` free of Spring/JPA annotations whenever possible or isolated from HTTP concerns.
- **Dependency Inversion**: Use cases depend on Port interfaces defined in `application/ports`, implemented by adapters in `adapters/out`.
- **DTOs & Immutability**: Use Java `record` for DTOs and data transfer between adapters and use cases.
- **Exception Handling**: Use domain-specific exceptions in `core/exceptions/` and map them in `infrastructure/GlobalExceptionHandler.java`.

### 2. Common Maven Commands (run from `habitparty-api/`)
- **Compile & test**: `./mvnw clean test` (or `mvn clean test`)
- **Package application**: `./mvnw clean package -DskipTests`
- **Run local server**: `./mvnw spring-boot:run`

### 3. API & Security Standards
- Maintain OpenAPI annotations (`@Operation`, `@ApiResponse`) on controllers in `adapters/in`.
- Protect private endpoints using the custom `SecurityFilter` and JWT claims.
- Validate incoming request payloads using Bean Validation (`@Valid` on controller methods).
