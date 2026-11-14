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
import org.springframework.data.domain.PageImpl;

import com.habitparty.adapters.in.web.dtos.response.TransactionHistoryResponseDTO;
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
    adapter.exportTransactions(page -> new PageImpl<>(List.of(tx)), writer, tokyoZone);

    String csv = writer.toString();
    assertTrue(csv.contains(expectedFormatted), () -> "CSV esperado com horário convertido: " + expectedFormatted + "\nObtido:\n" + csv);

    TransactionHistoryResponseDTO dto = TransactionHistoryResponseDTO.fromDomain(tx, tokyoZone);
    assertEquals(OffsetDateTime.of(expectedTokyoTime, ZoneOffset.ofHours(9)), dto.createdAt());
  }
}
