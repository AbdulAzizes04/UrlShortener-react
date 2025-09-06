// src/lib/logger.js
export function createLogger(opts) {
  if (!opts || !opts.endpoint) throw new Error('endpoint required')
  const endpoint = opts.endpoint
  const appName = opts.appName || 'app'
  const environment = opts.environment || 'development'
  const QUEUE_KEY = opts.queueKey || 'app_log_queue_v1'
  const FLUSH_MS = opts.flushIntervalMs || 5000

  async function post(payload) {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  function enqueue(payload) {
    try {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
      queue.push(payload)
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch {}
  }

  let flushScheduled = false
  async function flushQueue() {
    try {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
      if (!queue.length) return
      for (let i=0;i<queue.length;i++){
        try {
          const resp = await post(queue[i])
          if (!resp.ok) break
          const cur = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
          cur.shift()
          localStorage.setItem(QUEUE_KEY, JSON.stringify(cur))
        } catch { break }
      }
    } catch {}
    flushScheduled = false
  }

  function scheduleFlush(){ if (!flushScheduled) { flushScheduled = true; setTimeout(flushQueue, FLUSH_MS) } }

  function Log(stack, level, pkg, message, meta) {
    const payload = {
      timestamp: new Date().toISOString(),
      stack, level, package: pkg, message,
      appName, environment, meta: meta || {},
      origin: (typeof window !== 'undefined') ? window.location.href : 'node',
      userAgent: (typeof navigator !== 'undefined') ? navigator.userAgent : 'node'
    }
    (async ()=>{
      try {
        const r = await post(payload)
        if (!r.ok) { enqueue(payload); scheduleFlush() }
      } catch (e) { enqueue(payload); scheduleFlush() }
    })()

    try {
      if (level === 'ERROR') console.error('[LOG][ERROR]', stack, pkg, message, meta)
      else if (level === 'WARN') console.warn('[LOG][WARN]', stack, pkg, message)
      else console.info('[LOG][INFO]', stack, pkg, message)
    } catch {}
  }

  Log.debug = (stack,pkg,msg,meta)=>Log(stack,'DEBUG',pkg,msg,meta)
  Log.info  = (stack,pkg,msg,meta)=>Log(stack,'INFO',pkg,msg,meta)
  Log.warn  = (stack,pkg,msg,meta)=>Log(stack,'WARN',pkg,msg,meta)
  Log.error = (stack,pkg,msg,meta)=>Log(stack,'ERROR',pkg,msg,meta)

  if (typeof window !== 'undefined') scheduleFlush()
  return Log
}
