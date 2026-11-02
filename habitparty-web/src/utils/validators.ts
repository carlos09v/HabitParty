import type { PasswordValidationResult } from "@/types/settings";
import type { Task } from "@/types/task";
import { getTodayDateString } from "./date";

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrengthKey =
  | "VERY_WEAK"
  | "WEAK"
  | "FAIR"
  | "GOOD"
  | "STRONG";

export interface PasswordAnalysis {
  score: number; // 0 to 4
  levelKey: PasswordStrengthKey;
  label: "Muito Fraca" | "Fraca" | "Razoável" | "Boa" | "Forte";
  colorClass: string;
  barBgClass: string;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumberOrSpecial: boolean;
}

export function analyzePassword(password: string): PasswordAnalysis {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!password) {
    return {
      score: 0,
      levelKey: "VERY_WEAK",
      label: "Muito Fraca",
      colorClass: "text-neutral-400",
      barBgClass: "bg-white/10",
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumberOrSpecial: false,
    };
  }

  let passedRules = 0;
  if (hasMinLength) passedRules++;
  if (hasUpperCase) passedRules++;
  if (hasLowerCase) passedRules++;
  if (hasNumberOrSpecial) passedRules++;

  let score = 1;
  let levelKey: PasswordStrengthKey = "WEAK";
  let label: PasswordAnalysis["label"] = "Fraca";
  let colorClass = "text-danger-500";
  let barBgClass = "bg-danger-500";

  if (passedRules <= 1) {
    score = 1;
    levelKey = "WEAK";
    label = "Fraca";
    colorClass = "text-danger-500";
    barBgClass = "bg-danger-500";
  } else if (passedRules === 2) {
    score = 2;
    levelKey = "FAIR";
    label = "Razoável";
    colorClass = "text-warning-500";
    barBgClass = "bg-warning-500";
  } else if (passedRules === 3) {
    score = 3;
    levelKey = "GOOD";
    label = "Boa";
    colorClass = "text-gold";
    barBgClass = "bg-gold";
  } else {
    score = 4;
    levelKey = "STRONG";
    label = "Forte";
    colorClass = "text-success-500";
    barBgClass = "bg-success-500";
  }

  return {
    score,
    levelKey,
    label,
    colorClass,
    barBgClass,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumberOrSpecial,
  };
}

export type PasswordValidationErrorKey =
  | "passwordMinLength"
  | "passwordUppercase"
  | "passwordNumberOrSpecial"
  | "passwordWeak";

/**
 * Valida se uma nova senha atende a todas as políticas de segurança de autenticação.
 * Retorna mensagem de erro amigável pronta para exibição em toast/feedback visual.
 */
export function validateAuthPassword(password: string): {
  isValid: boolean;
  error?: string;
  errorKey?: PasswordValidationErrorKey;
} {
  const strength = analyzePassword(password);

  if (!strength.hasMinLength) {
    return {
      isValid: false,
      error: "A senha deve ter no mínimo 8 caracteres.",
      errorKey: "passwordMinLength",
    };
  }

  if (!strength.hasUpperCase) {
    return {
      isValid: false,
      error: "A senha deve conter pelo menos uma letra maiúscula.",
      errorKey: "passwordUppercase",
    };
  }

  if (!strength.hasNumberOrSpecial) {
    return {
      isValid: false,
      error:
        "A senha deve conter pelo menos um caractere especial (@$!%*?&#) ou número.",
      errorKey: "passwordNumberOrSpecial",
    };
  }

  if (strength.score < 2) {
    return {
      isValid: false,
      error:
        "A senha é muito fraca. Inclua letras maiúsculas, minúsculas ou números/símbolos.",
      errorKey: "passwordWeak",
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

export type BirthDateValidationErrorKey =
  | "birthDateRequired"
  | "birthDateInvalid"
  | "birthDateFuture"
  | "birthDateMinAge";

/**
 * Valida se uma data de nascimento atende à idade mínima e máxima da plataforma.
 */
export function validateBirthDate(
  birthDateString: string,
  minAge: number = MIN_USER_AGE,
  maxAge: number = MAX_USER_AGE,
): {
  isValid: boolean;
  error?: string;
  errorKey?: BirthDateValidationErrorKey;
} {
  if (!birthDateString || !birthDateString.trim()) {
    return {
      isValid: false,
      error: "A data de nascimento é obrigatória.",
      errorKey: "birthDateRequired",
    };
  }

  // Espera formato YYYY-MM-DD
  const parts = birthDateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return {
      isValid: false,
      error: "Data de nascimento inválida.",
      errorKey: "birthDateInvalid",
    };
  }

  const [year, month, day] = parts;
  const birthDate = new Date(year, month - 1, day);

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return {
      isValid: false,
      error: "Data de nascimento inválida.",
      errorKey: "birthDateInvalid",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthDate > today) {
    return {
      isValid: false,
      error: "A data de nascimento não pode estar no futuro.",
      errorKey: "birthDateFuture",
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
      errorKey: "birthDateMinAge",
    };
  }

  if (age > maxAge) {
    return {
      isValid: false,
      error: "Por favor, insira uma data de nascimento válida.",
      errorKey: "birthDateInvalid",
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
  locale?: "pt-BR" | "en";
}): string | null {
  const {
    isHardcore,
    dueDate,
    isEditing,
    taskToEdit,
    locale = "pt-BR",
  } = options;
  const isEn = locale === "en";
  if (!isHardcore) return null;

  if (!dueDate) {
    return isEn
      ? "In Hardcore Mode, To-Dos require a due date."
      : "No Modo Hardcore, afazeres exigem uma data de vencimento.";
  }

  const todayStr = getTodayDateString();

  if (!isEditing && dueDate < todayStr) {
    return isEn
      ? "A Hardcore To-Do due date cannot be in the past."
      : "A data de vencimento de um afazer Hardcore não pode ser no passado.";
  }

  if (isEditing && taskToEdit?.isHardcoreModeEnabled && taskToEdit?.dueDate) {
    const isOverdue = taskToEdit.dueDate < todayStr;
    if (isOverdue) {
      if (!isHardcore) {
        return isEn
          ? "Cannot disable Hardcore Mode on an overdue task."
          : "Não é permitido desativar o Modo Hardcore de uma tarefa com prazo vencido.";
      }
      if (dueDate !== taskToEdit.dueDate) {
        return isEn
          ? "Cannot change the due date of an overdue hardcore task."
          : "Não é permitido alterar a data de uma tarefa hardcore vencida.";
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
