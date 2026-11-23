package com.habitparty.adapters.out.persistence.repository;

import java.util.UUID;

/**
 * Projeção escalar para leitura de itens de checklist sem instanciar proxies LAZY
 * de {@code TaskJpaEntity} no Persistence Context do Hibernate.
 */
public record ChecklistItemProjection(
    UUID id,
    UUID taskId,
    UUID userId,
    String name,
    boolean isCompleted,
    boolean isRewarded,
    int orderIndex,
    boolean autoCompleted) {}
