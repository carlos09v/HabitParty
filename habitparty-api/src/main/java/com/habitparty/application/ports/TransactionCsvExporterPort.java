package com.habitparty.application.ports;

import java.io.Writer;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.function.BiFunction;

import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.UserExperienceMode;

public interface TransactionCsvExporterPort {

  record CsvExportOptions(
      ZoneId userZone,
      Locale locale,
      UserExperienceMode experienceMode,
      String dateFormat,
      String timeFormat,
      ZoneId storageZone,
      int maxRows) {
    public CsvExportOptions(
        ZoneId userZone,
        Locale locale,
        UserExperienceMode experienceMode,
        String dateFormat,
        String timeFormat) {
      this(userZone, locale, experienceMode, dateFormat, timeFormat, ZoneId.systemDefault(), 0);
    }

    public static CsvExportOptions defaults(ZoneId userZone) {
      return new CsvExportOptions(
          userZone != null ? userZone : ZoneId.systemDefault(),
          Locale.forLanguageTag("pt-BR"),
          UserExperienceMode.GAMIFIED,
          null,
          null,
          ZoneId.systemDefault(),
          0);
    }
  }

  /**
   * Exporta transações em streaming usando paginação por keyset cursor.
   * O callback {@code onBeforeWriteFirstByte} é invocado somente após o primeiro lote ser carregado
   * com sucesso, evitando emitir cabeçalhos HTTP 200/BOM em caso de falha na consulta.
   */
  void exportTransactionsKeyset(
      BiFunction<LocalDateTime, UUID, List<TransactionHistory>> cursorBatchProvider,
      int batchSize,
      CsvExportOptions options,
      Writer writer,
      Runnable onBeforeWriteFirstByte);
}
