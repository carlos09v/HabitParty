package com.habitparty.core.exceptions;

public class UserNotFoundException extends RuntimeException {

  // recebe a mensagem de erro e repassa para a classe pai do Java (super)
  public UserNotFoundException(String message) {
    super(message);
  }
}
