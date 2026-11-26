let timerId = null;
let expectedTickAt = 0;

function clearScheduledTick() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function scheduleNextTick() {
  const now = Date.now();
  if (expectedTickAt === 0 || now - expectedTickAt > 2000) {
    expectedTickAt = now + 1000;
  } else {
    expectedTickAt += 1000;
  }
  const delay = Math.max(50, expectedTickAt - now);
  timerId = setTimeout(() => {
    timerId = null;
    self.postMessage("tick");
    if (expectedTickAt !== 0) {
      scheduleNextTick();
    }
  }, delay);
}

self.addEventListener("message", (event) => {
  if (event.data === "start") {
    clearScheduledTick();
    expectedTickAt = Date.now();
    scheduleNextTick();
  } else if (event.data === "stop") {
    expectedTickAt = 0;
    clearScheduledTick();
  }
});
