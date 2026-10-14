import { Bell, LogOut } from "lucide-react";
import Image from "next/image";
import { signOut } from "@/actions/auth";
import type { components } from "@/api/schema";
import { NAV_FOOTER, NAV_SECTIONS } from "@/constants/navigation";
import { SidebarLink } from "./SidebarLink";
import { SidebarUserProfile } from "./SidebarUserProfile";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type User = components["schemas"]["UserResponseDTO"];

interface SidebarProps {
  user?: User | null;
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside
      className="w-60 shrink-0 h-screen border-r border-primary/30 bg-background/80 backdrop-blur-xl flex flex-col relative z-20"
      aria-label="Sidebar"
    >
      {/* Fundo de Confetes */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/assets/Confetti.svg')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      {/* HEADER */}
      <header className="p-5 flex flex-col gap-5 relative z-30">
        <div className="flex justify-center w-full">
          <Image
            src="/assets/logo.png"
            alt="Logo HabitParty"
            width={150}
            height={42}
            priority
            className="object-contain"
          />
        </div>

        <WorkspaceSwitcher />
      </header>

      {/* ÁREA DE SCROLL */}
      <nav
        className="flex-1 overflow-y-auto px-3 flex flex-col gap-5 custom-scrollbar z-10"
        aria-label="Navegação Principal"
      >
        {NAV_SECTIONS.map((section, idx) => (
          <div
            key={section.title || `nav-sec-${idx}`}
            className="flex flex-col gap-1"
          >
            {section.title && (
              <h2 className="px-3 text-label-m uppercase tracking-wider text-gold-pressed font-bold mb-1">
                {section.title}
              </h2>
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                  >
                    <Icon size={18} />
                  </SidebarLink>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="flex-1 min-h-6"></div>

        <div className="flex flex-col gap-1 pb-3">
          <div className="px-3 py-1 flex justify-between items-center">
            <button
              type="button"
              aria-label="Notificações"
              className="outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-md"
            >
              <Bell
                size={18}
                className="text-neutral-300 hover:text-neutral-50 cursor-pointer transition-colors"
              />
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {NAV_FOOTER.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                >
                  <Icon size={18} />
                </SidebarLink>
              );
            })}

            <li className="mt-4">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-body-s font-medium outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 text-neutral-300 hover:bg-neutral-500/10 hover:text-neutral-50 border-r-2 border-transparent text-left cursor-pointer"
                >
                  <LogOut size={18} aria-hidden="true" />
                  Sair
                </button>
              </form>
            </li>
          </ul>
        </div>
      </nav>

      {/* FOOTER */}
      <SidebarUserProfile initialUser={user} />
    </aside>
  );
}
