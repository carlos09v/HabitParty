package com.habitparty.application.usecases.boardcolumn;

import java.util.UUID;

public record CreateBoardColumnCommand(
    UUID workspaceId,
    String name,
    String icon,
    Integer orderIndex
) {
  public CreateBoardColumnCommand(UUID workspaceId, String name, String icon) {
    this(workspaceId, name, icon, null);
  }
}
