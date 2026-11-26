package com.habitparty.infrastructure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.stripe.Stripe;

import jakarta.annotation.PostConstruct;

@Configuration
public class StripeConfig {

  @Value("${stripe.api.key}")
  private String apiKey;

  @Value("${stripe.api.connect-timeout-ms:5000}")
  private int connectTimeoutMs;

  @Value("${stripe.api.read-timeout-ms:15000}")
  private int readTimeoutMs;

  @PostConstruct
  public void init() {
    Stripe.setConnectTimeout(connectTimeoutMs);
    Stripe.setReadTimeout(readTimeoutMs);
    if (apiKey != null && !apiKey.isBlank()) {
      Stripe.apiKey = apiKey;
    }
  }
}
