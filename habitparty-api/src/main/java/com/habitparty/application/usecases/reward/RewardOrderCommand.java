package com.habitparty.application.usecases.reward;

import java.util.UUID;

public record RewardOrderCommand(
    UUID id,
    int newIndex
) {}
