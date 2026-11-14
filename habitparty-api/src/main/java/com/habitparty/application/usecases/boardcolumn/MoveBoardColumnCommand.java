package com.habitparty.application.usecases.boardcolumn;

import java.util.UUID;

public record MoveBoardColumnCommand(
    UUID targetWorkspaceId
) {
}
