package com.habitparty.application.usecases.social;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.UserLevel;

final class SocialNotificationPayloadHelper {

  private SocialNotificationPayloadHelper() {
  }

  static String actorOnly(User actor) {
    return "{\"actorUsername\":\"" + escape(actor.getUsername()) + "\"}";
  }

  static String achievementUnlocked(
      User actor,
      String achievementCode,
      String achievementTitle,
      AchievementRarity rarity) {
    return "{\"actorUsername\":\"" + escape(actor.getUsername())
        + "\",\"achievementCode\":\"" + escape(achievementCode)
        + "\",\"achievementTitle\":\"" + escape(achievementTitle)
        + "\",\"rarity\":\"" + (rarity != null ? rarity.name() : "RARE")
        + "\"}";
  }

  static String levelUp(User actor, UserLevel level) {
    return "{\"actorUsername\":\"" + escape(actor.getUsername())
        + "\",\"levelName\":\"" + (level != null ? level.name() : "")
        + "\",\"levelTitle\":\"" + escape(level != null ? level.getTitle() : "")
        + "\"}";
  }

  private static String escape(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", " ")
        .replace("\r", " ");
  }
}
