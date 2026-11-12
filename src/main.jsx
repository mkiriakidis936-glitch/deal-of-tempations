import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import '@/lib/push' // πιάνει νωρίς το «Εγκατάσταση εφαρμογής» του browser
import { loadMedia } from '@/lib/media'

// PWA + push: service worker (μόνο στο deploy, όχι στο npm run dev)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

// Πρώτα φορτώνονται οι δικές σου φωτογραφίες/βίντεο (Admin → Φωτογραφίες & Βίντεο), μετά ανοίγει η εφαρμογή.
loadMedia().finally(async () => {
  const { default: App } = await import('@/App.jsx')
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
})
