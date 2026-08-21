package com.habitparty.core.domain.enums;

public enum InventoryItemStatus {
    AVAILABLE("Disponível"),      // Item comprado, pronto para ser usado
    IN_FOCUS("No Focus");       // Item atrelado ao FocusRecord

    private final String description;

    InventoryItemStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
