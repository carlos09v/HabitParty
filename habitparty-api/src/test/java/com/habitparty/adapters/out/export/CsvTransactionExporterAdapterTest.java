package com.habitparty.adapters.out.export;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryResponseDTO;
import com.habitparty.application.ports.TransactionCsvExporterPort;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.enums.TransactionType;

class CsvTransactionExporterAdapterTest {

  @Test
  @DisplayName("CSV e DTO de histórico devem converter createdAt para o fuso horário do usuário")
  void convertsTransactionTimestampToUserTimezoneInCsvAndDto() {
    CsvTransactionExporterAdapter adapter = new CsvTransactionExporterAdapter();
    ZoneId tokyoZone = ZoneId.of("Asia/Tokyo");

    // 2026-11-13 23:00:00 no fuso local do servidor -> convertido para Asia/Tokyo (+09:00)
    LocalDateTime serverCreatedAt = LocalDateTime.of(2026, 11, 13, 23, 0, 0);
    LocalDateTime expectedTokyoTime = serverCreatedAt
        .atZone(ZoneId.systemDefault())
        .withZoneSameInstant(tokyoZone)
        .toLocalDateTime();
    String expectedFormatted = String.format(
        "%02d/%02d/%04d %02d:%02d:%02d",
        expectedTokyoTime.getDayOfMonth(),
        expectedTokyoTime.getMonthValue(),
        expectedTokyoTime.getYear(),
        expectedTokyoTime.getHour(),
        expectedTokyoTime.getMinute(),
        expectedTokyoTime.getSecond());

    TransactionHistory tx = new TransactionHistory(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        new BigDecimal("2.50"),
        15,
        null,
        TransactionType.TASK_COMPLETED,
        "Ler livro",
        null,
        null,
        null,
        null,
        null,
        serverCreatedAt);

    StringWriter writer = new StringWriter();
    adapter.exportTransactionsKeyset(
        (cursorCreatedAt, cursorId) -> cursorId == null ? List.of(tx) : List.of(),
        500,
        TransactionCsvExporterPort.CsvExportOptions.defaults(tokyoZone),
        writer,
        null);

    String csv = writer.toString();
    assertTrue(csv.contains(expectedFormatted), () -> "CSV esperado com horário convertido: " + expectedFormatted + "\nObtido:\n" + csv);

    TransactionHistoryResponseDTO dto = TransactionHistoryResponseDTO.fromDomain(tx, tokyoZone);
    assertEquals(OffsetDateTime.of(expectedTokyoTime, ZoneOffset.ofHours(9)), dto.createdAt());
  }

  @Test
  @DisplayName("CSV deve exportar transações DEBT_PAID com a descrição Dívida Paga e filtro SHOPPING deve incluí-las")
  void exportsDebtPaidDescriptionInCsvAndIncludesInShoppingTab() {
    CsvTransactionExporterAdapter adapter = new CsvTransactionExporterAdapter();
    TransactionHistory debtTx = new TransactionHistory(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        new BigDecimal("-12.00"),
        0,
        new BigDecimal("12.00"),
        TransactionType.DEBT_PAID,
        "Tocar violão",
        "music",
        null,
        null,
        List.of(),
        LocalDateTime.of(2026, 11, 21, 10, 0, 0));

    StringWriter writer = new StringWriter();
    adapter.exportTransactionsKeyset(
        (cursorCreatedAt, cursorId) -> cursorId == null ? List.of(debtTx) : List.of(),
        500,
        TransactionCsvExporterPort.CsvExportOptions.defaults(ZoneId.of("UTC")),
        writer,
        null);

    String csv = writer.toString();
    assertTrue(csv.contains("Dívida Paga"), () -> "Esperado 'Dívida Paga' no CSV:\n" + csv);
    assertTrue(com.habitparty.application.usecases.transaction.ListUserTransactionsUseCase
        .resolveTypesForTab("SHOPPING")
        .containsAll(List.of(TransactionType.REWARD_BOUGHT, TransactionType.DEBT_PAID)));
  }

  @Test
  @DisplayName("CSV deve respeitar o teto maxRows e converter datas usando storageZone configurado")
  void respectsMaxRowsSafetyCapAndStorageZone() {
    CsvTransactionExporterAdapter adapter = new CsvTransactionExporterAdapter();
    TransactionHistory tx1 = new TransactionHistory(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        new BigDecimal("1.00"), 5, null, TransactionType.TASK_COMPLETED,
        "Item 1", null, null, null, null, null, LocalDateTime.of(2026, 11, 21, 12, 0, 0));
    TransactionHistory tx2 = new TransactionHistory(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        new BigDecimal("2.00"), 10, null, TransactionType.TASK_COMPLETED,
        "Item 2", null, null, null, null, null, LocalDateTime.of(2026, 11, 21, 13, 0, 0));

    StringWriter writer = new StringWriter();
    var options = new TransactionCsvExporterPort.CsvExportOptions(
        ZoneId.of("America/Sao_Paulo"),
        java.util.Locale.forLanguageTag("pt-BR"),
        com.habitparty.core.domain.enums.UserExperienceMode.GAMIFIED,
        "DD/MM/YYYY",
        "24h",
        ZoneId.of("UTC"),
        1);

    adapter.exportTransactionsKeyset(
        (cursorCreatedAt, cursorId) -> cursorId == null ? List.of(tx1, tx2) : List.of(),
        2,
        options,
        writer,
        null);

    String csv = writer.toString();
    assertTrue(csv.contains("Item 1"));
    assertTrue(csv.contains("21/11/2026 09:00:00"), () -> "Esperado 09:00:00 (UTC->Sao_Paulo):\n" + csv);
    assertTrue(!csv.contains("Item 2"), () -> "Não deveria exceder maxRows=1:\n" + csv);
  }
}
