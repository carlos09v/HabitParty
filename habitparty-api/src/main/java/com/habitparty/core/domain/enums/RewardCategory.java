package com.habitparty.core.domain.enums;

public enum RewardCategory {
    NONE("Nenhum"),
    ENTERTAINMENT("Entretenimento"),
    WELLNESS("Bem-estar"),
    SHOPPING("Compras"),
    DEVELOPMENT("Desenvolvimento"),
    LUCK("Sorte"),
    HOBBIES("Hobbies");

    private final String description;

    RewardCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}