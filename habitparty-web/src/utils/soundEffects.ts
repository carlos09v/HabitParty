"use client";

/**
 * Utilitário de Efeitos Sonoros Gamificados via Web Audio API.
 * 100% nativo do navegador, sem dependências externas, latência zero e offline.
 */
class SoundEffectsManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Som de Compra / Loja de Recompensas (Cha-Ching / Duas notas de moedas brilhantes)
   */
  playBuySound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Nota 1 (Si5 - 987Hz) para Nota 2 (Mi6 - 1318Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(987.77, now);
      osc1.frequency.setValueAtTime(1318.51, now + 0.08);

      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.45);

      // Chime harmônico agudo (Si6) para brilho metálico de moeda
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1975.53, now + 0.08);

      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.4);
    } catch (_e) {
      // Falha silenciosa caso o navegador restrinja áudio
    }
  }

  /**
   * Som de Conclusão de Tarefa / Quest (Arpejo triunfante ascendente C5 -> E5 -> G5 -> C6)
   */
  playTaskCompleteSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // C5, E5, G5, C6
      const frequencies = [523.25, 659.25, 783.99, 1046.5];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.065;
        const duration = 0.28;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (_e) {
      // Falha silenciosa
    }
  }

  /**
   * Som de Progresso de Hábito Positivo (Pop / Ding ágil e satisfatório)
   */
  playHabitSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (_e) {
      // Falha silenciosa
    }
  }
}

export const soundEffects = new SoundEffectsManager();
