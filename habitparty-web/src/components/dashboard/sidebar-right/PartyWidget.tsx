import { Shield, Users } from "lucide-react";
import { cn } from "@/utils";

const DEFAULT_MEMBERS: PartyMember[] = [
  { id: "1", name: "Carlos V.", level: 5, role: "Líder", status: "online" },
  {
    id: "2",
    name: "Mariana S.",
    level: 7,
    role: "Guerreira",
    status: "online",
  },
  { id: "3", name: "Lucas P.", level: 4, role: "Mago", status: "idle" },
];

import { useCompactMode } from "@/hooks/useCompactMode";
import type { PartyMember } from "@/types/dashboard";

export function PartyWidget() {
  const { isCompact } = useCompactMode();
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h4 className="text-subtitle-s font-bold text-neutral-100">Amigos</h4>
          <span className="text-tiny text-neutral-400 font-medium px-1.5 py-0.5 rounded bg-white/6">
            Party (em breve)
          </span>
        </div>
        <Users size={16} className="text-neutral-400" />
      </div>

      {/* Lista de Membros */}
      <div className="flex flex-col gap-1.5 w-full">
        {DEFAULT_MEMBERS.map((member) => (
          <div
            key={member.id}
            className={cn(
              "flex items-center justify-between rounded-lg border border-white/8 bg-white/3 hover:bg-white/6 transition-colors",
              isCompact ? "p-1.5" : "p-2",
            )}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  className={cn(
                    "rounded-full bg-neutral-700 border border-neutral-400 flex items-center justify-center text-tiny font-bold text-neutral-100",
                    isCompact ? "w-6 h-6" : "w-7 h-7",
                  )}
                >
                  {member.name.charAt(0)}
                </div>
                <span
                  className={`w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-background ${
                    member.status === "online"
                      ? "bg-success-500"
                      : member.status === "idle"
                        ? "bg-warning-500"
                        : "bg-neutral-500"
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <span
                  className={cn(
                    "font-medium text-neutral-100 leading-tight",
                    isCompact ? "text-xs" : "text-body-s",
                  )}
                >
                  {member.name}
                </span>
                <span className="text-tiny text-neutral-400">
                  Nv. {member.level} • {member.role}
                </span>
              </div>
            </div>

            <Shield size={14} className="text-gold/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
