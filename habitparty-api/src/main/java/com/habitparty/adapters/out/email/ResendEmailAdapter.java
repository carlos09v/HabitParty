package com.habitparty.adapters.out.email;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.infrastructure.ExternalHttpClientConfig;

import tools.jackson.databind.json.JsonMapper;

@Component
public class ResendEmailAdapter implements EmailSenderPort {
  private static final Logger log = LoggerFactory.getLogger(ResendEmailAdapter.class);
  private static final String RESEND_API_URL = "https://api.resend.com/emails";
  private static final DateTimeFormatter BR_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

  private final RestClient restClient;
  private final JsonMapper jsonMapper;
  private final String apiKey;
  private final String fromEmail;
  private final String frontendUrl;
  private final boolean devSimulate;

  private record ResendEmailPayload(String from, List<String> to, String subject, String html) {}

  private record HttpCallResult(int statusCode, String body) {}

  @Autowired
  public ResendEmailAdapter(
      @Value("${resend.api.key:}") String apiKey,
      @Value("${resend.api.from:HabitParty <onboarding@resend.dev>}") String fromEmail,
      @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl,
      @Value("${resend.dev-simulate:false}") boolean devSimulate,
      @Qualifier(ExternalHttpClientConfig.EXTERNAL_REST_CLIENT_BEAN) @Nullable RestClient externalRestClient,
      @Nullable JsonMapper jsonMapper) {
    this.apiKey = apiKey != null ? apiKey.trim() : "";
    this.fromEmail = fromEmail != null ? fromEmail.trim() : "HabitParty <onboarding@resend.dev>";
    this.frontendUrl = frontendUrl != null ? frontendUrl.trim() : "http://localhost:3000";
    this.devSimulate = devSimulate;
    this.restClient = externalRestClient != null ? externalRestClient : buildFallbackRestClient();
    this.jsonMapper = jsonMapper != null ? jsonMapper : JsonMapper.builder().build();
  }

  public ResendEmailAdapter(
      String apiKey,
      String fromEmail,
      String frontendUrl,
      boolean devSimulate) {
    this(apiKey, fromEmail, frontendUrl, devSimulate, null, null);
  }

  private static RestClient buildFallbackRestClient() {
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
    factory.setReadTimeout(Duration.ofSeconds(15));
    return RestClient.builder().requestFactory(factory).build();
  }

  private boolean isApiKeyUnconfigured() {
    return apiKey.isEmpty() || apiKey.startsWith("re_sua_chave");
  }

  private static String redactUrlToken(String link) {
    if (link == null || link.isBlank()) {
      return "<vazio>";
    }
    int queryIdx = link.indexOf('?');
    return queryIdx >= 0 ? link.substring(0, queryIdx) + "?token=[REDACTED]" : link;
  }

  @Override
  public boolean sendPasswordResetEmail(String toEmail, String resetLink) {
    if (isApiKeyUnconfigured()) {
      if (devSimulate) {
        log.warn("[ResendEmailAdapter] Modo simulação ativo — e-mail de recuperação para {} ({})",
            toEmail, redactUrlToken(resetLink));
        return true;
      }
      log.error("[ResendEmailAdapter] RESEND_API_KEY não configurada; envio de recuperação bloqueado para {}", toEmail);
      return false;
    }

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
        """.formatted(escapeHtml(resetLink));

    return sendEmail(
        toEmail,
        "Recuperação de Senha - HabitParty",
        htmlContent,
        "e-mail de recuperação");
  }

  @Override
  public boolean sendEmailVerificationEmail(String toEmail, String userName, String verificationLink) {
    if (isApiKeyUnconfigured()) {
      if (devSimulate) {
        log.warn("[ResendEmailAdapter] Modo simulação ativo — e-mail de verificação para {} ({})",
            toEmail, redactUrlToken(verificationLink));
        return true;
      }
      log.error("[ResendEmailAdapter] RESEND_API_KEY não configurada; envio de verificação bloqueado para {}", toEmail);
      return false;
    }

    String greetingName = (userName != null && !userName.isBlank()) ? userName : "Aventureiro(a)";
    String htmlContent = """
        <div style="font-family: Arial, sans-serif; background-color: #0b021d; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 520px; margin: 0 auto; border: 1px solid rgba(255, 215, 0, 0.25);">
          <h2 style="color: #ffd700; margin-top: 0; text-align: center;">🛡️ Confirme seu E-mail - HabitParty</h2>
          <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Olá, <strong>%s</strong>!</p>
          <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Bem-vindo(a) ao HabitParty! Confirme seu endereço de e-mail clicando no botão abaixo para garantir a segurança da sua conta e liberar recursos como lembretes por e-mail, alteração de senha e assinatura de planos:</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="%s" style="background-color: #ffd700; color: #0b021d; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Confirmar Meu E-mail</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; text-align: center;">Este link é válido por 24 horas. Se você não criou uma conta no HabitParty, ignore esta mensagem.</p>
        </div>
        """.formatted(
            escapeHtml(greetingName),
            escapeHtml(verificationLink)
        );

    return sendEmail(
        toEmail,
        "Confirme seu e-mail - HabitParty",
        htmlContent,
        "e-mail de verificação");
  }

  @Override
  public boolean sendTaskReminderEmail(String toEmail, String userName, String taskTitle, LocalDate dueDate, boolean isHardcore) {
    if (isApiKeyUnconfigured()) {
      if (devSimulate) {
        log.warn("[ResendEmailAdapter] Modo simulação ativo — lembrete de tarefa para {} (prazo: {}, hardcore: {})",
            toEmail, dueDate, isHardcore);
        return true;
      }
      log.error("[ResendEmailAdapter] RESEND_API_KEY não configurada; envio de lembrete bloqueado para {}", toEmail);
      return false;
    }

    String greetingName = (userName != null && !userName.isBlank()) ? userName : "Aventureiro(a)";
    String formattedDate = dueDate != null
        ? dueDate.format(BR_DATE_FORMATTER)
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
        """.formatted(
            escapeHtml(greetingName),
            escapeHtml(taskTitle),
            escapeHtml(formattedDate),
            hardcoreBadge,
            escapeHtml(tasksUrl)
        );

    String subject = isHardcore
        ? "⚠️ [URGENTE HabitParty] Lembrete da sua tarefa hardcore: " + taskTitle
        : "⏰ [Lembrete HabitParty] Sua tarefa está aguardando: " + taskTitle;

    return sendEmail(toEmail, subject, htmlContent, "lembrete de tarefa");
  }

  private boolean sendEmail(String toEmail, String subject, String htmlContent, String contextLabel) {
    try {
      String jsonBody = jsonMapper.writeValueAsString(
          new ResendEmailPayload(fromEmail, List.of(toEmail), subject, htmlContent));
      String idempotencyKey = UUID.randomUUID().toString();

      HttpCallResult response = restClient.post()
          .uri(RESEND_API_URL)
          .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
          .header("Idempotency-Key", idempotencyKey)
          .contentType(MediaType.APPLICATION_JSON)
          .body(jsonBody)
          .exchange((req, res) -> new HttpCallResult(
              res.getStatusCode().value(),
              new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8)));

      if (response != null && response.statusCode() >= 200 && response.statusCode() < 300) {
        log.info("[ResendEmailAdapter] {} enviado com sucesso para: {}", contextLabel, toEmail);
        return true;
      }
      int status = response != null ? response.statusCode() : -1;
      String body = response != null ? response.body() : "<vazio>";
      log.error("[ResendEmailAdapter] Falha ao enviar {} via Resend. Status: {}, Resposta: {}",
          contextLabel, status, body);
      return false;
    } catch (Exception e) {
      log.error("[ResendEmailAdapter] Erro inesperado ao tentar disparar {} via Resend", contextLabel, e);
      return false;
    }
  }

  private static String escapeHtml(String text) {
    if (text == null) {
      return "";
    }
    return text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }
}
