"use client";

import { Calendar, X } from "lucide-react";
import { useLocale } from "next-intl";
import {
  type ChangeEvent,
  type FocusEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useState,
} from "react";
import { Input } from "@/components/ui/Input";

export interface BirthDateInputProps {
  id?: string;
  name?: string;
  label?: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (isoOrRawValue: string) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  clearAriaLabel?: string;
  enterKeyHint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
  ref?: Ref<HTMLInputElement>;
  className?: string;
}

type BirthDateOrder = "DMY" | "MDY";

function isoToDisplay(iso: string, order: BirthDateOrder): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  const [, year, month, day] = match;
  return order === "MDY"
    ? `${month}/${day}/${year}`
    : `${day}/${month}/${year}`;
}

function formatDigitsToDisplay(digits: string): string {
  const clamped = digits.slice(0, 8);
  if (clamped.length <= 2) return clamped;
  if (clamped.length <= 4) {
    return `${clamped.slice(0, 2)}/${clamped.slice(2)}`;
  }
  return `${clamped.slice(0, 2)}/${clamped.slice(2, 4)}/${clamped.slice(4)}`;
}

function parseInputValue(
  raw: string,
  order: BirthDateOrder,
): { display: string; canonical: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { display: "", canonical: "" };
  }

  // Suporta autofill/paste direto no formato ISO YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return {
      display:
        order === "MDY" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`,
      canonical: `${year}-${month}-${day}`,
    };
  }

  const digits = trimmed.replace(/\D/g, "").slice(0, 8);
  if (!digits) {
    return { display: "", canonical: "" };
  }

  const display = formatDigitsToDisplay(digits);

  if (digits.length < 8) {
    // Emite a string parcial para que validadores diferenciem "obrigatório" de "incompleto/inválido"
    return { display, canonical: display };
  }

  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const day = order === "MDY" ? part2 : part1;
  const month = order === "MDY" ? part1 : part2;

  return {
    display,
    canonical: `${year}-${month}-${day}`,
  };
}

/**
 * Campo reutilizável, leve e acessível para datas de nascimento.
 *
 * - Aplica máscara conforme o idioma ativo (`DD/MM/AAAA` em `pt-BR`, `MM/DD/YYYY` em `en`).
 * - Aceita digitação numérica rápida, colagem/autofill ISO (`YYYY-MM-DD`) e `autoComplete="bday"`.
 * - Emite `YYYY-MM-DD` (ou string parcial se incompleta) via `onChange` e `<input type="hidden">`.
 */
export function BirthDateInput({
  id = "birthDate",
  name = "birthDate",
  label,
  value,
  defaultValue = "",
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  hint,
  clearAriaLabel,
  enterKeyHint,
  ref,
  className,
}: BirthDateInputProps) {
  const locale = useLocale();
  const order: BirthDateOrder = locale === "en" ? "MDY" : "DMY";
  const resolvedPlaceholder =
    placeholder ?? (order === "MDY" ? "MM/DD/YYYY" : "DD/MM/AAAA");

  const isControlled = value !== undefined;
  const initialCanonical = isControlled ? value : defaultValue;

  const [displayValue, setDisplayValue] = useState<string>(() =>
    isoToDisplay(initialCanonical, order),
  );
  const [canonicalValue, setCanonicalValue] =
    useState<string>(initialCanonical);

  useEffect(() => {
    if (!isControlled) return;
    if (value === canonicalValue) return;
    if (!value) {
      setDisplayValue("");
      setCanonicalValue("");
      return;
    }
    const formatted = isoToDisplay(value, order);
    if (formatted) {
      setDisplayValue(formatted);
      setCanonicalValue(value);
    }
  }, [value, isControlled, canonicalValue, order]);

  // Atualiza a formatação visual caso o usuário troque o idioma na tela de Auth
  useEffect(() => {
    const formatted = isoToDisplay(canonicalValue, order);
    if (formatted) {
      setDisplayValue(formatted);
    }
  }, [order, canonicalValue]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInputValue(e.target.value, order);
    setDisplayValue(parsed.display);
    setCanonicalValue(parsed.canonical);
    onChange?.(parsed.canonical);
  };

  const handleClear = () => {
    setDisplayValue("");
    setCanonicalValue("");
    onChange?.("");
  };

  return (
    <div className="w-full min-w-0">
      {name && <input type="hidden" name={name} value={canonicalValue} />}
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        maxLength={10}
        label={label}
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={resolvedPlaceholder}
        required={required}
        disabled={disabled}
        error={error}
        hint={hint}
        enterKeyHint={enterKeyHint}
        icon={<Calendar size={18} aria-hidden="true" />}
        endAdornment={
          displayValue && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label={clearAriaLabel ?? "Clear date"}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <X size={15} aria-hidden="true" />
            </button>
          ) : undefined
        }
        className={className}
      />
    </div>
  );
}
