package com.habitparty.core.domain.entities.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

class RewardGroupingTest {

  private Reward buildReward(
      String name, RewardType type, RewardCategory category, RewardPackageLevel pkg, Integer minutes) {
    return new Reward(
        UUID.randomUUID(),
        UUID.randomUUID(),
        name,
        new BigDecimal("10"),
        List.of(),
        type,
        0,
        "gamepad",
        null,
        category,
        minutes,
        pkg);
  }

  @Test
  @DisplayName("Deve extrair título base removendo sufixos de duração simples, composta e tier")
  void shouldExtractBaseTitleFromVariousSuffixes() {
    assertEquals("Videogame", RewardGrouping.extractBaseTitle("Videogame (30m)"));
    assertEquals("Videogame", RewardGrouping.extractBaseTitle("Videogame (1h)"));
    assertEquals("Videogame", RewardGrouping.extractBaseTitle("Videogame (1h 30m)"));
    assertEquals("Videogame", RewardGrouping.extractBaseTitle("Videogame - Básico"));
    assertEquals("Videogame", RewardGrouping.extractBaseTitle("Videogame - Pacote Épico (3h)"));
    assertEquals("Café Especial", RewardGrouping.extractBaseTitle("Café Especial (Mimo)"));
  }

  @Test
  @DisplayName("Deve contar variantes do mesmo card agrupado como 1 card na vitrine")
  void shouldCountGroupedVariantsAsSingleCard() {
    Reward r1 = buildReward(
        "Videogame (30m)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.BASIC, 30);
    Reward r2 = buildReward(
        "Videogame (1h)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.PREMIUM, 60);
    Reward r3 = buildReward(
        "Videogame (3h)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.EPIC, 180);
    Reward r4 = buildReward(
        "Café Especial", RewardType.SINGLE_USE, RewardCategory.WELLNESS, RewardPackageLevel.BASIC, null);

    assertEquals(2, RewardGrouping.countDistinctGroups(List.of(r1, r2, r3, r4)));
    assertEquals(3, RewardGrouping.countGroupVariants(List.of(r1, r2, r3, r4), RewardGrouping.groupKey(r1)));
  }

  @Test
  @DisplayName("Caixas Misteriosas e Dívidas nunca devem ser agrupadas mesmo com nomes parecidos")
  void shouldNeverGroupMysteryBoxesOrDebts() {
    Reward box1 = buildReward(
        "Caixa Básica", RewardType.MISTERY_BOX, RewardCategory.LUCK, RewardPackageLevel.BASIC, null);
    Reward box2 = buildReward(
        "Caixa Básica", RewardType.MISTERY_BOX, RewardCategory.LUCK, RewardPackageLevel.BASIC, null);
    Reward debt1 = buildReward(
        "Tempo extra", RewardType.SINGLE_USE, RewardCategory.DEBT, RewardPackageLevel.NONE, null);
    Reward debt2 = buildReward(
        "Tempo extra (30m)", RewardType.SINGLE_USE, RewardCategory.DEBT, RewardPackageLevel.NONE, null);

    assertFalse(RewardGrouping.isGroupable(RewardType.MISTERY_BOX, RewardCategory.LUCK));
    assertFalse(RewardGrouping.isGroupable(RewardType.SINGLE_USE, RewardCategory.DEBT));
    assertTrue(RewardGrouping.isGroupable(RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT));
    assertNotEquals(RewardGrouping.groupKey(box1), RewardGrouping.groupKey(box2));
    assertNotEquals(RewardGrouping.groupKey(debt1), RewardGrouping.groupKey(debt2));
    assertEquals(4, RewardGrouping.countDistinctGroups(List.of(box1, box2, debt1, debt2)));
    assertEquals(2, RewardGrouping.countRegularDistinctGroups(List.of(box1, box2, debt1, debt2)));
    assertEquals(2, RewardGrouping.countActiveDebts(List.of(box1, box2, debt1, debt2)));
  }
}
