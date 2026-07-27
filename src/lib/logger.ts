/**
 * Minimal structured logger. Keeps output grep-friendly without pulling in
 * a logging framework.
 */

type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, msg: string, extra?: Record<string, unknown>) {
  const line = {
    t: new Date().toISOString(),
    level,
    msg,
    ...extra,
  };
  const out = JSON.stringify(line);
  if (level === "error") console.error(out);
  else console.log(out);
}

export const logger = {
  debug: (msg: string, extra?: Record<string, unknown>) =>
    process.env.DEBUG ? log("debug", msg, extra) : undefined,
  info: (msg: string, extra?: Record<string, unknown>) => log("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => log("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => log("error", msg, extra),
};
