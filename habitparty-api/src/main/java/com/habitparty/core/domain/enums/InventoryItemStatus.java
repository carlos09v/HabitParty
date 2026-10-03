package com.habitparty.core.domain.enums;

public enum InventoryItemStatus {
    AVAILABLE("Disponível"),      // Item comprado, pronto para ser usado
    CONSUMED("Usado"),      // Item não visível na mochila, apenas para registro no transaction
    IN_FOCUS("No Focus"),       // Item atrelado ao FocusRecord
    DISCARDED("Descartado"); // Item não visível na mochila, apenas para registro no transaction

    private final String description;

    InventoryItemStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
