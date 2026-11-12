import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import { loadMedia } from '@/lib/media'

// Πρώτα φορτώνονται οι δικές σου φωτογραφίες/βίντεο (Admin → Φωτογραφίες & Βίντεο), μετά ανοίγει η εφαρμογή.
loadMedia().finally(async () => {
  const { default: App } = await import('@/App.jsx')
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
})
