"use client";

import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Check, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { type MutableRefObject, useCallback, useEffect, useRef } from "react";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import {
  MARKDOWN_FORMAT_OPTIONS,
  TASK_DESCRIPTION_MAX_LENGTH,
} from "@/constants/task";
import type { FormatSyntax } from "@/types/task-ui";
import { cn } from "@/utils";
import { markdownToEditorHtml, tiptapJsonToMarkdown } from "@/utils/markdown";

export interface RichTextDescriptionEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Permite ao pai forçar serialização imediata antes de salvar/fechar dentro da janela de debounce. */
  flushRef?: MutableRefObject<(() => string) | null>;
  placeholder: string;
  maxLength?: number;
  disabled?: boolean;
  variant?: "popover" | "modal";
  headerLabel?: string;
  doneLabel?: string;
  minHeightClassName?: string;
  maxHeightClassName?: string;
  className?: string;
}

/**
 * Editor WYSIWYG baseado em TipTap com serialização bidirecional para Markdown.
 * Suporta negrito, itálico, destaque, código inline, links clicáveis e marcadores de lista reais
 * sem painéis extras de Preview nem inserção de texto placeholder nas listas.
 */
export function RichTextDescriptionEditor({
  id,
  value,
  onChange,
  onBlur,
  flushRef,
  placeholder,
  maxLength = TASK_DESCRIPTION_MAX_LENGTH,
  disabled = false,
  variant = "popover",
  headerLabel,
  doneLabel,
  minHeightClassName,
  maxHeightClassName,
  className,
}: RichTextDescriptionEditorProps) {
  const tFooter = useTranslations("tasks.detailsPopover.footer");
  const lastEmittedMarkdownRef = useRef(value);
  const isSyncingExternalRef = useRef(false);
  const isRevertingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const maxLengthRef = useRef(maxLength);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  maxLengthRef.current = maxLength;
  onChangeRef.current = onChange;
  onBlurRef.current = onBlur;

  const clearPendingDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const flushSerialization = useCallback(
    (targetEditor?: ReturnType<typeof useEditor> | null): string => {
      clearPendingDebounce();
      const activeEditor = targetEditor ?? editorRef.current;
      if (!activeEditor || isSyncingExternalRef.current) {
        return lastEmittedMarkdownRef.current;
      }

      let nextMarkdown = tiptapJsonToMarkdown(activeEditor.getJSON());
      if (nextMarkdown.length > maxLengthRef.current) {
        isRevertingRef.current = true;
        activeEditor.commands.undo();
        isRevertingRef.current = false;
        nextMarkdown = tiptapJsonToMarkdown(activeEditor.getJSON());
      }

      if (nextMarkdown !== lastEmittedMarkdownRef.current) {
        lastEmittedMarkdownRef.current = nextMarkdown;
        onChangeRef.current(nextMarkdown);
      }
      return lastEmittedMarkdownRef.current;
    },
    [clearPendingDebounce],
  );

  const resolvedMinHeight =
    minHeightClassName ??
    (variant === "popover" ? "min-h-[68px]" : "min-h-[84px]");
  const resolvedMaxHeight =
    maxHeightClassName ?? (variant === "popover" ? "max-h-44" : "max-h-48");

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        orderedList: false,
        strike: false,
        underline: false,
        link: {
          autolink: true,
          linkOnPaste: true,
          openOnClick: true,
          defaultProtocol: "https",
          protocols: ["http", "https"],
          HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer",
            class:
              "text-info hover:text-info/80 underline underline-offset-2 font-medium transition-colors cursor-pointer break-all",
          },
        },
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: markdownToEditorHtml(value),
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        "aria-label": headerLabel || placeholder,
        class: cn(
          "habitparty-tiptap w-full px-2.5 py-2 text-neutral-100 leading-relaxed focus:outline-none overflow-y-auto custom-scrollbar",
          variant === "popover" ? "text-xs" : "text-body-s",
          resolvedMinHeight,
          resolvedMaxHeight,
        ),
      },
    },
    onUpdate: ({ editor: currentEditor, transaction }) => {
      if (
        !transaction.docChanged ||
        isSyncingExternalRef.current ||
        isRevertingRef.current
      ) {
        return;
      }

      clearPendingDebounce();

      const textLength = currentEditor.state.doc.textContent.length;
      if (textLength > maxLengthRef.current) {
        isRevertingRef.current = true;
        queueMicrotask(() => {
          currentEditor.commands.undo();
          isRevertingRef.current = false;
        });
        return;
      }

      // Perto do limite, valida o tamanho já serializado sem esperar o debounce de 150ms
      if (textLength >= Math.max(0, maxLengthRef.current - 120)) {
        queueMicrotask(() => {
          flushSerialization(currentEditor);
        });
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        flushSerialization(currentEditor);
      }, 150);
    },
    onBlur: ({ editor: currentEditor }) => {
      flushSerialization(currentEditor);
      onBlurRef.current?.();
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = () => flushSerialization(editor);
    return () => {
      flushRef.current = null;
    };
  }, [editor, flushRef, flushSerialization]);

  useEffect(() => () => clearPendingDebounce(), [clearPendingDebounce]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedMarkdownRef.current) return;

    clearPendingDebounce();
    isSyncingExternalRef.current = true;
    lastEmittedMarkdownRef.current = value;
    editor.commands.setContent(markdownToEditorHtml(value), {
      emitUpdate: false,
    });
    isSyncingExternalRef.current = false;
  }, [editor, value, clearPendingDebounce]);

  const editorState = useEditorState({
    editor,
    selector: (snapshot) => {
      const currentEditor = snapshot.editor;
      if (!currentEditor) {
        return {
          bold: false,
          italic: false,
          highlight: false,
          bullet: false,
          code: false,
          isFocused: false,
        };
      }
      return {
        bold: currentEditor.isActive("bold"),
        italic: currentEditor.isActive("italic"),
        highlight: currentEditor.isActive("highlight"),
        bullet: currentEditor.isActive("bulletList"),
        code: currentEditor.isActive("code"),
        isFocused: currentEditor.isFocused,
      };
    },
  });

  const handleFormatCommand = (syntax: FormatSyntax) => {
    if (!editor || disabled) return;

    switch (syntax) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;
      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;
      case "highlight":
        editor.chain().focus().toggleHighlight().run();
        break;
      case "bullet":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "code":
        editor.chain().focus().toggleCode().run();
        break;
    }
  };

  const containerClassName =
    variant === "popover"
      ? "flex flex-col rounded-xl border border-neutral-700 bg-card focus-within:border-primary dark:border-primary/25 dark:bg-surface/45 dark:focus-within:border-gold/70 dark:focus-within:bg-surface/70 transition-colors overflow-hidden"
      : "flex flex-col rounded-lg border border-neutral-600 hover:border-neutral-500 bg-card shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none dark:focus-within:border-gold dark:focus-within:ring-1 dark:focus-within:ring-gold transition-colors overflow-hidden";

  return (
    <div
      className={cn(
        containerClassName,
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      {/* Barra Superior Integrada: Rótulo opcional + Comandos WYSIWYG */}
      <div
        className={cn(
          "flex items-center justify-between gap-1 px-2.5 py-1.5 border-b border-neutral-700/60 bg-surface/60 dark:border-white/6 dark:bg-white/[0.02]",
          !headerLabel && "justify-start",
        )}
      >
        {headerLabel && (
          <div className="flex items-center gap-1.5 text-tiny font-semibold text-neutral-400 uppercase tracking-wider">
            <FileText size={11} className="text-neutral-500" />
            <span>{headerLabel}</span>
          </div>
        )}

        <div className="flex items-center gap-0.5 flex-wrap">
          {MARKDOWN_FORMAT_OPTIONS.map((item) => {
            const Icon = item.icon;
            const label = tFooter(`formats.${item.syntax}`);
            const isActive = Boolean(editorState?.[item.syntax]);

            return (
              <button
                key={item.syntax}
                type="button"
                disabled={disabled}
                onMouseDown={(e) => {
                  // Preserva foco e seleção no editor TipTap ao acionar formatação
                  e.preventDefault();
                }}
                onClick={() => handleFormatCommand(item.syntax)}
                title={`${label} (${item.hint})`}
                aria-label={label}
                aria-pressed={isActive}
                className={cn(
                  "p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                  isActive
                    ? "bg-primary/15 text-primary dark:bg-gold/15 dark:text-gold"
                    : "text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-surface-hover dark:hover:bg-white/10",
                )}
              >
                <Icon size={12} />
              </button>
            );
          })}

          {variant === "popover" && doneLabel && editorState?.isFocused && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.commands.blur()}
              className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white dark:bg-gold/15 dark:border-gold/30 dark:text-gold dark:hover:bg-gold dark:hover:text-on-gold text-[10px] font-bold transition-colors cursor-pointer"
            >
              <Check size={10} />
              <span>{doneLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Superfície WYSIWYG direta (sem aba Preview) */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Wrapper delegates container whitespace clicks to TipTap EditorContent */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Wrapper delegates container whitespace clicks to TipTap EditorContent */}
      <div
        onClick={() => {
          if (editor && !editor.isFocused && !disabled) {
            editor.commands.focus();
          }
        }}
        className="habitparty-tiptap cursor-text"
      >
        <EditorContent editor={editor} />
      </div>

      {variant === "popover" && (
        <DescriptionCharCounter
          length={value.length}
          className="self-end px-2.5 pb-1.5 -mt-0.5"
        />
      )}
    </div>
  );
}
