import { Bell, LogOut } from "lucide-react";
import Image from "next/image";
import { signOut } from "@/actions/auth";
import { NAV_FOOTER, NAV_SECTIONS } from "@/constants/navigation";
import { SidebarLink } from "./SidebarLink";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Sidebar() {
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
      <footer className="p-3.5 border-t border-primary/30 bg-primary-dark/20 z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-full bg-neutral-300 border-2 border-neutral-50 shrink-0"
            aria-hidden="true"
          ></div>
          <div className="flex flex-col min-w-0">
            <span className="text-body-s font-bold text-neutral-50 truncate">
              Carlos Vinicius
            </span>
            <span className="text-tiny text-neutral-300 truncate">
              Nível 5 - Novato
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex-1 min-w-0">
            <div
              className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={12}
              aria-valuemin={0}
              aria-valuemax={1200}
            >
              <div className="h-full bg-gold w-[10%] rounded-full"></div>
            </div>
            <p className="text-tiny text-neutral-300 text-center mt-0.5">
              (12/1200)
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0" title="26 moedas">
            <div className="w-3.5 h-3.5 rounded-full bg-gold border border-orange-500 flex items-center justify-center shadow-sm">
              <span className="text-[7px] text-neutral-900 font-bold">H</span>
            </div>
            <span className="text-body-s font-bold text-neutral-50">26</span>
          </div>
        </div>
      </footer>
    </aside>
  );
}
