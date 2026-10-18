package com.habitparty.application.usecases.focus;

import java.util.UUID;

public record FocusActivityOrderCommand(
    UUID id,
    int orderIndex
) {}
