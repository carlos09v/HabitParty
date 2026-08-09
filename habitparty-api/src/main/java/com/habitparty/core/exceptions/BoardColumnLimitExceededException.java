package com.habitparty.core.exceptions;

public class BoardColumnLimitExceededException extends RuntimeException {
  public BoardColumnLimitExceededException(String message) {
    super(message);
  }
}
