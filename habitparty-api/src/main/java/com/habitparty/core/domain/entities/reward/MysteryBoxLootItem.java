package com.habitparty.core.domain.entities.reward;

public record MysteryBoxLootItem(
    String name,
    String icon,
    Integer minutes,
    String category,
    String description
) {
  public MysteryBoxLootItem(String name, String icon, Integer minutes) {
    this(name, icon, minutes, null, null);
  }
}
