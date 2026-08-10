package com.habitparty.application.ports;

public interface PasswordHasherPort {
  // Pega a senha em texto puro e devolve o Hash embaralhado
  String encode(String rawPassword);

  // Compara se a senha digitada bate com o Hash salvo no banco
  boolean matches(String rawPassword, String encodedPassword);
}
