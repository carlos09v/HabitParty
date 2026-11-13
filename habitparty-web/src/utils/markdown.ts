import type { JSONContent } from "@tiptap/react";

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

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeHttpUrl(url: string): boolean {
  return /^https?:\/\/\S+$/i.test(url.trim());
}

/**
 * Converte uma linha de texto em tokens inline de Markdown (negrito, itálico, destaque, código e links clicáveis).
 */
function parseInlineMarkdownTokens(line: string): InlineMarkdownToken[] {
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
      tokens.push({
        type: "link",
        label: match[2],
        href: match[3],
      });
    } else if (match[4]) {
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
      tokens.push({
        type: "bold",
        content: match[6],
      });
    } else if (match[7]) {
      tokens.push({
        type: "highlight",
        content: match[8],
      });
    } else if (match[9]) {
      tokens.push({
        type: "code",
        content: match[10],
      });
    } else if (match[11]) {
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
function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  if (!text || !text.trim()) return [];

  const lines = text.split("\n");
  const blocks: MarkdownBlock[] = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*(?:[-•]\s*(.*)|\*\s+(.*))$/);
    if (bulletMatch) {
      const itemContent = bulletMatch[1] ?? bulletMatch[2] ?? "";
      const itemTokens = parseInlineMarkdownTokens(itemContent);
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

function renderInlineTokensToHtml(tokens: InlineMarkdownToken[]): string {
  return tokens
    .map((token) => {
      switch (token.type) {
        case "bold":
          return `<strong>${escapeHtml(token.content)}</strong>`;
        case "italic":
          return `<em>${escapeHtml(token.content)}</em>`;
        case "highlight":
          return `<mark>${escapeHtml(token.content)}</mark>`;
        case "code":
          return `<code>${escapeHtml(token.content)}</code>`;
        case "link": {
          if (!isSafeHttpUrl(token.href)) {
            return escapeHtml(token.label);
          }
          const safeHref = escapeHtml(token.href);
          return `<a href="${safeHref}">${escapeHtml(token.label)}</a>`;
        }
        default:
          return escapeHtml(token.content);
      }
    })
    .join("");
}

/**
 * Converte Markdown salvo na API em HTML semântico seguro para inicializar o editor WYSIWYG TipTap.
 */
export function markdownToEditorHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) return "";

  const blocks = parseMarkdownBlocks(markdown);
  if (blocks.length === 0) return "";

  return blocks
    .map((block) => {
      if (block.type === "bullet-list") {
        const itemsHtml = block.items
          .map(
            (itemTokens) =>
              `<li><p>${renderInlineTokensToHtml(itemTokens)}</p></li>`,
          )
          .join("");
        return `<ul>${itemsHtml}</ul>`;
      }
      const inlineHtml = renderInlineTokensToHtml(block.tokens);
      return `<p>${inlineHtml}</p>`;
    })
    .join("");
}

function wrapWithWhitespacePreserved(
  text: string,
  wrapper: (inner: string) => string,
): string {
  const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match || !match[2]) return text;
  return `${match[1]}${wrapper(match[2])}${match[3]}`;
}

function serializeInlineNodes(nodes?: JSONContent[]): string {
  if (!nodes || nodes.length === 0) return "";

  return nodes
    .map((node) => {
      if (node.type === "hardBreak") {
        return "\n";
      }
      if (node.type !== "text") {
        return serializeInlineNodes(node.content);
      }

      const rawText = node.text ?? "";
      if (!rawText) return "";

      const marks = node.marks ?? [];
      if (marks.length === 0) return rawText;

      const hasCode = marks.some((m) => m.type === "code");
      const hasHighlight = marks.some((m) => m.type === "highlight");
      const hasItalic = marks.some((m) => m.type === "italic");
      const hasBold = marks.some((m) => m.type === "bold");
      const linkMark = marks.find((m) => m.type === "link");
      const hasOtherFormatting =
        hasCode || hasHighlight || hasItalic || hasBold;

      let out = rawText;

      if (hasCode) {
        out = wrapWithWhitespacePreserved(out, (inner) => `\`${inner}\``);
      }
      if (hasHighlight) {
        out = wrapWithWhitespacePreserved(out, (inner) => `==${inner}==`);
      }
      if (hasItalic) {
        out = wrapWithWhitespacePreserved(out, (inner) => `*${inner}*`);
      }
      if (hasBold) {
        out = wrapWithWhitespacePreserved(out, (inner) => `**${inner}**`);
      }

      const href =
        typeof linkMark?.attrs?.href === "string" ? linkMark.attrs.href : "";
      if (href && isSafeHttpUrl(href)) {
        if (out.trim() === href && !hasOtherFormatting) {
          out = out.replace(out.trim(), href);
        } else {
          out = `[${out}](${href})`;
        }
      }

      return out;
    })
    .join("");
}

function hasVisibleText(node?: JSONContent | null): boolean {
  if (!node) return false;
  if (node.type === "text") {
    return Boolean(node.text && node.text.trim().length > 0);
  }
  return Boolean(node.content?.some((child) => hasVisibleText(child)));
}

function serializeBulletList(node: JSONContent, depth = 0): string[] {
  const indent = "  ".repeat(depth);
  const lines: string[] = [];

  for (const listItem of node.content ?? []) {
    if (listItem.type !== "listItem") continue;

    const children = listItem.content ?? [];
    let wroteItemHeader = false;

    for (const child of children) {
      if (child.type === "bulletList") {
        if (!wroteItemHeader) {
          lines.push(`${indent}- `);
          wroteItemHeader = true;
        }
        lines.push(...serializeBulletList(child, depth + 1));
      } else if (child.type === "orderedList") {
        if (!wroteItemHeader) {
          lines.push(`${indent}- `);
          wroteItemHeader = true;
        }
        lines.push(...serializeBulletList(child, depth + 1));
      } else {
        const inlineText = serializeInlineNodes(child.content);
        if (!wroteItemHeader) {
          lines.push(`${indent}- ${inlineText}`);
          wroteItemHeader = true;
        } else if (inlineText) {
          lines.push(`${indent}  ${inlineText}`);
        }
      }
    }

    if (!wroteItemHeader) {
      lines.push(`${indent}- `);
    }
  }

  return lines;
}

/**
 * Converte o documento JSON do TipTap para o formato Markdown enxuto persistido no backend.
 */
export function tiptapJsonToMarkdown(
  doc: JSONContent | null | undefined,
): string {
  if (!doc || !hasVisibleText(doc)) {
    return "";
  }

  const lines: string[] = [];

  for (const block of doc.content ?? []) {
    if (block.type === "bulletList" || block.type === "orderedList") {
      lines.push(...serializeBulletList(block));
    } else if (block.type === "blockquote") {
      for (const child of block.content ?? []) {
        lines.push(serializeInlineNodes(child.content));
      }
    } else {
      lines.push(serializeInlineNodes(block.content));
    }
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}
