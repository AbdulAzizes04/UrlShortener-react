// test-server.js
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const LOG_FILE = path.resolve(__dirname, 'logs.ndjson')

app.post('/logs', (req, res) => {
  const payload = req.body || {}
  // add server-received timestamp
  payload.receivedAt = new Date().toISOString()
  console.log('[LOG]', payload.level, payload.stack, payload.package, '-', payload.message)
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(payload) + '\n')
  } catch (e) {
    console.error('Failed to write log', e)
  }
  res.status(201).json({ ok: true })
})

const port = process.env.LOG_SERVER_PORT || 4000
app.listen(port, () => console.log(`Log test server listening on http://localhost:${port}/logs`))
