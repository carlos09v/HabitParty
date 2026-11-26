import { AlertCircle } from "lucide-react";

interface AuthFormAlertProps {
  message?: string | null;
}

export function AuthFormAlert({ message }: AuthFormAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-danger-500/40 bg-danger-500/10 px-3.5 py-3 text-xs sm:text-sm text-danger-400"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="leading-snug font-medium">{message}</span>
    </div>
  );
}
