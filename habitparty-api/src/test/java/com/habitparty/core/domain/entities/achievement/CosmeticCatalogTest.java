package com.habitparty.core.domain.entities.achievement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.CosmeticCatalog.CosmeticUnlockContext;
import com.habitparty.core.domain.enums.RetrospectiveArchetype;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

class CosmeticCatalogTest {

  private User createUser(boolean isPremium, boolean isFounder, int totalXp, LocalDateTime createdAt) {
    return new User(
        UUID.randomUUID(),
        UserRole.USER,
        isPremium,
        isFounder,
        null,
        null,
        null,
        null,
        "Colecionador",
        "colecionador",
        "col@habitparty.com",
        "pwd",
        true,
        createdAt,
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1998, 1, 1),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        totalXp,
        0,
        0,
        createdAt);
  }

  @Test
  @DisplayName("Molduras de maestria exigem seus respectivos feitos enquanto molduras VIP exigem assinatura Premium")
  void shouldValidateMasteryAndVipFramesSeparately() {
    User freeExpert = createUser(false, false, 6000, LocalDateTime.now().minusDays(40));

    freeExpert.updateShowcaseProfile(null, "forged_silver", null, null, CosmeticUnlockContext.empty());
    assertEquals("forged_silver", freeExpert.getAvatarFrame());

    assertThrows(DomainValidationException.class, () ->
        freeExpert.updateShowcaseProfile(null, "cyber_neon", null, null, CosmeticUnlockContext.empty()));

    assertThrows(DomainValidationException.class, () ->
        freeExpert.updateShowcaseProfile(null, "legend_laurel", null, null, CosmeticUnlockContext.empty()));

    CosmeticUnlockContext focusMasterCtx = new CosmeticUnlockContext(
        Set.of("FOCUS_FIRST", "FOCUS_HOURS_200", "TROPHY_HUNTER_1000"),
        Set.of("FOCUS_FIRST", "FOCUS_HOURS_200"),
        0L,
        Set.of(),
        LocalDateTime.now());
    freeExpert.updateShowcaseProfile(null, "chronos_bronze", null, null, focusMasterCtx);
    assertEquals("chronos_bronze", freeExpert.getAvatarFrame());

    freeExpert.updateShowcaseProfile(null, "obsidian_crest", null, null, focusMasterCtx);
    assertEquals("obsidian_crest", freeExpert.getAvatarFrame());
  }

  @Test
  @DisplayName("Títulos validam conquistas, 10+ artefatos, veterania de 30 dias, retrospectiva e limpeza via string vazia")
  void shouldValidateTitlesAndClearingBehavior() {
    LocalDateTime now = LocalDateTime.of(2026, 11, 18, 20, 0);
    User user = createUser(false, true, 12000, now.minusDays(35));

    assertThrows(DomainValidationException.class, () ->
        user.updateShowcaseProfile(null, null, "NIGHT_OWL", null, CosmeticUnlockContext.empty()));

    CosmeticUnlockContext richCtx = new CosmeticUnlockContext(
        Set.of("NIGHT_OWL"),
        Set.of(),
        10L,
        Set.of(RetrospectiveArchetype.DEEP_FOCUS_SAGE),
        now);

    user.updateShowcaseProfile(null, null, "NIGHT_OWL", null, richCtx);
    assertEquals("NIGHT_OWL", user.getEquippedTitle().orElseThrow());

    user.updateShowcaseProfile(null, null, "ARTIFACT_COLLECTOR", null, richCtx);
    assertEquals("ARTIFACT_COLLECTOR", user.getEquippedTitle().orElseThrow());

    user.updateShowcaseProfile(null, null, "JOURNEY_VETERAN", null, richCtx);
    assertEquals("JOURNEY_VETERAN", user.getEquippedTitle().orElseThrow());

    user.updateShowcaseProfile(null, null, "RETRO_DEEP_FOCUS_SAGE", null, richCtx);
    assertEquals("RETRO_DEEP_FOCUS_SAGE", user.getEquippedTitle().orElseThrow());

    user.updateShowcaseProfile(null, null, "FOUNDER", null, richCtx);
    assertEquals("FOUNDER", user.getEquippedTitle().orElseThrow());

    // String vazia limpa o título sem alterar outros campos
    user.updateShowcaseProfile(null, null, "", null, richCtx);
    assertFalse(user.getEquippedTitle().isPresent());
  }

  @Test
  @DisplayName("Avatares simbólicos validam patente de XP, status VIP/Fundador e limpeza")
  void shouldValidateAvatarPresets() {
    User user = createUser(false, false, 1500, LocalDateTime.now());

    user.updateShowcaseProfile(null, null, null, "level_amateur", CosmeticUnlockContext.empty());
    assertEquals("level_amateur", user.getAvatarPreset().orElseThrow());

    assertThrows(DomainValidationException.class, () ->
        user.updateShowcaseProfile(null, null, null, "level_legend", CosmeticUnlockContext.empty()));

    assertThrows(DomainValidationException.class, () ->
        user.updateShowcaseProfile(null, null, null, "vip_cosmic", CosmeticUnlockContext.empty()));

    user.updateShowcaseProfile(null, null, null, "", CosmeticUnlockContext.empty());
    assertTrue(user.getAvatarPreset().isEmpty());
  }

  @Test
  @DisplayName("Revalidação após reset de métricas limpa moldura de maestria, título de conquista/artefato e avatar por XP")
  void shouldRevalidateCosmeticsOnMetricsReset() {
    User user = createUser(true, false, 6000, LocalDateTime.now().minusDays(40));
    CosmeticUnlockContext ctx = new CosmeticUnlockContext(
        Set.of("NIGHT_OWL"),
        Set.of(),
        10L,
        Set.of(RetrospectiveArchetype.ARCHITECT),
        LocalDateTime.now());
    user.updateShowcaseProfile(null, "forged_silver", "NIGHT_OWL", "level_expert", ctx);

    user.resetStats();
    user.revalidateShowcaseCosmeticsAfterMetricsReset(false);

    assertEquals("none", user.getAvatarFrame());
    assertTrue(user.getEquippedTitle().isEmpty());
    assertTrue(user.getAvatarPreset().isEmpty());

    // Cosméticos vinculados apenas à conta/assinatura permanecem válidos
    user.updateShowcaseProfile(null, "cosmic_gold", "VIP_GUARDIAN", "vip_cosmic", CosmeticUnlockContext.empty());
    user.revalidateShowcaseCosmeticsAfterMetricsReset(true);
    assertEquals("cosmic_gold", user.getAvatarFrame());
    assertEquals("VIP_GUARDIAN", user.getEquippedTitle().orElse(null));
    assertEquals("vip_cosmic", user.getAvatarPreset().orElse(null));
  }
}
