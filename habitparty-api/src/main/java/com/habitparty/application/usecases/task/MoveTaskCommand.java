package com.habitparty.application.usecases.task;

import java.util.UUID;

public record MoveTaskCommand(
    UUID taskId,
    UUID boardColumnId,
    int newOrderIndex
) {}
