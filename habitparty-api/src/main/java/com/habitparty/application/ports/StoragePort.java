package com.habitparty.application.ports;

import org.springframework.web.multipart.MultipartFile;

public interface StoragePort {
    // Recebe o arquivo e devolve a URL pública da imagem salva
    String uploadFile(MultipartFile file); 
}
