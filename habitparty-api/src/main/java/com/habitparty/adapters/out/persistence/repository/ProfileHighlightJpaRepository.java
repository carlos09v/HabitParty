package com.habitparty.adapters.out.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.ProfileHighlightJpaEntity;
import com.habitparty.core.domain.enums.HighlightType;

public interface ProfileHighlightJpaRepository extends JpaRepository<ProfileHighlightJpaEntity, UUID> {

  List<ProfileHighlightJpaEntity> findAllByUserIdOrderByDisplayOrderAsc(UUID userId);

  long countByUserId(UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM ProfileHighlightJpaEntity ph WHERE ph.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM ProfileHighlightJpaEntity ph WHERE ph.userId = :userId AND ph.highlightType = :highlightType AND ph.highlightKey = :highlightKey")
  void deleteByUserIdAndHighlightTypeAndHighlightKey(
      @Param("userId") UUID userId,
      @Param("highlightType") HighlightType highlightType,
      @Param("highlightKey") String highlightKey);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM ProfileHighlightJpaEntity ph WHERE ph.userId = :userId AND ph.highlightType = :highlightType AND ph.highlightKey IN :highlightKeys")
  void deleteByUserIdAndHighlightTypeAndHighlightKeyIn(
      @Param("userId") UUID userId,
      @Param("highlightType") HighlightType highlightType,
      @Param("highlightKeys") Collection<String> highlightKeys);
}
