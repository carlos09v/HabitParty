package com.habitparty.application.usecases.transaction;

import java.io.Writer;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TransactionCsvExporterPort;

@Service
public class ExportTransactionsCsvUseCase {
  private final TransactionCsvExporterPort exporterPort;

  public ExportTransactionsCsvUseCase(TransactionCsvExporterPort exporterPort) {
    this.exporterPort = exporterPort;
  }

  public void execute(UUID userId, Writer writer) {
    exporterPort.exportTransactions(userId, writer);
  }
}
