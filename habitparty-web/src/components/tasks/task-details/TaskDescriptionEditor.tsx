import type { RefObject } from "react";
import type { FormatSyntax } from "./TaskDetailsFooter";

export function applyMarkdownFormat(
  textarea: HTMLTextAreaElement,
  currentDesc: string,
  syntax: FormatSyntax,
): { nextDesc: string; nextCursorPos: number } {
  const start = textarea.selectionStart ?? currentDesc.length;
  const end = textarea.selectionEnd ?? currentDesc.length;
  const selectedText = currentDesc.substring(start, end);

  let replacement = "";
  if (syntax === "bold") {
    replacement = selectedText ? `**${selectedText}**` : "**texto em negrito**";
  } else if (syntax === "italic") {
    replacement = selectedText ? `*${selectedText}*` : "*texto em itálico*";
  } else if (syntax === "highlight") {
    replacement = selectedText ? `==${selectedText}==` : "==texto destacado==";
  } else if (syntax === "bullet") {
    replacement = selectedText ? `\n- ${selectedText}` : "\n- Novo item";
  } else if (syntax === "code") {
    replacement = selectedText ? `\`${selectedText}\`` : "`código`";
  }

  const nextDesc =
    currentDesc.substring(0, start) + replacement + currentDesc.substring(end);

  return {
    nextDesc,
    nextCursorPos: start + replacement.length,
  };
}

interface TaskDescriptionEditorProps {
  description: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function TaskDescriptionEditor({
  description,
  onChange,
  onBlur,
  textareaRef,
}: TaskDescriptionEditorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        ref={textareaRef}
        rows={3}
        value={description}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Adicione uma descrição ou anotações..."
        className="w-full bg-surface/60 border border-primary/30 rounded-xl p-2.5 text-xs text-neutral-100 placeholder:text-neutral-500 hover:border-gold/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none resize-none custom-scrollbar transition-all leading-relaxed"
      />
    </div>
  );
}
