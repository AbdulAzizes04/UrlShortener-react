import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link as RouterLink, useParams, useNavigate } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, Container, TextField,
  Paper, Stack, Card, CardContent, Divider, Box
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import QueryStatsIcon from '@mui/icons-material/QueryStats'

// --- Store with logging + localStorage ---
function useStore() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('appState')
    return saved ? JSON.parse(saved) : { links: [], logs: [] }
  })

  const dispatch = (action) => {
    let newState = { ...state }
    if (action.type === 'ADD_LINKS') {
      newState.links = [...newState.links, ...action.payload]
    }
    if (action.type === 'VISIT') {
      newState.links = newState.links.map(l =>
        l.code === action.code ? { ...l, clicks: l.clicks + 1 } : l
      )
    }
    newState.logs = [...newState.logs, { action, time: new Date().toISOString() }]
    setState(newState)
    localStorage.setItem('appState', JSON.stringify(newState))
  }
  return { state, dispatch }
}

// --- Shorten Page ---
function ShortenPage({ store }) {
  const [urls, setUrls] = useState([''])
  const [expiry, setExpiry] = useState(30)
  const [created, setCreated] = useState([])

  const addUrlField = () => {
    if (urls.length < 5) setUrls([...urls, ''])
  }

  const handleChange = (i, val) => {
    const arr = [...urls]
    arr[i] = val
    setUrls(arr)
  }

  const shorten = () => {
    const now = Date.now()
    const newLinks = urls.filter(Boolean).map(u => ({
      original: u,
      code: Math.random().toString(36).substring(2, 7),
      expiresAt: new Date(now + expiry * 60000).toISOString(),
      clicks: 0
    }))
    store.dispatch({ type: 'ADD_LINKS', payload: newLinks })
    setCreated(newLinks)   // show newly created links
    setUrls([''])
  }

  return (
    <Container sx={{ py: 4 }}>
      <Paper sx={{ p: 3, bgcolor: 'white', boxShadow: 3 }}>
        <Typography variant="h5" color="primary" gutterBottom>
          Shorten Your URLs
        </Typography>
        <Stack spacing={2}>
          {urls.map((u, i) => (
            <TextField
              key={i}
              label={`URL ${i + 1}`}
              value={u}
              onChange={(e) => handleChange(i, e.target.value)}
              fullWidth
            />
          ))}
          <Button
            variant="outlined"
            onClick={addUrlField}
            disabled={urls.length >= 5}
            sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}
          >
            Add More
          </Button>
          <TextField
            label="Expiry (minutes)"
            type="number"
            value={expiry}
            onChange={(e) => setExpiry(parseInt(e.target.value))}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={shorten}
            sx={{ borderRadius: 8, fontWeight: 'bold' }}
          >
            Shorten
          </Button>
        </Stack>

        {/* Show newly shortened links */}
        {created.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Shortened Links
            </Typography>
            <Stack spacing={2}>
              {created.map((l, i) => (
                <Card
                  key={i}
                  sx={{
                    borderLeft: '6px solid #00bcd4',
                    boxShadow: 3,
                    p: 2,
                    bgcolor: '#f0fcff'
                  }}
                >
                  <CardContent>
                    <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Original: <span style={{ color: '#004d40' }}>{l.original}</span>
                    </Typography>
                    <Typography variant="body2">
                      Shortened:{" "}
                      <a
                        href={`/${l.code}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#00bcd4', fontWeight: 'bold' }}
                      >
                        {window.location.origin}/{l.code}
                      </a>
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: '#006064' }}>
                      Expires at: {new Date(l.expiresAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

// --- Stats Page ---
function StatsPage({ store }) {
  const { links } = store.state
  const active = links.filter(l => new Date(l.expiresAt) > new Date()).length
  const clicks = links.reduce((a, b) => a + b.clicks, 0)

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" color="primary" gutterBottom>
        Statistics
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1, boxShadow: 3, borderLeft: '6px solid #00bcd4' }}>
          <CardContent>
            <Typography variant="overline" color="primary">Total Links</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{links.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, boxShadow: 3, borderLeft: '6px solid #00bcd4' }}>
          <CardContent>
            <Typography variant="overline" color="primary">Active Links</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{active}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, boxShadow: 3, borderLeft: '6px solid #00bcd4' }}>
          <CardContent>
            <Typography variant="overline" color="primary">Total Clicks</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{clicks}</Typography>
          </CardContent>
        </Card>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={2}>
        {links.map((l, i) => (
          <Card key={i} sx={{ boxShadow: 2, p: 2, borderLeft: '4px solid #00bcd4', bgcolor: '#f0fcff' }}>
            <CardContent>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{l.original}</Typography>
              <Typography variant="body2">
                <a href={`/${l.code}`} target="_blank" rel="noreferrer" style={{ color: '#00bcd4' }}>
                  {window.location.origin}/{l.code}
                </a>
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Exp: {new Date(l.expiresAt).toLocaleString()} | Clicks: {l.clicks}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  )
}

// --- Redirect Page ---
function RedirectPage({ store }) {
  const { code } = useParams()
  const navigate = useNavigate()
  const link = store.state.links.find(l => l.code === code)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!link) {
      setMsg('Shortcode not found')
      return
    }
    const exp = new Date(link.expiresAt).getTime()
    if (Date.now() > exp) {
      setMsg('This link has expired')
      return
    }
    store.dispatch({ type: 'VISIT', code })
    window.location.href = link.original
  }, [code])

  return (
    <Container sx={{ py: 5 }}>
      <Paper sx={{ p: 3, bgcolor: 'white', boxShadow: 3 }}>
        <Typography>{msg || 'Redirecting...'}</Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/shorten')}
          sx={{ mt: 2, borderColor: '#00bcd4', color: '#00bcd4' }}
        >
          Go Home
        </Button>
      </Paper>
    </Container>
  )
}

// --- Layout with Cyan Header ---
function Layout({ children }) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: '#00bcd4' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'white', fontWeight: 'bold' }}>
            AffordMed URL Shortener
          </Typography>
          <Button color="inherit" component={RouterLink} to="/shorten" startIcon={<HomeIcon />} sx={{ color: 'white' }}>
            Shorten
          </Button>
          <Button color="inherit" component={RouterLink} to="/stats" startIcon={<QueryStatsIcon />} sx={{ color: 'white' }}>
            Stats
          </Button>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
  )
}

function App() {
  const store = useStore()
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ShortenPage store={store} />} />
          <Route path="/shorten" element={<ShortenPage store={store} />} />
          <Route path="/stats" element={<StatsPage store={store} />} />
          <Route path="/:code" element={<RedirectPage store={store} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
