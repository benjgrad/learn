type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  event: string;
  [key: string]: unknown;
}

function log(entry: LogEntry) {
  const output = { ...entry, timestamp: new Date().toISOString() };
  if (entry.level === "error") {
    console.error(JSON.stringify(output));
  } else if (entry.level === "warn") {
    console.warn(JSON.stringify(output));
  } else {
    console.log(JSON.stringify(output));
  }
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) =>
    log({ level: "info", event, ...data }),
  warn: (event: string, data?: Record<string, unknown>) =>
    log({ level: "warn", event, ...data }),
  error: (event: string, data?: Record<string, unknown>) =>
    log({ level: "error", event, ...data }),
};
