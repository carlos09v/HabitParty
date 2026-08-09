package com.habitparty.core.exceptions;

public class WorkspaceNotFoundExeption extends RuntimeException {
  
  // recebe a mensagem de erro e repassa para a classe pai do Java (super)
  public WorkspaceNotFoundExeption(String message) {
    super(message);
  }
}
