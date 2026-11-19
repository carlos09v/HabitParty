package com.habitparty.core.domain.entities.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.DomainValidationException;

class RewardDomainTest {

  @Test
  void shouldRejectZeroOrNegativePriceOnValidationAndUpdate() {
    assertThrows(DomainValidationException.class, () -> Reward.validatePrice(BigDecimal.ZERO));
    assertThrows(DomainValidationException.class, () -> Reward.validatePrice(new BigDecimal("-1")));
    assertThrows(DomainValidationException.class, () -> Reward.validatePrice(null));

    Reward reward = new Reward(
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Café Especial",
        new BigDecimal("4"),
        List.of(),
        RewardType.SINGLE_USE,
        0,
        "coffee",
        null,
        RewardCategory.ENTERTAINMENT,
        null,
        RewardPackageLevel.BASIC
    );

    assertThrows(DomainValidationException.class, () ->
        reward.updateDetails(
            "Café Especial",
            null,
            BigDecimal.ZERO,
            "coffee",
            RewardCategory.ENTERTAINMENT,
            List.of(),
            RewardType.SINGLE_USE,
            RewardPackageLevel.BASIC,
            null
        ));
  }

  @Test
  void shouldPreserveOptionalPackageLevelForSingleUseWhileClearingDurationAndLoot() {
    Reward reward = new Reward(
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Sessão de Jogo",
        new BigDecimal("15"),
        List.of(),
        RewardType.TIME_BASED,
        0,
        "gamepad",
        null,
        RewardCategory.ENTERTAINMENT,
        60,
        RewardPackageLevel.PREMIUM
    );

    reward.updateDetails(
        "Comprar Livro",
        "Livro desejado",
        new BigDecimal("50"),
        "book",
        RewardCategory.HOBBIES,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.EPIC,
        null
    );

    assertEquals(Optional.of(RewardPackageLevel.EPIC), reward.getPackageLevel());
    assertEquals(Optional.empty(), reward.getBaseDurationMinutes());
    assertNull(reward.getLootItems());
  }

  @Test
  void shouldForceNonePackageLevelWhenUpdatingToDebtCategory() {
    Reward reward = new Reward(
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Videogame",
        new BigDecimal("15"),
        List.of(),
        RewardType.SINGLE_USE,
        0,
        "gamepad",
        null,
        RewardCategory.ENTERTAINMENT,
        null,
        RewardPackageLevel.EPIC
    );

    reward.updateDetails(
        "Videogame em Dívida",
        null,
        new BigDecimal("8"),
        "gamepad",
        RewardCategory.DEBT,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.LEGENDARY,
        null
    );

    assertEquals(Optional.of(RewardPackageLevel.NONE), reward.getPackageLevel());
    assertEquals(Optional.of(RewardCategory.DEBT), reward.getCategory());
  }
}
