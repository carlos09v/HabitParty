package com.habitparty.core.exceptions;

public class WorkspaceLimitExceededException extends RuntimeException {
    public WorkspaceLimitExceededException(String message) {
        super(message);
    }
}