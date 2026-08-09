---
name: create-core
description: "Use when generating the core structure for a new HabitParty entity: domain entity, use cases, ports, and request DTOs under strict Hexagonal Architecture rules."
---

# create-core

Use this skill when the user provides an entity name, its attributes, and the methods required by the output port, and expects the core structure to be generated for HabitParty.

## Goal

Create the central business structure for the requested entity with the following outputs when applicable:

- a pure domain entity in `core/domain`
- one separate use case class per requested action in `application/usecases`
- a port interface in `application/ports`
- a request DTO record in `adapters/in/web/dtos/request`

## Generation Workflow

1. Identify the entity name, attributes, field types, and required use cases.
2. Create the domain entity first, keeping it free of Spring, JPA, web, and persistence annotations.
3. Add a full constructor, getters for every field, and only the setters strictly needed by business rules.
4. Move derived logic into getters when a value is computed from other state.
5. Create one use case class per action requested, each with a final port field, constructor injection, and an `execute` method.
6. Create the output port interface so persistence methods receive only domain entities.
7. Create the request DTO as a Java `record` with `jakarta.validation` annotations that match the provided field types.
8. Validate that financial fields use `BigDecimal` and XP or counters use `int`.

## Hard Rules

- Never place Spring annotations in the domain layer.
- Never place JPA annotations in the domain layer.
- Never use Lombok in the domain entity.
- Never let ports persist DTOs; they must persist domain entities only.
- Never include `userId` in create or update request DTOs.
- Use `BigDecimal` for money, coins, balances, prices, and totals that represent value.
- Use `int` for XP, streaks, levels, and order indexes.
- Keep domain behavior pure and independent from infrastructure.

## Domain Rules for HabitParty

- Ownership and business validation stay in the use case layer, not in the DTO.

## Use Case Pattern

Each use case should follow this structure:

- `private final <Entity>Repository port;`
- constructor injection for the port
- an `execute(...)` method that orchestrates the business flow

## DTO Pattern

Create request DTOs as `record` types and annotate fields with the minimum validation needed for safe input handling.

## Completion Check

Before finishing, confirm that:

- the entity is pure and compilable
- the port only references domain types
- each requested use case has its own class
- the DTO matches the requested input shape
- all numeric types follow the HabitParty rules
