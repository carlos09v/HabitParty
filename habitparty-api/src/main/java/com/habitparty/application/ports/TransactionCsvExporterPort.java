package com.habitparty.application.ports;

import java.io.Writer;
import java.util.function.IntFunction;

import org.springframework.data.domain.Page;

import com.habitparty.core.domain.entities.TransactionHistory;

public interface TransactionCsvExporterPort {
  void exportTransactions(IntFunction<Page<TransactionHistory>> pageProvider, Writer writer);
}
