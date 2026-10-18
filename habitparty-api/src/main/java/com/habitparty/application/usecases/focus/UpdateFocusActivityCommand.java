package com.habitparty.application.usecases.focus;

import com.habitparty.core.domain.enums.FocusRecordType;

public record UpdateFocusActivityCommand(
    String name,
    String icon,
    FocusRecordType recordType,
    Integer pomoTimeMinutes
) {}
