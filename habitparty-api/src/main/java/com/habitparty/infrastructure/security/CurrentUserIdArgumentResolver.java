package com.habitparty.infrastructure.security;

import java.util.UUID;

import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.habitparty.core.exceptions.UnauthenticatedException;

/**
 * {@link HandlerMethodArgumentResolver} para parâmetros anotados com {@link CurrentUserId}.
 */
public class CurrentUserIdArgumentResolver implements HandlerMethodArgumentResolver {

  @Override
  public boolean supportsParameter(MethodParameter parameter) {
    return parameter.hasParameterAnnotation(CurrentUserId.class)
        && UUID.class.isAssignableFrom(parameter.getParameterType());
  }

  @Override
  public Object resolveArgument(
      MethodParameter parameter,
      ModelAndViewContainer mavContainer,
      NativeWebRequest webRequest,
      WebDataBinderFactory binderFactory) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new UnauthenticatedException("Usuário não autenticado.");
    }
    Object principal = authentication.getPrincipal();
    if (principal instanceof AuthenticatedUser authenticatedUser && authenticatedUser.id() != null) {
      return authenticatedUser.id();
    }
    throw new UnauthenticatedException("Usuário não autenticado.");
  }
}
