type TelemetryPayload = Record<string, unknown>;

const KEY = 'heritage.telemetry.buffer';

function safeRead(): Array<{ event: string; payload: TelemetryPayload; at: string }> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function safeWrite(items: Array<{ event: string; payload: TelemetryPayload; at: string }>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(-200)));
  } catch {
    // 忽略存储异常
  }
}

export function trackEvent(event: string, payload: TelemetryPayload = {}) {
  const at = new Date().toISOString();
  const items = safeRead();
  items.push({ event, payload, at });
  safeWrite(items);
  console.log(`[telemetry] ${event}`, payload);
}

export function readTelemetry() {
  return safeRead();
}
