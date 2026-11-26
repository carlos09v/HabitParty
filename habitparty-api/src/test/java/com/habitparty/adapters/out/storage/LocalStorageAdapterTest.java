package com.habitparty.adapters.out.storage;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.habitparty.core.exceptions.DomainValidationException;

class LocalStorageAdapterTest {

  @TempDir
  Path tempDir;

  @Test
  @DisplayName("Deve fazer upload de imagem PNG válida (magic bytes) e remover o arquivo local com sucesso")
  void shouldUploadAndDeleteLocalFile() {
    LocalStorageAdapter adapter = new LocalStorageAdapter(tempDir);
    byte[] content = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};

    String fileUrl = adapter.uploadFile(new ByteArrayInputStream(content), "avatar.png", content.length);
    assertTrue(fileUrl.startsWith("/uploads/"));

    String filename = fileUrl.substring("/uploads/".length());
    Path storedFile = tempDir.resolve(filename);
    assertTrue(Files.exists(storedFile));

    adapter.deleteFile(fileUrl);
    assertFalse(Files.exists(storedFile));
  }

  @Test
  @DisplayName("Deve rejeitar payload disfarçado com extensão .png cujos magic bytes não correspondem a PNG")
  void shouldRejectFakeImagePayloadsWithDisguisedExtension() {
    LocalStorageAdapter adapter = new LocalStorageAdapter(tempDir);
    byte[] htmlPayload = "<html><script>alert(1)</script></html>".getBytes();

    assertThrows(DomainValidationException.class, () ->
        adapter.uploadFile(new ByteArrayInputStream(htmlPayload), "evil.png", htmlPayload.length));
  }

  @Test
  @DisplayName("Deve ignorar URLs externas ou tentativas de path traversal no deleteFile")
  void shouldIgnoreExternalUrlsAndPathTraversalOnDelete() throws Exception {
    LocalStorageAdapter adapter = new LocalStorageAdapter(tempDir);
    Path outsideFile = tempDir.getParent().resolve("outside-secret.txt");
    Files.writeString(outsideFile, "secret");

    try {
      assertDoesNotThrow(() -> adapter.deleteFile(null));
      assertDoesNotThrow(() -> adapter.deleteFile(""));
      assertDoesNotThrow(() -> adapter.deleteFile("https://lh3.googleusercontent.com/a/avatar"));
      assertDoesNotThrow(() -> adapter.deleteFile("/uploads/../outside-secret.txt"));
      assertTrue(Files.exists(outsideFile));
    } finally {
      Files.deleteIfExists(outsideFile);
    }
  }
}
