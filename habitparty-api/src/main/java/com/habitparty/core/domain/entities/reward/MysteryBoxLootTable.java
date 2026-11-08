package com.habitparty.core.domain.entities.reward;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.exceptions.DomainValidationException;

public class MysteryBoxLootTable {

  public static final int REQUIRED_SLOTS = 3;

  public static List<MysteryBoxLootItem> defaultPoolFor(RewardPackageLevel level) {
    RewardPackageLevel safeLevel = level != null ? level : RewardPackageLevel.BASIC;
    return switch (safeLevel) {
      case BASIC -> List.of(
          new MysteryBoxLootItem("Pausa Revigorante", "coffee", 15),
          new MysteryBoxLootItem("Cupom de Lazer Médio", "music", 30),
          new MysteryBoxLootItem("Sessão Focada de Hobby", "book", 45));
      case PREMIUM -> List.of(
          new MysteryBoxLootItem("Sessão de Videogame", "gamepad", 60),
          new MysteryBoxLootItem("Vale-Lazer Estendido", "pizza", 90),
          new MysteryBoxLootItem("Noite Gamer / Cinema", "clapperboard", 120));
      case EPIC -> List.of(
          new MysteryBoxLootItem("Bloco Estendido de Lazer", "gamepad", 120),
          new MysteryBoxLootItem("Noite Livre Completa", "ticket", 180),
          new MysteryBoxLootItem("Tarde de Desconexão", "trophy", 240));
      case LEGENDARY -> List.of(
          new MysteryBoxLootItem("Day-Off Parcial de Elite", "star", 240),
          new MysteryBoxLootItem("Day-Off Integral", "crown", 480),
          new MysteryBoxLootItem("Celebração Absoluta", "gem", null));
      default -> List.of(
          new MysteryBoxLootItem("Pausa Curta", "coffee", 15),
          new MysteryBoxLootItem("Lazer Livre", "Gamepad2", 30),
          new MysteryBoxLootItem("Prêmio Especial", "gift", 45));
    };
  }

  public static int maxMinutesForSlot(RewardPackageLevel level, int slotIndex) {
    RewardPackageLevel safeLevel = level != null ? level : RewardPackageLevel.BASIC;
    return switch (safeLevel) {
      case BASIC -> switch (slotIndex) {
        case 0 -> 20;
        case 1 -> 35;
        default -> 60;
      };
      case PREMIUM -> switch (slotIndex) {
        case 0 -> 60;
        case 1 -> 90;
        default -> 120;
      };
      case EPIC -> switch (slotIndex) {
        case 0 -> 120;
        case 1 -> 180;
        default -> 240;
      };
      case LEGENDARY -> switch (slotIndex) {
        case 0 -> 240;
        case 1 -> 480;
        default -> 480;
      };
      default -> 60;
    };
  }

  public static List<MysteryBoxLootItem> validateAndNormalizeLootItems(
      RewardPackageLevel level,
      List<MysteryBoxLootItem> items) {
    if (items == null || items.isEmpty()) {
      return null;
    }
    if (items.size() != REQUIRED_SLOTS) {
      throw new DomainValidationException(
          "A Caixa Misteriosa personalizada deve conter exatamente 3 opções de prêmio.");
    }

    RewardPackageLevel safeLevel =
        (level != null && level != RewardPackageLevel.NONE) ? level : RewardPackageLevel.BASIC;
    List<MysteryBoxLootItem> normalized = new ArrayList<>(REQUIRED_SLOTS);

    for (int i = 0; i < REQUIRED_SLOTS; i++) {
      MysteryBoxLootItem slot = items.get(i);
      if (slot == null || slot.name() == null || slot.name().trim().isEmpty()) {
        throw new DomainValidationException(
            "Todos os 3 prêmios da Caixa Misteriosa precisam ter um nome válido.");
      }
      String trimmedName = slot.name().trim();
      if (trimmedName.length() > 30) {
        throw new DomainValidationException(
            "O nome de cada prêmio da Caixa Misteriosa deve ter até 30 caracteres.");
      }

      String normalizedIcon =
          (slot.icon() != null && !slot.icon().trim().isEmpty())
              ? slot.icon().trim()
              : "gift";
      if (normalizedIcon.length() > 20) {
        normalizedIcon = normalizedIcon.substring(0, 20);
      }

      Integer normalizedMinutes = null;
      if (slot.minutes() != null && slot.minutes() > 0) {
        int maxCap = maxMinutesForSlot(safeLevel, i);
        if (slot.minutes() < 5) {
          throw new DomainValidationException(
              "A duração mínima para prêmios de tempo na Caixa Misteriosa é de 5 minutos.");
        }
        if (slot.minutes() > maxCap) {
          throw new DomainValidationException(
              "O tempo do prêmio " + (i + 1) + " excede o limite de " + maxCap
                  + " minutos para este nível de Caixa Misteriosa.");
        }
        normalizedMinutes = slot.minutes();
      }

      normalized.add(new MysteryBoxLootItem(trimmedName, normalizedIcon, normalizedMinutes));
    }

    return List.copyOf(normalized);
  }

  public static MysteryBoxResult roll(RewardPackageLevel level) {
    return roll(level, null);
  }

  public static MysteryBoxResult roll(
      RewardPackageLevel level,
      List<MysteryBoxLootItem> customLootItems) {
    int rollValue = ThreadLocalRandom.current().nextInt(1, 101);
    return rollWithValue(level, customLootItems, rollValue);
  }

  public static MysteryBoxResult rollWithValue(
      RewardPackageLevel level,
      List<MysteryBoxLootItem> customLootItems,
      int rollValue) {
    RewardPackageLevel safeLevel = level != null ? level : RewardPackageLevel.BASIC;
    List<MysteryBoxLootItem> pool =
        (customLootItems != null && customLootItems.size() == REQUIRED_SLOTS)
            ? customLootItems
            : defaultPoolFor(safeLevel);

    int slotIndex = resolveSlotIndex(safeLevel, rollValue);
    MysteryBoxLootItem chosen = pool.get(Math.min(Math.max(slotIndex, 0), pool.size() - 1));
    Integer minutes = (chosen.minutes() != null && chosen.minutes() > 0) ? chosen.minutes() : null;
    return new MysteryBoxResult(chosen.name(), chosen.icon(), minutes);
  }

  private static int resolveSlotIndex(RewardPackageLevel level, int roll) {
    return switch (level) {
      case PREMIUM, EPIC -> {
        if (roll <= 50) yield 0;
        if (roll <= 85) yield 1;
        yield 2;
      }
      case BASIC, LEGENDARY -> {
        if (roll <= 60) yield 0;
        if (roll <= 90) yield 1;
        yield 2;
      }
      default -> {
        if (roll <= 60) yield 0;
        if (roll <= 90) yield 1;
        yield 2;
      }
    };
  }
}
