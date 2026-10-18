package com.habitparty.application.ports;

import java.io.Writer;
import java.util.UUID;

public interface TransactionCsvExporterPort {
  void exportTransactions(UUID userId, Writer writer);
}
