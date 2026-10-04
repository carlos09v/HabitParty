package com.habitparty.infrastructure.security;

import java.util.UUID;

public record AuthenticatedUser(UUID id, String role) {
}
