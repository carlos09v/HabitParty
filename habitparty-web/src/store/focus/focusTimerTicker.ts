let globalTimerInterval: ReturnType<typeof setInterval> | null = null;
let globalTimerWorker: Worker | null = null;
let activeGlobalTickFn: (() => void) | null = null;
let workerUnavailable = false;

function startFallbackInterval() {
  if (typeof window === "undefined" || globalTimerInterval) return;
  globalTimerInterval = setInterval(() => {
    activeGlobalTickFn?.();
  }, 1000);
}

function ensureTimerWorker(): Worker | null {
  if (
    workerUnavailable ||
    typeof window === "undefined" ||
    typeof Worker === "undefined"
  ) {
    return null;
  }
  if (globalTimerWorker) return globalTimerWorker;
  try {
    const worker = new Worker("/focus-timer-worker.js");
    worker.onmessage = (event: MessageEvent) => {
      if (event.data === "tick") {
        // Worker ativo: dispensa o interval de fallback sujeito a throttling em segundo plano
        if (globalTimerInterval) {
          clearInterval(globalTimerInterval);
          globalTimerInterval = null;
        }
        activeGlobalTickFn?.();
      }
    };
    worker.onerror = () => {
      workerUnavailable = true;
      try {
        worker.terminate();
      } catch {
        // Ignore terminate error
      }
      if (globalTimerWorker === worker) {
        globalTimerWorker = null;
      }
      if (activeGlobalTickFn) {
        startFallbackInterval();
      }
    };
    globalTimerWorker = worker;
    return worker;
  } catch {
    workerUnavailable = true;
    return null;
  }
}

/**
 * Inicia o ticker global usando Web Worker como fonte primária e `setInterval` como fallback.
 */
export function startGlobalTicker(tickFn: () => void) {
  if (typeof window === "undefined") return;
  activeGlobalTickFn = tickFn;

  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
    globalTimerInterval = null;
  }
  // Mantém fallback ativo até o Worker confirmar o primeiro tick
  startFallbackInterval();

  const worker = ensureTimerWorker();
  if (worker) {
    try {
      worker.postMessage("start");
    } catch {
      // Fallback já está ativo
    }
  }
}

/**
 * Interrompe ticker fallback e sinaliza pausa ao Web Worker global.
 */
export function stopGlobalTicker() {
  activeGlobalTickFn = null;
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
    globalTimerInterval = null;
  }
  if (globalTimerWorker) {
    try {
      globalTimerWorker.postMessage("stop");
    } catch {
      // Ignore postMessage error
    }
  }
}
