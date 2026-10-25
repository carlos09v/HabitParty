import { DatePicker } from "@/components/ui/DatePicker";

interface TaskDatePickerProps {
  dueDate: string;
  onDateChange: (newDate: string) => void;
  disabled?: boolean;
}

/**
 * Seletor rápido de data para o cabeçalho de detalhes de tarefas To-Do.
 * Reutiliza o DatePicker universal do projeto com a variante "badge", garantindo consistência visual e zero duplicação de lógica.
 */
export function TaskDatePicker({
  dueDate,
  onDateChange,
  disabled = false,
}: TaskDatePickerProps) {
  return (
    <div
      title={
        disabled ? "Data congelada: prazo expirado no Modo Hardcore" : undefined
      }
    >
      <DatePicker
        value={dueDate}
        onChange={onDateChange}
        variant="badge"
        allowClear={!disabled}
        disabled={disabled}
      />
    </div>
  );
}
