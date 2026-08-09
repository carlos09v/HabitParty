---
name: create-web
description: "Use when the entity name and REST routes are known and you need to generate the inbound web layer: response DTOs and REST controllers for HabitParty."
---

# create-web

Use this skill when the user provides the entity name and the REST routes and expects the inbound web layer to be generated for HabitParty.

## Goal

Generate the in adapter for a domain entity, exposing only response DTOs and REST controllers.

## Generation Workflow

1. Inspect the existing domain entity to identify the data that can be safely returned by the API.
2. Create the response DTO in `adapters/in/web/dtos/response` as a Java `record`.
3. Add the static factory method `public static EntidadeResponseDTO fromDomain(Entidade dominio)`.
4. Create the REST controller in `adapters/in/web/controllers`.
5. Annotate the controller with `@RestController` and `@RequestMapping`.
6. Add `@Validated` when the controller processes lists or other validation scenarios that require it.
7. Call use cases from the controller and map every response through response DTOs.
8. Enforce the correct HTTP status for each route.

## Response DTO Rules

- Use a `record` for every response DTO.
- Never include passwords or other sensitive data in the response.
- Never return domain entities or JPA entities directly from the controller.
- Keep the `fromDomain(...)` factory as the single mapping entry point.
- Mirror only the fields that are appropriate for API consumers.

## Controller Rules

- Keep the controller as the web boundary only.
- Use `@RestController` and `@RequestMapping` on the class.
- Use `@Validated` when the endpoint handles lists or needs method-level validation support.
- Return `201 Created` for POST, `204 No Content` for DELETE, and `200 OK` for GET.
- Delegate business decisions to the use case layer.
- Never expose infrastructure types in the controller contract.

## Security Rules

- For actions that depend on the logged-in user, always extract the identity with `@RequestHeader("X-User-Id") UUID userIdLogado`.
- Never obtain the logged-in user ID from the URL.
- Use the header-based user identity to reduce IDOR risk.
- Keep authentication and ownership checks outside the DTO.

## Hard Rules

- Never return domain entities directly.
- Never return JPA entities directly.
- Never put business rules in response DTOs.
- Never place user identity in create or update paths when it should come from the header.
- Keep the web layer focused on request/response translation and HTTP semantics.

## Completion Check

Before finishing, confirm that:

- every endpoint returns a response DTO or no content as appropriate
- status codes match the route semantics
- sensitive data is excluded from responses
- user-scoped routes use `X-User-Id` from the request header
- no domain or JPA type leaks into the controller response
