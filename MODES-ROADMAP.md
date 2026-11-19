# Modes — τι χρειάζεται για να γίνουν πιο ολοκληρωμένα

Βασισμένο στον κώδικα: `data/modes/modeRegistry.js`, `components/modes/*`, `lib/modeKit.js`.
Σήμερα ενεργά ψηφιακά modes: **Pajama Lockdown 18+** και **Beach Bar Home Lockdown**.

## Τι ΛΕΙΠΕΙ από τα modes (επαληθευμένο στον κώδικα)
Τα `RecapExport`, `TutorialTV` και τα achievements υπάρχουν μόνο στο classic (Tablet/TV pages). Δεν είναι συνδεδεμένα σε κανένα από τα `components/modes/*`.

## Προτεραιότητα 1 — Αρχή & τέλος κάθε παιχνιδιού
1. **Intro / κανόνες στην TV** (επαναχρήση του `TutorialTV`): 4–5 κάρτες «πώς παίζεται», ασφάλεια, ΣΤΟΠ. Ξεκινά αυτόματα πριν το πρώτο act.
2. **Consent check-in στα κινητά πριν ξεκινήσει**: κάθε παίκτρια επιλέγει όρια/opt-outs (π.χ. «χωρίς γαργάλημα», «χωρίς δέσιμο», «μόνο non-alcohol»). Η εφαρμογή φιλτράρει αυτόματα κάρτες/ποινές που τα παραβιάζουν. Σήμερα υπάρχει μόνο το `RestraintNote` και το ΣΤΟΠ — το opt-out ανά παίκτρια λείπει.
3. **Φινάλε με Recap** (επαναχρήση `RecapExport`): σκορ, best moments, ποινές, χρόνος εξόδου, κοινοποιήσιμη κάρτα (μαύρο/χρυσό).
4. **Awards στο τέλος** (π.χ. «Cipher Master», «Last Queen», «Πιο γρήγορη διαφυγή») — ήδη υπάρχει `achievements.js` για classic.

## Προτεραιότητα 2 — Pajama Lockdown
- **Τυχαίος Exit Code ανά συνεδρία.** Το default είναι σταθερό `6969` (`lockdownContent.js`) — μάντεψε-το-εύκολα.
- **Προοδευτική ένταση (heat levels)**: επιλογή Mild / Spicy / Extreme στο setup· κάθε κάρτα/ποινή έχει `level` και φιλτράρεται.
- **Hint system με κόστος**: υποδείξεις που προσθέτουν +χρόνο (αντί για μόνιμα διαθέσιμες).
- **Live «Escape progress» στην TV**: 5 levels ως χρυσά dots/ring, όχι μόνο κείμενο.
- **Αντίστροφο panic**: ήδη υπάρχει `panic()` στο κινητό — πρόσθεσε οπτική επιβεβαίωση «Όλες ΟΚ;» με ψηφοφορία συνέχισης ανά παίκτρια.

## Προτεραιότητα 3 — Beach Bar
- **DJ queue / ήχος**: συνδεδεμένα cues (`sfx`) με Dance & Freeze ώστε το Freeze να ακούγεται και στο κινητό.
- **Mocktail menu πρώτα**: μη αλκοολούχες επιλογές ως default, αλκοόλ ως opt-in στο consent check-in.
- **Leaderboard πλωτή κάψουλα** στο κινητό (σκορ + tokens) — το `ranking` υπάρχει ήδη στο `ModeMobile`.
- **Last Queen finale** με κοινή οθόνη TV (στεφάνι, countdown 180″ ήδη σε `BEACH_FINALE_SECONDS`).

## Προτεραιότητα 4 — Κοινό για όλα τα modes
- **Undo τελευταίας ενέργειας** για τη διοργανώτρια (υπάρχει στο classic Toolbar, όχι στα modes).
- **Τελευταίες 3 ενέργειες στην TV** (ticker) για να μην χάνεται κανείς.
- **Haptics/ήχος ανά event** (ήδη `navigator.vibrate` σε Play).
- **Αποθήκευση/συνέχιση συνεδρίας** μετά από crash (`AdminSessionRecovery` υπάρχει — σύνδεσέ το και με `mg` state).
- **Τεστ**: `tests/` έχει node tests· πρόσθεσε για `timerLeft/timerAdd/timerPause` και για το φιλτράρισμα consent.
