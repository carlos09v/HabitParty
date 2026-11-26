package com.habitparty.adapters.out.export;

import java.io.Writer;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.function.BiFunction;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.TransactionCsvExporterPort;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

@Component
public class CsvTransactionExporterAdapter implements TransactionCsvExporterPort {

  @Override
  public void exportTransactionsKeyset(
      BiFunction<LocalDateTime, UUID, List<TransactionHistory>> cursorBatchProvider,
      int batchSize,
      CsvExportOptions options,
      Writer writer,
      Runnable onBeforeWriteFirstByte) {
    CsvExportOptions effective = options != null ? options : CsvExportOptions.defaults(ZoneId.systemDefault());
    ZoneId effectiveStorageZone = effective.storageZone() != null ? effective.storageZone() : ZoneId.systemDefault();
    ZoneId effectiveZone = effective.userZone() != null ? effective.userZone() : effectiveStorageZone;
    int maxRows = effective.maxRows();
    boolean isEnglish = effective.locale() != null
        && effective.locale().getLanguage().toLowerCase(Locale.ROOT).startsWith("en");
    boolean isProductivity = effective.experienceMode() == UserExperienceMode.PRODUCTIVITY;

    // 1. Busca o primeiro lote ANTES de escrever qualquer byte ou cabeçalho HTTP 200/BOM
    List<TransactionHistory> batch = cursorBatchProvider.apply(null, null);

    if (onBeforeWriteFirstByte != null) {
      onBeforeWriteFirstByte.run();
    }

    char delimiter = isEnglish ? ',' : ';';
    String[] headers = buildHeaders(isEnglish, isProductivity);
    DateTimeFormatter dateFormatter = buildDateTimeFormatter(isEnglish, effective.dateFormat(), effective.timeFormat());
    DecimalFormat decimalFormat = buildDecimalFormat(isEnglish);

    CSVFormat format = CSVFormat.EXCEL.builder()
        .setHeader(headers)
        .setDelimiter(delimiter)
        .get();

    try (CSVPrinter printer = new CSVPrinter(writer, format)) {
      int safeBatchSize = Math.max(batchSize, 1);
      int writtenRows = 0;

      while (batch != null && !batch.isEmpty()) {
        for (TransactionHistory tx : batch) {
          if (maxRows > 0 && writtenRows >= maxRows) {
            break;
          }
          String formattedCreatedAt = tx.getCreatedAt() != null
              ? tx.getCreatedAt()
                  .atZone(effectiveStorageZone)
                  .withZoneSameInstant(effectiveZone)
                  .format(dateFormatter)
              : "";

          String formattedGold = formatAmount(tx.getGoldAmount().orElse(BigDecimal.ZERO), decimalFormat);
          String formattedPrice = tx.getPriceSnapshot()
              .map(price -> formatAmount(price, decimalFormat))
              .orElse("");
          String tagsJoined = tx.getTagsSnapshot()
              .filter(tags -> !tags.isEmpty())
              .map(tags -> String.join(", ", tags))
              .orElse("");

          printer.printRecord(
              sanitizeCsvCell(tx.getNameSnapshot()),
              formattedGold,
              tx.getXpAmount(),
              localizeTransactionType(tx.getTransactionType(), isEnglish, isProductivity),
              tx.getDifficultySnapshot()
                  .map(diff -> localizeDifficulty(diff, isEnglish))
                  .orElse("-"),
              sanitizeCsvCell(tx.getColumnNameSnapshot().orElse("")),
              sanitizeCsvCell(tagsJoined),
              sanitizeCsvCell(tx.getDescriptionSnapshot().orElse("")),
              formattedPrice,
              formattedCreatedAt
          );
          writtenRows++;
        }

        printer.flush();

        if ((maxRows > 0 && writtenRows >= maxRows) || batch.size() < safeBatchSize) {
          break;
        }
        TransactionHistory last = batch.get(batch.size() - 1);
        batch = cursorBatchProvider.apply(last.getCreatedAt(), last.getId());
      }
    } catch (Exception e) {
      throw new RuntimeException("Erro ao gerar a exportação CSV do extrato.", e);
    }
  }

  private static String[] buildHeaders(boolean isEnglish, boolean isProductivity) {
    if (isEnglish) {
      return isProductivity
          ? new String[]{"Name", "Credits", "Points", "Type", "Complexity", "List", "Tags", "Description", "Original Price", "Date"}
          : new String[]{"Name", "Coins", "XP", "Type", "Difficulty", "List", "Tags", "Description", "Original Price", "Date"};
    }
    return isProductivity
        ? new String[]{"Nome", "Créditos", "Pontos", "Tipo", "Complexidade", "Lista", "Tags", "Descrição", "Preço Original", "Data"}
        : new String[]{"Nome", "Moedas", "XP", "Tipo", "Dificuldade", "Lista", "Tags", "Descrição", "Preço Original", "Data"};
  }

  private static DateTimeFormatter buildDateTimeFormatter(boolean isEnglish, String dateFormat, String timeFormat) {
    String datePattern = "MM/DD/YYYY".equalsIgnoreCase(dateFormat)
        ? "MM/dd/yyyy"
        : ("YYYY-MM-DD".equalsIgnoreCase(dateFormat)
            ? "yyyy-MM-dd"
            : ("DD/MM/YYYY".equalsIgnoreCase(dateFormat)
                ? "dd/MM/yyyy"
                : (isEnglish ? "MM/dd/yyyy" : "dd/MM/yyyy")));

    String timePattern = "12h".equalsIgnoreCase(timeFormat) ? "hh:mm:ss a" : "HH:mm:ss";
    Locale fmtLocale = isEnglish ? Locale.US : Locale.forLanguageTag("pt-BR");
    return DateTimeFormatter.ofPattern(datePattern + " " + timePattern, fmtLocale);
  }

  private static DecimalFormat buildDecimalFormat(boolean isEnglish) {
    DecimalFormatSymbols symbols = new DecimalFormatSymbols(isEnglish ? Locale.US : Locale.forLanguageTag("pt-BR"));
    symbols.setDecimalSeparator(isEnglish ? '.' : ',');
    DecimalFormat df = new DecimalFormat("0.##", symbols);
    df.setGroupingUsed(false);
    return df;
  }

  private static String formatAmount(BigDecimal value, DecimalFormat df) {
    if (value == null) {
      return "0";
    }
    return df.format(value);
  }

  private static String localizeDifficulty(TaskDifficulty difficulty, boolean isEnglish) {
    if (!isEnglish) {
      return difficulty.getDescription();
    }
    return switch (difficulty) {
      case TRIVIAL -> "Trivial";
      case EASY -> "Easy";
      case MEDIUM -> "Medium";
      case HARD -> "Hard";
    };
  }

  private static String localizeTransactionType(TransactionType type, boolean isEnglish, boolean isProductivity) {
    if (type == null) {
      return "";
    }
    if (!isEnglish) {
      if (isProductivity) {
        return switch (type) {
          case HABIT_COMPLETED -> "Hábito Concluído";
          case DAILY_COMPLETED -> "Rotina Concluída";
          case TODO_COMPLETED -> "Afazer Concluído";
          case TASK_COMPLETED -> "Tarefa Concluída";
          case TASK_FAILED -> "Rotina Não Cumprida";
          case BAD_HABIT_PENALTY -> "Hábito Negativo";
          case REWARD_BOUGHT -> "Recompensa Resgatada";
          case DEBT_PAID -> "Pendência Quitada";
          case ITEM_CONSUMED -> "Item Utilizado";
          case ITEM_DISCARDED -> "Item Descartado";
          case FOCUS_COMPLETED -> "Sessão de Foco";
          case MANUAL_ADJUSTMENT -> "Ajuste Manual";
        };
      }
      return type.getDescription();
    }
    return switch (type) {
      case HABIT_COMPLETED -> "Habit Completed";
      case DAILY_COMPLETED -> isProductivity ? "Routine Completed" : "Daily Completed";
      case TODO_COMPLETED -> "To-Do Completed";
      case TASK_COMPLETED -> "Task Completed";
      case TASK_FAILED -> isProductivity ? "Routine Missed" : "Task Failed";
      case BAD_HABIT_PENALTY -> isProductivity ? "Negative Habit" : "Bad Habit Penalty";
      case REWARD_BOUGHT -> "Reward Redeemed";
      case DEBT_PAID -> "Debt Paid";
      case ITEM_CONSUMED -> "Item Used";
      case ITEM_DISCARDED -> "Item Discarded";
      case FOCUS_COMPLETED -> "Focus Session";
      case MANUAL_ADJUSTMENT -> "Manual Adjustment";
    };
  }

  static String sanitizeCsvCell(String value) {
    if (value == null || value.isEmpty()) {
      return "";
    }
    // Normaliza CR/CRLF isolado e neutraliza fórmulas no início (mesmo precedidas por espaços/tabs) e em cada linha
    String normalized = value.replace("\r\n", "\n").replace('\r', '\n');
    String[] lines = normalized.split("\n", -1);
    StringBuilder sb = new StringBuilder(normalized.length() + 4);
    for (int i = 0; i < lines.length; i++) {
      if (i > 0) {
        sb.append('\n');
      }
      String line = lines[i];
      if (startsWithFormulaTrigger(line)) {
        sb.append('\'').append(line);
      } else {
        sb.append(line);
      }
    }
    return sb.toString();
  }

  private static boolean startsWithFormulaTrigger(String line) {
    if (line == null || line.isEmpty()) {
      return false;
    }
    char first = line.charAt(0);
    if (first == '\t' || first == '\r') {
      return true;
    }
    int idx = 0;
    while (idx < line.length()) {
      char ch = line.charAt(idx);
      if (ch == ' ' || ch == '\t' || ch == '\r') {
        idx++;
        continue;
      }
      return ch == '=' || ch == '+' || ch == '-' || ch == '@' || ch == '|';
    }
    return false;
  }
}
