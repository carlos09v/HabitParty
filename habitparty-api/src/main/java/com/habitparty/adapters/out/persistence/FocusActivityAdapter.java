package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.FocusActivityJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.FocusActivityMapper;
import com.habitparty.adapters.out.persistence.repository.FocusActivityJpaRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;

@Component
public class FocusActivityAdapter implements FocusActivityRepository {
    private final FocusActivityJpaRepository repository;
    private final FocusActivityMapper mapper;

    public FocusActivityAdapter(FocusActivityJpaRepository repository, FocusActivityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public FocusActivity save(FocusActivity activity) {
        FocusActivityJpaEntity entity = mapper.toEntity(activity);
        FocusActivityJpaEntity savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<FocusActivity> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    @Override
    public List<FocusActivity> findAllByUserIdOrderByOrderIndex(UUID userId) {
        return repository.findAllByUserIdOrderByOrderIndexAsc(userId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public int countByUserId(UUID userId) {
        return repository.countByUserId(userId);
    }

    @Override
    public int getMaxOrderIndexByUserId(UUID userId) {
        return repository.findMaxOrderIndexByUserId(userId);
    }

    @Override
    public void shiftOrderIndexDown(UUID userId, int startOrderIndex) {
        repository.shiftOrderIndexDown(userId, startOrderIndex);
    }

    @Override
    public List<FocusActivity> saveAll(List<FocusActivity> activities) {
        List<FocusActivityJpaEntity> entities = activities.stream()
                .map(mapper::toEntity)
                .toList();

        List<FocusActivityJpaEntity> savedEntities = repository.saveAll(entities);

        return savedEntities.stream()
                .map(mapper::toDomain)
                .toList();
    }
}
