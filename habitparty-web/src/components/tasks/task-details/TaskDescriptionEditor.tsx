"use client";

import { Bold, Highlighter, List } from "lucide-react";
import type { RefObject } from "react";

interface TaskDescriptionEditorProps {
  description: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  showFormatToolbar: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function TaskDescriptionEditor({
  description,
  onChange,
  onBlur,
  showFormatToolbar,
  textareaRef,
}: TaskDescriptionEditorProps) {
  const applyFormat = (syntax: "bold" | "highlight" | "bullet") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);

    let replacement = "";
    if (syntax === "bold") {
      replacement = selectedText
        ? `**${selectedText}**`
        : "**texto em negrito**";
    } else if (syntax === "highlight") {
      replacement = selectedText
        ? `==${selectedText}==`
        : "==texto destacado==";
    } else if (syntax === "bullet") {
      replacement = selectedText ? `\n- ${selectedText}` : "\n- Novo item";
    }

    const nextDesc =
      description.substring(0, start) +
      replacement +
      description.substring(end);

    onChange(nextDesc);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + replacement.length,
        start + replacement.length,
      );
    }, 50);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {showFormatToolbar && (
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg animate-in fade-in duration-100">
          <button
            type="button"
            onClick={() => applyFormat("bold")}
            title="Negrito (**texto**)"
            className="p-1 rounded text-neutral-300 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat("highlight")}
            title="Destacar (==texto==)"
            className="p-1 rounded text-neutral-300 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Highlighter size={13} />
          </button>
          <button
            type="button"
            onClick={() => applyFormat("bullet")}
            title="Lista de itens (- item)"
            className="p-1 rounded text-neutral-300 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
          >
            <List size={13} />
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        rows={3}
        value={description}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Adicione uma descrição ou anotações..."
        className="w-full bg-primary-dark/25 border border-primary/20 rounded-lg p-2.5 text-xs text-neutral-200 placeholder:text-neutral-500 hover:border-primary/40 focus:border-gold/60 focus:outline-none focus:bg-primary-dark/40 resize-none custom-scrollbar transition-all leading-relaxed"
      />
    </div>
  );
}
