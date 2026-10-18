package com.habitparty.adapters.out.export;

import java.io.Writer;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.TransactionCsvExporterPort;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

@Component
public class CsvTransactionExporterAdapter implements TransactionCsvExporterPort {
  private final TransactionHistoryRepository port;

  public CsvTransactionExporterAdapter(TransactionHistoryRepository port) {
    this.port = port;
  }

  @Override
  public void exportTransactions(UUID userId, Writer writer) {
    DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    CSVFormat format = CSVFormat.EXCEL.builder()
        .setHeader("Nome", "Ouro", "XP", "Tipo", "Dificuldade", "Preço Original", "Data")
        .setDelimiter(';')
        .get();

    try (CSVPrinter printer = new CSVPrinter(writer, format)) {
      int page = 0;
      int size = 500;
      Page<TransactionHistory> transactionPage;

      do {
        transactionPage = port.findAllByUserId(userId, page, size);

        for (TransactionHistory tx : transactionPage.getContent()) {
          printer.printRecord(
              tx.getNameSnapshot(),
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
}
