"use client";

import { Check, ExternalLink, FileText, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RefObject, useMemo, useState } from "react";
import { MARKDOWN_FORMAT_OPTIONS } from "@/constants/task";
import type { FormatSyntax } from "@/types/task-ui";
import {
  type InlineMarkdownToken,
  parseMarkdownBlocks,
} from "@/utils/markdown";

interface TaskDescriptionEditorProps {
  description: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  onApplyFormat?: (syntax: FormatSyntax) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

function renderInlineTokens(tokens: InlineMarkdownToken[]) {
  return tokens.map((token, idx) => {
    const key = `${token.type}-${idx}`;
    switch (token.type) {
      case "bold":
        return (
          <strong key={key} className="font-bold text-neutral-50">
            {token.content}
          </strong>
        );
      case "italic":
        return (
          <em key={key} className="italic text-neutral-200">
            {token.content}
          </em>
        );
      case "highlight":
        return (
          <mark
            key={key}
            className="bg-amber-500/20 text-amber-800 dark:bg-gold/25 dark:text-gold px-1 py-0.5 rounded font-semibold"
          >
            {token.content}
          </mark>
        );
      case "code":
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-surface border border-neutral-700 text-primary dark:bg-white/10 dark:border-white/10 dark:text-gold font-mono text-[11px]"
          >
            {token.content}
          </code>
        );
      case "link":
        return (
          <a
            key={key}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="text-info hover:text-info/80 underline underline-offset-2 font-medium transition-colors inline-flex items-center gap-0.5 break-all cursor-pointer"
          >
            <span>{token.label}</span>
            <ExternalLink size={10} className="shrink-0 inline" />
          </a>
        );
      default:
        return <span key={key}>{token.content}</span>;
    }
  });
}

function MarkdownFormattedView({ text }: { text: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(text), [text]);

  return (
    <div className="flex flex-col gap-1.5 text-xs text-neutral-200 leading-relaxed break-words">
      {blocks.map((block, bIdx) => {
        const blockKey = `${block.type}-${bIdx}`;
        if (block.type === "bullet-list") {
          return (
            <ul
              key={blockKey}
              className="list-disc list-inside flex flex-col gap-1 pl-1 text-neutral-200 marker:text-gold"
            >
              {block.items.map((itemTokens, iIdx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static markdown list items rendered from text lines
                <li key={`item-${bIdx}-${iIdx}`} className="leading-relaxed">
                  {renderInlineTokens(itemTokens)}
                </li>
              ))}
            </ul>
          );
        }
        const isEmptyLine =
          block.tokens.length === 1 &&
          block.tokens[0].type === "text" &&
          !block.tokens[0].content.trim();
        if (isEmptyLine) {
          return <div key={blockKey} className="h-1.5" />;
        }
        return (
          <p key={blockKey} className="leading-relaxed">
            {renderInlineTokens(block.tokens)}
          </p>
        );
      })}
    </div>
  );
}

export function TaskDescriptionEditor({
  description,
  onChange,
  onBlur,
  onApplyFormat,
  textareaRef,
}: TaskDescriptionEditorProps) {
  const t = useTranslations("tasks.detailsPopover");
  const tFooter = useTranslations("tasks.detailsPopover.footer");
  const [isEditing, setIsEditing] = useState(false);

  const hasContent = description.trim().length > 0;
  const hasRichSyntax = useMemo(
    () =>
      /\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==|`[^`]+`|https?:\/\/[^\s]+|^\s*[-*•]\s+/m.test(
        description,
      ),
    [description],
  );

  const handleStartEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
      }
    }, 20);
  };

  return (
    <div className="flex flex-col rounded-xl border border-neutral-700 bg-card focus-within:border-primary dark:border-primary/25 dark:bg-surface/45 dark:focus-within:border-gold/70 dark:focus-within:bg-surface/70 transition-colors overflow-hidden">
      {/* Barra Superior Integrada: Rótulo + Botões de Formatação Rápida */}
      <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 border-b border-neutral-700/60 bg-surface/60 dark:border-white/6 dark:bg-white/[0.02]">
        <div className="flex items-center gap-1.5 text-tiny font-semibold text-neutral-400 uppercase tracking-wider">
          <FileText size={11} className="text-neutral-500" />
          <span>{t("descriptionLabel")}</span>
        </div>

        <div className="flex items-center gap-0.5">
          {onApplyFormat &&
            MARKDOWN_FORMAT_OPTIONS.map((item) => {
              const Icon = item.icon;
              const label = tFooter(`formats.${item.syntax}`);
              return (
                <button
                  key={item.syntax}
                  type="button"
                  onMouseDown={(e) => {
                    // Evita perder o foco/seleção do textarea ao clicar no botão
                    e.preventDefault();
                  }}
                  onClick={() => {
                    if (!isEditing) {
                      setIsEditing(true);
                    }
                    onApplyFormat(item.syntax);
                  }}
                  title={`${label} (${item.hint})`}
                  aria-label={label}
                  className="p-1 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Icon size={12} />
                </button>
              );
            })}

          {isEditing && hasContent && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setIsEditing(false);
                onBlur();
              }}
              className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white dark:bg-gold/15 dark:border-gold/30 dark:text-gold dark:hover:bg-gold dark:hover:text-on-gold text-[10px] font-bold transition-colors cursor-pointer"
            >
              <Check size={10} />
              <span>{t("doneEditing")}</span>
            </button>
          )}

          {!isEditing && hasContent && (
            <button
              type="button"
              onClick={handleStartEditing}
              title={t("clickToEditDescription")}
              aria-label={t("clickToEditDescription")}
              className="ml-1 p-1 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Pencil size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Corpo: Modo Edição (Textarea + Preview ao Vivo se houver Markdown/Link) vs Modo Visualização Formatada */}
      {isEditing || !hasContent ? (
        <div className="flex flex-col">
          <textarea
            ref={textareaRef}
            rows={3}
            value={description}
            onFocus={() => setIsEditing(true)}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              onBlur();
            }}
            placeholder={t("descriptionPlaceholder")}
            className="w-full bg-transparent p-2.5 text-xs text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none resize-none custom-scrollbar leading-relaxed"
          />

          {hasContent && hasRichSyntax && (
            <div className="px-2.5 py-2 border-t border-neutral-700/60 bg-surface/50 dark:border-white/8 dark:bg-background/40 flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {t("previewLabel")}
              </span>
              <MarkdownFormattedView text={description} />
            </div>
          )}
        </div>
      ) : (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Click-to-edit container that preserves inner clickable links
        // biome-ignore lint/a11y/noStaticElementInteractions: Click-to-edit container that preserves inner clickable links
        <div
          onClick={handleStartEditing}
          title={t("clickToEditDescription")}
          className="p-2.5 min-h-[68px] max-h-44 overflow-y-auto custom-scrollbar cursor-text hover:bg-surface/40 dark:hover:bg-white/[0.02] transition-colors"
        >
          <MarkdownFormattedView text={description} />
        </div>
      )}
    </div>
  );
}
