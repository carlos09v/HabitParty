package com.habitparty.application.usecases.social;

import java.util.UUID;

public record SendFriendRequestCommand(
    UUID requesterId,
    String targetUsername,
    String targetFriendCode) {
}
