/**
 * Micro-utilitário de comemoração com partículas gamificadas.
 * 100% nativo do navegador via Web Animations API, sem dependências externas.
 */
export function triggerCelebrationConfetti(x?: number, y?: number) {
  if (typeof document === "undefined") return;

  const count = 38;
  const colors = [
    "#F59E0B", // Gold
    "#10B981", // Emerald
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#3B82F6", // Blue
    "#FBBF24", // Yellow
  ];

  const originX = x ?? window.innerWidth / 2;
  const originY = y ?? window.innerHeight / 2;

  const container = document.createElement("div");
  container.className =
    "fixed inset-0 pointer-events-none z-[9999] overflow-hidden";
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const color = colors[i % colors.length];
    const size = Math.floor(Math.random() * 8) + 6;
    const isCircle = Math.random() > 0.4;

    el.style.position = "absolute";
    el.style.left = `${originX}px`;
    el.style.top = `${originY}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundColor = color;
    el.style.borderRadius = isCircle ? "50%" : "2px";
    el.style.boxShadow = `0 0 6px ${color}80`;
    el.style.opacity = "1";

    const angle = Math.random() * 2 * Math.PI;
    const velocity = Math.random() * 280 + 100;
    const destX = Math.cos(angle) * velocity;
    const destY = Math.sin(angle) * velocity - 100;
    const rotation = Math.random() * 720 - 360;

    container.appendChild(el);

    el.animate(
      [
        { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
        {
          transform: `translate(${destX}px, ${destY + 160}px) rotate(${rotation}deg) scale(0.5)`,
          opacity: 0,
        },
      ],
      {
        duration: Math.random() * 600 + 850,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        fill: "forwards",
      },
    );
  }

  setTimeout(() => {
    container.remove();
  }, 1600);
}
