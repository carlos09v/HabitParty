package com.habitparty.core.domain.entities.auth;

import java.util.Locale;
import java.util.Set;

import com.habitparty.core.exceptions.DomainValidationException;

/**
 * Validador de domínio contra provedores de e-mail temporários/descartáveis (Anti-Bot / Anti-Spam).
 */
public final class DisposableEmailValidator {

  private static final Set<String> DISPOSABLE_DOMAINS = Set.of(
      "10minutemail.com",
      "10minutemail.net",
      "tempmail.com",
      "temp-mail.org",
      "temp-mail.io",
      "guerrillamail.com",
      "guerrillamailblock.com",
      "sharklasers.com",
      "grr.la",
      "yopmail.com",
      "yopmail.fr",
      "yopmail.net",
      "mailinator.com",
      "maildrop.cc",
      "trashmail.com",
      "trashmail.net",
      "getnada.com",
      "nada.email",
      "mohmal.com",
      "dispostable.com",
      "fakeinbox.com",
      "throwawaymail.com",
      "mailnesia.com",
      "mintemail.com",
      "mytemp.email",
      "emailondeck.com",
      "tempail.com",
      "tuamaeaquelaursa.com",
      "invertexto.com"
  );

  private DisposableEmailValidator() {
  }

  public static boolean isDisposable(String email) {
    if (email == null || !email.contains("@")) {
      return false;
    }
    String domain = email.substring(email.lastIndexOf('@') + 1).trim().toLowerCase(Locale.ROOT);
    while (domain.endsWith(".")) {
      domain = domain.substring(0, domain.length() - 1);
    }
    if (domain.isEmpty()) {
      return false;
    }
    String candidate = domain;
    while (true) {
      if (DISPOSABLE_DOMAINS.contains(candidate)) {
        return true;
      }
      int dotIdx = candidate.indexOf('.');
      if (dotIdx < 0 || dotIdx == candidate.length() - 1) {
        return false;
      }
      candidate = candidate.substring(dotIdx + 1);
    }
  }

  public static void validate(String email) {
    if (email == null || email.isBlank() || !email.contains("@")) {
      throw new DomainValidationException("Informe um endereço de e-mail válido.");
    }
    if (isDisposable(email)) {
      throw new DomainValidationException(
          "E-mails temporários ou descartáveis não são permitidos. Utilize um endereço de e-mail permanente.");
    }
  }
}
