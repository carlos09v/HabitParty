package com.habitparty.core.domain.entities.auth;

public record OAuthUserProfile(
    String email,
    String name,
    String picture
) {}
