package com.habitparty.adapters.out.email;

import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.EmailSenderPort;

@Component
public class ResendEmailAdapter implements EmailSenderPort {
  private static final Logger log = LoggerFactory.getLogger(ResendEmailAdapter.class);
  private final HttpClient httpClient;
  private final String apiKey;
  private final String fromEmail;
  private final String frontendUrl;

  public ResendEmailAdapter(
      @Value("${resend.api.key:}") String apiKey,
      @Value("${resend.api.from:HabitParty <onboarding@resend.dev>}") String fromEmail,
      @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
    this.apiKey = apiKey != null ? apiKey.trim() : "";
    this.fromEmail = fromEmail != null ? fromEmail.trim() : "HabitParty <onboarding@resend.dev>";
    this.frontendUrl = frontendUrl != null ? frontendUrl.trim() : "http://localhost:3000";
    this.httpClient = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .proxy(ProxySelector.getDefault())
        .followRedirects(HttpClient.Redirect.NORMAL)
        .connectTimeout(Duration.ofSeconds(20))
        .build();
  }

  @Override
  public boolean sendPasswordResetEmail(String toEmail, String resetLink) {
    if (apiKey.isEmpty() || apiKey.startsWith("re_sua_chave")) {
      log.warn("================================================================================");
      log.warn("[ResendEmailAdapter] RESEND_API_KEY não configurada ou com valor placeholder.");
      log.warn("[Simulação de E-mail de Recuperação]");
      log.warn("Destinatário: {}", toEmail);
      log.warn("Link de Redefinição: {}", resetLink);
      log.warn("================================================================================");
      return true;
    }

    try {
      String htmlContent = """
          <div style="font-family: Arial, sans-serif; background-color: #0b021d; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #ffd700; margin-top: 0; text-align: center;">HabitParty</h2>
            <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Olá,</p>
            <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Você solicitou a recuperação de senha da sua conta HabitParty.</p>
            <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Clique no botão abaixo para cadastrar uma nova senha (link válido por 15 minutos):</p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="%s" style="background-color: #ffd700; color: #0b021d; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Redefinir Minha Senha</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.4;">Se você não realizou esta solicitação, desconsidere esta mensagem. Sua conta permanece segura.</p>
          </div>
          """.formatted(resetLink);

      // Constrói o JSON escapando as aspas de forma segura
      String jsonBody = """
          {
            "from": %s,
            "to": [%s],
            "subject": "Recuperação de Senha - HabitParty",
            "html": %s
          }
          """.formatted(
              escapeJsonString(fromEmail),
              escapeJsonString(toEmail),
              escapeJsonString(htmlContent)
          );

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://api.resend.com/emails"))
          .timeout(Duration.ofSeconds(15))
          .header("Authorization", "Bearer " + apiKey)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        log.info("[ResendEmailAdapter] E-mail de recuperação enviado com sucesso para: {}", toEmail);
        return true;
      } else {
        log.error("[ResendEmailAdapter] Falha ao enviar e-mail via Resend. Status: {}, Resposta: {}", response.statusCode(), response.body());
        return false;
      }
    } catch (Exception e) {
      log.error("[ResendEmailAdapter] Erro inesperado ao tentar disparar e-mail via Resend", e);
      return false;
    }
  }

  @Override
  public boolean sendTaskReminderEmail(String toEmail, String userName, String taskTitle, LocalDate dueDate, boolean isHardcore) {
    if (apiKey.isEmpty() || apiKey.startsWith("re_sua_chave")) {
      log.warn("================================================================================");
      log.warn("[ResendEmailAdapter] RESEND_API_KEY não configurada ou com valor placeholder.");
      log.warn("[Simulação de Lembrete de Tarefa]");
      log.warn("Destinatário: {} ({})", toEmail, userName);
      log.warn("Tarefa: {} | Prazo: {} | Modo Hardcore: {}", taskTitle, dueDate, isHardcore);
      log.warn("================================================================================");
      return true;
    }

    try {
      String greetingName = (userName != null && !userName.isBlank()) ? userName : "Aventureiro(a)";
      String formattedDate = dueDate != null
          ? dueDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
          : "Sem prazo definido";

      String hardcoreBadge = isHardcore
          ? """
            <div style="background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; margin: 16px 0; color: #f87171;">
              <strong>⚠️ Modo Hardcore Ativo:</strong> Esta tarefa possui penalidade de 50% de moedas e XP se não for concluída dentro do prazo!
            </div>
            """
          : "";

      String tasksUrl = frontendUrl + "/dashboard";

      String htmlContent = """
          <div style="font-family: Arial, sans-serif; background-color: #0b021d; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 520px; margin: 0 auto; border: 1px solid rgba(255, 215, 0, 0.2);">
            <h2 style="color: #ffd700; margin-top: 0; text-align: center;">⏰ Lembrete de Tarefa - HabitParty</h2>
            <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Olá, <strong>%s</strong>!</p>
            <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Este é um lembrete programado para a sua tarefa pendente:</p>
            
            <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0;">
              <h3 style="color: #ffd700; margin: 0 0 8px 0; font-size: 18px;">%s</h3>
              <p style="margin: 0; font-size: 14px; color: #cbd5e1;">📅 Prazo de entrega: <strong>%s</strong></p>
            </div>

            %s

            <div style="margin: 28px 0; text-align: center;">
              <a href="%s" style="background-color: #ffd700; color: #0b021d; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Acessar HabitParty e Concluir</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; text-align: center;">Você está recebendo este e-mail porque solicitou lembrete para esta tarefa no HabitParty.</p>
          </div>
          """.formatted(greetingName, taskTitle, formattedDate, hardcoreBadge, tasksUrl);

      String subject = isHardcore
          ? "⚠️ [URGENTE HabitParty] Lembrete da sua tarefa hardcore: " + taskTitle
          : "⏰ [Lembrete HabitParty] Sua tarefa está aguardando: " + taskTitle;

      String jsonBody = """
          {
            "from": %s,
            "to": [%s],
            "subject": %s,
            "html": %s
          }
          """.formatted(
              escapeJsonString(fromEmail),
              escapeJsonString(toEmail),
              escapeJsonString(subject),
              escapeJsonString(htmlContent)
          );

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://api.resend.com/emails"))
          .timeout(Duration.ofSeconds(15))
          .header("Authorization", "Bearer " + apiKey)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        log.info("[ResendEmailAdapter] Lembrete de tarefa enviado com sucesso para: {}", toEmail);
        return true;
      } else {
        log.error("[ResendEmailAdapter] Falha ao enviar lembrete via Resend. Status: {}, Resposta: {}", response.statusCode(), response.body());
        return false;
      }
    } catch (Exception e) {
      log.error("[ResendEmailAdapter] Erro inesperado ao tentar disparar lembrete via Resend", e);
      return false;
    }
  }

  private String escapeJsonString(String text) {
    if (text == null) return "\"\"";
    StringBuilder sb = new StringBuilder("\"");
    for (char c : text.toCharArray()) {
      switch (c) {
        case '"' -> sb.append("\\\"");
        case '\\' -> sb.append("\\\\");
        case '\b' -> sb.append("\\b");
        case '\f' -> sb.append("\\f");
        case '\n' -> sb.append("\\n");
        case '\r' -> sb.append("\\r");
        case '\t' -> sb.append("\\t");
        default -> {
          if (c < ' ') {
            String t = "000" + Integer.toHexString(c);
            sb.append("\\u").append(t.substring(t.length() - 4));
          } else {
            sb.append(c);
          }
        }
      }
    }
    sb.append("\"");
    return sb.toString();
  }
}
