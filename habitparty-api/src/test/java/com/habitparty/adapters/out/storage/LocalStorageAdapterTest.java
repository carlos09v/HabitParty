package com.habitparty.adapters.out.storage;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalStorageAdapterTest {

  @TempDir
  Path tempDir;

  @Test
  @DisplayName("Deve fazer upload e remover o arquivo local com sucesso")
  void shouldUploadAndDeleteLocalFile() {
    LocalStorageAdapter adapter = new LocalStorageAdapter(tempDir);
    byte[] content = new byte[]{1, 2, 3, 4};

    String fileUrl = adapter.uploadFile(new ByteArrayInputStream(content), "avatar.png", content.length);
    assertTrue(fileUrl.startsWith("/uploads/"));

    String filename = fileUrl.substring("/uploads/".length());
    Path storedFile = tempDir.resolve(filename);
    assertTrue(Files.exists(storedFile));

    adapter.deleteFile(fileUrl);
    assertFalse(Files.exists(storedFile));
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
