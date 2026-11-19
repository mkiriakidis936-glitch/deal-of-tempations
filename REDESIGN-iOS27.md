# Redesign · iOS 27 Dark — Μαύρο & Χρυσό

Μόνο εμφάνιση. Καμία αλλαγή σε state, routes, κανόνες παιχνιδιού ή δεδομένα.

## Τι άλλαξε (και γιατί καλύπτει ΟΛΕΣ τις οθόνες)
Η εφαρμογή είναι token-driven, οπότε το redesign μπήκε στο κέντρο και όχι οθόνη-οθόνη:

| Αρχείο | Ρόλος |
|---|---|
| `src/ios27.css` (ΝΕΟ, φορτώνεται τελευταίο στο `main.jsx`) | Tokens, Liquid Glass υλικά, κάψουλες-κουμπιά, inputs, spring κίνηση, tab bar, Tablet/Admin, TV, Modes, Invitation/Promo, fallbacks προσβασιμότητας |
| `tailwind.config.js` | Όλες οι παλέτες pink/fuchsia/purple/cyan/emerald/amber… γίνονται μία χρυσή κλίμακα. Το `red` γίνεται iOS red (μόνο κίνδυνος/ΣΤΟΠ). Τα γκρι γίνονται iOS grays. Έτσι εκατοντάδες `bg-pink-950`, `text-emerald-…` κ.λπ. γίνονται αυτόματα μαύρο/χρυσό |
| `components/play/MobileTabBar.jsx` | Πλωτή γυάλινη tab bar στο κάτω μέρος (όπως native iOS) + `TabBarSpacer` |
| `pages/Play.jsx` | Προστέθηκε μόνο το spacer κάτω από την tab bar |
| `components/modes/ModeShell.jsx`, `ModeTV.jsx`, `data/modes/modeRegistry.js` | Large-title χρυσός τίτλος, χρονόμετρο-κάψουλα, μαύρα/χρυσά themes ανά mode |
| `components/ui/toaster.jsx` | Toasts σε γυάλινη κάψουλα |
| `index.css`, `index.html`, manifests | Γραμματοσειρά SF Pro (Inter ως fallback σε non-Apple), `theme-color` #000 |
| ~24 αρχεία με inline χρώματα | Νέον hex (#ffd700, #00f2fe, #8b5cf6, #ff003c…) → χρυσό / iOS red |

## Design language
- Αληθινό μαύρο (OLED), χρυσό `#E8C26B` (gradient `#F9E7B2 → #E8C26B → #C99B2E`).
- Liquid Glass: `backdrop-filter: blur(28px) saturate(180%)`, specular highlight πάνω, hairline περίγραμμα.
- Squircle γωνίες (24–40px), κουμπιά-κάψουλες 46px+ ύψος, spring easing, press-scale.
- Κόκκινο μόνο για ΣΤΟΠ/ποινές/κίνδυνο.
- `prefers-reduced-motion` και `prefers-reduced-transparency` σεβαστά.

## Πώς το τρέχεις
```bash
npm install     # στον δικό σου υπολογιστή (τα node_modules του zip ήταν από Mac)
npm run dev
```
## Πώς κάνεις tweak
Όλα τα χρώματα/υλικά είναι στην κορυφή του `src/ios27.css` (`--gold-*`, `--glass-*`).
Για πιο «γυάλινο» ή πιο «συμπαγές» look άλλαξε `--glass-1` και το `blur()`.
