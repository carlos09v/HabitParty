let timerId = null;

self.addEventListener("message", (event) => {
  if (event.data === "start") {
    if (timerId !== null) {
      clearInterval(timerId);
    }
    timerId = setInterval(() => {
      self.postMessage("tick");
    }, 1000);
  } else if (event.data === "stop") {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }
});
