package com.habitparty.infrastructure;

import com.habitparty.core.exceptions.UserNotFoundException;
import com.habitparty.core.exceptions.WorkspaceLimitExceededException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Avisa o Spring: "Se essa exceção estourar, chame este método!"
    @ExceptionHandler(WorkspaceLimitExceededException.class)
    public ResponseEntity<Map<String, String>> handleWorkspaceLimit(WorkspaceLimitExceededException ex) {
        
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Limite Atingido");
        errorResponse.put("message", ex.getMessage());

        // Retorna um erro 403 (Forbidden) ou 400 (Bad Request) em vez de um Erro 500
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFound(UserNotFoundException ex) {
    
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Não encontrado!");
        errorResponse.put("message", ex.getMessage());

        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }
    
}