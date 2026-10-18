package com.habitparty.adapters.out.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.ProcessedPaymentEventJpaEntity;

public interface ProcessedPaymentEventJpaRepository
    extends JpaRepository<ProcessedPaymentEventJpaEntity, String> {
}
