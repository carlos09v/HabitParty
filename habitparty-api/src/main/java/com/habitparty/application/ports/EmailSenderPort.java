package com.habitparty.application.ports;

import java.time.LocalDate;

public interface EmailSenderPort {
  boolean sendPasswordResetEmail(String toEmail, String resetLink);
  boolean sendTaskReminderEmail(String toEmail, String userName, String taskTitle, LocalDate dueDate, boolean isHardcore);
}
