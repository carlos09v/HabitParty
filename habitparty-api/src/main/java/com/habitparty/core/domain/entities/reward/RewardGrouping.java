package com.habitparty.core.domain.entities.reward;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

/**
 * Regras puras de agrupamento de recompensas em cards únicos na vitrine
 * e limites de capacidade por plano (espelha `rewardGrouping.ts` no frontend).
 */
public final class RewardGrouping {
  public static final int FREE_MAX_REWARD_CARDS = 12;
  public static final int PREMIUM_MAX_REWARD_CARDS = 50;
  public static final int MAX_VARIANTS_PER_GROUP = 4;
  public static final int MAX_ACTIVE_DEBTS = 15;

  private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");
  private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}+");

  private static final Pattern PAREN_SUFFIX_PATTERN = Pattern.compile(
      "\\s*[(\\[]"
          + "(?:pacote\\s+|package\\s+|pack\\s+|tier\\s+)?"
          + "(?:n[íi]vel\\s+)?"
          + "(?:b[áa]sico|basic|premium|padr[ãa]o|standard|[ée]pico?|epic|lend[áa]rio|legendary|di[áa]rio|semanal|mimo|marco"
          + "|\\d+\\s*h(?:ora)?s?\\s*\\d+\\s*m(?:in(?:uto)?s?)?"
          + "|\\d+\\s*(?:min(?:uto)?s?|m|h(?:ora)?s?))"
          + "[)\\]]\\s*$",
      Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

  private static final Pattern TRAILING_TIER_PATTERN = Pattern.compile(
      "\\s*(?:[-–—:|•]\\s*|\\s+)"
          + "(?:pacote\\s+|package\\s+|pack\\s+)?"
          + "(?:b[áa]sico|basic|premium|padr[ãa]o|standard|[ée]pico?|epic|lend[áa]rio|legendary)\\s*$",
      Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

  private static final Pattern TRAILING_DURATION_PATTERN = Pattern.compile(
      "\\s*(?:[-–—:|•]\\s*|\\s+)"
          + "(?:\\d+\\s*h(?:ora)?s?\\s*\\d+\\s*m(?:in(?:uto)?s?)?"
          + "|\\d+\\s*(?:min(?:uto)?s?|m|h(?:ora)?s?))\\s*$",
      Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

  private static final Pattern TRAILING_SEPARATOR_PATTERN = Pattern.compile("[-–—:|•]\\s*$");

  private RewardGrouping() {}

  public static int getMaxRewardCards(boolean isPremium) {
    return isPremium ? PREMIUM_MAX_REWARD_CARDS : FREE_MAX_REWARD_CARDS;
  }

  public static boolean isGroupable(RewardType type, RewardCategory category) {
    if (category == RewardCategory.DEBT) {
      return false;
    }
    return type == RewardType.TIME_BASED || type == RewardType.SINGLE_USE;
  }

  public static String extractBaseTitle(String title) {
    if (title == null) {
      return "";
    }
    String trimmed = MULTI_SPACE.matcher(title.trim()).replaceAll(" ");
    if (trimmed.isEmpty()) {
      return "";
    }

    String current = trimmed;
    for (int i = 0; i < 4; i++) {
      String next = PAREN_SUFFIX_PATTERN.matcher(current).replaceFirst("");
      next = TRAILING_DURATION_PATTERN.matcher(next).replaceFirst("");
      next = TRAILING_TIER_PATTERN.matcher(next).replaceFirst("");
      next = TRAILING_SEPARATOR_PATTERN.matcher(next).replaceFirst("").trim();
      if (next.isEmpty() || next.equals(current)) {
        break;
      }
      current = next;
    }

    return current.isEmpty() ? trimmed : current;
  }

  public static String normalizeTitleKey(String baseTitle) {
    if (baseTitle == null) {
      return "";
    }
    String normalized = Normalizer.normalize(baseTitle, Normalizer.Form.NFD);
    return COMBINING_MARKS.matcher(normalized)
        .replaceAll("")
        .toLowerCase(Locale.ROOT)
        .trim();
  }

  public static String groupKey(
      UUID rewardId, String name, RewardType type, RewardCategory category) {
    RewardCategory safeCategory = category != null ? category : RewardCategory.NONE;
    if (!isGroupable(type, safeCategory)) {
      return "solo:" + (rewardId != null ? rewardId : UUID.randomUUID());
    }
    String baseTitle = extractBaseTitle(name);
    String titleKey = normalizeTitleKey(baseTitle);
    return "group:" + type.name() + "::" + safeCategory.name() + "::" + titleKey;
  }

  public static String groupKey(Reward reward) {
    return groupKey(
        reward.getId(),
        reward.getName(),
        reward.getType(),
        reward.getCategory().orElse(RewardCategory.NONE));
  }

  public static boolean isDebt(Reward reward) {
    return reward != null
        && reward.getCategory().map(category -> category == RewardCategory.DEBT).orElse(false);
  }

  /**
   * Ordena a vitrine mantendo Dívidas sempre primeiro no topo e preservando a ordem relativa
   * de cada segmento (Dívidas e Recompensas regulares) por {@code orderIndex}.
   */
  public static List<Reward> sortWithDebtsFirst(List<Reward> rewards) {
    if (rewards == null || rewards.isEmpty()) {
      return List.of();
    }
    return rewards.stream()
        .sorted(java.util.Comparator
            .comparing((Reward reward) -> !isDebt(reward))
            .thenComparingInt(Reward::getOrder_index))
        .toList();
  }

  public static int countDistinctGroups(List<Reward> rewards) {
    if (rewards == null || rewards.isEmpty()) {
      return 0;
    }
    Set<String> keys = new HashSet<>();
    for (Reward reward : rewards) {
      keys.add(groupKey(reward));
    }
    return keys.size();
  }

  /**
   * Conta apenas os cards regulares da Vitrine (excluindo Dívidas, que possuem cota independente).
   */
  public static int countRegularDistinctGroups(List<Reward> rewards) {
    if (rewards == null || rewards.isEmpty()) {
      return 0;
    }
    Set<String> keys = new HashSet<>();
    for (Reward reward : rewards) {
      if (!isDebt(reward)) {
        keys.add(groupKey(reward));
      }
    }
    return keys.size();
  }

  /**
   * Conta quantas Dívidas descartáveis ativas o usuário possui atualmente.
   */
  public static int countActiveDebts(List<Reward> rewards) {
    if (rewards == null || rewards.isEmpty()) {
      return 0;
    }
    int count = 0;
    for (Reward reward : rewards) {
      if (isDebt(reward)) {
        count++;
      }
    }
    return count;
  }

  public static int countGroupVariants(List<Reward> rewards, String targetGroupKey) {
    if (rewards == null || rewards.isEmpty() || targetGroupKey == null) {
      return 0;
    }
    int count = 0;
    for (Reward reward : rewards) {
      if (targetGroupKey.equals(groupKey(reward))) {
        count++;
      }
    }
    return count;
  }

  public static Optional<Reward> findConflictingPackageTier(
      List<Reward> rewards,
      String targetGroupKey,
      RewardPackageLevel candidateLevel,
      UUID excludeRewardId) {
    if (rewards == null
        || rewards.isEmpty()
        || targetGroupKey == null
        || candidateLevel == null
        || candidateLevel == RewardPackageLevel.NONE) {
      return Optional.empty();
    }
    for (Reward reward : rewards) {
      if (excludeRewardId != null && excludeRewardId.equals(reward.getId())) {
        continue;
      }
      if (targetGroupKey.equals(groupKey(reward))
          && reward.getPackageLevel().orElse(RewardPackageLevel.NONE) == candidateLevel) {
        return Optional.of(reward);
      }
    }
    return Optional.empty();
  }

  public static String formatPackageLevelLabel(RewardPackageLevel level) {
    if (level == null) {
      return "Nenhum";
    }
    return switch (level) {
      case BASIC -> "Básico";
      case PREMIUM -> "Premium";
      case EPIC -> "Épico";
      case LEGENDARY -> "Lendário";
      case NONE -> "Nenhum";
    };
  }
}
