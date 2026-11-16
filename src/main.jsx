import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import '@/responsive.css'
import '@/cinematic-tv.css'
import '@/visual-overhaul.css'
import '@/lib/push' // πιάνει νωρίς το «Εγκατάσταση εφαρμογής» του browser
import { loadMedia } from '@/lib/media'

// PWA + push: service worker (μόνο στο deploy, όχι στο npm run dev)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

// Ξεκινά παράλληλα η λήψη του App και των media overrides.
// Το React αποδίδεται μόνο αφού εφαρμοστούν τα overrides, ώστε να μη φανεί
// προσωρινά το αρχικό περιεχόμενο αντί για τις ρυθμίσεις του Admin.
const appPromise = import('@/App.jsx');
loadMedia().finally(async () => {
  const { default: App } = await appPromise;
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
})
