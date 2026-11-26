package com.habitparty.application.usecases.achievement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.FocusRecordRepository.RetrospectiveFocusBucket;
import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.TransactionHistoryRepository.RetrospectiveTxBucket;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.social.SocialAccessSupport;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;
import com.habitparty.application.usecases.social.SocialUserSummary;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.entities.achievement.UserRetrospective;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.RetrospectiveArchetype;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;

@Service
public class GetUserRetrospectiveUseCase {

  private static final int MIN_SUPPORTED_YEAR = 2020;
  private static final int MIN_FOCUS_MINUTES_FOR_ACTIVE_DAY = 10;

  private static final Set<TransactionType> COMPLETED_TASK_TYPES = EnumSet.of(
      TransactionType.HABIT_COMPLETED,
      TransactionType.DAILY_COMPLETED,
      TransactionType.TODO_COMPLETED,
      TransactionType.TASK_COMPLETED);

  private static final Set<TransactionType> POSITIVE_REWARD_TYPES = EnumSet.of(
      TransactionType.HABIT_COMPLETED,
      TransactionType.DAILY_COMPLETED,
      TransactionType.TODO_COMPLETED,
      TransactionType.TASK_COMPLETED,
      TransactionType.FOCUS_COMPLETED);

  private final UserRepository userRepository;
  private final FriendshipRepository friendshipRepository;
  private final TransactionHistoryRepository transactionHistoryRepository;
  private final FocusRecordRepository focusRecordRepository;
  private final UserAchievementRepository userAchievementRepository;
  private final AchievementRepository achievementRepository;
  private final UserTimeResolver timeResolver;

  public GetUserRetrospectiveUseCase(
      UserRepository userRepository,
      FriendshipRepository friendshipRepository,
      TransactionHistoryRepository transactionHistoryRepository,
      FocusRecordRepository focusRecordRepository,
      UserAchievementRepository userAchievementRepository,
      AchievementRepository achievementRepository,
      UserTimeResolver timeResolver) {
    this.userRepository = userRepository;
    this.friendshipRepository = friendshipRepository;
    this.transactionHistoryRepository = transactionHistoryRepository;
    this.focusRecordRepository = focusRecordRepository;
    this.userAchievementRepository = userAchievementRepository;
    this.achievementRepository = achievementRepository;
    this.timeResolver = timeResolver;
  }

  @Transactional(readOnly = true)
  public UserRetrospective executeForSelf(UUID userId, Integer requestedYear) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    return buildRetrospective(user, requestedYear, true);
  }

  /**
   * Verifica de forma leve se o usuário tem banner sazonal de retrospectiva disponível agora.
   * Fora da janela sazonal (20/dez–31/jan), retorna vazio sem executar nenhuma consulta ao banco.
   */
  @Transactional(readOnly = true)
  public Optional<Integer> resolveSeasonalBannerYear(User target) {
    if (target == null || target.getId() == null) {
      return Optional.empty();
    }
    ZoneId userZone = timeResolver.resolveZone(target);
    LocalDate userToday = timeResolver.resolveDate(target);
    int defaultYear = UserRetrospective.resolveDefaultTargetYear(userToday);
    if (!UserRetrospective.isInSeasonalWindow(userToday, defaultYear)) {
      return Optional.empty();
    }
    ZoneId storageZone = timeResolver.clock().getZone();
    ZonedDateTime startUser = LocalDate.of(defaultYear, 1, 1).atStartOfDay(userZone);
    ZonedDateTime endUserExclusive = LocalDate.of(defaultYear + 1, 1, 1).atStartOfDay(userZone);
    LocalDateTime startStorage = startUser.withZoneSameInstant(storageZone).toLocalDateTime();
    LocalDateTime endStorageExclusive = endUserExclusive.withZoneSameInstant(storageZone).toLocalDateTime();

    Map<Integer, List<RetrospectiveTxBucket>> txBucketsByYear = loadTxBucketsByYear(
        target.getId(), startStorage, endStorageExclusive, userZone);
    Map<Integer, List<RetrospectiveFocusBucket>> focusBucketsByYear = loadFocusBucketsByYear(
        target.getId(), startStorage, endStorageExclusive, userZone);
    YearSnapshot snapshot = computeYearSnapshotFromBuckets(
        userZone,
        txBucketsByYear.getOrDefault(defaultYear, List.of()),
        focusBucketsByYear.getOrDefault(defaultYear, List.of()),
        List.of(),
        Map.of());
    return snapshot.eligible() ? Optional.of(defaultYear) : Optional.empty();
  }

  /**
   * Retorna os arquétipos de retrospectiva elegíveis já conquistados pelo usuário em anos concluídos
   * ou na janela sazonal atual (usado para validar títulos equipáveis de retrospectiva).
   */
  @Transactional(readOnly = true)
  public Set<RetrospectiveArchetype> findEligibleArchetypesForUser(User target) {
    if (target == null || target.getId() == null) {
      return Set.of();
    }
    ZoneId userZone = timeResolver.resolveZone(target);
    LocalDate userToday = timeResolver.resolveDate(target);
    int currentYear = userToday.getYear();
    int earliestYear = resolveEarliestActivityYear(target, userZone, currentYear);

    int maxEligibleYear = -1;
    for (int year = earliestYear; year <= currentYear; year++) {
      if (year < currentYear || UserRetrospective.isInSeasonalWindow(userToday, year)) {
        maxEligibleYear = year;
      }
    }
    if (maxEligibleYear < earliestYear) {
      return Set.of();
    }

    ZoneId storageZone = timeResolver.clock().getZone();
    ZonedDateTime startUser = LocalDate.of(earliestYear, 1, 1).atStartOfDay(userZone);
    ZonedDateTime endUserExclusive = LocalDate.of(maxEligibleYear + 1, 1, 1).atStartOfDay(userZone);
    LocalDateTime startStorage = startUser.withZoneSameInstant(storageZone).toLocalDateTime();
    LocalDateTime endStorageExclusive = endUserExclusive.withZoneSameInstant(storageZone).toLocalDateTime();

    Map<Integer, List<RetrospectiveTxBucket>> txBucketsByYear = loadTxBucketsByYear(
        target.getId(), startStorage, endStorageExclusive, userZone);
    Map<Integer, List<RetrospectiveFocusBucket>> focusBucketsByYear = loadFocusBucketsByYear(
        target.getId(), startStorage, endStorageExclusive, userZone);

    Set<RetrospectiveArchetype> archetypes = EnumSet.noneOf(RetrospectiveArchetype.class);
    for (int year = earliestYear; year <= maxEligibleYear; year++) {
      YearSnapshot snapshot = computeYearSnapshotFromBuckets(
          userZone,
          txBucketsByYear.getOrDefault(year, List.of()),
          focusBucketsByYear.getOrDefault(year, List.of()),
          List.of(),
          Map.of());
      if (snapshot.eligible()) {
        archetypes.add(RetrospectiveArchetype.resolve(
            snapshot.activeDays(),
            snapshot.tasksCompleted(),
            snapshot.hardTasksCompleted(),
            snapshot.focusMinutes()));
      }
    }
    return archetypes;
  }

  @Transactional(readOnly = true)
  public UserRetrospective executeForUsername(UUID viewerId, String rawUsername, Integer requestedYear) {
    String cleanUsername = SocialAccessSupport.normalizeUsernameQuery(rawUsername);
    if (cleanUsername == null) {
      throw new ResourceNotFoundException("Usuário não encontrado.");
    }

    User target = userRepository.findByUsernameIgnoreCase(cleanUsername)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário @" + cleanUsername + " não encontrado."));

    boolean isSelf = viewerId != null && viewerId.equals(target.getId());
    Optional<Friendship> relOpt = (!isSelf && viewerId != null)
        ? friendshipRepository.findBetweenUsers(viewerId, target.getId())
        : Optional.empty();
    SocialRelationshipStatus status = isSelf
        ? SocialRelationshipStatus.SELF
        : SocialAccessSupport.resolveRelationshipStatus(viewerId, relOpt.orElse(null));

    if (status == SocialRelationshipStatus.BLOCKED || status == SocialRelationshipStatus.BLOCKED_BY_VIEWER) {
      throw new ResourceNotFoundException("Usuário @" + cleanUsername + " não encontrado.");
    }

    boolean isFriend = status == SocialRelationshipStatus.FRIENDS;
    boolean canViewProfile = SocialUserSummary.isAllowed(target.getProfileVisibility(), isSelf, isFriend);
    boolean canViewStats = canViewProfile
        && SocialUserSummary.isAllowed(target.getStatsVisibility(), isSelf, isFriend);

    if (!canViewStats) {
      throw new UnauthorizedException("A retrospectiva deste usuário é privada.");
    }

    boolean includeAchievements = SocialUserSummary.isAllowed(target.getAchievementsVisibility(), isSelf, isFriend);
    return buildRetrospective(target, requestedYear, includeAchievements);
  }

  private UserRetrospective buildRetrospective(User target, Integer requestedYear, boolean includeAchievements) {
    ZoneId userZone = timeResolver.resolveZone(target);
    LocalDate userToday = timeResolver.resolveDate(target);

    int defaultYear = UserRetrospective.resolveDefaultTargetYear(userToday);
    int targetYear = requestedYear != null ? requestedYear : defaultYear;
    if (targetYear < MIN_SUPPORTED_YEAR || targetYear > userToday.getYear()) {
      throw new DomainValidationException(
          "O ano da retrospectiva deve estar entre " + MIN_SUPPORTED_YEAR + " e " + userToday.getYear() + ".");
    }

    int earliestYear = resolveEarliestActivityYear(target, userZone, userToday.getYear());

    Map<UUID, Achievement> achievementsById = new HashMap<>();
    Map<Integer, List<UserAchievement>> unlocksByYear = new HashMap<>();
    if (includeAchievements) {
      achievementRepository.findAllOrdered().forEach(a -> achievementsById.put(a.getId(), a));
      for (UserAchievement ua : userAchievementRepository.findAllByUserId(target.getId())) {
        if (ua.getUnlockedAt() != null) {
          int unlockYear = toUserDate(ua.getUnlockedAt(), userZone).getYear();
          unlocksByYear.computeIfAbsent(unlockYear, k -> new ArrayList<>()).add(ua);
        }
      }
    }

    int minScanYear = targetYear;
    int maxScanYear = targetYear;
    for (int year = userToday.getYear(); year >= earliestYear; year--) {
      boolean completedOrSeasonal = year < userToday.getYear()
          || UserRetrospective.isInSeasonalWindow(userToday, year);
      if (completedOrSeasonal || year == targetYear) {
        minScanYear = Math.min(minScanYear, year);
        maxScanYear = Math.max(maxScanYear, year);
      }
    }

    // Agregação SQL direta por balde temporal (evita carregar anos inteiros de entidades na heap)
    ZonedDateTime startUser = LocalDate.of(minScanYear, 1, 1).atStartOfDay(userZone);
    ZonedDateTime endUserExclusive = LocalDate.of(maxScanYear + 1, 1, 1).atStartOfDay(userZone);
    LocalDateTime startStorage = startUser.withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    LocalDateTime endStorageExclusive = endUserExclusive.withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();

    Map<Integer, List<RetrospectiveTxBucket>> txByYear = loadTxBucketsByYear(
        target.getId(), startStorage, endStorageExclusive, userZone);
    Map<Integer, List<RetrospectiveFocusBucket>> focusByYear = loadFocusBucketsByYear(
        target.getId(), startStorage, endStorageExclusive, userZone);

    List<Integer> availableYears = new ArrayList<>();
    YearSnapshot targetSnapshot = null;

    for (int year = maxScanYear; year >= minScanYear; year--) {
      boolean completedOrSeasonal = year < userToday.getYear()
          || UserRetrospective.isInSeasonalWindow(userToday, year);
      if (year != targetYear && !completedOrSeasonal) {
        continue;
      }
      YearSnapshot snapshot = computeYearSnapshotFromBuckets(
          userZone,
          txByYear.getOrDefault(year, List.of()),
          focusByYear.getOrDefault(year, List.of()),
          unlocksByYear.getOrDefault(year, List.of()),
          achievementsById);
      if (year == targetYear) {
        targetSnapshot = snapshot;
      }
      if (completedOrSeasonal && snapshot.eligible()) {
        availableYears.add(year);
      }
    }

    if (targetSnapshot == null) {
      targetSnapshot = computeYearSnapshotFromBuckets(
          userZone,
          txByYear.getOrDefault(targetYear, List.of()),
          focusByYear.getOrDefault(targetYear, List.of()),
          unlocksByYear.getOrDefault(targetYear, List.of()),
          achievementsById);
    }

    boolean inSeasonalWindow = UserRetrospective.isInSeasonalWindow(userToday, targetYear);
    RetrospectiveArchetype archetype = RetrospectiveArchetype.resolve(
        targetSnapshot.activeDays(),
        targetSnapshot.tasksCompleted(),
        targetSnapshot.hardTasksCompleted(),
        targetSnapshot.focusMinutes());

    return new UserRetrospective(
        targetYear,
        userZone.getId(),
        targetSnapshot.eligible(),
        inSeasonalWindow,
        targetSnapshot.criteriaMet(),
        UserRetrospective.MIN_CRITERIA_REQUIRED,
        UserRetrospective.MIN_ACTIVE_DAYS,
        UserRetrospective.MIN_TASKS_COMPLETED,
        UserRetrospective.MIN_FOCUS_MINUTES,
        targetSnapshot.activeDays(),
        targetSnapshot.tasksCompleted(),
        targetSnapshot.hardTasksCompleted(),
        targetSnapshot.focusMinutes(),
        targetSnapshot.focusSessionsCount(),
        targetSnapshot.pomodorosCompleted(),
        targetSnapshot.xpEarned(),
        targetSnapshot.coinsEarned(),
        includeAchievements ? targetSnapshot.achievementsUnlockedCount() : 0,
        targetSnapshot.bestMonth(),
        targetSnapshot.bestMonthTasksCount(),
        includeAchievements && targetSnapshot.rarestAchievement() != null
            ? targetSnapshot.rarestAchievement().getCode()
            : null,
        includeAchievements && targetSnapshot.rarestAchievement() != null
            ? targetSnapshot.rarestAchievement().getTitle()
            : null,
        includeAchievements && targetSnapshot.rarestAchievement() != null
            ? targetSnapshot.rarestAchievement().getRarity().name()
            : null,
        archetype,
        availableYears);
  }

  private Map<Integer, List<RetrospectiveTxBucket>> loadTxBucketsByYear(
      UUID userId,
      LocalDateTime startStorage,
      LocalDateTime endStorageExclusive,
      ZoneId userZone) {
    List<RetrospectiveTxBucket> buckets = transactionHistoryRepository
        .aggregateForRetrospective(userId, startStorage, endStorageExclusive)
        .orElseGet(() -> toTxBuckets(transactionHistoryRepository.findAllByUserIdAndPeriod(
            userId, startStorage, endStorageExclusive.minusNanos(1))));

    Map<Integer, List<RetrospectiveTxBucket>> byYear = new HashMap<>();
    for (RetrospectiveTxBucket bucket : buckets) {
      int year = bucketToUserDate(bucket.year(), bucket.month(), bucket.day(), bucket.hour(), bucket.quarterHour(), userZone)
          .getYear();
      byYear.computeIfAbsent(year, k -> new ArrayList<>()).add(bucket);
    }
    return byYear;
  }

  private Map<Integer, List<RetrospectiveFocusBucket>> loadFocusBucketsByYear(
      UUID userId,
      LocalDateTime startStorage,
      LocalDateTime endStorageExclusive,
      ZoneId userZone) {
    List<RetrospectiveFocusBucket> buckets = focusRecordRepository
        .aggregateForRetrospective(userId, startStorage, endStorageExclusive, MIN_FOCUS_MINUTES_FOR_ACTIVE_DAY)
        .orElseGet(() -> toFocusBuckets(focusRecordRepository.findAllByUserIdAndPeriod(
            userId, startStorage, endStorageExclusive.minusNanos(1))));

    Map<Integer, List<RetrospectiveFocusBucket>> byYear = new HashMap<>();
    for (RetrospectiveFocusBucket bucket : buckets) {
      int year = bucketToUserDate(bucket.year(), bucket.month(), bucket.day(), bucket.hour(), bucket.quarterHour(), userZone)
          .getYear();
      byYear.computeIfAbsent(year, k -> new ArrayList<>()).add(bucket);
    }
    return byYear;
  }

  private List<RetrospectiveTxBucket> toTxBuckets(List<TransactionHistory> transactions) {
    if (transactions == null || transactions.isEmpty()) {
      return List.of();
    }
    List<RetrospectiveTxBucket> buckets = new ArrayList<>(transactions.size());
    for (TransactionHistory tx : transactions) {
      if (tx.getCreatedAt() == null) {
        continue;
      }
      TransactionType type = tx.getTransactionType();
      if (!POSITIVE_REWARD_TYPES.contains(type)) {
        continue;
      }
      int tasks = 0;
      int hardTasks = 0;
      if (COMPLETED_TASK_TYPES.contains(type)) {
        int effortUnits = Math.max(1, tx.getEffortUnitsSnapshot().orElse(1));
        tasks = effortUnits;
        if (tx.getDifficultySnapshot().orElse(null) == TaskDifficulty.HARD) {
          hardTasks = effortUnits;
        }
      }
      int xp = Math.max(0, tx.getXpAmount());
      BigDecimal gold = tx.getGoldAmount().orElse(BigDecimal.ZERO);
      BigDecimal positiveGold = gold.compareTo(BigDecimal.ZERO) > 0 ? gold : BigDecimal.ZERO;
      LocalDateTime ts = tx.getCreatedAt();
      buckets.add(new RetrospectiveTxBucket(
          ts.getYear(), ts.getMonthValue(), ts.getDayOfMonth(), ts.getHour(), ts.getMinute() / 15,
          tasks, hardTasks, xp, positiveGold));
    }
    return buckets;
  }

  private List<RetrospectiveFocusBucket> toFocusBuckets(List<FocusRecord> records) {
    if (records == null || records.isEmpty()) {
      return List.of();
    }
    List<RetrospectiveFocusBucket> buckets = new ArrayList<>(records.size());
    for (FocusRecord rec : records) {
      if (rec.getInventoryItemId().isPresent() || rec.getEndTime() == null) {
        continue;
      }
      int minutes = Math.max(0, rec.getDurationMinutes());
      int pomos = Math.max(0, rec.getCompletedPomos().orElse(0));
      LocalDateTime ts = rec.getEndTime();
      buckets.add(new RetrospectiveFocusBucket(
          ts.getYear(), ts.getMonthValue(), ts.getDayOfMonth(), ts.getHour(), ts.getMinute() / 15,
          minutes, 1, pomos, minutes >= MIN_FOCUS_MINUTES_FOR_ACTIVE_DAY));
    }
    return buckets;
  }

  private LocalDate bucketToUserDate(int year, int month, int day, int hour, int quarterHour, ZoneId userZone) {
    LocalDateTime bucketStart = LocalDateTime.of(year, month, day, hour, Math.max(0, Math.min(3, quarterHour)) * 15);
    return toUserDate(bucketStart, userZone);
  }

  private int resolveEarliestActivityYear(User user, ZoneId userZone, int currentYear) {
    int earliest = currentYear;
    if (user.getCreatedAt() != null) {
      earliest = Math.min(earliest, toUserDate(user.getCreatedAt(), userZone).getYear());
    }
    Optional<LocalDateTime> firstTx = transactionHistoryRepository.findEarliestCreatedAtByUserId(user.getId());
    if (firstTx.isPresent()) {
      earliest = Math.min(earliest, toUserDate(firstTx.get(), userZone).getYear());
    }
    Optional<LocalDateTime> firstFocus = focusRecordRepository.findEarliestEndTimeByUserId(user.getId());
    if (firstFocus.isPresent()) {
      earliest = Math.min(earliest, toUserDate(firstFocus.get(), userZone).getYear());
    }
    return Math.max(MIN_SUPPORTED_YEAR, Math.min(earliest, currentYear));
  }

  private YearSnapshot computeYearSnapshotFromBuckets(
      ZoneId userZone,
      List<RetrospectiveTxBucket> txBuckets,
      List<RetrospectiveFocusBucket> focusBuckets,
      List<UserAchievement> yearUnlocks,
      Map<UUID, Achievement> achievementsById) {
    Set<LocalDate> activeDates = new HashSet<>();
    int tasksCompleted = 0;
    int hardTasksCompleted = 0;
    int xpEarned = 0;
    BigDecimal coinsEarned = BigDecimal.ZERO;
    int[] monthTasks = new int[13];
    int[] monthFocusMinutes = new int[13];

    for (RetrospectiveTxBucket bucket : txBuckets) {
      LocalDate txDate = bucketToUserDate(
          bucket.year(), bucket.month(), bucket.day(), bucket.hour(), bucket.quarterHour(), userZone);
      if (bucket.tasksCompleted() > 0) {
        tasksCompleted += bucket.tasksCompleted();
        hardTasksCompleted += bucket.hardTasksCompleted();
        activeDates.add(txDate);
        monthTasks[txDate.getMonthValue()] += bucket.tasksCompleted();
      }
      if (bucket.xpEarned() > 0) {
        xpEarned += bucket.xpEarned();
      }
      if (bucket.coinsEarned() != null && bucket.coinsEarned().compareTo(BigDecimal.ZERO) > 0) {
        coinsEarned = coinsEarned.add(bucket.coinsEarned());
      }
    }

    int focusMinutes = 0;
    int focusSessionsCount = 0;
    int pomodorosCompleted = 0;

    for (RetrospectiveFocusBucket bucket : focusBuckets) {
      LocalDate focusDate = bucketToUserDate(
          bucket.year(), bucket.month(), bucket.day(), bucket.hour(), bucket.quarterHour(), userZone);
      focusMinutes += Math.max(0, bucket.totalMinutes());
      focusSessionsCount += Math.max(0, bucket.sessionsCount());
      pomodorosCompleted += Math.max(0, bucket.pomodorosCompleted());
      monthFocusMinutes[focusDate.getMonthValue()] += Math.max(0, bucket.totalMinutes());
      if (bucket.hasActiveDaySession()) {
        activeDates.add(focusDate);
      }
    }

    Integer bestMonth = null;
    int bestMonthTasks = 0;
    int bestMonthFocus = 0;
    for (int m = 1; m <= 12; m++) {
      if (monthTasks[m] == 0 && monthFocusMinutes[m] == 0) {
        continue;
      }
      if (bestMonth == null
          || monthTasks[m] > bestMonthTasks
          || (monthTasks[m] == bestMonthTasks && monthFocusMinutes[m] > bestMonthFocus)) {
        bestMonth = m;
        bestMonthTasks = monthTasks[m];
        bestMonthFocus = monthFocusMinutes[m];
      }
    }

    int unlockedCount = 0;
    Achievement rarest = null;
    for (UserAchievement ua : yearUnlocks) {
      unlockedCount++;
      Achievement ach = achievementsById.get(ua.getAchievementId());
      if (ach != null && (rarest == null || compareRarity(ach, rarest) > 0)) {
        rarest = ach;
      }
    }

    int activeDays = activeDates.size();
    int criteriaMet = UserRetrospective.countCriteriaMet(activeDays, tasksCompleted, focusMinutes);
    boolean eligible = criteriaMet >= UserRetrospective.MIN_CRITERIA_REQUIRED;

    return new YearSnapshot(
        eligible,
        criteriaMet,
        activeDays,
        tasksCompleted,
        hardTasksCompleted,
        focusMinutes,
        focusSessionsCount,
        pomodorosCompleted,
        xpEarned,
        coinsEarned,
        unlockedCount,
        bestMonth,
        bestMonthTasks,
        rarest);
  }

  private int compareRarity(Achievement candidate, Achievement current) {
    return Comparator
        .comparingInt((Achievement a) -> a.getRarity().ordinal())
        .thenComparingInt(Achievement::getPoints)
        .compare(candidate, current);
  }

  private LocalDate toUserDate(LocalDateTime storageDateTime, ZoneId userZone) {
    return storageDateTime
        .atZone(ZoneId.systemDefault())
        .withZoneSameInstant(userZone)
        .toLocalDate();
  }

  private record YearSnapshot(
      boolean eligible,
      int criteriaMet,
      int activeDays,
      int tasksCompleted,
      int hardTasksCompleted,
      int focusMinutes,
      int focusSessionsCount,
      int pomodorosCompleted,
      int xpEarned,
      BigDecimal coinsEarned,
      int achievementsUnlockedCount,
      Integer bestMonth,
      int bestMonthTasksCount,
      Achievement rarestAchievement) {
  }
}
