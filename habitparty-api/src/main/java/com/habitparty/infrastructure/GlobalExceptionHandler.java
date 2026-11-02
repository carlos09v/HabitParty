package com.habitparty.infrastructure;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.habitparty.adapters.in.web.dtos.response.ErrorResponseDTO;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.PaymentProcessingException;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;

import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.validation.ConstraintViolationException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DatabindException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final Pattern UNIQUE_KEY_PATTERN = Pattern.compile("Key \\((.*?)\\)=\\((.*?)\\) already exists");

    // Catches errors thrown by @Valid (e.g., @NotBlank, @Past)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidationExceptions(MethodArgumentNotValidException ex) {
        StringBuilder errorMessage = new StringBuilder("Erros de validação encontrados: ");

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = (error instanceof FieldError fieldError)
                    ? fieldError.getField()
                    : error.getObjectName();
            String message = error.getDefaultMessage();
            errorMessage.append(fieldName).append(" (").append(message).append("); ");
        });

        ErrorResponseDTO errorResponse = new ErrorResponseDTO("Erro de Validação de Dados", errorMessage.toString());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponseDTO> handleHandlerMethodValidation(HandlerMethodValidationException ex) {
        StringBuilder errorMessage = new StringBuilder("Erros de validação encontrados: ");
        ex.getParameterValidationResults().forEach(result ->
            result.getResolvableErrors().forEach(error -> {
                String message = error.getDefaultMessage();
                errorMessage.append(message != null ? message : "Valor inválido").append("; ");
            })
        );
        ErrorResponseDTO errorResponse = new ErrorResponseDTO("Erro de Validação de Dados", errorMessage.toString());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String specificMessage = ex.getMostSpecificCause().getMessage();
        String mensagemAmigavel = "Conflito de integridade nos dados enviados.";

        if (specificMessage != null && specificMessage.contains("already exists")) {
            Matcher matcher = UNIQUE_KEY_PATTERN.matcher(specificMessage);
            if (matcher.find()) {
                String campo = matcher.group(1);
                String valor = matcher.group(2);
                if ("email".equalsIgnoreCase(campo)) {
                    mensagemAmigavel = String.format("O email '%s' já está em uso.", valor);
                } else if ("username".equalsIgnoreCase(campo)) {
                    mensagemAmigavel = String.format("O username '%s' já está em uso.", valor);
                } else {
                    mensagemAmigavel = "Já existe um registro com os mesmos dados informados.";
                }
            }
        }

        ErrorResponseDTO error = new ErrorResponseDTO("Dados Duplicados", mensagemAmigavel);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Throwable cause = ex.getCause();

        // 1. Suporte ao Jackson 3 (Spring Boot 4 WebMVC)
        if (cause instanceof DatabindException databindException) {
            String campo = databindException.getPath().stream()
                    .map(JacksonException.Reference::getPropertyName)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse("desconhecido");

            Class<?> targetType = null;
            Object invalidValue = null;
            if (databindException instanceof tools.jackson.databind.exc.InvalidFormatException invalidFormat) {
                targetType = invalidFormat.getTargetType();
                invalidValue = invalidFormat.getValue();
            }

            String mensagemAmigavel = buildFriendlyJsonMappingMessage(
                    campo, databindException.getCause(), targetType, invalidValue,
                    databindException instanceof tools.jackson.databind.exc.InvalidFormatException);

            ErrorResponseDTO error = new ErrorResponseDTO("Formato de Dado Inválido", mensagemAmigavel);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // 2. Suporte ao Jackson 2 (compatibilidade com adaptadores legados)
        if (cause instanceof JsonMappingException jsonMappingException) {
            String campo = jsonMappingException.getPath().stream()
                    .map(JsonMappingException.Reference::getFieldName)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse("desconhecido");

            Class<?> targetType = null;
            Object invalidValue = null;
            if (jsonMappingException instanceof InvalidFormatException invalidFormat) {
                targetType = invalidFormat.getTargetType();
                invalidValue = invalidFormat.getValue();
            }

            String mensagemAmigavel = buildFriendlyJsonMappingMessage(
                    campo, jsonMappingException.getCause(), targetType, invalidValue,
                    jsonMappingException instanceof InvalidFormatException);

            ErrorResponseDTO error = new ErrorResponseDTO("Formato de Dado Inválido", mensagemAmigavel);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        ErrorResponseDTO error = new ErrorResponseDTO(
                "Corpo da Requisição Malformado",
                "O corpo da requisição JSON está ausente ou malformado.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    private String buildFriendlyJsonMappingMessage(
            String campo,
            Throwable rootCause,
            Class<?> targetType,
            Object invalidValue,
            boolean isInvalidFormat) {
        if (rootCause instanceof DateTimeParseException) {
            return String.format("A data no campo '%s' é inválida. Use o padrão 'YYYY-MM-DD' (ex: 2003-02-03).", campo);
        }
        if (isInvalidFormat) {
            if (targetType != null && targetType.isEnum()) {
                String permitidos = Arrays.toString(targetType.getEnumConstants());
                return String.format("O valor '%s' não é válido para '%s'. Opções permitidas: %s.",
                        invalidValue, campo, permitidos);
            }
            return String.format(
                    "O valor '%s' fornecido para o campo '%s' é incompatível com o tipo esperado.",
                    invalidValue, campo);
        }
        return String.format("O campo '%s' está com um formato ou tipo de dado inválido.", campo);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDTO> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String mensagem = String.format("O parâmetro '%s' recebeu um valor inválido.", ex.getName());
        ErrorResponseDTO error = new ErrorResponseDTO("Parâmetro Inválido", mensagem);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler({
        MissingServletRequestParameterException.class,
        MissingRequestHeaderException.class,
        MissingServletRequestPartException.class
    })
    public ResponseEntity<ErrorResponseDTO> handleMissingRequestParameters(Exception ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Parâmetro Obrigatório Ausente", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponseDTO> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Argumento Inválido", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Limites do Plano Free Atingidos -> 403 (Forbidden)
    @ExceptionHandler(LimitExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handleLimitExceeded(LimitExceededException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Limite Atingido", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponseDTO> handleIllegalStateException(IllegalStateException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Operação Inválida", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Recursos Não Encontrados (Workspaces, Users, Rewards, etc.) -> 404
    @ExceptionHandler({ResourceNotFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ErrorResponseDTO> handleResourceNotFound(Exception ex) {
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

    // Falhas de integração ou comunicação com gateway de pagamento -> 502 (Bad Gateway)
    @ExceptionHandler(PaymentProcessingException.class)
    public ResponseEntity<ErrorResponseDTO> handlePaymentProcessing(PaymentProcessingException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Erro de Pagamento", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
    }

    // Acesso negado pelo Spring Security -> 403 (Forbidden)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccessDenied(AccessDeniedException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Acesso Negado", "Você não tem permissão para acessar este recurso.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    // Violação de constraints de validação (parâmetros, queries, etc.) -> 400 (Bad Request)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConstraintViolation(ConstraintViolationException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Erro de Validação de Dados", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Método HTTP não suportado no endpoint -> 405 (Method Not Allowed)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponseDTO> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Método Não Permitido", "Método HTTP " + ex.getMethod() + " não suportado para este endpoint.");
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(error);
    }

    // Tipo de mídia (Content-Type) não suportado -> 415 (Unsupported Media Type)
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponseDTO> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Tipo de Mídia Não Suportado", "O Content-Type enviado não é suportado por este endpoint.");
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(error);
    }

    // Upload de arquivo acima do limite permitido -> 413 (Payload Too Large)
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Arquivo Muito Grande", "O tamanho do arquivo enviado excede o limite máximo permitido.");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
    }

    // Fallback global para exceções não tratadas -> 500 (Internal Server Error)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGenericException(Exception ex) {
        log.error("Erro inesperado não tratado: ", ex);
        ErrorResponseDTO error = new ErrorResponseDTO("Erro Interno", "Ocorreu um erro interno inesperado no servidor.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}