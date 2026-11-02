package com.habitparty.adapters.out.export;

import java.io.Writer;
import java.time.format.DateTimeFormatter;
import java.util.function.IntFunction;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.TransactionCsvExporterPort;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

@Component
public class CsvTransactionExporterAdapter implements TransactionCsvExporterPort {

  @Override
  public void exportTransactions(IntFunction<Page<TransactionHistory>> pageProvider, Writer writer) {
    DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    CSVFormat format = CSVFormat.EXCEL.builder()
        .setHeader("Nome", "Ouro", "XP", "Tipo", "Dificuldade", "Preço Original", "Data")
        .setDelimiter(';')
        .get();

    try (CSVPrinter printer = new CSVPrinter(writer, format)) {
      int page = 0;
      Page<TransactionHistory> transactionPage;

      do {
        transactionPage = pageProvider.apply(page);

        for (TransactionHistory tx : transactionPage.getContent()) {
          printer.printRecord(
              sanitizeCsvCell(tx.getNameSnapshot()),
              tx.getGoldAmount().map(Object::toString).orElse("0"),
              tx.getXpAmount(),
              tx.getTransactionType().getDescription(),
              tx.getDifficultySnapshot().map(TaskDifficulty::getDescription).orElse("-"),
              tx.getPriceSnapshot().map(Object::toString).orElse(""),
              tx.getCreatedAt().format(dateFormatter)
          );
        }

        printer.flush();
        page++;
      } while (transactionPage.hasNext());

    } catch (Exception e) {
      throw new RuntimeException("Erro ao gerar a exportação CSV do extrato.", e);
    }
  }

  private static String sanitizeCsvCell(String value) {
    if (value == null || value.isEmpty()) {
      return "";
    }
    char first = value.charAt(0);
    if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
      return "'" + value;
    }
    return value;
  }
}
