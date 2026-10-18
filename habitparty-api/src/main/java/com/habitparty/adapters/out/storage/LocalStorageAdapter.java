package com.habitparty.adapters.out.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.application.ports.StoragePort;
import com.habitparty.core.exceptions.DomainValidationException;

@Component
public class LocalStorageAdapter implements StoragePort {
  private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");

  private final Path uploadDir = Paths.get("uploads");

  public LocalStorageAdapter() {
    try {
      if (!Files.exists(uploadDir)) {
        Files.createDirectories(uploadDir);
      }
    } catch (IOException e) {
      throw new RuntimeException("Não foi possível criar o diretório de uploads!", e);
    }
  }

  @Override
  public String uploadFile(InputStream contentStream, String originalFilename, long size) {
    if (size <= 0) {
      throw new DomainValidationException("O arquivo enviado está vazio.");
    }

    if (size > MAX_FILE_SIZE) {
      throw new DomainValidationException("O arquivo excede o limite máximo permitido de 5 MB.");
    }

    String extension = "";
    if (originalFilename != null && originalFilename.contains(".")) {
      extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
    }

    if (!ALLOWED_EXTENSIONS.contains(extension)) {
      throw new DomainValidationException("Formato de arquivo inválido. Apenas imagens JPG, PNG ou WEBP são permitidas.");
    }

    try {
      String newFilename = UUID.randomUUID().toString() + extension;
      Path destinationPath = this.uploadDir.resolve(newFilename).normalize();

      // Proteção contra path traversal
      if (!destinationPath.startsWith(this.uploadDir.toAbsolutePath().normalize()) &&
          !destinationPath.startsWith(this.uploadDir)) {
        throw new DomainValidationException("Nome de arquivo inválido.");
      }

      Files.copy(contentStream, destinationPath, StandardCopyOption.REPLACE_EXISTING);

      return "/uploads/" + newFilename;
    } catch (IOException e) {
      throw new RuntimeException("Falha ao salvar o arquivo fisicamente.", e);
    }
  }
}
