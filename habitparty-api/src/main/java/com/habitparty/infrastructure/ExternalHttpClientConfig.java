package com.habitparty.infrastructure;

import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Pool HTTP externo compartilhado (1 único {@link HttpClient} + {@link RestClient}) para
 * integrações externas (Resend, Google OAuth e Cloudflare Turnstile), evitando multiplicação
 * de pools/threads e timeouts implícitos.
 */
@Configuration
public class ExternalHttpClientConfig {

  public static final String EXTERNAL_REST_CLIENT_BEAN = "externalRestClient";

  @Bean
  public HttpClient sharedExternalHttpClient() {
    return HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .proxy(ProxySelector.getDefault())
        .followRedirects(HttpClient.Redirect.NORMAL)
        .connectTimeout(Duration.ofSeconds(10))
        .build();
  }

  @Bean(name = EXTERNAL_REST_CLIENT_BEAN)
  public RestClient externalRestClient(
      @Qualifier("sharedExternalHttpClient") HttpClient sharedExternalHttpClient) {
    JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(sharedExternalHttpClient);
    requestFactory.setReadTimeout(Duration.ofSeconds(15));
    return RestClient.builder()
        .requestFactory(requestFactory)
        .build();
  }
}
