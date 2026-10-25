package com.habitparty.infrastructure;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${app.storage.upload-dir:uploads}")
  private String uploadDirProp;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path uploadDir = Paths.get(uploadDirProp).toAbsolutePath().normalize();
    String uploadPath = uploadDir.toUri().toString();

    registry.addResourceHandler("/uploads/**")
        .addResourceLocations(uploadPath);
  }
}
