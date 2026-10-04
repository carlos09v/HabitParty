"use client";

import { InputHTMLAttributes, ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode; // Ícone opcional
}

export function Input({
  label,
  id,
  className,
  icon,
  type = "text",
  onChange,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [hasValue, setHasValue] = useState(false);

  const isPasswordInput = type === "password";
  const finalType = isPasswordInput && isPasswordVisible ? "text" : type;

  // Função para interceptar o que o usuário digita/limpa
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label htmlFor={id} className="text-body-s text-neutral-100">
        {label}
      </label>
      <div className="relative flex items-center  transition-colors">
        {icon && (
          <div
            className={cn(
              "absolute left-4 pointer-events-none transition-colors",
              hasValue ? "text-gold" : "text-neutral-500 peer-focus:text-gold",
            )}
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          type={finalType}
          onChange={handleChange}
          className={cn(
            "w-full py-3 rounded-lg text-body-m text-neutral-50 outline-none transition-all",
            "bg-primary-dark/20 border border-primary/30",
            "focus:border-primary-light focus:bg-primary-dark/30 focus:shadow-[0_0_8px_rgba(168,99,255,0.3)]",
            "placeholder:text-neutral-400",
            icon ? "pl-11 pr-4" : "px-4",
            // Esse truque esconde o calendário padrão do Chrome/Edge, permitindo clicar no input inteiro para abrir
            type === "date" &&
              "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            className,
          )}
          {...props}
        />

        {/* Ícone de Senha */}
        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-4 text-neutral-400 hover:text-gold transition-colors focus:outline-none"
          >
            {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
