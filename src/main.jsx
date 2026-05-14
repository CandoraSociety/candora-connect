import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { fetchAndApplyBranding } from '@/lib/branding'

// Apply branding colors on app load
fetchAndApplyBranding()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)