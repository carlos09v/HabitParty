package com.habitparty.core.domain.entities.achievement;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.RetrospectiveArchetype;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.exceptions.DomainValidationException;

/**
 * Catálogo e regras de desbloqueio de cosméticos do perfil (Molduras, Títulos e Avatares Simbólicos).
 */
public final class CosmeticCatalog {

  public static final int ARTIFACT_COLLECTOR_TITLE_MIN = 10;
  public static final int VETERAN_TITLE_MIN_DAYS = 30;

  public static final Set<String> PREMIUM_AVATAR_FRAMES = Set.of(
      "cosmic_gold",
      "cyber_neon",
      "fire_phoenix",
      "emerald_mystic",
      "amethyst_void");

  public static final Set<String> MASTERY_AVATAR_FRAMES = Set.of(
      "forged_silver",
      "obsidian_crest",
      "chronos_bronze",
      "legend_laurel");

  public static final Set<String> VALID_AVATAR_FRAMES = Set.of(
      "none",
      "cosmic_gold",
      "cyber_neon",
      "fire_phoenix",
      "emerald_mystic",
      "amethyst_void",
      "forged_silver",
      "obsidian_crest",
      "chronos_bronze",
      "legend_laurel");

  public static final Set<String> ACHIEVEMENT_TITLES = Set.of(
      "NIGHT_OWL",
      "EARLY_BIRD",
      "HARDCORE_SURVIVOR",
      "FOCUS_MARATHON_90",
      "TASK_HARD_25",
      "STREAK_90",
      "FOCUS_HOURS_200",
      "GOLD_15000",
      "STREAK_365",
      "TASK_1000",
      "TROPHY_HUNTER_1000");

  public static final Map<String, RetrospectiveArchetype> RETRO_TITLES = Map.of(
      "RETRO_DEEP_FOCUS_SAGE", RetrospectiveArchetype.DEEP_FOCUS_SAGE,
      "RETRO_STREAK_GUARDIAN", RetrospectiveArchetype.STREAK_GUARDIAN,
      "RETRO_CHALLENGE_SEEKER", RetrospectiveArchetype.CHALLENGE_SEEKER,
      "RETRO_ARCHITECT", RetrospectiveArchetype.ARCHITECT,
      "RETRO_RISING_SPARK", RetrospectiveArchetype.RISING_SPARK);

  public static final Set<String> VALID_TITLES = Set.of(
      "NIGHT_OWL",
      "EARLY_BIRD",
      "HARDCORE_SURVIVOR",
      "FOCUS_MARATHON_90",
      "TASK_HARD_25",
      "STREAK_90",
      "FOCUS_HOURS_200",
      "GOLD_15000",
      "STREAK_365",
      "TASK_1000",
      "FOUNDER",
      "VIP_GUARDIAN",
      "ARTIFACT_COLLECTOR",
      "TROPHY_HUNTER_1000",
      "JOURNEY_VETERAN",
      "RETRO_DEEP_FOCUS_SAGE",
      "RETRO_STREAK_GUARDIAN",
      "RETRO_CHALLENGE_SEEKER",
      "RETRO_ARCHITECT",
      "RETRO_RISING_SPARK");

  public static final Map<String, UserLevel> LEVEL_AVATAR_PRESETS = Map.ofEntries(
      Map.entry("level_novice", UserLevel.NOVICE),
      Map.entry("level_apprentice", UserLevel.APPRENTICE),
      Map.entry("level_adventurer", UserLevel.ADVENTURER),
      Map.entry("level_challenger", UserLevel.CHALLENGER),
      Map.entry("level_amateur", UserLevel.AMATEUR),
      Map.entry("level_professional", UserLevel.PROFESSIONAL),
      Map.entry("level_expert", UserLevel.EXPERT),
      Map.entry("level_veteran", UserLevel.VETERAN),
      Map.entry("level_master", UserLevel.MASTER),
      Map.entry("level_legend", UserLevel.LEGEND));

  public static final Set<String> VALID_AVATAR_PRESETS = Set.of(
      "level_novice",
      "level_apprentice",
      "level_adventurer",
      "level_challenger",
      "level_amateur",
      "level_professional",
      "level_expert",
      "level_veteran",
      "level_master",
      "level_legend",
      "vip_cosmic",
      "founder_crest");

  private CosmeticCatalog() {}

  public record CosmeticUnlockContext(
      Set<String> unlockedAchievementCodes,
      Set<String> allFocusAchievementCodes,
      long unlockedArtifactsCount,
      Set<RetrospectiveArchetype> eligibleRetroArchetypes,
      LocalDateTime referenceTime) {

    public CosmeticUnlockContext {
      unlockedAchievementCodes = unlockedAchievementCodes != null ? Set.copyOf(unlockedAchievementCodes) : Set.of();
      allFocusAchievementCodes = allFocusAchievementCodes != null ? Set.copyOf(allFocusAchievementCodes) : Set.of();
      unlockedArtifactsCount = Math.max(0L, unlockedArtifactsCount);
      eligibleRetroArchetypes = eligibleRetroArchetypes != null ? Set.copyOf(eligibleRetroArchetypes) : Set.of();
      referenceTime = referenceTime != null ? referenceTime : LocalDateTime.now();
    }

    public static CosmeticUnlockContext empty() {
      return new CosmeticUnlockContext(Set.of(), Set.of(), 0L, Set.of(), LocalDateTime.now());
    }
  }

  public static String normalizeAndValidateFrame(User user, String rawFrame, CosmeticUnlockContext context) {
    String clean = rawFrame.trim().toLowerCase(Locale.ROOT);
    if (!VALID_AVATAR_FRAMES.contains(clean)) {
      throw new DomainValidationException("Moldura de avatar inválida: " + rawFrame);
    }
    if ("none".equals(clean)) {
      return "none";
    }
    if (PREMIUM_AVATAR_FRAMES.contains(clean)) {
      if (!user.isPremium()) {
        throw new DomainValidationException("Molduras animadas exclusivas requerem o plano Guardião Cósmico (Premium).");
      }
      return clean;
    }

    CosmeticUnlockContext ctx = context != null ? context : CosmeticUnlockContext.empty();
    switch (clean) {
      case "forged_silver" -> {
        if (user.getTotalXp() < UserLevel.EXPERT.getMinXpRequired()) {
          throw new DomainValidationException("A moldura Prata Forjada requer nível Especialista (6.000 XP).");
        }
      }
      case "obsidian_crest" -> {
        if (!ctx.unlockedAchievementCodes().contains("TROPHY_HUNTER_1000")) {
          throw new DomainValidationException(
              "A moldura Brasão de Obsidiana requer a conquista Colecionador de Glórias (1.000 pts).");
        }
      }
      case "chronos_bronze" -> {
        if (ctx.allFocusAchievementCodes().isEmpty()
            || !ctx.unlockedAchievementCodes().containsAll(ctx.allFocusAchievementCodes())) {
          throw new DomainValidationException(
              "A moldura Engrenagem do Tempo requer todas as conquistas da categoria Foco desbloqueadas.");
        }
      }
      case "legend_laurel" -> {
        if (user.getTotalXp() < UserLevel.LEGEND.getMinXpRequired()) {
          throw new DomainValidationException("A moldura Louros da Lenda requer nível Lenda (60.000 XP).");
        }
      }
      default -> throw new DomainValidationException("Moldura de avatar inválida: " + rawFrame);
    }
    return clean;
  }

  public static String normalizeAndValidateTitle(User user, String rawTitle, CosmeticUnlockContext context) {
    String clean = rawTitle.trim().toUpperCase(Locale.ROOT);
    if ("NONE".equals(clean)) {
      return null;
    }
    if (!VALID_TITLES.contains(clean)) {
      throw new DomainValidationException("Título de perfil inválido: " + rawTitle);
    }

    CosmeticUnlockContext ctx = context != null ? context : CosmeticUnlockContext.empty();
    if (ACHIEVEMENT_TITLES.contains(clean)) {
      if (!ctx.unlockedAchievementCodes().contains(clean)) {
        throw new DomainValidationException("Este título requer o desbloqueio da conquista correspondente.");
      }
      return clean;
    }

    if ("FOUNDER".equals(clean)) {
      if (!user.isFounder()) {
        throw new DomainValidationException("O título Membro Fundador é exclusivo para membros fundadores.");
      }
      return clean;
    }

    if ("VIP_GUARDIAN".equals(clean)) {
      if (!user.isPremium()) {
        throw new DomainValidationException("Este título requer assinatura Premium ativa.");
      }
      return clean;
    }

    if ("ARTIFACT_COLLECTOR".equals(clean)) {
      if (ctx.unlockedArtifactsCount() < ARTIFACT_COLLECTOR_TITLE_MIN) {
        throw new DomainValidationException(
            "Este título requer pelo menos " + ARTIFACT_COLLECTOR_TITLE_MIN + " artefatos na coleção.");
      }
      return clean;
    }

    if ("JOURNEY_VETERAN".equals(clean)) {
      boolean hasVerifiedAndAge = user.isEmailVerified()
          && user.getCreatedAt() != null
          && !user.getCreatedAt().plusDays(VETERAN_TITLE_MIN_DAYS).isAfter(ctx.referenceTime());
      if (!hasVerifiedAndAge) {
        throw new DomainValidationException(
            "O título Veterano da Jornada requer e-mail verificado e pelo menos 30 dias de conta.");
      }
      return clean;
    }

    RetrospectiveArchetype requiredArchetype = RETRO_TITLES.get(clean);
    if (requiredArchetype == null || !ctx.eligibleRetroArchetypes().contains(requiredArchetype)) {
      throw new DomainValidationException(
          "Este título requer o desbloqueio do arquétipo correspondente na Retrospectiva Anual.");
    }
    return clean;
  }

  public static String normalizeAndValidateAvatarPreset(User user, String rawPreset) {
    String clean = rawPreset.trim().toLowerCase(Locale.ROOT);
    if ("none".equals(clean)) {
      return null;
    }
    if (!VALID_AVATAR_PRESETS.contains(clean)) {
      throw new DomainValidationException("Avatar simbólico inválido: " + rawPreset);
    }

    UserLevel requiredLevel = LEVEL_AVATAR_PRESETS.get(clean);
    if (requiredLevel != null) {
      if (user.getTotalXp() < requiredLevel.getMinXpRequired()) {
        throw new DomainValidationException(
            "Este avatar requer a patente " + requiredLevel.getTitle() + " (" + requiredLevel.getMinXpRequired() + " XP).");
      }
      return clean;
    }

    if ("vip_cosmic".equals(clean)) {
      if (!user.isPremium()) {
        throw new DomainValidationException("O avatar Cósmico VIP requer assinatura Premium ativa.");
      }
      return clean;
    }

    if ("founder_crest".equals(clean)) {
      if (!user.isFounder()) {
        throw new DomainValidationException("O avatar Brasão Fundador é exclusivo para membros fundadores.");
      }
      return clean;
    }

    throw new DomainValidationException("Avatar simbólico inválido: " + rawPreset);
  }

  public static boolean shouldResetFrameOnMetricsReset(String avatarFrame) {
    if (avatarFrame == null || avatarFrame.isBlank()) {
      return false;
    }
    return MASTERY_AVATAR_FRAMES.contains(avatarFrame.trim().toLowerCase(Locale.ROOT));
  }

  public static boolean shouldResetTitleOnMetricsReset(String equippedTitle, boolean historyDeleted) {
    if (equippedTitle == null || equippedTitle.isBlank()) {
      return false;
    }
    String clean = equippedTitle.trim().toUpperCase(Locale.ROOT);
    if (ACHIEVEMENT_TITLES.contains(clean) || "ARTIFACT_COLLECTOR".equals(clean)) {
      return true;
    }
    return historyDeleted && RETRO_TITLES.containsKey(clean);
  }

  public static boolean shouldResetAvatarPresetOnMetricsReset(User user, String avatarPreset) {
    if (user == null || avatarPreset == null || avatarPreset.isBlank()) {
      return false;
    }
    UserLevel requiredLevel = LEVEL_AVATAR_PRESETS.get(avatarPreset.trim().toLowerCase(Locale.ROOT));
    if (requiredLevel == null) {
      return false;
    }
    return user.getTotalXp() < requiredLevel.getMinXpRequired();
  }
}
