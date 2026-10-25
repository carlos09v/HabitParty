import type { FormatSyntax } from "@/types/task-ui";

/**
 * Aplica sintaxe Markdown rápida ao texto selecionado (ou insere placeholder) em um textarea.
 */
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
