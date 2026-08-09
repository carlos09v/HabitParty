package com.habitparty.core.exceptions;

public class BoardColumnNotFoundException extends RuntimeException{
  public BoardColumnNotFoundException(String message) {
    super(message);
  }
}
