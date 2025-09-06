import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#00bcd4' },
    secondary: { main: '#ffffff' },
    background: { default: '#e0f7fa', paper: '#ffffff' },
    text: { primary: '#004d40', secondary: '#006064' },
  },
  shape: { borderRadius: 16 },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
)
