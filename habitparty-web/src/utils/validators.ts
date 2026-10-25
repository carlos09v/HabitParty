import { analyzePassword } from "@/components/auth/PasswordStrengthIndicator";
import type { PasswordValidationResult } from "@/types/settings";
import type { Task } from "@/types/task";
import { getTodayDateString } from "./date";

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Valida se uma nova senha atende a todas as políticas de segurança de autenticação.
 * Retorna mensagem de erro amigável pronta para exibição em toast/feedback visual.
 */
export function validateAuthPassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  const strength = analyzePassword(password);

  if (!strength.hasMinLength) {
    return {
      isValid: false,
      error: "A senha deve ter no mínimo 8 caracteres.",
    };
  }

  if (!strength.hasUpperCase) {
    return {
      isValid: false,
      error: "A senha deve conter pelo menos uma letra maiúscula.",
    };
  }

  if (!strength.hasNumberOrSpecial) {
    return {
      isValid: false,
      error:
        "A senha deve conter pelo menos um caractere especial (@$!%*?&#) ou número.",
    };
  }

  if (strength.score < 2) {
    return {
      isValid: false,
      error:
        "A senha é muito fraca. Inclua letras maiúsculas, minúsculas ou números/símbolos.",
    };
  }

  return { isValid: true };
}

/**
 * Valida os requisitos de segurança da senha e verifica se a confirmação confere.
 */
export function validatePasswordRequirements(
  newPassword: string,
  confirmPassword = "",
): PasswordValidationResult {
  const hasMinLength = newPassword.length >= PASSWORD_MIN_LENGTH;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasSpecialChar = /[@$!%*?&#]/.test(newPassword);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const isValid =
    hasMinLength && hasUpperCase && hasSpecialChar && passwordsMatch;

  return {
    hasMinLength,
    hasUpperCase,
    hasSpecialChar,
    passwordsMatch,
    isValid,
  };
}

/**
 * Idade mínima exigida para cadastro autônomo na plataforma (12 anos).
 * Em conformidade com o marco de adolescência do ECA e boas práticas da LGPD.
 */
export const MIN_USER_AGE = 12;
export const MAX_USER_AGE = 120;

/**
 * Valida se uma data de nascimento atende à idade mínima e máxima da plataforma.
 */
export function validateBirthDate(
  birthDateString: string,
  minAge: number = MIN_USER_AGE,
  maxAge: number = MAX_USER_AGE,
): { isValid: boolean; error?: string } {
  if (!birthDateString || !birthDateString.trim()) {
    return { isValid: false, error: "A data de nascimento é obrigatória." };
  }

  // Espera formato YYYY-MM-DD
  const parts = birthDateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return { isValid: false, error: "Data de nascimento inválida." };
  }

  const [year, month, day] = parts;
  const birthDate = new Date(year, month - 1, day);

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return { isValid: false, error: "Data de nascimento inválida." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthDate > today) {
    return {
      isValid: false,
      error: "A data de nascimento não pode estar no futuro.",
    };
  }

  // Cálculo preciso de idade considerando ano, mês e dia
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < minAge) {
    return {
      isValid: false,
      error: `Você precisa ter no mínimo ${minAge} anos para se cadastrar.`,
    };
  }

  if (age > maxAge) {
    return {
      isValid: false,
      error: "Por favor, insira uma data de nascimento válida.",
    };
  }

  return { isValid: true };
}

/**
 * Valida os requisitos do Modo Hardcore para afazeres (TODO).
 * Retorna mensagem de erro descritiva ou null se a configuração for válida.
 */
export function validateHardcoreTodo(options: {
  isHardcore: boolean;
  dueDate?: string;
  isEditing: boolean;
  taskToEdit?: { isHardcoreModeEnabled?: boolean; dueDate?: string } | null;
}): string | null {
  const { isHardcore, dueDate, isEditing, taskToEdit } = options;
  if (!isHardcore) return null;

  if (!dueDate) {
    return "No Modo Hardcore, afazeres exigem uma data de vencimento.";
  }

  const todayStr = getTodayDateString();

  if (!isEditing && dueDate < todayStr) {
    return "A data de vencimento de um afazer Hardcore não pode ser no passado.";
  }

  if (isEditing && taskToEdit?.isHardcoreModeEnabled && taskToEdit?.dueDate) {
    const isOverdue = taskToEdit.dueDate < todayStr;
    if (isOverdue) {
      if (!isHardcore) {
        return "Não é permitido desativar o Modo Hardcore de uma tarefa com prazo vencido.";
      }
      if (dueDate !== taskToEdit.dueDate) {
        return "Não é permitido alterar a data de uma tarefa hardcore vencida.";
      }
    }
  }

  return null;
}

/**
 * Determina se uma tarefa exige confirmação explícita antes de ser excluída.
 * Exige confirmação apenas quando há subtarefas (checklist), Modo Hardcore ativo
 * ou histórico relevante de ofensiva/execuções (streak / contadores).
 */
export function shouldConfirmTaskDeletion(task: Task): boolean {
  const hasChecklist = Boolean(task.checklist && task.checklist.length > 0);
  const isHardcore = Boolean(task.isHardcoreModeEnabled);
  const hasStreakOrProgress =
    (task.streak ?? task.currentStreak ?? 0) > 0 ||
    (task.positiveCount ?? 0) > 0;

  return hasChecklist || isHardcore || hasStreakOrProgress;
}
