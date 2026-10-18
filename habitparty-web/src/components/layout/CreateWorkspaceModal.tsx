"use client";

import { useEffect, useRef, useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  isEdit?: boolean;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  isEdit = false,
}: CreateWorkspaceModalProps) {
  const [workspaceName, setWorkspaceName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setWorkspaceName(initialName);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceName.trim()) {
      onSubmit(workspaceName.trim());
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar Ambiente" : "Novo Ambiente"}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="workspaceName"
            className="text-body-s text-neutral-300"
          >
            Nome do Ambiente
          </label>
          <input
            ref={inputRef}
            id="workspaceName"
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Ex: Trabalho, Estudos..."
            className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            required
            maxLength={12}
          />
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-body-s text-neutral-300 hover:text-neutral-50 transition-colors focus:outline-none rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!workspaceName.trim()}
            className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark border border-primary-light/30 rounded-lg text-neutral-50 text-body-s font-bold hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
