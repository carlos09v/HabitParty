package com.habitparty.application.ports;

import com.habitparty.core.domain.entities.auth.OAuthUserProfile;

public interface OAuthIdentityProviderPort {
  OAuthUserProfile fetchUserProfile(String authorizationCode);
}
