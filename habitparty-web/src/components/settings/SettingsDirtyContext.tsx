"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then((mod) => ({
      default: mod.ConfirmationModal,
    })),
  { ssr: false },
);

interface PendingNavigation {
  href: string;
  mode: "push" | "replace";
}

interface SettingsDirtyContextValue {
  hasUnsavedChanges: boolean;
  setFormDirty: (formId: string, isDirty: boolean) => void;
  clearAllDirty: () => void;
  /** Intercepta cliques de navegação interna quando há alterações pendentes. */
  guardLinkClick: (
    e: MouseEvent<HTMLAnchorElement>,
    href: string,
    mode?: "push" | "replace",
  ) => void;
}

const SettingsDirtyContext = createContext<SettingsDirtyContextValue>({
  hasUnsavedChanges: false,
  setFormDirty: () => {},
  clearAllDirty: () => {},
  guardLinkClick: () => {},
});

export function SettingsDirtyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const tGuard = useTranslations("settings.unsavedGuard");
  const [dirtyForms, setDirtyForms] = useState<Record<string, boolean>>({});
  const [pendingNav, setPendingNav] = useState<PendingNavigation | null>(null);

  const setFormDirty = useCallback((formId: string, isDirty: boolean) => {
    setDirtyForms((prev) => {
      const current = Boolean(prev[formId]);
      if (current === isDirty) return prev;
      if (!isDirty) {
        const next = { ...prev };
        delete next[formId];
        return next;
      }
      return { ...prev, [formId]: true };
    });
  }, []);

  const clearAllDirty = useCallback(() => {
    setDirtyForms({});
    setPendingNav(null);
  }, []);

  const hasUnsavedChanges = useMemo(
    () => Object.values(dirtyForms).some(Boolean),
    [dirtyForms],
  );

  const guardLinkClick = useCallback(
    (
      e: MouseEvent<HTMLAnchorElement>,
      href: string,
      mode: "push" | "replace" = "push",
    ) => {
      if (!hasUnsavedChanges) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
      setPendingNav({ href, mode });
    },
    [hasUnsavedChanges],
  );

  const handleConfirmDiscard = () => {
    const target = pendingNav;
    setPendingNav(null);
    setDirtyForms({});
    if (!target) return;
    if (target.mode === "replace") {
      router.replace(target.href, { scroll: false });
    } else {
      router.push(target.href);
    }
  };

  // Protege também contra fechar ou recarregar a página com edições pendentes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const value = useMemo(
    () => ({
      hasUnsavedChanges,
      setFormDirty,
      clearAllDirty,
      guardLinkClick,
    }),
    [hasUnsavedChanges, setFormDirty, clearAllDirty, guardLinkClick],
  );

  return (
    <SettingsDirtyContext.Provider value={value}>
      {children}

      {pendingNav && (
        <ConfirmationModal
          isOpen
          onClose={() => setPendingNav(null)}
          onConfirm={handleConfirmDiscard}
          variant="warning"
          title={tGuard("title")}
          description={tGuard("description")}
          confirmText={tGuard("discardBtn")}
          cancelText={tGuard("stayBtn")}
        />
      )}
    </SettingsDirtyContext.Provider>
  );
}

export function useSettingsDirtyState() {
  return useContext(SettingsDirtyContext);
}

export function useRegisterSettingsDirty(formId: string, isDirty: boolean) {
  const { setFormDirty } = useSettingsDirtyState();

  useEffect(() => {
    setFormDirty(formId, isDirty);
  }, [formId, isDirty, setFormDirty]);

  useEffect(() => {
    return () => {
      setFormDirty(formId, false);
    };
  }, [formId, setFormDirty]);
}
