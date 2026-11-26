package com.habitparty.infrastructure.security;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import io.swagger.v3.oas.annotations.Parameter;

/**
 * Resolve automaticamente o {@link java.util.UUID} do usuário autenticado a partir do
 * {@link org.springframework.security.core.context.SecurityContextHolder}, ocultando o parâmetro
 * no OpenAPI e lançando {@link com.habitparty.core.exceptions.UnauthenticatedException} (HTTP 401)
 * quando não houver principal autenticado.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Parameter(hidden = true)
public @interface CurrentUserId {
}
