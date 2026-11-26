package com.habitparty.infrastructure;

import java.sql.SQLException;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.habitparty.adapters.in.web.dtos.response.ErrorResponseDTO;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.PaymentProcessingException;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthenticatedException;
import com.habitparty.core.exceptions.UnauthorizedException;

import jakarta.persistence.OptimisticLockException;
import jakarta.validation.ConstraintViolationException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DatabindException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final Pattern UNIQUE_KEY_PATTERN = Pattern.compile("Key \\((.*?)\\)=\\((.*?)\\) already exists");
    private static final String SQLSTATE_UNIQUE_VIOLATION = "23505";

    // Catches errors thrown by @Valid (e.g., @NotBlank, @Past)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidationExceptions(MethodArgumentNotValidException ex) {
        StringBuilder errorMessage = new StringBuilder("Erros de validação encontrados: ");

        ex.getBindingResult().getAllErrors().forEach(error -> {
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
        Throwable specificCause = ex.getMostSpecificCause();
        String specificMessage = specificCause != null ? specificCause.getMessage() : ex.getMessage();

        if (isUniqueConstraintViolation(ex, specificMessage)) {
            String mensagemAmigavel = "Já existe um registro com os mesmos dados informados.";
            if (specificMessage != null) {
                Matcher matcher = UNIQUE_KEY_PATTERN.matcher(specificMessage);
                if (matcher.find()) {
                    String campo = matcher.group(1);
                    if ("email".equalsIgnoreCase(campo)) {
                        // Nunca ecoa o e-mail duplicado para impedir enumeração de contas
                        mensagemAmigavel = "Não foi possível concluir o cadastro com os dados informados.";
                    } else if ("username".equalsIgnoreCase(campo)) {
                        mensagemAmigavel = "Este nome de usuário já está em uso.";
                    }
                } else {
                    String lower = specificMessage.toLowerCase(Locale.ROOT);
                    if (lower.contains("email")) {
                        mensagemAmigavel = "Não foi possível concluir o cadastro com os dados informados.";
                    } else if (lower.contains("username")) {
                        mensagemAmigavel = "Este nome de usuário já está em uso.";
                    }
                }
            }
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponseDTO("Dados Duplicados", mensagemAmigavel));
        }

        log.warn("Violação de integridade de dados (não-unicidade): {}", specificMessage);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDTO("Erro de Integridade", "Os dados informados violam uma regra de integridade."));
    }

    private static boolean isUniqueConstraintViolation(Throwable ex, String specificMessage) {
        Throwable cursor = ex;
        while (cursor != null) {
            if (cursor instanceof SQLException sqlEx && SQLSTATE_UNIQUE_VIOLATION.equals(sqlEx.getSQLState())) {
                return true;
            }
            cursor = cursor.getCause();
        }
        if (specificMessage == null) {
            return false;
        }
        String lower = specificMessage.toLowerCase(Locale.ROOT);
        return lower.contains("already exists")
                || lower.contains("duplicate key")
                || lower.contains("unique index or primary key violation")
                || lower.contains("unique constraint");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Throwable cause = ex.getCause();

        // Suporte ao Jackson 3 (Spring Boot 4 WebMVC)
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
        log.warn("Argumento inválido na requisição: {}", ex.getMessage());
        ErrorResponseDTO error = new ErrorResponseDTO(
                "Argumento Inválido",
                "Um ou mais argumentos informados são inválidos.");
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
        log.error("Estado inválido durante processamento da requisição: {}", ex.getMessage(), ex);
        ErrorResponseDTO error = new ErrorResponseDTO(
                "Operação Inválida",
                "Não foi possível concluir a operação no estado atual.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Conflito de concorrência otimista (@Version) -> 409 (Conflict)
    @ExceptionHandler({ObjectOptimisticLockingFailureException.class, OptimisticLockException.class})
    public ResponseEntity<ErrorResponseDTO> handleOptimisticLockingFailure(Exception ex) {
        log.warn("Conflito de concorrência otimista detectado: {}", ex.getMessage());
        ErrorResponseDTO error = new ErrorResponseDTO(
                "Conflito de Concorrência",
                "Este recurso foi atualizado simultaneamente. Recarregue os dados e tente novamente.");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    // Recursos Não Encontrados (Workspaces, Users, Rewards, etc.) -> 404
    @ExceptionHandler({ResourceNotFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ErrorResponseDTO> handleResourceNotFound(Exception ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Não Encontrado", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // Requisição sem autenticação válida -> 401 (Unauthorized)
    @ExceptionHandler(UnauthenticatedException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnauthenticated(UnauthenticatedException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Não Autenticado", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // Tentativa de mexer em recurso de outro usuário -> 403 (Forbidden) (ou 401 se mensagem indicar ausência de autenticação)
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnauthorized(UnauthorizedException ex) {
        if ("Usuário não autenticado.".equals(ex.getMessage())) {
            ErrorResponseDTO error = new ErrorResponseDTO("Não Autenticado", ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        ErrorResponseDTO error = new ErrorResponseDTO("Acesso Negado", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    // Regras de negócio/validação de atributos violadas -> 400 (Bad Request)
    @ExceptionHandler(DomainValidationException.class)
    public ResponseEntity<ErrorResponseDTO> handleDomainValidation(DomainValidationException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Erro de Validação", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Falhas de integração ou comunicação com gateway de pagamento -> 502 (Bad Gateway) sem vazar detalhes internos
    @ExceptionHandler(PaymentProcessingException.class)
    public ResponseEntity<ErrorResponseDTO> handlePaymentProcessing(PaymentProcessingException ex) {
        log.error("[Payment] Falha no processamento de pagamento: {}", ex.getMessage(), ex);
        ErrorResponseDTO error = new ErrorResponseDTO(
                "Erro de Pagamento",
                "Não foi possível processar a operação de pagamento no momento. Tente novamente em instantes.");
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

    // Upload de arquivo acima do limite permitido -> 413 (Content Too Large)
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponseDTO> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        ErrorResponseDTO error = new ErrorResponseDTO("Arquivo Muito Grande", "O tamanho do arquivo enviado excede o limite máximo permitido.");
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body(error);
    }

    // Requisição multipart inválida ou corrompida -> 400 (Bad Request)
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponseDTO> handleMultipartException(MultipartException ex) {
        log.warn("Requisição multipart inválida ou corrompida: {}", ex.getMessage());
        ErrorResponseDTO error = new ErrorResponseDTO("Erro no Upload", "Requisição multipart inválida ou corrompida.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // Desconexão do cliente durante streaming (ex: download CSV interrompido) -> encerra silenciosamente
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public ResponseEntity<Void> handleAsyncRequestNotUsable(AsyncRequestNotUsableException ex) {
        log.debug("Cliente desconectou durante streaming de resposta: {}", ex.getMessage());
        return null;
    }

    // Fallback global para exceções não tratadas -> 500 (Internal Server Error)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGenericException(Exception ex) {
        log.error("Erro inesperado não tratado: ", ex);
        ErrorResponseDTO error = new ErrorResponseDTO("Erro Interno", "Ocorreu um erro interno inesperado no servidor.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
