package com.habitparty.core.domain.entities.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.domain.enums.RewardPackageLevel;

class MysteryBoxArtifactDropTableTest {

  private final Artifact fateDice = new Artifact(
      UUID.fromString("b1000000-0000-4000-8000-000000000017"),
      "FATE_DICE",
      "Dices",
      AchievementRarity.RARE,
      ArtifactSourceType.MYSTERY_BOX,
      null,
      17);

  private final Artifact horizonKey = new Artifact(
      UUID.fromString("b1000000-0000-4000-8000-000000000018"),
      "HORIZON_KEY",
      "KeyRound",
      AchievementRarity.RARE,
      ArtifactSourceType.MYSTERY_BOX,
      null,
      18);

  private final Artifact aetherPrism = new Artifact(
      UUID.fromString("b1000000-0000-4000-8000-000000000019"),
      "AETHER_PRISM",
      "Pyramid",
      AchievementRarity.EPIC,
      ArtifactSourceType.MYSTERY_BOX,
      null,
      19);

  private final Artifact astralReliquary = new Artifact(
      UUID.fromString("b1000000-0000-4000-8000-000000000020"),
      "ASTRAL_RELIQUARY",
      "Orbit",
      AchievementRarity.LEGENDARY,
      ArtifactSourceType.MYSTERY_BOX,
      null,
      20);

  private final Artifact achievementRelic = new Artifact(
      UUID.fromString("b1000000-0000-4000-8000-000000000001"),
      "ASTRO_COMPASS",
      "Compass",
      AchievementRarity.RARE,
      ArtifactSourceType.ACHIEVEMENT,
      "STREAK_30",
      1);

  private List<Artifact> catalog() {
    return List.of(achievementRelic, fateDice, horizonKey, aetherPrism, astralReliquary);
  }

  @Test
  @DisplayName("Caixa Básica tem 5% de chance de dropar FATE_DICE e respeita proteção contra duplicatas")
  void basicBoxDropsFateDiceWithinFivePercentAndPreventsDuplicates() {
    Optional<Artifact> dropped = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.BASIC, catalog(), Set.of(), 5, 0);
    assertTrue(dropped.isPresent());
    assertEquals("FATE_DICE", dropped.get().getCode());

    Optional<Artifact> missed = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.BASIC, catalog(), Set.of(), 6, 0);
    assertTrue(missed.isEmpty());

    Optional<Artifact> alreadyOwned = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.BASIC, catalog(), Set.of(fateDice.getId()), 1, 0);
    assertTrue(alreadyOwned.isEmpty());
  }

  @Test
  @DisplayName("Caixa Premium escolhe ponderadamente entre FATE_DICE e HORIZON_KEY e ignora artefato já obtido")
  void premiumBoxSelectsUnownedWeightedArtifact() {
    Optional<Artifact> first = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.PREMIUM, catalog(), Set.of(), 10, 0);
    assertTrue(first.isPresent());
    assertEquals("FATE_DICE", first.get().getCode());

    Optional<Artifact> second = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.PREMIUM, catalog(), Set.of(), 10, 12);
    assertTrue(second.isPresent());
    assertEquals("HORIZON_KEY", second.get().getCode());

    Optional<Artifact> onlyHorizonLeft = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.PREMIUM, catalog(), Set.of(fateDice.getId()), 15, 0);
    assertTrue(onlyHorizonLeft.isPresent());
    assertEquals("HORIZON_KEY", onlyHorizonLeft.get().getCode());
  }

  @Test
  @DisplayName("Caixas Épica e Lendária nunca dropam artefatos de conquista nem itens repetidos")
  void epicAndLegendaryRespectSourceTypeAndDuplicateProtection() {
    Optional<Artifact> epicTopRoll = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.EPIC, catalog(), Set.of(), 28, 30);
    assertTrue(epicTopRoll.isPresent());
    assertEquals("ASTRAL_RELIQUARY", epicTopRoll.get().getCode());

    Optional<Artifact> legendaryDrop = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.LEGENDARY,
        catalog(),
        Set.of(horizonKey.getId(), aetherPrism.getId()),
        50,
        0);
    assertTrue(legendaryDrop.isPresent());
    assertEquals("ASTRAL_RELIQUARY", legendaryDrop.get().getCode());

    Optional<Artifact> allOwned = MysteryBoxArtifactDropTable.rollBonusArtifactWithValues(
        RewardPackageLevel.LEGENDARY,
        catalog(),
        Set.of(horizonKey.getId(), aetherPrism.getId(), astralReliquary.getId()),
        1,
        0);
    assertTrue(allOwned.isEmpty());
  }
}
