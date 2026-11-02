package com.habitparty.adapters.out.persistence.mappers;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserStatsJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserSubscriptionJpaEntity;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserSubscription;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserExperienceMode;

@Component
public class UserMapper {

  public UserJpaEntity toEntity(User domain) {
    UserJpaEntity entity = new UserJpaEntity();
    updateEntityFromDomain(entity, domain);
    return entity;
  }

  public void updateEntityFromDomain(UserJpaEntity entity, User domain) {
    entity.setId(domain.getId());
    entity.setRole(domain.getRole());
    entity.setFullName(domain.getFullName());
    entity.setEmail(domain.getEmail());
    entity.setUsername(domain.getUsername());
    entity.setPassword(domain.getPassword());
    entity.setEmailVerified(domain.isEmailVerified());
    entity.setEmailVerifiedAt(domain.getEmailVerifiedAt());
    entity.setGender(domain.getGender());
    entity.setExperienceMode(domain.getExperienceMode() != null ? domain.getExperienceMode() : UserExperienceMode.PRODUCTIVITY);
    entity.setBirthDate(domain.getBirthDate());
    entity.setProfilePhotoUrl(domain.getProfilePhotoUrl().orElse(null));
    if (entity.getCreatedAt() == null) {
      entity.setCreatedAt(domain.getCreatedAt() != null ? domain.getCreatedAt() : LocalDateTime.now());
    }

    // Mapeia UserStatsJpaEntity (1:1 PK compartilhada)
    UserStatsJpaEntity statsEntity = entity.getStats();
    if (statsEntity == null) {
      statsEntity = new UserStatsJpaEntity();
      entity.setStats(statsEntity);
    }
    UserStats domainStats = domain.getStats();
    statsEntity.setCurrentCoins(domainStats != null && domainStats.getCurrentCoins() != null
        ? domainStats.getCurrentCoins()
        : BigDecimal.ZERO);
    statsEntity.setTotalGoldEarned(domainStats != null && domainStats.getTotalGoldEarned() != null
        ? domainStats.getTotalGoldEarned()
        : BigDecimal.ZERO);
    statsEntity.setTotalXp(domainStats != null ? domainStats.getTotalXp() : 0);
    statsEntity.setCurrentStreak(domainStats != null ? domainStats.getCurrentStreak() : 0);
    statsEntity.setHighestStreak(domainStats != null ? domainStats.getHighestStreak() : 0);
    statsEntity.setUpdatedAt(domainStats != null && domainStats.getUpdatedAt() != null
        ? domainStats.getUpdatedAt()
        : LocalDateTime.now());

    // Mapeia UserSubscriptionJpaEntity (1:1 PK compartilhada)
    UserSubscriptionJpaEntity subEntity = entity.getSubscription();
    if (subEntity == null) {
      subEntity = new UserSubscriptionJpaEntity();
      entity.setSubscription(subEntity);
    }
    UserSubscription domainSub = domain.getSubscription();
    subEntity.setPremium(domainSub != null && domainSub.isPremium());
    subEntity.setFounder(domainSub != null && domainSub.isFounder());
    subEntity.setStripeCustomerId(domainSub != null ? domainSub.getStripeCustomerId() : null);
    subEntity.setStripeSubscriptionId(domainSub != null ? domainSub.getStripeSubscriptionId() : null);
    subEntity.setSubscriptionStatus(domainSub != null && domainSub.getSubscriptionStatus() != null
        ? domainSub.getSubscriptionStatus()
        : SubscriptionStatus.FREE);
    subEntity.setSubscriptionEndsAt(domainSub != null ? domainSub.getSubscriptionEndsAt() : null);
    subEntity.setUpdatedAt(domainSub != null && domainSub.getUpdatedAt() != null
        ? domainSub.getUpdatedAt()
        : LocalDateTime.now());
  }

  public User toDomain(UserJpaEntity entity) {
    UserStatsJpaEntity s = entity.getStats();
    UserStats domainStats = (s != null)
        ? new UserStats(
            entity.getId(),
            s.getCurrentCoins(),
            s.getTotalGoldEarned(),
            s.getTotalXp(),
            s.getCurrentStreak(),
            s.getHighestStreak(),
            s.getUpdatedAt())
        : UserStats.createInitial(entity.getId());

    UserSubscriptionJpaEntity sub = entity.getSubscription();
    UserSubscription domainSub = (sub != null)
        ? new UserSubscription(
            entity.getId(),
            sub.isPremium(),
            sub.isFounder(),
            sub.getStripeCustomerId(),
            sub.getStripeSubscriptionId(),
            sub.getSubscriptionStatus(),
            sub.getSubscriptionEndsAt(),
            sub.getUpdatedAt())
        : UserSubscription.createInitial(entity.getId());

    return new User(
        entity.getId(),
        entity.getRole(),
        entity.getFullName(),
        entity.getUsername(),
        entity.getEmail(),
        entity.getPassword(),
        entity.isEmailVerified(),
        entity.getEmailVerifiedAt(),
        entity.getBirthDate(),
        entity.getProfilePhotoUrl(),
        entity.getGender(),
        entity.getExperienceMode() != null ? entity.getExperienceMode() : UserExperienceMode.PRODUCTIVITY,
        entity.getCreatedAt(),
        domainStats,
        domainSub
    );
  }
}
