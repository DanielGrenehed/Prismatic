window.available_loggers = [];
window.log = [];

window.addLog = (name) => {
  if (window.available_loggers.includes(name)) {
    if (!window.log.includes(name)) window.log.push(name);
      return "Logging turned on for " + name;
  } else {
    console.error("Tried to add '" + name + "' as log");
  }
};

window.addLogs = (...logs) => {logs.forEach((l) => window.addLog(l));};
window.logAll = () => {window.log = window.available_loggers;};
window.logNone = () => {window.log = []};

function createLogger(key) {
  window.available_loggers.push(key);
  const isLogging = () => {return window?.log?.includes(key);};
  const log = (...args) => {if (isLogging()) console.log("%c"+key + " %c->%c ", "color: cyan;", "color:yellow;", "color: inherit;", ...args);};
  return {isLogging, log};
}

export {createLogger};
