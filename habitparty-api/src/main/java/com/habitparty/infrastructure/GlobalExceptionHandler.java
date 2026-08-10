package com.habitparty.infrastructure;

import com.habitparty.adapters.in.web.dtos.response.ErrorResponseDTO;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Limites do Plano Free Atingidos -> 403 (Forbidden)
    @ExceptionHandler(LimitExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handleLimitExceeded(LimitExceededException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Limite Atingido", ex.getMessage());

        // Retorna um erro 403 (Forbidden) ou 400 (Bad Request) em vez de um Erro 500
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    // Recursos Não Encontrados (Workspaces, Users, Rewards, etc.) -> 404
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleResourceNotFound(ResourceNotFoundException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Não Encontrado", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    // Tentativa de mexer em algo de outro usuário -> 403 (Forbidden)
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnauthorized(UnauthorizedException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Acesso Negado", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    // Regras de negócio/validação de atributos violadas -> 400 (Bad Request)
    @ExceptionHandler(DomainValidationException.class)
    public ResponseEntity<ErrorResponseDTO> handleDomainValidation(DomainValidationException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Erro de Validação", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}