package com.habitparty.infrastructure;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.concurrent.Executor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.scheduling.annotation.AsyncConfigurer;

/**
 * Configura o executor assíncrono com Virtual Threads e concorrência limitada
 * abaixo do tamanho máximo do pool HikariCP, evitando saturação de conexões sob picos de eventos.
 */
@Configuration
public class AsyncConfig implements AsyncConfigurer {

  private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

  private final int concurrencyLimit;

  public AsyncConfig(@Value("${app.async.concurrency-limit:6}") int concurrencyLimit) {
    this.concurrencyLimit = Math.max(1, concurrencyLimit);
  }

  @Bean(name = "applicationTaskExecutor")
  public Executor applicationTaskExecutor() {
    SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("hp-async-");
    executor.setVirtualThreads(true);
    executor.setConcurrencyLimit(concurrencyLimit);
    return executor;
  }

  @Override
  public Executor getAsyncExecutor() {
    return applicationTaskExecutor();
  }

  @Override
  public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
    return (Throwable ex, Method method, Object... params) -> log.error(
        "[Async] Exceção não capturada em {}.{} (args={}): {}",
        method.getDeclaringClass().getSimpleName(),
        method.getName(),
        Arrays.toString(params),
        ex.getMessage(),
        ex);
  }
}
