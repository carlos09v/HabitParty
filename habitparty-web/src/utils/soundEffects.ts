"use client";

import {
  type AmbientSoundType,
  useSoundPreferencesStore,
} from "@/store/soundPreferencesStore";

/**
 * Utilitário de Efeitos Sonoros Gamificados via Web Audio API.
 * 100% nativo do navegador, sem dependências externas, latência zero e offline.
 * Integrado ao SoundPreferencesStore para respeitar volume padrão e silenciamento.
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
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Executa uma ação garantindo que o AudioContext está em estado 'running'.
   * Se estiver suspenso por política do navegador, aguarda a resolução do resume().
   */
  private runWithContext(fn: (ctx: AudioContext) => void) {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          try {
            fn(ctx);
          } catch (_e) {}
        })
        .catch(() => {});
    } else {
      try {
        fn(ctx);
      } catch (_e) {}
    }
  }

  private getPreferences() {
    if (typeof window === "undefined") {
      return {
        uiSoundsEnabled: true,
        timerSoundsEnabled: true,
        timerVolume: 0.8,
        timerSoundType: "zen" as const,
        ambientVolume: 0.5,
      };
    }
    return useSoundPreferencesStore.getState();
  }

  /**
   * Som de Compra / Loja de Recompensas (Cha-Ching / Duas notas de moedas brilhantes)
   */
  playBuySound() {
    if (!this.getPreferences().uiSoundsEnabled) return;

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
    if (!this.getPreferences().uiSoundsEnabled) return;

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
   * Som Triunfal de Subida de Nível (Fanfarra épica gamificada + Acorde de vitória + Brilho celestial)
   */
  playLevelUpSound() {
    if (!this.getPreferences().uiSoundsEnabled) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Arpejo de Fanfarra Ascendente (G4 -> C5 -> E5 -> G5 -> C6)
      const fanfareNotes = [
        { freq: 392.0, time: 0, dur: 0.11, type: "triangle" as const },
        { freq: 523.25, time: 0.09, dur: 0.11, type: "triangle" as const },
        { freq: 659.25, time: 0.18, dur: 0.11, type: "triangle" as const },
        { freq: 783.99, time: 0.27, dur: 0.14, type: "triangle" as const },
        { freq: 1046.5, time: 0.4, dur: 1.1, type: "triangle" as const },
      ];

      fanfareNotes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + note.time;

        osc.type = note.type;
        osc.frequency.setValueAtTime(note.freq, startTime);

        const peakGain = note.time >= 0.4 ? 0.3 : 0.22;
        gain.gain.setValueAtTime(peakGain, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.dur);
      });

      // 2. Acorde de Vitória Sustentado (Dó Maior: C4, G4, C5, E5) no clímax da fanfarra
      const chordTime = now + 0.4;
      const chordDuration = 1.25;
      const chordFreqs = [261.63, 392.0, 523.25, 659.25];

      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, chordTime);

        gain.gain.setValueAtTime(0.14, chordTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          chordTime + chordDuration,
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(chordTime);
        osc.stop(chordTime + chordDuration);
      });

      // 3. Faíscas e Chimes Celestiais (Arpejo agudo cintilante: E6 -> G6 -> B6 -> C7)
      const chimes = [
        { freq: 1318.51, delay: 0.46 },
        { freq: 1567.98, delay: 0.54 },
        { freq: 1975.53, delay: 0.62 },
        { freq: 2093.0, delay: 0.7 },
      ];

      chimes.forEach((chime) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + chime.delay;
        const dur = 0.38;

        osc.type = "sine";
        osc.frequency.setValueAtTime(chime.freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch (_e) {
      // Falha silenciosa
    }
  }

  /**
   * Som de Clique/Tick da Roleta (Giro da fita passando pelo ponteiro)
   */
  playRouletteTickSound(pitchMultiplier = 1) {
    if (!this.getPreferences().uiSoundsEnabled) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(950 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(
        450 * pitchMultiplier,
        now + 0.035,
      );

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (_e) {
      // Falha silenciosa
    }
  }

  /**
   * Som de Vitória da Roleta (Revelação de Prêmio da Caixa Misteriosa)
   */
  playRouletteWinSound() {
    this.playLevelUpSound();
  }

  /**
   * Som de Progresso de Hábito Positivo (Pop / Ding ágil e satisfatório)
   */
  playHabitSound() {
    if (!this.getPreferences().uiSoundsEnabled) return;

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

  /**
   * Som de Penalidade / Multa de Hábito Negativo (Tom grave descendente)
   */
  playPenaltySound() {
    if (!this.getPreferences().uiSoundsEnabled) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (_e) {
      // Falha silenciosa
    }
  }

  /**
   * Som de Conclusão de Sessão de Foco / Pomodoro (Sino Zen suave / Chime de sino tibetano)
   */
  playFocusSessionCompleteSound(volumeOverride?: number) {
    const prefs = this.getPreferences();
    if (!prefs.timerSoundsEnabled && volumeOverride === undefined) return;
    const volume = volumeOverride ?? prefs.timerVolume;
    if (volume <= 0) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Frequência fundamental de sino suave (528Hz - nota de cura/foco)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(528, now);
      osc.frequency.exponentialRampToValueAtTime(1056, now + 0.15);

      gain.gain.setValueAtTime(0.3 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (_e) {
      // Falha silenciosa
    }
  }

  /**
   * Som de Início de Sessão de Foco (Zen ou Arcade)
   */
  playTimerStartSound(type?: "zen" | "arcade", volumeOverride?: number) {
    const prefs = this.getPreferences();
    if (volumeOverride === undefined && !prefs.timerSoundsEnabled) return;
    const volume = volumeOverride ?? prefs.timerVolume ?? 0.8;
    if (volume <= 0) return;

    const chosenType = type || prefs.timerSoundType || "zen";

    this.runWithContext((ctx) => {
      const now = ctx.currentTime;
      const safeVolume = Math.max(0.1, volume);

      if (chosenType === "zen") {
        // Sino Harmônico Suave Zen (528Hz + harmônico 264Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(528, now);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(264, now);

        gain.gain.setValueAtTime(0.25 * safeVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.9);
        osc2.stop(now + 0.9);
      } else {
        // Arcade Start: 2 bips ascendentes rápidos (Dó5 -> Sol5)
        const tones = [
          { freq: 523.25, time: 0, dur: 0.1 },
          { freq: 783.99, time: 0.09, dur: 0.16 },
        ];

        tones.forEach((tone) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + tone.time;

          osc.type = "triangle";
          osc.frequency.setValueAtTime(tone.freq, startTime);

          gain.gain.setValueAtTime(0.22 * safeVolume, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + tone.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + tone.dur);
        });
      }
    });
  }

  /**
   * Som de Início de Pausa (Arpejo suave descendente para relaxamento: F5 -> D5 -> A4)
   */
  playBreakStartSound(volumeOverride?: number) {
    const prefs = this.getPreferences();
    if (!prefs.timerSoundsEnabled && volumeOverride === undefined) return;
    const volume = volumeOverride ?? prefs.timerVolume;
    if (volume <= 0) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const freqs = [698.46, 587.33, 440.0]; // F5, D5, A4
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.12;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2 * volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    } catch (_e) {
      // Falha silenciosa
    }
  }

  /**
   * Som de Fim de Pausa / Retorno ao Foco (Arpejo animado ascendente: A4 -> D5 -> F#5)
   */
  playBreakEndSound(volumeOverride?: number) {
    const prefs = this.getPreferences();
    if (!prefs.timerSoundsEnabled && volumeOverride === undefined) return;
    const volume = volumeOverride ?? prefs.timerVolume;
    if (volume <= 0) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const freqs = [440.0, 587.33, 739.99]; // A4, D5, F#5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.1;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25 * volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (_e) {
      // Falha silenciosa
    }
  }

  // ========================================================
  // RUÍDOS AMBIENTE PROCEDURAIS DE FOCO (BENEFÍCIO PREMIUM)
  // Gerados 100% via Web Audio API, sem download de áudio
  // ========================================================
  private ambientGainNode: GainNode | null = null;
  private ambientCleanupFns: (() => void)[] = [];
  private activeAmbientType: AmbientSoundType = "none";
  private cachedPinkNoiseBuffer: AudioBuffer | null = null;

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    if (
      this.cachedPinkNoiseBuffer &&
      this.cachedPinkNoiseBuffer.sampleRate === ctx.sampleRate
    ) {
      return this.cachedPinkNoiseBuffer;
    }

    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    // Suavização das bordas para loop 100% contínuo e orgânico sem cliques
    const fadeSamples = Math.floor(ctx.sampleRate * 0.15);
    for (let i = 0; i < fadeSamples; i++) {
      const factor = i / fadeSamples;
      output[i] =
        output[i] * factor +
        output[bufferSize - fadeSamples + i] * (1 - factor);
    }

    this.cachedPinkNoiseBuffer = buffer;
    return buffer;
  }

  getActiveAmbientType(): AmbientSoundType {
    return this.activeAmbientType;
  }

  stopAmbientSound() {
    this.ambientCleanupFns.forEach((fn) => {
      try {
        fn();
      } catch (_e) {}
    });
    this.ambientCleanupFns = [];

    if (this.ambientGainNode) {
      try {
        const ctx = this.getContext();
        if (ctx) {
          this.ambientGainNode.gain.setValueAtTime(0, ctx.currentTime);
        }
        this.ambientGainNode.disconnect();
      } catch (_e) {}
      this.ambientGainNode = null;
    }
    this.activeAmbientType = "none";
  }

  setAmbientVolume(volume: number) {
    if (this.ambientGainNode) {
      try {
        const ctx = this.getContext();
        if (ctx) {
          const safeVolume = Math.max(0, Math.min(1, volume)) * 0.35;
          this.ambientGainNode.gain.setValueAtTime(safeVolume, ctx.currentTime);
        }
      } catch (_e) {}
    }
  }

  startAmbientSound(type: AmbientSoundType, volumeOverride?: number) {
    this.stopAmbientSound();
    if (type === "none") return;

    this.runWithContext((ctx) => {
      const prefs = this.getPreferences();
      const volume = volumeOverride ?? prefs.ambientVolume ?? 0.5;
      const safeVolume = Math.max(0, Math.min(1, volume)) * 0.35;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(safeVolume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.ambientGainNode = masterGain;

      if (type === "rain") {
        // Chuva Suave: Ruído rosa filtrado com leve modulação de rajada
        const noiseBuffer = this.createPinkNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = "highpass";
        hpFilter.frequency.setValueAtTime(240, ctx.currentTime);

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.setValueAtTime(1100, ctx.currentTime);

        source.connect(hpFilter);
        hpFilter.connect(lpFilter);
        lpFilter.connect(masterGain);

        source.start(0);
        this.ambientCleanupFns.push(() => {
          try {
            source.stop();
            source.disconnect();
          } catch (_e) {}
        });
      } else if (type === "cafe") {
        // Cafeteria: Ruído suave com corte em frequências médias simulando murmúrio distante
        const noiseBuffer = this.createPinkNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.setValueAtTime(650, ctx.currentTime);

        const peakFilter = ctx.createBiquadFilter();
        peakFilter.type = "peaking";
        peakFilter.frequency.setValueAtTime(400, ctx.currentTime);
        peakFilter.gain.setValueAtTime(4, ctx.currentTime);

        source.connect(lpFilter);
        lpFilter.connect(peakFilter);
        peakFilter.connect(masterGain);

        source.start(0);
        this.ambientCleanupFns.push(() => {
          try {
            source.stop();
            source.disconnect();
          } catch (_e) {}
        });
      } else if (type === "lofi") {
        // Lofi Zen: Acorde harmônico quente e contínuo (C3, G3, C4, E4) com filtro suave
        const freqs = [130.81, 196.0, 261.63, 329.63];
        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.setValueAtTime(420, ctx.currentTime);
        lpFilter.connect(masterGain);

        const oscs: OscillatorNode[] = [];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = i % 2 === 0 ? "sine" : "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          oscGain.gain.setValueAtTime(0.2, ctx.currentTime);

          osc.connect(oscGain);
          oscGain.connect(lpFilter);
          osc.start(0);
          oscs.push(osc);
        });

        this.ambientCleanupFns.push(() => {
          oscs.forEach((osc) => {
            try {
              osc.stop();
              osc.disconnect();
            } catch (_e) {}
          });
        });
      } else if (type === "fire") {
        // Fogueira Cósmica: Fundo quente de graves + estalidos periódicos de lenha
        const noiseBuffer = this.createPinkNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.setValueAtTime(400, ctx.currentTime);

        source.connect(lpFilter);
        lpFilter.connect(masterGain);
        source.start(0);

        // Estalidos aleatórios de brasas
        const intervalId = setInterval(() => {
          try {
            if (!this.ambientGainNode) return;
            const now = ctx.currentTime;
            const popOsc = ctx.createOscillator();
            const popGain = ctx.createGain();
            popOsc.type = "sine";
            popOsc.frequency.setValueAtTime(1200 + Math.random() * 1800, now);
            popGain.gain.setValueAtTime(0.08, now);
            popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

            popOsc.connect(popGain);
            popGain.connect(masterGain);
            popOsc.start(now);
            popOsc.stop(now + 0.035);
          } catch (_e) {}
        }, 320);

        this.ambientCleanupFns.push(() => {
          clearInterval(intervalId);
          try {
            source.stop();
            source.disconnect();
          } catch (_e) {}
        });
      }

      this.activeAmbientType = type;
    });
  }
}

export const soundEffects = new SoundEffectsManager();
