package com.habitparty.adapters.out.storage;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.StoragePort;
import com.habitparty.core.exceptions.DomainValidationException;

@Component
public class LocalStorageAdapter implements StoragePort {
  private static final Logger log = LoggerFactory.getLogger(LocalStorageAdapter.class);
  private static final int MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");
  private static final String UPLOADS_URL_PREFIX = "/uploads/";

  private final Path uploadDir;

  @Autowired
  public LocalStorageAdapter(@Value("${app.storage.upload-dir:uploads}") String uploadDirProp) {
    this(Paths.get(uploadDirProp).toAbsolutePath().normalize());
  }

  LocalStorageAdapter(Path uploadDir) {
    this.uploadDir = uploadDir;
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
    if (contentStream == null || size <= 0) {
      throw new DomainValidationException("O arquivo enviado está vazio.");
    }

    if (size > MAX_FILE_SIZE) {
      throw new DomainValidationException("O arquivo excede o limite máximo permitido de 5 MB.");
    }

    String extension = "";
    if (originalFilename != null && originalFilename.contains(".")) {
      extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase(Locale.ROOT);
    }

    if (!ALLOWED_EXTENSIONS.contains(extension)) {
      throw new DomainValidationException(
          "Formato de arquivo inválido. Apenas imagens JPG, PNG ou WEBP são permitidas.");
    }

    try (InputStream managedStream = contentStream) {
      byte[] bytes = readBoundedBytes(managedStream, MAX_FILE_SIZE);
      if (bytes.length == 0) {
        throw new DomainValidationException("O arquivo enviado está vazio.");
      }

      if (!matchesImageMagicBytes(bytes, extension)) {
        throw new DomainValidationException(
            "O conteúdo do arquivo não corresponde a uma imagem válida (JPG, PNG ou WEBP).");
      }

      String newFilename = UUID.randomUUID() + extension;
      Path destinationPath = this.uploadDir.resolve(newFilename).normalize();

      // Proteção contra path traversal
      if (!destinationPath.toAbsolutePath().normalize().startsWith(this.uploadDir.toAbsolutePath().normalize())) {
        throw new DomainValidationException("Nome de arquivo inválido.");
      }

      Files.write(destinationPath, bytes);
      return UPLOADS_URL_PREFIX + newFilename;
    } catch (DomainValidationException e) {
      throw e;
    } catch (IOException e) {
      throw new RuntimeException("Falha ao salvar o arquivo fisicamente.", e);
    }
  }

  private static byte[] readBoundedBytes(InputStream stream, int maxBytes) throws IOException {
    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
    byte[] chunk = new byte[8192];
    int total = 0;
    int read;
    while ((read = stream.read(chunk)) != -1) {
      total += read;
      if (total > maxBytes) {
        throw new DomainValidationException("O arquivo excede o limite máximo permitido de 5 MB.");
      }
      buffer.write(chunk, 0, read);
    }
    return buffer.toByteArray();
  }

  private static boolean matchesImageMagicBytes(byte[] bytes, String extension) {
    return switch (extension) {
      case ".jpg", ".jpeg" -> bytes.length >= 3
          && (bytes[0] & 0xFF) == 0xFF
          && (bytes[1] & 0xFF) == 0xD8
          && (bytes[2] & 0xFF) == 0xFF;
      case ".png" -> bytes.length >= 8
          && (bytes[0] & 0xFF) == 0x89
          && bytes[1] == 0x50 // P
          && bytes[2] == 0x4E // N
          && bytes[3] == 0x47 // G
          && bytes[4] == 0x0D
          && bytes[5] == 0x0A
          && bytes[6] == 0x1A
          && bytes[7] == 0x0A;
      case ".webp" -> bytes.length >= 12
          && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
          && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
      default -> false;
    };
  }

  @Override
  public void deleteFile(String fileUrl) {
    if (fileUrl == null || fileUrl.isBlank() || !fileUrl.startsWith(UPLOADS_URL_PREFIX)) {
      return;
    }

    String filename = fileUrl.substring(UPLOADS_URL_PREFIX.length());
    if (filename.isBlank()) {
      return;
    }

    Path targetPath = this.uploadDir.resolve(filename).normalize();
    Path baseDir = this.uploadDir.toAbsolutePath().normalize();

    // Proteção contra path traversal e tentativa de deletar o próprio diretório
    if (!targetPath.toAbsolutePath().normalize().startsWith(baseDir)
        || targetPath.toAbsolutePath().normalize().equals(baseDir)) {
      return;
    }

    try {
      Files.deleteIfExists(targetPath);
    } catch (IOException ex) {
      log.warn("[LocalStorageAdapter] Não foi possível remover o arquivo {}: {}", targetPath.getFileName(), ex.getMessage());
    }
  }
}
