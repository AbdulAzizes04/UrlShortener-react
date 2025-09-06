// src/lib/logger.ts
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'TRACE'

export interface LoggerOptions {
  endpoint: string // e.g. "http://localhost:4000/logs"
  appName?: string
  environment?: string
  queueKey?: string
  flushIntervalMs?: number
}

export function createLogger(opts: LoggerOptions) {
  if (!opts || !opts.endpoint) {
    throw new Error('createLogger requires an endpoint option')
  }

  const endpoint = opts.endpoint
  const appName = opts.appName ?? 'app'
  const environment = opts.environment ?? 'development'
  const QUEUE_KEY = opts.queueKey ?? 'app_log_queue_v1'
  const FLUSH_MS = opts.flushIntervalMs ?? 5000

  // helper: try to call fetch (works in browser; in Node you need node >=18 or provide global fetch)
  async function post(payload: any) {
    const body = JSON.stringify(payload)
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  }

  // enqueue to localStorage for retry if offline / failed
  function enqueue(payload: any) {
    try {
      const raw = localStorage.getItem(QUEUE_KEY) || '[]'
      const queue = JSON.parse(raw)
      queue.push(payload)
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch (e) {
      // if localStorage not available, fail silently
    }
  }

  let flushScheduled = false
  async function flushQueue() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(QUEUE_KEY) || '[]'
      const queue: any[] = JSON.parse(raw)
      if (!queue.length) return
      // attempt to send queue items in order
      for (let i = 0; i < queue.length; ++i) {
        try {
          const resp = await post(queue[i])
          if (!resp.ok) break // stop if server rejects
          // remove first element
          const cur = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
          cur.shift()
          localStorage.setItem(QUEUE_KEY, JSON.stringify(cur))
        } catch {
          break // if network fails, stop
        }
      }
    } catch (e) {
      // ignore
    } finally {
      flushScheduled = false
    }
  }

  function scheduleFlush() {
    if (flushScheduled) return
    flushScheduled = true
    setTimeout(() => flushQueue(), FLUSH_MS)
  }

  // the exported Log function (matches required signature)
  function Log(stack: string, level: LogLevel, pkg: string, message: string, meta?: Record<string, any>) {
    const payload = {
      timestamp: new Date().toISOString(),
      stack,
      level,
      package: pkg,
      message,
      appName,
      environment,
      meta: meta || {},
      origin: typeof window !== 'undefined' ? window.location.href : 'node',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
    };

    // fire-and-forget attempt
    (async () => {
      try {
        const resp = await post(payload);
        if (!resp.ok) {
          // server error -> queue
          enqueue(payload);
          scheduleFlush();
        }
      } catch (err) {
        // network error -> queue
        try { enqueue(payload); } catch (e) {}
        scheduleFlush();
      }
    })();

    // convenience console debug for dev (won't replace server logging)
    try {
      if (level === 'ERROR') {
        console.error(`[LOG][${level}] ${stack} ${pkg}: ${message}`, meta ?? '')
      } else if (level === 'WARN') {
        console.warn(`[LOG][${level}] ${stack} ${pkg}: ${message}`)
      } else {
        console.info(`[LOG][${level}] ${stack} ${pkg}: ${message}`)
      }
    } catch {}
  }

  // helper methods
  Log.debug = (stack: string, pkg: string, message: string, meta?: any) => Log(stack, 'DEBUG', pkg, message, meta)
  Log.info  = (stack: string, pkg: string, message: string, meta?: any) => Log(stack, 'INFO', pkg, message, meta)
  Log.warn  = (stack: string, pkg: string, message: string, meta?: any) => Log(stack, 'WARN', pkg, message, meta)
  Log.error = (stack: string, pkg: string, message: string, meta?: any) => Log(stack, 'ERROR', pkg, message, meta)

  // flush queued logs on page load (browser)
  if (typeof window !== 'undefined') scheduleFlush()

  return Log as typeof Log & {
    debug: typeof Log.debug
    info: typeof Log.info
    warn: typeof Log.warn
    error: typeof Log.error
  }
}
