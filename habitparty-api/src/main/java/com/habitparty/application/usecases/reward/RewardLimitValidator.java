package com.habitparty.application.usecases.reward;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.reward.RewardGrouping;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;

/**
 * Validador compartilhado de limites de cards, dívidas ativas, variantes por grupo
 * e unicidade de tier de pacote entre {@link CreateRewardUseCase}, {@link UpdateRewardUseCase}
 * e {@link UpdateRewardGroupUseCase}.
 */
final class RewardLimitValidator {

  private RewardLimitValidator() {
  }

  static void assertActiveDebtQuotaNotExceeded(int currentActiveDebts) {
    if (currentActiveDebts >= RewardGrouping.MAX_ACTIVE_DEBTS) {
      throw new LimitExceededException(
          "Limite máximo de " + RewardGrouping.MAX_ACTIVE_DEBTS
              + " dívidas ativas atingido. Quite uma dívida antes de registrar outra.");
    }
  }

  static void assertNewDebtWithinLimit(int previousDebtCount, int newDebtCount) {
    if (newDebtCount > previousDebtCount && newDebtCount > RewardGrouping.MAX_ACTIVE_DEBTS) {
      throw new LimitExceededException(
          "Limite máximo de " + RewardGrouping.MAX_ACTIVE_DEBTS
              + " dívidas ativas atingido. Quite uma dívida antes de registrar outra.");
    }
  }

  static void assertRewardCardQuotaForCreate(boolean isPremium, int currentCards) {
    int maxCards = RewardGrouping.getMaxRewardCards(isPremium);
    if (currentCards >= maxCards) {
      throw new LimitExceededException(cardLimitMessage(isPremium));
    }
  }

  static void assertRewardCardQuotaForUpdate(boolean isPremium, int previousGroupCount, int newGroupCount) {
    int maxCards = RewardGrouping.getMaxRewardCards(isPremium);
    if (newGroupCount > previousGroupCount && newGroupCount > maxCards) {
      throw new LimitExceededException(cardLimitMessage(isPremium));
    }
  }

  static void assertGroupVariantCapacityForCreate(int existingVariantsInGroup) {
    if (existingVariantsInGroup >= RewardGrouping.MAX_VARIANTS_PER_GROUP) {
      throw new LimitExceededException(
          "Este card já atingiu o limite máximo de "
              + RewardGrouping.MAX_VARIANTS_PER_GROUP
              + " pacotes.");
    }
  }

  static void assertGroupVariantLimit(int variantCount) {
    if (variantCount > RewardGrouping.MAX_VARIANTS_PER_GROUP) {
      throw new LimitExceededException(
          "Este card já atingiu o limite máximo de "
              + RewardGrouping.MAX_VARIANTS_PER_GROUP
              + " pacotes.");
    }
  }

  static void assertNoConflictingPackageTier(
      List<Reward> rewards,
      String groupKey,
      RewardPackageLevel packageLevel,
      UUID excludedRewardId,
      String customMessageFormat) {
    if (RewardGrouping.findConflictingPackageTier(rewards, groupKey, packageLevel, excludedRewardId).isPresent()) {
      String label = RewardGrouping.formatPackageLevelLabel(packageLevel);
      throw new DomainValidationException(String.format(customMessageFormat, label));
    }
  }

  private static String cardLimitMessage(boolean isPremium) {
    return isPremium
        ? "Limite de " + RewardGrouping.PREMIUM_MAX_REWARD_CARDS
            + " cards de recompensa por usuário atingido no plano premium."
        : "Limite de " + RewardGrouping.FREE_MAX_REWARD_CARDS
            + " cards de recompensa por usuário atingido no plano gratuito.";
  }
}
