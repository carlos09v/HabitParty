package com.habitparty.application.usecases.achievement;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserArtifactRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.application.usecases.user.EffectiveStreakResolver.UserWithEffectiveStreak;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.CosmeticCatalog;
import com.habitparty.core.domain.entities.achievement.CosmeticCatalog.CosmeticUnlockContext;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.RetrospectiveArchetype;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateShowcaseProfileUseCase {
  private final UserRepository userPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final EffectiveStreakResolver effectiveStreakResolver;
  private final AchievementRepository achievementPort;
  private final UserAchievementRepository userAchievementPort;
  private final UserArtifactRepository userArtifactPort;
  private final GetUserRetrospectiveUseCase getUserRetrospectiveUseCase;

  @Autowired
  public UpdateShowcaseProfileUseCase(
      UserRepository userPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      @Nullable EffectiveStreakResolver effectiveStreakResolver,
      @Nullable AchievementRepository achievementPort,
      @Nullable UserAchievementRepository userAchievementPort,
      @Nullable UserArtifactRepository userArtifactPort,
      @Nullable GetUserRetrospectiveUseCase getUserRetrospectiveUseCase) {
    this.userPort = userPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
    this.effectiveStreakResolver = effectiveStreakResolver != null
        ? effectiveStreakResolver
        : new EffectiveStreakResolver(null);
    this.achievementPort = achievementPort;
    this.userAchievementPort = userAchievementPort;
    this.userArtifactPort = userArtifactPort;
    this.getUserRetrospectiveUseCase = getUserRetrospectiveUseCase;
  }

  public UpdateShowcaseProfileUseCase(
      UserRepository userPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      EffectiveStreakResolver effectiveStreakResolver) {
    this(
        userPort,
        evaluateUserAchievementsUseCase,
        effectiveStreakResolver,
        null,
        null,
        null,
        null);
  }

  public UpdateShowcaseProfileUseCase(
      UserRepository userPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this(userPort, evaluateUserAchievementsUseCase, new EffectiveStreakResolver(null), null, null, null, null);
  }

  public record UpdateShowcaseProfileCommand(
      String bio,
      String avatarFrame,
      String equippedTitle,
      String avatarPreset) {
    public UpdateShowcaseProfileCommand(String bio, String avatarFrame) {
      this(bio, avatarFrame, null, null);
    }
  }

  @Transactional
  public User execute(UUID userId, UpdateShowcaseProfileCommand command) {
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    CosmeticUnlockContext unlockContext = buildUnlockContextIfNeeded(user, command);
    user.updateShowcaseProfile(
        command.bio(),
        command.avatarFrame(),
        command.equippedTitle(),
        command.avatarPreset(),
        unlockContext);
    User saved = userPort.save(user);
    evaluateUserAchievementsUseCase.execute(saved);
    return saved;
  }

  private CosmeticUnlockContext buildUnlockContextIfNeeded(User user, UpdateShowcaseProfileCommand command) {
    String cleanFrame = command.avatarFrame() != null
        ? command.avatarFrame().trim().toLowerCase()
        : null;
    String cleanTitle = command.equippedTitle() != null
        ? command.equippedTitle().trim().toUpperCase()
        : null;

    boolean needsAchievementCodes = "obsidian_crest".equals(cleanFrame)
        || "chronos_bronze".equals(cleanFrame)
        || (cleanTitle != null && CosmeticCatalog.ACHIEVEMENT_TITLES.contains(cleanTitle));
    boolean needsArtifactCount = "ARTIFACT_COLLECTOR".equals(cleanTitle);
    boolean needsRetroCheck = cleanTitle != null && cleanTitle.startsWith("RETRO_");

    if (!needsAchievementCodes && !needsArtifactCount && !needsRetroCheck) {
      return CosmeticUnlockContext.empty();
    }

    Set<String> unlockedAchievementCodes = new HashSet<>();
    Set<String> allFocusAchievementCodes = new HashSet<>();
    if (needsAchievementCodes && achievementPort != null && userAchievementPort != null) {
      List<Achievement> catalog = achievementPort.findAllOrdered();
      Map<UUID, String> codeById = new HashMap<>(catalog.size());
      for (Achievement ach : catalog) {
        String code = ach.getCode().trim().toUpperCase();
        codeById.put(ach.getId(), code);
        if (ach.getCategory() == AchievementCategory.FOCUS) {
          allFocusAchievementCodes.add(code);
        }
      }
      for (UserAchievement ua : userAchievementPort.findAllByUserId(user.getId())) {
        String code = codeById.get(ua.getAchievementId());
        if (code != null) {
          unlockedAchievementCodes.add(code);
        }
      }
    }

    long unlockedArtifactsCount = needsArtifactCount && userArtifactPort != null
        ? userArtifactPort.countByUserId(user.getId())
        : 0L;

    Set<RetrospectiveArchetype> eligibleRetroArchetypes = needsRetroCheck && getUserRetrospectiveUseCase != null
        ? getUserRetrospectiveUseCase.findEligibleArchetypesForUser(user)
        : Set.of();

    return new CosmeticUnlockContext(
        unlockedAchievementCodes,
        allFocusAchievementCodes,
        unlockedArtifactsCount,
        eligibleRetroArchetypes,
        LocalDateTime.now());
  }

  @Transactional
  public UserWithEffectiveStreak executeWithEffectiveStreak(
      UUID userId, UpdateShowcaseProfileCommand command) {
    return effectiveStreakResolver.wrap(execute(userId, command));
  }
}
