package com.habitparty.core.exceptions;

public class RewardLimitExceededException extends RuntimeException {
  public RewardLimitExceededException(String message) {
    super(message);
  }
}
