package com.habitparty.application.usecases.transaction_history;

import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.TransactionHistory;

@Service
public class ExportTransactionsCsvUseCase {
  private final TransactionHistoryRepository port;

    public ExportTransactionsCsvUseCase(TransactionHistoryRepository port) {
        this.port = port;
    }

    public void execute(UUID userId, PrintWriter writer) {
        // Formata a data para o padrão brasileiro que o usuário vai entender ao ler
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        // Configura o construtor do CSV
        CSVFormat format = CSVFormat.EXCEL.builder()
                .setHeader("Nome", "Ouro", "XP", "Tipo", "Preço Original", "Data")
                .setDelimiter(';') // Ponto e vírgula é melhor para Excel no Brasil
                .get();

        // O bloco try-with-resources garante que o printer vai ser fechado e enviado (flush) ao final
        try (CSVPrinter printer = new CSVPrinter(writer, format)) {
            
            int page = 0;
            int size = 500; // Puxa 500 registros por vez para economizar memória
            Page<TransactionHistory> transactionPage;

            do {
                // Busca a página atual no banco de dados
                transactionPage = port.findAllByUserId(userId, page, size);

                // Itera sobre as transações daquela página e imprime a linha
                for (TransactionHistory tx : transactionPage.getContent()) {
                    printer.printRecord(
                        tx.getNameSnapshot(),                                  // Nome
                        tx.getGoldAmount().map(g -> g.toString()).orElse("0"), // Ouro
                        tx.getXpAmount(),                                      // XP
                        tx.getTransactionType().name(),                        // Type
                        tx.getPriceSnapshot().map(p -> p.toString()).orElse(""), // PriceSnapshot (vazio se for nulo)
                        tx.getCreatedAt().format(dateFormatter)        
                    );
                }
                
                // Força o envio dos dados desta página para a rede (evita acumular no buffer)
                printer.flush();
                
                page++; // Avança para a próxima página no banco
                
            } while (transactionPage.hasNext()); // Repete enquanto houver mais páginas no banco
            
        } catch (Exception e) {
            // Em caso de erro na geração, lança uma exceção de sistema
            throw new RuntimeException("Erro ao gerar a exportação CSV do extrato.", e);
        }
    }
}
