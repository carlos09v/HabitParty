package com.habitparty.core.exceptions;

/**
 * Exceção lançada quando a requisição exige um usuário autenticado, mas o principal está ausente ou inválido.
 * Mapeada para HTTP 401 (Unauthorized) no {@code GlobalExceptionHandler}, diferenciando-se de
 * {@link UnauthorizedException} de posse/autorização (HTTP 403 Forbidden).
 */
public class UnauthenticatedException extends UnauthorizedException {
  public UnauthenticatedException(String message) {
    super(message);
  }
}
