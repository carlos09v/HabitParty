package com.habitparty.adapters.out.persistence;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.habitparty.application.ports.StoragePort;

@Component
public class LocalStorageAdapter implements StoragePort {
  // Define o nome da pasta onde as fotos vão ficar salvas fisicamente no seu PC
    private final Path uploadDir = Paths.get("uploads");

    public LocalStorageAdapter() {
        // Assim que o Spring ligar, ele verifica se a pasta "uploads" existe. Se não existir, ele cria.
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível criar o diretório de uploads!", e);
        }
    }

    @Override
    public String uploadFile(MultipartFile file) {
        try {
            // 1. Validação básica: garante que o arquivo não está vazio
            if (file.isEmpty()) {
                throw new IllegalArgumentException("O arquivo enviado está vazio.");
            }

            // 2. Extrai a extensão do arquivo original (ex: .png, .jpg)
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // 3. Gera um nome único (UUID) para evitar conflitos de arquivos com o mesmo nome
            String newFilename = UUID.randomUUID().toString() + extension;

            // 4. Resolve o caminho final (ex: uploads/550e8400-e29b-41d4-a716-446655440000.png)
            Path destinationPath = this.uploadDir.resolve(newFilename);

            // 5. Copia o arquivo da requisição HTTP direto para a pasta no seu HD
            Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);

            // 6. Retorna o caminho relativo que será salvo no banco de dados na coluna profile_photo_url
            return "/uploads/" + newFilename;

        } catch (IOException e) {
            throw new RuntimeException("Falha ao salvar o arquivo fisicamente.", e);
        }
    }
}
