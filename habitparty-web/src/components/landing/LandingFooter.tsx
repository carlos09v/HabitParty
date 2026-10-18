import Image from "next/image";
import Link from "next/link";
import { LANDING_NAV_LINKS } from "@/constants/landing";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-700 dark:border-white/10 bg-card/70 dark:bg-neutral-900/60 pt-16 pb-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Coluna 1: Marca */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/assets/logo.png"
                alt="HabitParty"
                width={160}
                height={36}
                className="w-auto h-9 object-contain"
              />
            </Link>
            <p className="text-sm text-neutral-300 max-w-sm leading-relaxed">
              O sistema definitivo de produtividade gamificada. Transforme suas
              metas e rotinas diárias em uma jornada cósmica com XP, Ouro e
              recompensas reais.
            </p>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-4">
              Explorar
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              {LANDING_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="hover:text-gold transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Acesso */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-4">
              Acesso
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              <li>
                <Link
                  href="/signIn"
                  className="hover:text-gold transition-colors"
                >
                  Entrar na Conta
                </Link>
              </li>
              <li>
                <Link
                  href="/signUp"
                  className="hover:text-gold transition-colors"
                >
                  Cadastre-se Gratuitamente
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="hover:text-gold transition-colors"
                >
                  Central de Ajuda
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha Inferior com Copyright */}
        <div className="pt-8 border-t border-neutral-700/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>© {currentYear} HabitParty. Todos os direitos reservados.</p>
          <p className="text-center sm:text-right">
            Feito para quem escolheu levar a própria disciplina a sério.
          </p>
        </div>
      </div>
    </footer>
  );
}
