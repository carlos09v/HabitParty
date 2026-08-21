package com.habitparty.infrastructure;

import com.habitparty.adapters.in.web.dtos.response.ErrorResponseDTO;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;


import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    // Catches errors thrown by @Valid (e.g., @NotBlank, @Past)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidationExceptions(MethodArgumentNotValidException ex) {
        // 1. Extract all the validation errors
        StringBuilder errorMessage = new StringBuilder("Erros de validação encontrados: ");
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errorMessage.append(fieldName).append(" (").append(message).append("); ");
        });

        // 2. Format the response using your existing DTO
        ErrorResponseDTO errorResponse = new ErrorResponseDTO("Erro de Validação de Dados", errorMessage.toString());
        
        // 3. Return a 400 Bad Request
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        
        // Pega a mensagem mais profunda (a que veio direto do PostgreSQL)
        String specificMessage = ex.getMostSpecificCause().getMessage();
        
        String mensagemAmigavel = "Erro de conflito de dados no banco de dados."; // Fallback

        // Se a mensagem contiver o padrão do Postgres: "Key (campo)=(valor) already exists."
        if (specificMessage != null && specificMessage.contains("already exists")) {
            
            // Cria um Regex para capturar o que está dentro do primeiro () e do segundo ()
            Pattern pattern = Pattern.compile("Key \\((.*?)\\)=\\((.*?)\\) already exists");
            Matcher matcher = pattern.matcher(specificMessage);
            
            if (matcher.find()) {
                String campo = matcher.group(1); // Ex: "email" ou "username"
                String valor = matcher.group(2); // Ex: "user@example.com"
                
                mensagemAmigavel = String.format("O %s '%s' já está em uso.", campo, valor);
            }
        }
        
        ErrorResponseDTO error = new ErrorResponseDTO("Dados Duplicados", mensagemAmigavel);
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        
        String mensagemAmigavel = "Corpo da requisição malformado ou com tipo de dado incorreto. Verifique o JSON enviado.";

        // Pega a mensagem gerada pelo Jackson (leitor de JSON)
        String specificMessage = ex.getMessage();

        // Se o erro for de Enum inválido
        if (specificMessage != null && specificMessage.contains("not one of the values accepted for Enum class")) {
            
            // Regex para capturar o valor errado que o usuário mandou e a lista de valores permitidos
            Pattern pattern = Pattern.compile("from String \"(.*?)\": not one of the values accepted for Enum class: \\[(.*?)\\]");
            Matcher matcher = pattern.matcher(specificMessage);
            
            if (matcher.find()) {
                String valorEnviado = matcher.group(1);     // Ex: "MALEs"
                String valoresPermitidos = matcher.group(2); // Ex: "PREFER_NOT_TO_SAY, NON_BINARY, FEMALE, MALE"
                
                mensagemAmigavel = String.format("O valor '%s' não é aceito. As opções válidas são: [%s]. Lembre-se de usar letras maiúsculas.", 
                                                 valorEnviado, valoresPermitidos);
            }
        }

        ErrorResponseDTO error = new ErrorResponseDTO("Formato de Dado Inválido", mensagemAmigavel);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

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