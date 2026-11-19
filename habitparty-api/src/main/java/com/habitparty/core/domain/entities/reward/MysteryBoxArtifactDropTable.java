package com.habitparty.core.domain.entities.reward;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.domain.enums.RewardPackageLevel;

/**
 * Tabela de probabilidade bônus para drop de Artefatos de Exploração em Caixas Misteriosas.
 * Nunca substitui o prêmio principal de lazer e aplica proteção contra duplicatas.
 */
public final class MysteryBoxArtifactDropTable {

  private static final Map<RewardPackageLevel, Integer> TRIGGER_CHANCE_PERCENT = Map.of(
      RewardPackageLevel.NONE, 5,
      RewardPackageLevel.BASIC, 5,
      RewardPackageLevel.PREMIUM, 15,
      RewardPackageLevel.EPIC, 28,
      RewardPackageLevel.LEGENDARY, 50);

  private static final Map<RewardPackageLevel, Map<String, Integer>> TIER_WEIGHTS = Map.of(
      RewardPackageLevel.NONE, Map.of("FATE_DICE", 10),
      RewardPackageLevel.BASIC, Map.of("FATE_DICE", 10),
      RewardPackageLevel.PREMIUM, Map.of("FATE_DICE", 12, "HORIZON_KEY", 10),
      RewardPackageLevel.EPIC, Map.of("HORIZON_KEY", 18, "AETHER_PRISM", 12, "ASTRAL_RELIQUARY", 4),
      RewardPackageLevel.LEGENDARY, Map.of("HORIZON_KEY", 10, "AETHER_PRISM", 25, "ASTRAL_RELIQUARY", 15));

  private MysteryBoxArtifactDropTable() {}

  public static int triggerChancePercent(RewardPackageLevel level) {
    RewardPackageLevel safeLevel = level != null ? level : RewardPackageLevel.BASIC;
    return TRIGGER_CHANCE_PERCENT.getOrDefault(safeLevel, 5);
  }

  public static Optional<Artifact> rollBonusArtifact(
      RewardPackageLevel level,
      List<Artifact> catalog,
      Set<UUID> ownedArtifactIds) {
    if (catalog == null || catalog.isEmpty()) {
      return Optional.empty();
    }

    int chanceRoll = ThreadLocalRandom.current().nextInt(1, 101);
    if (chanceRoll > triggerChancePercent(level)) {
      return Optional.empty();
    }

    List<Artifact> candidates = filterUnownedEligible(level, catalog, ownedArtifactIds);
    int totalWeight = computeTotalWeight(level, candidates);
    if (totalWeight <= 0) {
      return Optional.empty();
    }

    int weightRoll = ThreadLocalRandom.current().nextInt(totalWeight);
    return selectFromEligible(level, candidates, totalWeight, weightRoll);
  }

  public static Optional<Artifact> rollBonusArtifactWithValues(
      RewardPackageLevel level,
      List<Artifact> catalog,
      Set<UUID> ownedArtifactIds,
      int chanceRoll1To100,
      int weightRollZeroToTotalMinusOne) {
    if (chanceRoll1To100 < 1 || chanceRoll1To100 > triggerChancePercent(level)) {
      return Optional.empty();
    }

    List<Artifact> candidates = filterUnownedEligible(level, catalog, ownedArtifactIds);
    int totalWeight = computeTotalWeight(level, candidates);
    if (totalWeight <= 0) {
      return Optional.empty();
    }

    return selectFromEligible(level, candidates, totalWeight, weightRollZeroToTotalMinusOne);
  }

  private static Optional<Artifact> selectFromEligible(
      RewardPackageLevel level,
      List<Artifact> candidates,
      int totalWeight,
      int weightRollZeroToTotalMinusOne) {
    if (candidates.isEmpty() || totalWeight <= 0) {
      return Optional.empty();
    }

    Map<String, Integer> weights = weightsFor(level);
    int target = Math.floorMod(weightRollZeroToTotalMinusOne, totalWeight);
    int cumulative = 0;
    for (Artifact candidate : candidates) {
      int weight = weights.getOrDefault(candidate.getCode(), 0);
      if (weight <= 0) {
        continue;
      }
      cumulative += weight;
      if (target < cumulative) {
        return Optional.of(candidate);
      }
    }

    return Optional.of(candidates.get(candidates.size() - 1));
  }

  private static List<Artifact> filterUnownedEligible(
      RewardPackageLevel level,
      List<Artifact> catalog,
      Set<UUID> ownedArtifactIds) {
    if (catalog == null || catalog.isEmpty()) {
      return List.of();
    }
    Map<String, Integer> weights = weightsFor(level);
    Set<UUID> owned = ownedArtifactIds != null ? ownedArtifactIds : Set.of();

    List<Artifact> eligible = new ArrayList<>();
    for (Artifact artifact : catalog) {
      if (artifact == null || artifact.getId() == null) {
        continue;
      }
      if (artifact.getSourceType() != ArtifactSourceType.MYSTERY_BOX) {
        continue;
      }
      if (owned.contains(artifact.getId())) {
        continue;
      }
      if (weights.getOrDefault(artifact.getCode(), 0) > 0) {
        eligible.add(artifact);
      }
    }
    return eligible;
  }

  private static int computeTotalWeight(RewardPackageLevel level, List<Artifact> candidates) {
    Map<String, Integer> weights = weightsFor(level);
    int total = 0;
    for (Artifact candidate : candidates) {
      total += Math.max(0, weights.getOrDefault(candidate.getCode(), 0));
    }
    return total;
  }

  private static Map<String, Integer> weightsFor(RewardPackageLevel level) {
    RewardPackageLevel safeLevel = level != null ? level : RewardPackageLevel.BASIC;
    return TIER_WEIGHTS.getOrDefault(safeLevel, TIER_WEIGHTS.get(RewardPackageLevel.BASIC));
  }
}
