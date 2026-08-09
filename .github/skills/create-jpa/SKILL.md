---
name: create-jpa
description: "Use when the domain entity already exists and you need to generate the persistence layer: JPA entity, Spring Data repository, mapper, and outbound adapter for HabitParty."
---

# create-jpa

Use this skill when the user provides the name of an entity whose domain model already exists and expects the persistence layer to be generated for HabitParty.

## Goal

Generate the out adapter for a domain entity using the existing core model as the source of truth.

## Generation Workflow

1. Inspect the existing domain entity to identify all persisted fields, identifiers, and relationships.
2. Create the JPA entity in `adapters/out/persistence/entities`.
3. Create the Spring Data repository interface that extends `JpaRepository<JpaEntity, UUID>`.
4. Create a mapper in `adapters/out/persistence/mappers` that translates strictly between domain and JPA models.
5. Create the adapter in `adapters/out/persistence` and annotate it with `@Component`.
6. Implement the output port using the Spring repository and the mapper.
7. Verify that save, update, delete, and find methods move only domain entities across the port boundary.

## JPA Entity Rules

- Use Lombok annotations on the persistence model: `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`.
- Map the table with `@Entity` and `@Table`.
- Use automatic UUID generation for the identifier with `@GeneratedValue`.
- Read the existing domain entity and mirror its persisted fields in the JPA model.
- Keep infrastructure concerns in the persistence layer only.

## Repository Rules

- Create a Spring Data interface in the persistence package.
- Extend `JpaRepository<EntidadeJpa, UUID>`.
- Add custom query methods only when they are required by the port contract or the use cases.

## Mapper Rules

- The mapper must convert only between domain entity and JPA entity.
- Do not let the mapper contain business rules.
- Preserve value types and naming consistently with the domain model.
- Keep the mapping explicit and symmetrical.

## Adapter Rules

- The adapter must implement the port defined in the core layer.
- Inject the Spring repository through the constructor.
- Use the mapper for every conversion between persistence and domain objects.
- Keep the adapter as the boundary where Spring Data details are isolated.

## Hard Rules

- Never change the domain entity to fit persistence needs.
- Never expose JPA entities outside the out adapter.
- Never pass DTOs through the port.
- Never put business rules inside the mapper or adapter.
- Always preserve the core hexagonal direction: persistence depends on the domain, not the other way around.

## Completion Check

Before finishing, confirm that:

- the JPA entity mirrors the persisted domain fields
- the repository compiles with the correct UUID identifier type
- the mapper is bidirectional and domain-only at the boundary
- the adapter implements the correct port
- no infrastructure types leak into the core layer
