import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import '@/responsive.css'
import '@/cinematic-tv.css'
import '@/ios27.css' // Base iOS 27 foundation
import '@/visual-overhaul.css' // Final full-game visual layer
import '@/polish.css' // Τελικό γυάλισμα: ζεστό μαύρο/χρυσό, μπάρα έναρξης, δευτερεύοντα κουμπιά
import '@/wallpaper.css' // Wallpaper οθονών (ενεργό μόνο όταν οριστεί από το Admin)
import '@/lib/push' // πιάνει νωρίς το «Εγκατάσταση εφαρμογής» του browser
import { loadMedia, subscribeMediaRefresh } from '@/lib/media'

// PWA + push: service worker (μόνο στο deploy, όχι στο npm run dev)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

// Ξεκινά παράλληλα η λήψη του App και των media overrides.
// Το React αποδίδεται αφού εφαρμοστούν τα overrides (ή η τελευταία γνωστή ρύθμιση από cache),
// ώστε να μη φανεί προσωρινά το αρχικό περιεχόμενο αντί για τις ρυθμίσεις του Admin.
const appPromise = import('@/App.jsx');

// Όταν τα media φτάσουν αργότερα (αργό δίκτυο) ή αλλάξουν από το Admin σε στατική σελίδα,
// η εφαρμογή ξανα-σχεδιάζεται ώστε να δείξει τα σωστά αρχεία χωρίς χειροκίνητο refresh.
function Root({ App }) {
  const [rev, setRev] = React.useState(0);
  React.useEffect(() => subscribeMediaRefresh((kind) => { if (kind === 'remount') setRev((n) => n + 1); }), []);
  return <App key={rev} />;
}

loadMedia().finally(async () => {
  const { default: App } = await appPromise;
  ReactDOM.createRoot(document.getElementById('root')).render(<Root App={App} />)
})
