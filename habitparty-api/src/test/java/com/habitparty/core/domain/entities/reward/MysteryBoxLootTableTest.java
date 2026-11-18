package com.habitparty.core.domain.entities.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.exceptions.DomainValidationException;

class MysteryBoxLootTableTest {

  @Test
  void shouldRollCustomLootItemsAccordingToTierProbabilities() {
    List<MysteryBoxLootItem> customPool = List.of(
        new MysteryBoxLootItem("Café Expresso", "coffee", null),
        new MysteryBoxLootItem("Episódio de Anime", "clapperboard", 25),
        new MysteryBoxLootItem("Partida Ranqueada", "gamepad", 50)
    );

    MysteryBoxResult common = MysteryBoxLootTable.rollWithValue(RewardPackageLevel.BASIC, customPool, 35);
    assertEquals("Café Expresso", common.name());
    assertEquals("coffee", common.icon());
    assertNull(common.minutes());

    MysteryBoxResult rare = MysteryBoxLootTable.rollWithValue(RewardPackageLevel.BASIC, customPool, 75);
    assertEquals("Episódio de Anime", rare.name());
    assertEquals("clapperboard", rare.icon());
    assertEquals(25, rare.minutes());

    MysteryBoxResult jackpot = MysteryBoxLootTable.rollWithValue(RewardPackageLevel.BASIC, customPool, 95);
    assertEquals("Partida Ranqueada", jackpot.name());
    assertEquals("gamepad", jackpot.icon());
    assertEquals(50, jackpot.minutes());
  }

  @Test
  void shouldFallbackToDefaultTierPoolWhenCustomItemsAreNull() {
    MysteryBoxResult basicCommon = MysteryBoxLootTable.rollWithValue(RewardPackageLevel.BASIC, null, 10);
    assertEquals("Pausa Revigorante", basicCommon.name());
    assertEquals(10, basicCommon.minutes());

    MysteryBoxResult premiumCommon = MysteryBoxLootTable.rollWithValue(RewardPackageLevel.PREMIUM, null, 25);
    assertEquals("Sessão de Videogame", premiumCommon.name());
    assertEquals(35, premiumCommon.minutes());
  }

  @Test
  void shouldValidateAndNormalizeCustomLootItemsAndRejectExcessiveDuration() {
    List<MysteryBoxLootItem> valid = List.of(
        new MysteryBoxLootItem("  Chocolatinho  ", "cookie", 0),
        new MysteryBoxLootItem("Vídeo Curto", "clapperboard", 25),
        new MysteryBoxLootItem("Sessão Indie", "gamepad", 45)
    );

    List<MysteryBoxLootItem> normalized =
        MysteryBoxLootTable.validateAndNormalizeLootItems(RewardPackageLevel.BASIC, valid);
    assertEquals(3, normalized.size());
    assertEquals("Chocolatinho", normalized.get(0).name());
    assertNull(normalized.get(0).minutes());
    assertEquals(25, normalized.get(1).minutes());
    assertEquals(45, normalized.get(2).minutes());

    List<MysteryBoxLootItem> exceedingCap = List.of(
        new MysteryBoxLootItem("Maratona", "gamepad", 20),
        new MysteryBoxLootItem("Vídeo", "clapperboard", 25),
        new MysteryBoxLootItem("Jogo", "gamepad", 45)
    );

    assertThrows(DomainValidationException.class, () ->
        MysteryBoxLootTable.validateAndNormalizeLootItems(RewardPackageLevel.BASIC, exceedingCap));
  }
}
