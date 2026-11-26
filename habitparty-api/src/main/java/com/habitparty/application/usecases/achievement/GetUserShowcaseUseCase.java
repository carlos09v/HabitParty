package com.habitparty.application.usecases.achievement;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.ArtifactRepository;
import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserArtifactRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.task.DailyResetUseCase;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.entities.achievement.UserArtifact;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.AchievementCode;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetUserShowcaseUseCase {
  private final UserRepository userPort;
  private final AchievementRepository achievementPort;
  private final UserAchievementRepository userAchievementPort;
  private final ProfileHighlightRepository profileHighlightPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final EffectiveStreakResolver effectiveStreakResolver;
  private final DailyResetUseCase dailyResetUseCase;
  private final ArtifactRepository artifactPort;
  private final UserArtifactRepository userArtifactPort;
  private final TaskRepository taskPort;
  private final Clock clock;
  private final FriendshipRepository friendshipPort;
  private final GetUserRetrospectiveUseCase retrospectiveUseCase;

  @Autowired
  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      @Nullable EffectiveStreakResolver effectiveStreakResolver,
      @Nullable DailyResetUseCase dailyResetUseCase,
      @Nullable ArtifactRepository artifactPort,
      @Nullable UserArtifactRepository userArtifactPort,
      @Nullable TaskRepository taskPort,
      @Nullable Clock clock,
      @Nullable FriendshipRepository friendshipPort,
      @Nullable GetUserRetrospectiveUseCase retrospectiveUseCase) {
    this.userPort = userPort;
    this.achievementPort = achievementPort;
    this.userAchievementPort = userAchievementPort;
    this.profileHighlightPort = profileHighlightPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
    this.effectiveStreakResolver = effectiveStreakResolver != null
        ? effectiveStreakResolver
        : new EffectiveStreakResolver(null);
    this.dailyResetUseCase = dailyResetUseCase;
    this.artifactPort = artifactPort;
    this.userArtifactPort = userArtifactPort;
    this.taskPort = taskPort;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
    this.friendshipPort = friendshipPort;
    this.retrospectiveUseCase = retrospectiveUseCase;
  }

  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      @Nullable EffectiveStreakResolver effectiveStreakResolver,
      @Nullable DailyResetUseCase dailyResetUseCase,
      @Nullable ArtifactRepository artifactPort,
      @Nullable UserArtifactRepository userArtifactPort,
      @Nullable TaskRepository taskPort,
      @Nullable Clock clock) {
    this(
        userPort,
        achievementPort,
        userAchievementPort,
        profileHighlightPort,
        evaluateUserAchievementsUseCase,
        effectiveStreakResolver,
        dailyResetUseCase,
        artifactPort,
        userArtifactPort,
        taskPort,
        clock,
        null,
        null);
  }

  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      @Nullable EffectiveStreakResolver effectiveStreakResolver,
      @Nullable DailyResetUseCase dailyResetUseCase,
      @Nullable ArtifactRepository artifactPort,
      @Nullable UserArtifactRepository userArtifactPort) {
    this(
        userPort,
        achievementPort,
        userAchievementPort,
        profileHighlightPort,
        evaluateUserAchievementsUseCase,
        effectiveStreakResolver,
        dailyResetUseCase,
        artifactPort,
        userArtifactPort,
        null,
        null);
  }

  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      @Nullable EffectiveStreakResolver effectiveStreakResolver,
      @Nullable DailyResetUseCase dailyResetUseCase) {
    this(
        userPort,
        achievementPort,
        userAchievementPort,
        profileHighlightPort,
        evaluateUserAchievementsUseCase,
        effectiveStreakResolver,
        dailyResetUseCase,
        null,
        null);
  }

  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      EffectiveStreakResolver effectiveStreakResolver) {
    this(
        userPort,
        achievementPort,
        userAchievementPort,
        profileHighlightPort,
        evaluateUserAchievementsUseCase,
        effectiveStreakResolver,
        null,
        null,
        null);
  }

  public GetUserShowcaseUseCase(
      UserRepository userPort,
      AchievementRepository achievementPort,
      UserAchievementRepository userAchievementPort,
      ProfileHighlightRepository profileHighlightPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this(
        userPort,
        achievementPort,
        userAchievementPort,
        profileHighlightPort,
        evaluateUserAchievementsUseCase,
        new EffectiveStreakResolver(null),
        null,
        null,
        null);
  }

  public record AchievementProgressItem(
      Achievement achievement,
      boolean unlocked,
      LocalDateTime unlockedAt,
      boolean seen,
      int currentValue,
      int progressPercent,
      @Nullable Artifact grantedArtifact) {
    public AchievementProgressItem(
        Achievement achievement,
        boolean unlocked,
        LocalDateTime unlockedAt,
        boolean seen,
        int currentValue,
        int progressPercent) {
      this(achievement, unlocked, unlockedAt, seen, currentValue, progressPercent, null);
    }
  }

  public record ArtifactProgressItem(
      Artifact artifact,
      boolean unlocked,
      LocalDateTime unlockedAt,
      String obtainedSource,
      boolean seen) {}

  public record TaskStreakSummary(
      UUID id,
      String name,
      TaskType taskType,
      int currentStreak,
      int highestStreak,
      boolean isCycleBased) {}

  public record UserShowcaseResult(
      User user,
      int effectiveStreak,
      List<ProfileHighlight> highlights,
      List<AchievementProgressItem> achievements,
      int unlockedCount,
      int totalAchievements,
      int totalAchievementPoints,
      int maxPossiblePoints,
      List<ArtifactProgressItem> artifacts,
      int unlockedArtifactsCount,
      int totalArtifactsCount,
      List<TaskStreakSummary> taskStreaks,
      int highestTaskStreak,
      @Nullable String highestTaskStreakTitle,
      @Nullable TaskType highestTaskStreakType,
      List<TaskStreakSummary> highlightTaskStreaks,
      long friendsCount,
      long pendingFriendRequestsCount,
      boolean hasSeasonalRetroBanner,
      @Nullable Integer seasonalRetroYear,
      List<String> eligibleRetroArchetypes) {
    public UserShowcaseResult(
        User user,
        int effectiveStreak,
        List<ProfileHighlight> highlights,
        List<AchievementProgressItem> achievements,
        int unlockedCount,
        int totalAchievements,
        int totalAchievementPoints,
        int maxPossiblePoints,
        List<ArtifactProgressItem> artifacts,
        int unlockedArtifactsCount,
        int totalArtifactsCount,
        List<TaskStreakSummary> taskStreaks,
        int highestTaskStreak,
        @Nullable String highestTaskStreakTitle,
        @Nullable TaskType highestTaskStreakType,
        List<TaskStreakSummary> highlightTaskStreaks,
        long friendsCount,
        long pendingFriendRequestsCount,
        boolean hasSeasonalRetroBanner,
        @Nullable Integer seasonalRetroYear) {
      this(
          user,
          effectiveStreak,
          highlights,
          achievements,
          unlockedCount,
          totalAchievements,
          totalAchievementPoints,
          maxPossiblePoints,
          artifacts,
          unlockedArtifactsCount,
          totalArtifactsCount,
          taskStreaks,
          highestTaskStreak,
          highestTaskStreakTitle,
          highestTaskStreakType,
          highlightTaskStreaks,
          friendsCount,
          pendingFriendRequestsCount,
          hasSeasonalRetroBanner,
          seasonalRetroYear,
          List.of());
    }

    public UserShowcaseResult(
        User user,
        int effectiveStreak,
        List<ProfileHighlight> highlights,
        List<AchievementProgressItem> achievements,
        int unlockedCount,
        int totalAchievements,
        int totalAchievementPoints,
        int maxPossiblePoints,
        List<ArtifactProgressItem> artifacts,
        int unlockedArtifactsCount,
        int totalArtifactsCount,
        List<TaskStreakSummary> taskStreaks,
        int highestTaskStreak,
        @Nullable String highestTaskStreakTitle,
        @Nullable TaskType highestTaskStreakType,
        List<TaskStreakSummary> highlightTaskStreaks) {
      this(
          user,
          effectiveStreak,
          highlights,
          achievements,
          unlockedCount,
          totalAchievements,
          totalAchievementPoints,
          maxPossiblePoints,
          artifacts,
          unlockedArtifactsCount,
          totalArtifactsCount,
          taskStreaks,
          highestTaskStreak,
          highestTaskStreakTitle,
          highestTaskStreakType,
          highlightTaskStreaks,
          0L,
          0L,
          false,
          null);
    }
    public UserShowcaseResult(
        User user,
        int effectiveStreak,
        List<ProfileHighlight> highlights,
        List<AchievementProgressItem> achievements,
        int unlockedCount,
        int totalAchievements,
        int totalAchievementPoints,
        int maxPossiblePoints,
        List<ArtifactProgressItem> artifacts,
        int unlockedArtifactsCount,
        int totalArtifactsCount,
        List<TaskStreakSummary> taskStreaks,
        int highestTaskStreak,
        @Nullable String highestTaskStreakTitle,
        @Nullable TaskType highestTaskStreakType) {
      this(
          user,
          effectiveStreak,
          highlights,
          achievements,
          unlockedCount,
          totalAchievements,
          totalAchievementPoints,
          maxPossiblePoints,
          artifacts,
          unlockedArtifactsCount,
          totalArtifactsCount,
          taskStreaks,
          highestTaskStreak,
          highestTaskStreakTitle,
          highestTaskStreakType,
          taskStreaks);
    }

    public UserShowcaseResult(
        User user,
        int effectiveStreak,
        List<ProfileHighlight> highlights,
        List<AchievementProgressItem> achievements,
        int unlockedCount,
        int totalAchievements,
        int totalAchievementPoints,
        int maxPossiblePoints,
        List<ArtifactProgressItem> artifacts,
        int unlockedArtifactsCount,
        int totalArtifactsCount) {
      this(
          user,
          effectiveStreak,
          highlights,
          achievements,
          unlockedCount,
          totalAchievements,
          totalAchievementPoints,
          maxPossiblePoints,
          artifacts,
          unlockedArtifactsCount,
          totalArtifactsCount,
          List.of(),
          0,
          null,
          null,
          List.of());
    }

    public UserShowcaseResult(
        User user,
        int effectiveStreak,
        List<ProfileHighlight> highlights,
        List<AchievementProgressItem> achievements,
        int unlockedCount,
        int totalAchievements,
        int totalAchievementPoints,
        int maxPossiblePoints) {
      this(
          user,
          effectiveStreak,
          highlights,
          achievements,
          unlockedCount,
          totalAchievements,
          totalAchievementPoints,
          maxPossiblePoints,
          List.of(),
          0,
          0,
          List.of(),
          0,
          null,
          null,
          List.of());
    }

    public List<TaskStreakSummary> resolvedHighlightTaskStreaks() {
      return highlightTaskStreaks != null && !highlightTaskStreaks.isEmpty()
          ? highlightTaskStreaks
          : (taskStreaks != null ? taskStreaks : List.of());
    }
  }

  @Transactional
  public UserShowcaseResult execute(UUID userId) {
    if (dailyResetUseCase != null) {
      dailyResetUseCase.resetUserIfDue(userId);
    }
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    List<ProfileHighlight> highlights = profileHighlightPort.findAllByUserIdOrderByDisplayOrder(userId);

    // Avalia conquistas pendentes reutilizando os destaques já carregados e evita reconsultar catálogo/desbloqueios/artefatos
    var snapshot = evaluateUserAchievementsUseCase.executeWithSnapshot(user, highlights);
    List<Achievement> catalog = !snapshot.catalog().isEmpty()
        ? snapshot.catalog()
        : achievementPort.findAllOrdered();
    List<UserAchievement> userUnlocks = !snapshot.allUserUnlocks().isEmpty()
        ? snapshot.allUserUnlocks()
        : userAchievementPort.findAllByUserId(userId);

    return buildShowcaseResult(
        user,
        highlights,
        catalog,
        userUnlocks,
        snapshot.artifactCatalog(),
        snapshot.userArtifacts(),
        true,
        true);
  }

  /**
   * Lista as ofensivas atuais e recordes das tarefas recorrentes positivas do usuário
   * (Diárias e Hábitos positivos/neutros) para seleção ou hidratação de destaques na vitrine.
   */
  @Transactional(readOnly = true)
  public List<TaskStreakSummary> listTaskStreaksForUser(UUID userId) {
    if (userId == null) {
      return List.of();
    }
    return userPort.findById(userId)
        .map(this::buildTaskStreakSummaries)
        .orElse(List.of());
  }

  /**
   * Leitura pura da vitrine (sem mutações de reset diário ou escrita de conquistas),
   * segura para consultas de outros visitantes dentro de transações @Transactional(readOnly = true).
   */
  @Transactional(readOnly = true)
  public UserShowcaseResult executeReadOnly(User preloadedUser) {
    return executeReadOnly(preloadedUser, true);
  }

  /**
   * Variante de leitura pura que permite pular a consulta de tarefas recorrentes
   * quando o visitante não tem permissão para visualizar estatísticas.
   */
  @Transactional(readOnly = true)
  public UserShowcaseResult executeReadOnly(User preloadedUser, boolean includeTaskStreaks) {
    if (preloadedUser == null || preloadedUser.getId() == null) {
      throw new ResourceNotFoundException("Usuário não encontrado.");
    }
    UUID userId = preloadedUser.getId();
    List<ProfileHighlight> highlights = profileHighlightPort.findAllByUserIdOrderByDisplayOrder(userId);
    List<Achievement> catalog = achievementPort.findAllOrdered();
    List<UserAchievement> userUnlocks = userAchievementPort.findAllByUserId(userId);
    return buildShowcaseResult(
        preloadedUser, highlights, catalog, userUnlocks, null, null, false, includeTaskStreaks);
  }

  private UserShowcaseResult buildShowcaseResult(
      User user,
      List<ProfileHighlight> highlights,
      List<Achievement> catalog,
      List<UserAchievement> userUnlocks,
      List<Artifact> preloadedArtifactCatalog,
      List<UserArtifact> preloadedUserArtifacts,
      boolean includeOwnerBadges,
      boolean includeTaskStreaks) {
    int highlightsCount = highlights.size();
    Map<UUID, UserAchievement> unlockMap = userUnlocks.stream()
        .collect(Collectors.toMap(UserAchievement::getAchievementId, Function.identity(), (a, b) -> a));

    List<Artifact> artifactCatalog = preloadedArtifactCatalog != null
        ? preloadedArtifactCatalog
        : (artifactPort != null ? artifactPort.findAllOrdered() : List.of());
    List<UserArtifact> userArtifacts = preloadedUserArtifacts != null
        ? preloadedUserArtifacts
        : (userArtifactPort != null ? userArtifactPort.findAllByUserId(user.getId()) : List.of());

    Map<String, Artifact> artifactByAchCode = new HashMap<>();
    for (Artifact art : artifactCatalog) {
      if (art.getSourceType() == ArtifactSourceType.ACHIEVEMENT && art.getRequiredAchievementCode() != null) {
        artifactByAchCode.put(art.getRequiredAchievementCode().trim().toUpperCase(), art);
      }
    }

    int unlockedCount = 0;
    int totalPoints = 0;
    int maxPoints = 0;

    List<AchievementProgressItem> items = new ArrayList<>(catalog.size());
    for (Achievement achievement : catalog) {
      maxPoints += achievement.getPoints();
      UserAchievement unlock = unlockMap.get(achievement.getId());
      boolean isUnlocked = unlock != null;

      int rawCurrent = AchievementCode.fromString(achievement.getCode())
          .map(code -> code.extractCurrentProgress(user, highlightsCount))
          .orElse(isUnlocked ? achievement.getTargetValue() : 0);

      int clampedCurrent = isUnlocked
          ? Math.max(rawCurrent, achievement.getTargetValue())
          : Math.min(rawCurrent, achievement.getTargetValue());

      int percent = achievement.getTargetValue() > 0
          ? Math.min(100, Math.round((clampedCurrent * 100.0f) / achievement.getTargetValue()))
          : (isUnlocked ? 100 : 0);

      if (isUnlocked) {
        unlockedCount++;
        totalPoints += achievement.getPoints();
      }

      Artifact grantedArtifact = artifactByAchCode.get(achievement.getCode().trim().toUpperCase());

      items.add(new AchievementProgressItem(
          achievement,
          isUnlocked,
          isUnlocked ? unlock.getUnlockedAt() : null,
          !isUnlocked || unlock.isSeen(),
          clampedCurrent,
          isUnlocked ? 100 : percent,
          grantedArtifact));
    }

    Map<UUID, UserArtifact> userArtifactMap = userArtifacts.stream()
        .collect(Collectors.toMap(UserArtifact::getArtifactId, Function.identity(), (a, b) -> a));

    int unlockedArtifactsCount = 0;
    List<ArtifactProgressItem> artifactItems = new ArrayList<>(artifactCatalog.size());
    for (Artifact artifact : artifactCatalog) {
      UserArtifact owned = userArtifactMap.get(artifact.getId());
      boolean ownedFlag = owned != null;
      if (ownedFlag) {
        unlockedArtifactsCount++;
      }
      artifactItems.add(new ArtifactProgressItem(
          artifact,
          ownedFlag,
          ownedFlag ? owned.getUnlockedAt() : null,
          ownedFlag ? owned.getObtainedSource() : null,
          !ownedFlag || owned.isSeen()));
    }

    List<TaskStreakSummary> allTaskStreaks = includeTaskStreaks
        ? buildTaskStreakSummaries(user)
        : List.of();
    Set<String> existingTaskIds = allTaskStreaks.stream()
        .map(s -> s.id().toString())
        .collect(Collectors.toSet());
    List<ProfileHighlight> effectiveHighlights = (includeTaskStreaks && taskPort != null)
        ? highlights.stream()
            .filter(h -> h.getHighlightType() != HighlightType.TASK_STREAK
                || h.getHighlightKey().filter(existingTaskIds::contains).isPresent())
            .toList()
        : highlights;

    Set<String> pinnedTaskIds = effectiveHighlights.stream()
        .filter(h -> h.getHighlightType() == HighlightType.TASK_STREAK)
        .flatMap(h -> h.getHighlightKey().stream())
        .collect(Collectors.toSet());
    List<TaskStreakSummary> highlightTaskStreaks = pinnedTaskIds.isEmpty()
        ? List.of()
        : allTaskStreaks.stream()
            .filter(s -> pinnedTaskIds.contains(s.id().toString()))
            .toList();

    List<TaskStreakSummary> featuredTaskStreaks = selectTopActiveTaskStreaks(allTaskStreaks);

    TaskStreakSummary topTaskRecord = allTaskStreaks.stream()
        .filter(s -> s.highestStreak() > 0)
        .max(Comparator
            .comparingInt(TaskStreakSummary::highestStreak)
            .thenComparingInt(TaskStreakSummary::currentStreak)
            .thenComparing(TaskStreakSummary::name, Comparator.reverseOrder()))
        .orElse(null);

    long friendsCount = 0L;
    long pendingFriendRequestsCount = 0L;
    Integer seasonalRetroYear = null;
    List<String> eligibleRetroArchetypes = List.of();
    if (includeOwnerBadges) {
      if (friendshipPort != null) {
        friendsCount = friendshipPort.countAcceptedByUserId(user.getId());
        pendingFriendRequestsCount = friendshipPort.countIncomingPendingByUserId(user.getId());
      }
      if (retrospectiveUseCase != null) {
        seasonalRetroYear = retrospectiveUseCase.resolveSeasonalBannerYear(user).orElse(null);
        eligibleRetroArchetypes = retrospectiveUseCase.findEligibleArchetypesForUser(user).stream()
            .map(Enum::name)
            .sorted()
            .toList();
      }
    }

    int effectiveStreak = includeTaskStreaks ? effectiveStreakResolver.resolve(user) : 0;

    return new UserShowcaseResult(
        user,
        effectiveStreak,
        effectiveHighlights,
        items,
        unlockedCount,
        catalog.size(),
        totalPoints,
        maxPoints,
        artifactItems,
        unlockedArtifactsCount,
        artifactCatalog.size(),
        featuredTaskStreaks,
        topTaskRecord != null ? topTaskRecord.highestStreak() : 0,
        topTaskRecord != null ? topTaskRecord.name() : null,
        topTaskRecord != null ? topTaskRecord.taskType() : null,
        highlightTaskStreaks,
        friendsCount,
        pendingFriendRequestsCount,
        seasonalRetroYear != null,
        seasonalRetroYear,
        eligibleRetroArchetypes);
  }

  /**
   * Mantém apenas as tarefas recorrentes com streak ativo (> 0) de maior ofensiva,
   * no máximo uma Diária e um Hábito, evitando listar tarefas zeradas na vitrine.
   */
  private List<TaskStreakSummary> selectTopActiveTaskStreaks(List<TaskStreakSummary> allTaskStreaks) {
    if (allTaskStreaks == null || allTaskStreaks.isEmpty()) {
      return List.of();
    }
    List<TaskStreakSummary> featured = new ArrayList<>(2);
    allTaskStreaks.stream()
        .filter(s -> s.taskType() == TaskType.DAILY && s.currentStreak() > 0)
        .findFirst()
        .ifPresent(featured::add);
    allTaskStreaks.stream()
        .filter(s -> s.taskType() == TaskType.HABIT && s.currentStreak() > 0)
        .findFirst()
        .ifPresent(featured::add);
    featured.sort(Comparator
        .comparingInt(TaskStreakSummary::currentStreak).reversed()
        .thenComparing(Comparator.comparingInt(TaskStreakSummary::highestStreak).reversed())
        .thenComparing(TaskStreakSummary::name, String.CASE_INSENSITIVE_ORDER));
    return List.copyOf(featured);
  }

  private List<TaskStreakSummary> buildTaskStreakSummaries(User user) {
    if (taskPort == null || user == null || user.getId() == null) {
      return List.of();
    }
    List<UUID> singleUserId = List.of(user.getId());
    // Consulta enxuta sem carregar checklists (não utilizados na vitrine)
    List<Task> recurringTasks = taskPort.findRecurringTasksLightweightByUserIds(singleUserId)
        .orElseGet(() -> taskPort.findRecurringTasksByUserIds(singleUserId));
    if (recurringTasks == null || recurringTasks.isEmpty()) {
      return List.of();
    }
    LocalDate effectiveDate = LocalDate.now(clock.withZone(user.resolveZoneId(clock.getZone())));
    List<TaskStreakSummary> summaries = new ArrayList<>();
    for (Task task : recurringTasks) {
      if (task instanceof Daily d) {
        int current = d.getEffectiveStreak(effectiveDate);
        int highest = Math.max(d.getHighestStreak(), current);
        boolean isCycleBased = (d.getRepeatType() != null && d.getRepeatType() != DailyRepeatType.DAILY)
            || d.getRepeatEvery() > 1;
        summaries.add(new TaskStreakSummary(
            d.getId(),
            d.getName(),
            TaskType.DAILY,
            current,
            highest,
            isCycleBased));
      } else if (task instanceof Habit h && h.getHabitType() != HabitType.NEGATIVE) {
        int current = h.getEffectiveStreak(effectiveDate);
        int highest = Math.max(h.getHighestStreak(), current);
        boolean isCycleBased = h.getResetCounter() != null && h.getResetCounter() != HabitResetCounter.DAILY;
        summaries.add(new TaskStreakSummary(
            h.getId(),
            h.getName(),
            TaskType.HABIT,
            current,
            highest,
            isCycleBased));
      }
    }
    summaries.sort(Comparator
        .comparingInt(TaskStreakSummary::currentStreak).reversed()
        .thenComparing(Comparator.comparingInt(TaskStreakSummary::highestStreak).reversed())
        .thenComparing(TaskStreakSummary::name, String.CASE_INSENSITIVE_ORDER));
    return summaries;
  }
}
