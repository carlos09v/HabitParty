import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import { getTodayDateString } from "./date";
import { isTaskHardcoreLocked } from "./taskSchedule";

export const FULL_NAME_MAX_LENGTH = 150;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export type PasswordStrengthKey =
  | "VERY_WEAK"
  | "WEAK"
  | "FAIR"
  | "GOOD"
  | "STRONG";

export interface PasswordAnalysis {
  score: number; // 0 to 4
  levelKey: PasswordStrengthKey;
  colorClass: string;
  barBgClass: string;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  /** Alias semântico de `hasNumberOrSpecial` (exige símbolo em `@$!%*?&#`). */
  hasSpecialChar: boolean;
  hasNumberOrSpecial: boolean;
}

export function analyzePassword(password: string): PasswordAnalysis {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  // Alinhado com a regex de CreateUserDTO / ResetPasswordRequestDTO / UpdateUserPasswordDTO no backend
  const hasSpecialChar = /[@$!%*?&#]/.test(password);

  if (!password) {
    return {
      score: 0,
      levelKey: "VERY_WEAK",
      colorClass: "text-neutral-400",
      barBgClass: "bg-white/10",
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasSpecialChar: false,
      hasNumberOrSpecial: false,
    };
  }

  let passedRules = 0;
  if (hasMinLength) passedRules++;
  if (hasUpperCase) passedRules++;
  if (hasLowerCase) passedRules++;
  if (hasSpecialChar) passedRules++;

  let score = 1;
  let levelKey: PasswordStrengthKey = "WEAK";
  let colorClass = "text-danger-400";
  let barBgClass = "bg-danger-500";

  if (passedRules <= 1) {
    score = 1;
    levelKey = "WEAK";
    colorClass = "text-danger-400";
    barBgClass = "bg-danger-500";
  } else if (passedRules === 2) {
    score = 2;
    levelKey = "FAIR";
    colorClass = "text-warning-400";
    barBgClass = "bg-warning-500";
  } else if (passedRules === 3) {
    score = 3;
    levelKey = "GOOD";
    colorClass = "text-gold-ink dark:text-gold";
    barBgClass = "bg-gold";
  } else {
    score = 4;
    levelKey = "STRONG";
    colorClass = "text-success-400";
    barBgClass = "bg-success-500";
  }

  return {
    score,
    levelKey,
    colorClass,
    barBgClass,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasSpecialChar,
    hasNumberOrSpecial: hasSpecialChar,
  };
}

export type FullNameValidationErrorKey =
  | "fullNameRequired"
  | "fullNameMaxLength";

export function validateFullName(fullName: string): {
  isValid: boolean;
  errorKey?: FullNameValidationErrorKey;
} {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { isValid: false, errorKey: "fullNameRequired" };
  }
  if (trimmed.length > FULL_NAME_MAX_LENGTH) {
    return { isValid: false, errorKey: "fullNameMaxLength" };
  }
  return { isValid: true };
}

export type UsernameValidationErrorKey =
  | "usernameRequired"
  | "usernameMinLength"
  | "usernameInvalidChars";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): {
  isValid: boolean;
  errorKey?: "emailRequired" | "emailInvalid";
} {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, errorKey: "emailRequired" };
  }
  if (!BASIC_EMAIL_PATTERN.test(trimmed)) {
    return { isValid: false, errorKey: "emailInvalid" };
  }
  return { isValid: true };
}

export function validateUsername(username: string): {
  isValid: boolean;
  errorKey?: UsernameValidationErrorKey;
} {
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    return { isValid: false, errorKey: "usernameRequired" };
  }
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return { isValid: false, errorKey: "usernameMinLength" };
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return { isValid: false, errorKey: "usernameInvalidChars" };
  }
  return { isValid: true };
}

export type PasswordValidationErrorKey =
  | "passwordMinLength"
  | "passwordMaxLength"
  | "passwordUppercase"
  | "passwordNumberOrSpecial";

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

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      isValid: false,
      error: `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
      errorKey: "passwordMaxLength",
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
      error: "A senha deve conter pelo menos um caractere especial (@$!%*?&#).",
      errorKey: "passwordNumberOrSpecial",
    };
  }

  return { isValid: true };
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
  timeZone?: string | null,
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

  const [todayYear, todayMonth, todayDay] = getTodayDateString(
    new Date(),
    timeZone,
  )
    .split("-")
    .map(Number);
  const today = new Date(todayYear, todayMonth - 1, todayDay);

  if (birthDate > today) {
    return {
      isValid: false,
      error: "A data de nascimento não pode estar no futuro.",
      errorKey: "birthDateFuture",
    };
  }

  // Cálculo preciso de idade considerando ano, mês e dia
  let age = todayYear - year;
  const m = todayMonth - month;
  if (m < 0 || (m === 0 && todayDay < day)) {
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
  timeZone?: string | null;
  isGamified?: boolean;
}): string | null {
  const {
    isHardcore,
    dueDate,
    isEditing,
    taskToEdit,
    locale = "pt-BR",
    timeZone,
    isGamified = true,
  } = options;
  const t = getUtilityTranslator(locale, "validators.hardcoreTodo");
  const now = new Date();
  const todayStr = getTodayDateString(now, timeZone);
  const normalizedDueDate = dueDate ? dueDate.split("T")[0] : "";
  const normalizedOriginalDueDate = taskToEdit?.dueDate
    ? taskToEdit.dueDate.split("T")[0]
    : "";

  const isEditingOverdueHardcore = Boolean(
    isEditing && isTaskHardcoreLocked(taskToEdit, now, timeZone),
  );

  if (!isHardcore) {
    if (isEditingOverdueHardcore) {
      return isGamified
        ? t("disableOverdueGamified")
        : t("disableOverdueProductivity");
    }
    return null;
  }

  if (!normalizedDueDate) {
    return isGamified
      ? t("missingDueDateGamified")
      : t("missingDueDateProductivity");
  }

  if (!isEditing && normalizedDueDate < todayStr) {
    return isGamified ? t("pastDueDateGamified") : t("pastDueDateProductivity");
  }

  if (
    isEditingOverdueHardcore &&
    normalizedOriginalDueDate &&
    normalizedDueDate !== normalizedOriginalDueDate
  ) {
    return isGamified
      ? t("changeOverdueDateGamified")
      : t("changeOverdueDateProductivity");
  }

  return null;
}
