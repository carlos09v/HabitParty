package com.habitparty.application.usecases.boardcolumn;

import java.util.UUID;

public record BoardColumnOrderCommand(
    UUID columnId,
    int newIndex
) {}
