package com.habitparty.infrastructure;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.flywaydb.core.api.callback.Callback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class FlywayV6RepairConfig {

  @Bean
  public Callback flywayV6ConsolidationCallback() {
    return new Callback() {
      @Override
      public boolean supports(Event event, Context context) {
        return event == Event.BEFORE_VALIDATE || event == Event.BEFORE_MIGRATE;
      }

      @Override
      public boolean canHandleInTransaction(Event event, Context context) {
        return true;
      }

      @Override
      public void handle(Event event, Context context) {
        try {
          Connection conn = context.getConnection();
          if (!tableExists(conn, "flyway_schema_history")) {
            return;
          }
          boolean partialV6 = !tableExists(conn, "achievements");
          // V6 consolidada recebeu o catálogo expandido (63 conquistas) e novos contadores em user_stats.
          // Bancos locais que já rodaram a V6 antiga são detectados pela ausência da coluna nova e reaplicam
          // a V6 inteira (todas as instruções são idempotentes: IF NOT EXISTS / ON CONFLICT DO UPDATE).
          boolean outdatedV6 = !partialV6
              && !columnExists(conn, "user_stats", "total_activity_goals_met");
          if (partialV6 || outdatedV6) {
            try (PreparedStatement ps = conn.prepareStatement(
                "DELETE FROM flyway_schema_history WHERE version = '6'")) {
              int removed = ps.executeUpdate();
              if (removed > 0) {
                log.info(partialV6
                    ? "Migração V6 parcial detectada sem tabela 'achievements'. Reaplicando V6 consolidada..."
                    : "Migração V6 desatualizada detectada (catálogo expandido de conquistas). Reaplicando V6 consolidada...");
              }
            }
          }
        } catch (Exception e) {
          log.debug("Verificação pré-migração V6 ignorada: {}", e.getMessage());
        }
      }

      @Override
      public String getCallbackName() {
        return "flywayV6ConsolidationCallback";
      }
    };
  }

  private boolean columnExists(Connection conn, String tableName, String columnName) throws Exception {
    try (PreparedStatement ps = conn.prepareStatement(
        "SELECT 1 FROM information_schema.columns WHERE LOWER(table_name) = LOWER(?) AND LOWER(column_name) = LOWER(?)")) {
      ps.setString(1, tableName);
      ps.setString(2, columnName);
      try (ResultSet rs = ps.executeQuery()) {
        return rs.next();
      }
    }
  }

  private boolean tableExists(Connection conn, String tableName) throws Exception {
    try (PreparedStatement ps = conn.prepareStatement(
        "SELECT 1 FROM information_schema.tables WHERE LOWER(table_name) = LOWER(?)")) {
      ps.setString(1, tableName);
      try (ResultSet rs = ps.executeQuery()) {
        return rs.next();
      }
    }
  }
}
