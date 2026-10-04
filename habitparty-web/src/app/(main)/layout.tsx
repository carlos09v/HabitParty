import { ReactNode } from "react";
import { Sidebar } from "../../components/layout/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    // Container principal: h-screen overflow-hidden impede rolagem na janela toda
    <div className="relative h-screen flex overflow-hidden">
      {/* 
        =========================================
        ORBES DE LUZ (Fundo Desfocado - Fiel ao Figma)
        ========================================= 
      */}
      {/* Bola Superior (Magenta) */}
      <div className="absolute top-[5%] left-[30%] w-125 h-125 rounded-full bg-magenta opacity-15 blur-[300px] pointer-events-none z-0" />

      {/* Bola Inferior Esquerda (Azul) */}
      <div className="absolute bottom-[-10%] left-[10%] w-150 h-150 rounded-full bg-blue opacity-15 blur-[300px] pointer-events-none z-0" />

      {/* Bola Inferior Direita (Magenta) */}
      <div className="absolute bottom-[5%] right-[5%] w-150 h-150 rounded-full bg-magenta opacity-15 blur-[300px] pointer-events-none z-0" />

      <Sidebar />

      {/* 
        =========================================
        ÁREA PRINCIPAL
        ========================================= 
      */}
      <main className="relative z-10 flex-1 h-screen overflow-hidden flex">
        {/* Todo o conteúdo das telas /dashboard, /inventory, etc., aparecerá aqui */}
        {children}
      </main>
    </div>
  );
}
