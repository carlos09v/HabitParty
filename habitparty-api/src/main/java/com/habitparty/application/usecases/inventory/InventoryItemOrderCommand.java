package com.habitparty.application.usecases.inventory;

import java.util.UUID;

public record InventoryItemOrderCommand(
    UUID itemId,
    int newIndex
) {}
