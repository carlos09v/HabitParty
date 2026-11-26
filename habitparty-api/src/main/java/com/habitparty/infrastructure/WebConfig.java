package com.habitparty.infrastructure;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.habitparty.infrastructure.security.CurrentUserIdArgumentResolver;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${app.storage.upload-dir:uploads}")
  private String uploadDirProp;

  @Override
  public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
    resolvers.add(new CurrentUserIdArgumentResolver());
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path uploadDir = Paths.get(uploadDirProp).toAbsolutePath().normalize();
    String uploadPath = uploadDir.toUri().toString();

    registry.addResourceHandler("/uploads/**")
        .addResourceLocations(uploadPath)
        .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());
  }
}
