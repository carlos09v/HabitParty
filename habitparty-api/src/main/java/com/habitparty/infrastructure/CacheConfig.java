package com.habitparty.infrastructure;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Configuração de cache em memória (Caffeine) para catálogos estáticos (conquistas e artefatos)
 * e resolução de fuso horário de usuários.
 */
@Configuration
@EnableCaching
public class CacheConfig {

  public static final String ACHIEVEMENTS_CATALOG_CACHE = "achievementsCatalog";
  public static final String ARTIFACTS_CATALOG_CACHE = "artifactsCatalog";
  public static final String USER_TIMEZONES_CACHE = "userTimezones";

  @Bean
  public CacheManager cacheManager() {
    SimpleCacheManager manager = new SimpleCacheManager();
    manager.setCaches(List.of(
        new CaffeineCache(
            ACHIEVEMENTS_CATALOG_CACHE,
            Caffeine.newBuilder()
                .expireAfterWrite(6, TimeUnit.HOURS)
                .maximumSize(32)
                .recordStats()
                .build()),
        new CaffeineCache(
            ARTIFACTS_CATALOG_CACHE,
            Caffeine.newBuilder()
                .expireAfterWrite(6, TimeUnit.HOURS)
                .maximumSize(64)
                .recordStats()
                .build()),
        new CaffeineCache(
            USER_TIMEZONES_CACHE,
            Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(50_000)
                .recordStats()
                .build())
    ));
    return manager;
  }
}
