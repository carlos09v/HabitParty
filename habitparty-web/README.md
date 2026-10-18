# 🎮 HabitParty Web (Frontend)

Interface web moderna do HabitParty construída com **Next.js 15+ (App Router)**, **React 19**, **Tailwind CSS v4** e **Biome**.

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# Checar linting e formatação
npm run lint

# Formatar arquivos com Biome
npm run format
```

---

## 🎁 Vitrine de Recompensas & Caixas Misteriosas (Loot Tables RNG)

O módulo de Recompensas permite que o usuário converta moedas (🪙) ganhas na conclusão de tarefas e sessões de foco em momentos reais de lazer e descanso.

### Modalidades de Recompensa
1. **Uso Único:** Consumo pontual que é arquivado na Mochila após o uso (ex: pedir delivery, comprar um café especial).
2. **Baseado em Tempo (Cupom):** Cupons de tempo pré-fixado (ex: 30m, 60m) que podem ser enviados e cronometrados no Palco de Foco.
3. **Caixa Misteriosa (RNG Gamificado):** Sorteio de prêmios aleatórios por nível de raridade, com custos equilibrados para não quebrar a economia do usuário:

| Nível / Pacote | Cor Tema | Preço Sugerido | Chances de Drop (RNG) | Proposta / Conceito |
| :--- | :--- | :--- | :--- | :--- |
| **Básica (Basic)** | 🟢 Verde (`success-500`) | **5,00 🪙** | • 60% Pausa Curta (10-15m)<br>• 30% Lazer Médio (30m)<br>• 10% Sessão Focada (45m + 1 🪙 bônus) | Micro-recompensas para manter o ritmo sem culpa e sem pesar no saldo. |
| **Premium** | 🔵 Ciano (`info`) | **15,00 🪙** | • 50% Lazer Padrão (45-60m)<br>• 35% Lazer Estendido (75-90m)<br>• 15% Noite Gamer / Cinema (120m) | Recompensa de meio de semana para celebrar metas com jogos e séries. |
| **Épica (Epic)** | 🟣 Magenta (`magenta`) | **35,00 🪙** | • 50% Bloco Estendido (120m)<br>• 35% Noite Livre (180m)<br>• 15% Tarde Inteira de Desconexão (240m) | Recompensa substancial de final de semana para coroar dias consistentes. |
| **Lendária (Legendary)** | 🟡 Dourado (`gold`) | **80,00 🪙** | • 60% Day-Off Parcial de Elite (240m)<br>• 30% Day-Off Integral<br>• 10% Celebração Absoluta (Final de Semana Livre) | O ápice de semanas de disciplina e ofensivas intactas. Um marco memorável. |

---

## 🏛️ Padrões de Arquitetura

- **Component Boundaries:** Server Components por padrão (`RSC`), com client components (`"use client"`) restritos às folhas interativas.
- **Design Tokens:** Variáveis semânticas em `globals.css` (@theme) sincronizadas com o Figma do projeto.
- **Micro-interações:** Hover com escala, anel radiante de seleção e popovers ancorados de pré-visualização.
