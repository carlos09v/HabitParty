package com.habitparty.infrastructure;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.habitparty.adapters.in.web.dtos.response.ErrorResponseDTO;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;

import java.time.format.DateTimeParseException;
import java.util.Arrays;
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
        Throwable cause = ex.getCause();

        // Captura QUALQUER erro de mapeamento do Jackson (pai do InvalidFormatException e afins)
        if (cause instanceof JsonMappingException jsonMappingException) {

            // Pega o nome do campo problemático navegando pelo caminho do erro
            String campo = jsonMappingException.getPath().stream()
                    .map(JsonMappingException.Reference::getFieldName)
                    .findFirst()
                    .orElse("desconhecido");

            String mensagemAmigavel = String.format("O campo '%s' está com um formato ou tipo de dado inválido.",
                    campo);

            // 1. Verifica se a causa original foi um erro de parse de data
            Throwable rootCause = jsonMappingException.getCause();
            if (rootCause instanceof DateTimeParseException) {
                mensagemAmigavel = String
                        .format("A data no campo '%s' é inválida. Use o padrão 'YYYY-MM-DD' (ex: 2003-02-03).", campo);
            }
            // 2. Verifica se é um erro de valor incompatível (como Enum ou String em campo numérico)
            else if (jsonMappingException instanceof InvalidFormatException invalidFormat) {
                if (invalidFormat.getTargetType() != null && invalidFormat.getTargetType().isEnum()) {
                    String permitidos = Arrays.toString(invalidFormat.getTargetType().getEnumConstants());
                    mensagemAmigavel = String.format("O valor '%s' não é válido para '%s'. Opções permitidas: %s.",
                            invalidFormat.getValue(), campo, permitidos);
                } else {
                    mensagemAmigavel = String.format(
                            "O valor '%s' fornecido para o campo '%s' é incompatível com o tipo esperado.",
                            invalidFormat.getValue(), campo);
                }
            }

            ErrorResponseDTO error = new ErrorResponseDTO("Formato de Dado Inválido", mensagemAmigavel);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // Fallback: se não for um erro de mapeamento conhecido, imprime a mensagem real da exceção para debug
        String mensagemFallback = "Erro na leitura do JSON: " + (cause != null ? cause.getMessage() : ex.getMessage());
        ErrorResponseDTO error = new ErrorResponseDTO("Corpo da Requisição Malformado", mensagemFallback);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Limites do Plano Free Atingidos -> 403 (Forbidden)
    @ExceptionHandler(LimitExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handleLimitExceeded(LimitExceededException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Limite Atingido", ex.getMessage());

        // Retorna um erro 403 (Forbidden) ou 400 (Bad Request) em vez de um Erro 500
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponseDTO> handleIllegalStateException(IllegalStateException ex) {
        
        // Pega a mensagem exata que você definiu lá na regra de negócio (no Domínio)
        String mensagemAmigavel = ex.getMessage();
        
        // Monta a resposta no seu formato padrão
        ErrorResponseDTO error = new ErrorResponseDTO("Operação Inválida", mensagemAmigavel);
        
        // Retorna 400 Bad Request (pois o usuário tentou fazer algo que o estado atual não permite)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
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