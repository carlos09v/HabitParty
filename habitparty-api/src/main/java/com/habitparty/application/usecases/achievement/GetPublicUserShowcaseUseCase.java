package com.habitparty.application.usecases.achievement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.social.SocialAccessSupport;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;
import com.habitparty.application.usecases.social.SocialUserSummary;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetPublicUserShowcaseUseCase {

  private final UserRepository userRepository;
  private final FriendshipRepository friendshipRepository;
  private final EffectiveStreakResolver effectiveStreakResolver;
  private final GetUserShowcaseUseCase getUserShowcaseUseCase;
  private final ProfileHighlightRepository profileHighlightRepository;

  @Autowired
  public GetPublicUserShowcaseUseCase(
      UserRepository userRepository,
      FriendshipRepository friendshipRepository,
      EffectiveStreakResolver effectiveStreakResolver,
      GetUserShowcaseUseCase getUserShowcaseUseCase,
      @Nullable ProfileHighlightRepository profileHighlightRepository) {
    this.userRepository = userRepository;
    this.friendshipRepository = friendshipRepository;
    this.effectiveStreakResolver = effectiveStreakResolver;
    this.getUserShowcaseUseCase = getUserShowcaseUseCase;
    this.profileHighlightRepository = profileHighlightRepository;
  }

  public GetPublicUserShowcaseUseCase(
      UserRepository userRepository,
      FriendshipRepository friendshipRepository,
      EffectiveStreakResolver effectiveStreakResolver,
      GetUserShowcaseUseCase getUserShowcaseUseCase) {
    this(userRepository, friendshipRepository, effectiveStreakResolver, getUserShowcaseUseCase, null);
  }

  public record PublicUserShowcaseResult(
      SocialUserSummary user,
      SocialRelationshipStatus relationshipStatus,
      UUID friendshipId,
      boolean canViewProfile,
      boolean canViewStats,
      boolean canViewAchievements,
      GetUserShowcaseUseCase.UserShowcaseResult fullShowcase,
      int effectiveStreak,
      List<ProfileHighlight> highlights,
      List<GetUserShowcaseUseCase.AchievementProgressItem> achievements,
      List<GetUserShowcaseUseCase.ArtifactProgressItem> artifacts) {
  }

  @Transactional(readOnly = true)
  public PublicUserShowcaseResult execute(UUID viewerId, String rawUsername) {
    String cleanUsername = SocialAccessSupport.normalizeUsernameQuery(rawUsername);
    if (cleanUsername == null) {
      throw new ResourceNotFoundException("Perfil de usuário não encontrado.");
    }

    User targetUser = userRepository.findByUsernameIgnoreCase(cleanUsername)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário @" + cleanUsername + " não encontrado."));

    boolean isSelf = viewerId != null && viewerId.equals(targetUser.getId());
    Optional<Friendship> relOpt = (!isSelf && viewerId != null)
        ? friendshipRepository.findBetweenUsers(viewerId, targetUser.getId())
        : Optional.empty();

    SocialRelationshipStatus relationshipStatus = isSelf
        ? SocialRelationshipStatus.SELF
        : SocialAccessSupport.resolveRelationshipStatus(viewerId, relOpt.orElse(null));

    if (relationshipStatus == SocialRelationshipStatus.BLOCKED) {
      throw new ResourceNotFoundException("Perfil de usuário não encontrado.");
    }

    boolean isFriend = relationshipStatus == SocialRelationshipStatus.FRIENDS;
    boolean blockedByViewer = relationshipStatus == SocialRelationshipStatus.BLOCKED_BY_VIEWER;

    boolean canViewProfile = !blockedByViewer
        && SocialUserSummary.isAllowed(targetUser.getProfileVisibility(), isSelf, isFriend);
    boolean canViewStats = canViewProfile
        && SocialUserSummary.isAllowed(targetUser.getStatsVisibility(), isSelf, isFriend);
    boolean canViewAchievements = canViewProfile
        && SocialUserSummary.isAllowed(targetUser.getAchievementsVisibility(), isSelf, isFriend);

    if (!canViewProfile) {
      SocialUserSummary hiddenSummary = SocialUserSummary.fromUserForViewer(targetUser, 0, relationshipStatus);
      return new PublicUserShowcaseResult(
          hiddenSummary,
          relationshipStatus,
          relOpt.map(Friendship::getId).orElse(null),
          false,
          false,
          false,
          null,
          0,
          List.of(),
          List.of(),
          List.of());
    }

    // Caminho leve: quando stats e conquistas estão ambos ocultos, evita carregar catálogo completo/artefatos/tarefas
    if (!canViewStats && !canViewAchievements && profileHighlightRepository != null) {
      SocialUserSummary summary = SocialUserSummary.fromUserForViewer(targetUser, 0, relationshipStatus);
      List<ProfileHighlight> accountBadgeHighlights = profileHighlightRepository
          .findAllByUserIdOrderByDisplayOrder(targetUser.getId())
          .stream()
          .filter(h -> h.getHighlightType() == HighlightType.ACCOUNT_BADGE && !isLevelRankBadge(h))
          .toList();
      return new PublicUserShowcaseResult(
          summary,
          relationshipStatus,
          relOpt.map(Friendship::getId).orElse(null),
          true,
          false,
          false,
          null,
          0,
          accountBadgeHighlights,
          List.of(),
          List.of());
    }

    GetUserShowcaseUseCase.UserShowcaseResult fullShowcase = canViewStats
        ? getUserShowcaseUseCase.executeReadOnly(targetUser)
        : Optional.ofNullable(getUserShowcaseUseCase.executeReadOnly(targetUser, false))
            .orElseGet(() -> getUserShowcaseUseCase.executeReadOnly(targetUser));
    User evaluatedUser = fullShowcase.user();
    int streak = canViewStats ? fullShowcase.effectiveStreak() : 0;

    SocialUserSummary summary = SocialUserSummary.fromUserForViewer(evaluatedUser, streak, relationshipStatus);

    List<ProfileHighlight> filteredHighlights = fullShowcase.highlights().stream()
        .filter(h -> switch (h.getHighlightType()) {
          case ACHIEVEMENT, ARTIFACT -> canViewAchievements;
          case STAT_METRIC, TASK_STREAK -> canViewStats;
          case ACCOUNT_BADGE -> canViewProfile && (canViewStats || !isLevelRankBadge(h));
        })
        .toList();

    List<GetUserShowcaseUseCase.AchievementProgressItem> filteredAchievements = canViewAchievements
        ? fullShowcase.achievements()
        : List.of();

    List<GetUserShowcaseUseCase.ArtifactProgressItem> filteredArtifacts = canViewAchievements
        ? fullShowcase.artifacts()
        : List.of();

    return new PublicUserShowcaseResult(
        summary,
        relationshipStatus,
        relOpt.map(Friendship::getId).orElse(null),
        true,
        canViewStats,
        canViewAchievements,
        canViewStats ? fullShowcase : null,
        canViewStats ? streak : 0,
        filteredHighlights,
        filteredAchievements,
        filteredArtifacts);
  }

  private static boolean isLevelRankBadge(ProfileHighlight highlight) {
    return highlight.getHighlightKey()
        .map(key -> "LEVEL_RANK".equalsIgnoreCase(key.trim()))
        .orElse(false);
  }
}
