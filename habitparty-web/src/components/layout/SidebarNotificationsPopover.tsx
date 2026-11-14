"use client";

import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCheck,
  Flame,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  getSidebarNotificationsAction,
  type SidebarNotification,
} from "@/actions/notificationActions";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useUserStore } from "@/store/userStore";
import { cn, getTodayDateString } from "@/utils";
import { getDatePartsInTimeZone } from "@/utils/date";
import { soundEffects } from "@/utils/soundEffects";

const POPOVER_OPTIONS = {
  preferredSide: "right" as const,
  popoverWidth: 320,
  popoverHeight: 400,
  margin: 14,
};

const DISMISSED_STORAGE_PREFIX = "habitparty:notifications-dismissed:";

function getDismissedStorageKey(
  dateStr = getTodayDateString(
    new Date(),
    useUserStore.getState().user?.timezone,
  ),
): string {
  return `${DISMISSED_STORAGE_PREFIX}${dateStr}`;
}

export interface SidebarNotificationsPopoverProps {
  className?: string;
}

export function SidebarNotificationsPopover({
  className,
}: SidebarNotificationsPopoverProps = {}) {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "CRITICAL">("ALL");
  const [notifications, setNotifications] = useState<SidebarNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hasPlayedInitialSoundRef = useRef(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const loadNotifications = useCallback((playAlertOnNew = false) => {
    startTransition(async () => {
      const now = new Date();
      const userTimeZone = useUserStore.getState().user?.timezone;
      const localDateStr = getTodayDateString(now, userTimeZone);
      const localDayIdx = getDatePartsInTimeZone(now, userTimeZone).weekday;
      const res = await getSidebarNotificationsAction(
        localDateStr,
        localDayIdx,
        now.getTimezoneOffset(),
      );
      setNotifications(res.notifications);
      if (
        playAlertOnNew &&
        !hasPlayedInitialSoundRef.current &&
        res.notifications.length > 0
      ) {
        hasPlayedInitialSoundRef.current = true;
        soundEffects.playNotificationSound();
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(getDismissedStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setDismissedIds(
            new Set(parsed.filter((v): v is string => typeof v === "string")),
          );
        }
      }
    } catch {
      // Ignora erros de acesso/parse do localStorage
    }
  }, []);

  // Mantém o contador/badge sincronizado ao concluir/alterar tarefas mesmo com o popover fechado,
  // atualizando otimisticamente o alerta de ofensiva e adiando a revalidação pesada para o período ocioso
  useEffect(() => {
    if (typeof window === "undefined") return;
    let debounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
    let idleCallbackId: number | null = null;

    const scheduleRefresh = () => {
      if (debounceTimer) {
        globalThis.clearTimeout(debounceTimer);
      }
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
        idleCallbackId = null;
      }
      debounceTimer = globalThis.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idleCallbackId = window.requestIdleCallback(
            () => {
              loadNotifications(false);
            },
            { timeout: 3000 },
          );
        } else {
          loadNotifications(false);
        }
      }, 4500);
    };

    const handleTasksUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ completedToday?: boolean }>)
        .detail;
      if (detail?.completedToday) {
        setNotifications((prev) => prev.filter((n) => n.id !== "alert-streak"));
      }
      scheduleRefresh();
    };

    const handleFocusTaskCompleted = () => {
      setNotifications((prev) => prev.filter((n) => n.id !== "alert-streak"));
      scheduleRefresh();
    };

    window.addEventListener("habitparty:tasks-changed", handleTasksUpdated);
    window.addEventListener(
      "habitparty:task-completed-from-focus",
      handleFocusTaskCompleted,
    );

    return () => {
      if (debounceTimer) {
        globalThis.clearTimeout(debounceTimer);
      }
      if (idleCallbackId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      window.removeEventListener(
        "habitparty:tasks-changed",
        handleTasksUpdated,
      );
      window.removeEventListener(
        "habitparty:task-completed-from-focus",
        handleFocusTaskCompleted,
      );
    };
  }, [loadNotifications]);

  // Adia o carregamento inicial de alertas para o período ocioso pós-hidratação,
  // evitando que 4 buscas concorram com a renderização inicial da rota
  useEffect(() => {
    void locale;
    if (typeof window === "undefined") return;

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(
        () => {
          loadNotifications(true);
        },
        { timeout: 2000 },
      );
      return () => window.cancelIdleCallback(idleId);
    }

    const timerId = globalThis.setTimeout(() => {
      loadNotifications(true);
    }, 1500);
    return () => globalThis.clearTimeout(timerId);
  }, [loadNotifications, locale]);

  const togglePopover = () => {
    if (!isOpen && triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect());
      loadNotifications(false);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  useClickOutside(popoverRef, closePopover, {
    enabled: isOpen,
    onEscape: closePopover,
  });

  const position = useAnchoredPopoverPosition(
    isOpen,
    anchorRect,
    popoverRef,
    POPOVER_OPTIONS,
  );

  const activeNotifications = notifications.filter(
    (n) => !dismissedIds.has(n.id),
  );

  const criticalNotifications = activeNotifications.filter(
    (n) => n.severity === "danger" || n.severity === "warning",
  );

  const displayedNotifications =
    activeTab === "CRITICAL" ? criticalNotifications : activeNotifications;

  const unreadCount = activeNotifications.length;
  const hasCritical = criticalNotifications.length > 0;

  const handleDismissAll = () => {
    const nextDismissed = new Set(notifications.map((n) => n.id));
    setDismissedIds(nextDismissed);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          getDismissedStorageKey(),
          JSON.stringify(Array.from(nextDismissed)),
        );
      } catch {
        // Ignora falha de escrita no localStorage
      }
    }
  };

  const getNotificationIcon = (type: SidebarNotification["type"]) => {
    switch (type) {
      case "overdue":
        return <AlertCircle size={15} className="text-red-400 shrink-0" />;
      case "reminder":
        return <Bell size={15} className="text-amber-400 shrink-0" />;
      case "streak":
        return <Flame size={15} className="text-amber-400 shrink-0" />;
      case "focus_item":
        return <Sparkles size={15} className="text-gold shrink-0" />;
      default:
        return <Calendar size={15} className="text-sky-400 shrink-0" />;
    }
  };

  const getSeverityBadgeClasses = (
    severity: SidebarNotification["severity"],
  ) => {
    switch (severity) {
      case "danger":
        return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
      case "warning":
        return "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300";
      case "gold":
        return "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:border-gold/30 dark:bg-gold/10 dark:text-gold";
      default:
        return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Botão de Disparo (Notificações) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePopover}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={t("triggerAria", { count: unreadCount })}
        className={cn(
          "flex w-full h-9 items-center justify-between px-3 py-2 rounded-lg transition-colors text-body-s font-medium outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 border-r-2 border-transparent text-left cursor-pointer group select-none",
          isOpen
            ? "bg-primary-dark/50 text-neutral-50 border-gold font-bold"
            : "text-neutral-300 hover:bg-neutral-500/10 hover:text-neutral-50",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "transition-colors shrink-0",
              isOpen
                ? "text-gold"
                : "text-neutral-300 group-hover:text-neutral-50",
            )}
            aria-hidden="true"
          >
            <Bell size={18} />
          </span>
          <span className="text-neutral-200 group-hover:text-neutral-50 transition-colors truncate">
            {t("label")}
          </span>
        </div>

        {/* Badge de Contagem */}
        {unreadCount > 0 && (
          <span
            className={cn(
              "min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm shrink-0",
              hasCritical
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gold text-on-gold",
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Ancorado */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={t("dialogAria")}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${POPOVER_OPTIONS.popoverWidth}px`,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: `${POPOVER_OPTIONS.popoverHeight}px`,
            zIndex: 9999,
          }}
          className="max-w-[calc(100vw-24px)] flex flex-col rounded-2xl border border-neutral-700 dark:border-primary/40 bg-card dark:bg-popover shadow-popover-dark dark:shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header do Popover */}
          <header className="p-3.5 border-b border-neutral-700 dark:border-primary/20 flex items-center justify-between gap-2 shrink-0 bg-surface/60 dark:bg-surface/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-100 text-body-s">
                {t("headerTitle")}
              </span>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold border",
                    hasCritical
                      ? "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300"
                      : "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:border-gold/40 dark:bg-gold/15 dark:text-gold",
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  title={t("markAllRead")}
                  aria-label={t("markAllRead")}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={closePopover}
                aria-label={t("closeAria")}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </header>

          {/* Tabs: Todas vs Críticas */}
          <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={cn(
                "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "ALL"
                  ? "bg-gold text-on-gold font-bold shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-surface dark:hover:bg-white/5",
              )}
            >
              {t("tabAll", { count: activeNotifications.length })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CRITICAL")}
              className={cn(
                "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                activeTab === "CRITICAL"
                  ? "bg-red-500 text-white font-bold shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-surface dark:hover:bg-white/5",
              )}
            >
              {t("tabCritical", { count: criticalNotifications.length })}
            </button>
          </div>

          {/* Lista de Notificações */}
          <div className="p-2.5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-2">
            {isPending && displayedNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                {t("updating")}
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <CheckCheck size={18} />
                </div>
                <p className="text-body-s font-semibold text-neutral-200">
                  {t("emptyTitle")}
                </p>
                <p className="text-tiny text-neutral-400">
                  {t("emptySubtitle")}
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={closePopover}
                  className="group/item flex items-start gap-2.5 p-2.5 rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/50 hover:bg-card-hover/90 hover:border-primary/40 dark:hover:border-gold/40 transition-colors text-left"
                >
                  <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-neutral-100 group-hover/item:text-primary dark:group-hover/item:text-gold transition-colors truncate">
                        {n.title}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0",
                          getSeverityBadgeClasses(n.severity),
                        )}
                      >
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="text-tiny text-neutral-400 line-clamp-2">
                      {n.description}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
