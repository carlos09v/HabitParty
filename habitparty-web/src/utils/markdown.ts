import type { FormatSyntax } from "@/types/task-ui";

export type InlineMarkdownToken =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "highlight"; content: string }
  | { type: "code"; content: string }
  | { type: "link"; label: string; href: string };

export type MarkdownBlock =
  | { type: "paragraph"; tokens: InlineMarkdownToken[] }
  | { type: "bullet-list"; items: InlineMarkdownToken[][] };

const INLINE_TOKEN_REGEX =
  /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<]+)|(\*\*([^*]+)\*\*)|(==([^=]+)==)|(`([^`]+)`)|(\*([^*]+)\*)/g;

/**
 * Converte uma linha de texto em tokens inline de Markdown (negrito, itálico, destaque, código e links clicáveis).
 */
export function parseInlineMarkdownTokens(line: string): InlineMarkdownToken[] {
  if (!line) return [{ type: "text", content: "" }];

  const tokens: InlineMarkdownToken[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(INLINE_TOKEN_REGEX)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      tokens.push({
        type: "text",
        content: line.slice(lastIndex, matchIndex),
      });
    }

    if (match[1]) {
      // [label](https://...)
      tokens.push({
        type: "link",
        label: match[2],
        href: match[3],
      });
    } else if (match[4]) {
      // Raw URL https://...
      const rawUrl = match[4];
      const trailingMatch = rawUrl.match(/[.,;:!?)]+$/);
      const trailingPunct = trailingMatch ? trailingMatch[0] : "";
      const cleanUrl = trailingPunct
        ? rawUrl.slice(0, rawUrl.length - trailingPunct.length)
        : rawUrl;

      tokens.push({
        type: "link",
        label: cleanUrl,
        href: cleanUrl,
      });
      if (trailingPunct) {
        tokens.push({
          type: "text",
          content: trailingPunct,
        });
      }
    } else if (match[5]) {
      // **bold**
      tokens.push({
        type: "bold",
        content: match[6],
      });
    } else if (match[7]) {
      // ==highlight==
      tokens.push({
        type: "highlight",
        content: match[8],
      });
    } else if (match[9]) {
      // `code`
      tokens.push({
        type: "code",
        content: match[10],
      });
    } else if (match[11]) {
      // *italic*
      tokens.push({
        type: "italic",
        content: match[12],
      });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < line.length) {
    tokens.push({
      type: "text",
      content: line.slice(lastIndex),
    });
  }

  return tokens.length > 0 ? tokens : [{ type: "text", content: line }];
}

/**
 * Converte um texto multilinha em blocos estruturados (parágrafos e listas com marcadores).
 */
export function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  if (!text || !text.trim()) return [];

  const lines = text.split("\n");
  const blocks: MarkdownBlock[] = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*•]\s+(.+)$/);
    if (bulletMatch) {
      const itemTokens = parseInlineMarkdownTokens(bulletMatch[1]);
      const prevBlock = blocks[blocks.length - 1];
      if (prevBlock && prevBlock.type === "bullet-list") {
        prevBlock.items.push(itemTokens);
      } else {
        blocks.push({
          type: "bullet-list",
          items: [itemTokens],
        });
      }
    } else {
      blocks.push({
        type: "paragraph",
        tokens: parseInlineMarkdownTokens(line),
      });
    }
  }

  return blocks;
}

/**
 * Aplica sintaxe Markdown rápida ao texto selecionado (ou insere placeholder) em um textarea.
 */
export function applyMarkdownFormat(
  textarea: HTMLTextAreaElement | null,
  currentDesc: string,
  syntax: FormatSyntax,
): { nextDesc: string; nextCursorPos: number } {
  const start = textarea?.selectionStart ?? currentDesc.length;
  const end = textarea?.selectionEnd ?? currentDesc.length;
  const selectedText = currentDesc.substring(start, end);

  let replacement = "";
  if (syntax === "bold") {
    replacement = selectedText ? `**${selectedText}**` : "**texto em negrito**";
  } else if (syntax === "italic") {
    replacement = selectedText ? `*${selectedText}*` : "*texto em itálico*";
  } else if (syntax === "highlight") {
    replacement = selectedText ? `==${selectedText}==` : "==texto destacado==";
  } else if (syntax === "bullet") {
    const prefix = start > 0 && currentDesc[start - 1] !== "\n" ? "\n- " : "- ";
    replacement = selectedText
      ? `${prefix}${selectedText}`
      : `${prefix}Novo item`;
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
