# Deal of Temptation

React (Vite) + Express + PostgreSQL. Τρέχει σε ένα service στο Railway: ο server σερβίρει το build του frontend και το API.

```
src/        frontend (το ίδιο με πριν· το src/api/base44Client.js μιλάει πλέον με τον δικό μας server)
server/     Express API: auth (JWT), entities (Postgres JSONB), realtime (SSE), functions
scripts/    migrate-assets.mjs (εικόνες/βίντεο από Base44) και import-data.mjs (δεδομένα)
```

## 0. ΠΡΙΝ κλείσεις τον λογαριασμό Base44

1. **Εικόνες/βίντεο:** είναι ακόμα στο CDN του Base44 και χάνονται μαζί με το app.
   ```bash
   npm install
   node scripts/migrate-assets.mjs     # κατεβάζει στο public/assets και διορθώνει τα paths
   ```
2. **Δεδομένα** (ερωτηματολόγια, RSVP, περιεχόμενο, προφίλ…): κάνε export κάθε entity σε JSON και βάλε τα στο `data-export/` ως `PlayerIntake.json`, `GameContent.json` κ.λπ. (Ο φάκελος είναι στο `.gitignore` — έχει προσωπικά δεδομένα, μην τον κάνεις commit.)
3. Σημείωσε την τιμή του secret `CONTROL_PANEL_API_KEY` αν χρησιμοποιείς το ξεχωριστό Control Panel app.

## 1. GitHub

```bash
git init && git add . && git commit -m "Move off Base44"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## 2. Railway

1. **New Project → Deploy from GitHub repo** και διάλεξε το repo.
2. **+ New → Database → PostgreSQL** στο ίδιο project.
3. Στο service της εφαρμογής → **Variables**:
   | Μεταβλητή | Τιμή |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference στη βάση) |
   | `JWT_SECRET` | μακρύ τυχαίο string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
   | `ADMIN_EMAILS` | το email σου (όσα emails βάλεις γίνονται admin) |
   | `CONTROL_PANEL_API_KEY` | προαιρετικό |
4. **Settings → Networking → Generate Domain** (ή δικό σου domain).
5. Το πρώτο deploy φτιάχνει μόνο του τους πίνακες. Μετά πήγαινε στο `/register`, φτιάξε λογαριασμό με το email του `ADMIN_EMAILS` και μπες στο `/` (tablet) και `/admin`.

> Τρέξε **ένα** replica. Το realtime (SSE) κρατιέται στη μνήμη του process· με πολλά replicas οι κινητές/TV δεν θα βλέπουν ο ένας τον άλλον.

## 3. Εισαγωγή των παλιών δεδομένων

```bash
# DATABASE_URL = το PUBLIC url της βάσης από το Railway (Postgres → Connect)
DATABASE_URL="postgresql://..." node scripts/import-data.mjs
```

## 4. Τοπική ανάπτυξη

```bash
cp .env.example .env        # συμπλήρωσε DATABASE_URL, JWT_SECRET, ADMIN_EMAILS
npm install
npm run dev:server          # API στο :3000
npm run dev                 # frontend στο :5173 (proxy προς το API)
```

## Τι άλλαξε σε σχέση με το Base44

- **Auth:** email+κωδικός με JWT. Έφυγε η επιβεβαίωση με OTP στο email και το MFA. Το «Continue with Google» δουλεύει μόνο αν βάλεις `GOOGLE_CLIENT_ID/SECRET`. Επαναφορά κωδικού: στέλνει email αν βάλεις `RESEND_API_KEY` + `MAIL_FROM`, αλλιώς τυπώνει το link στα logs του Railway.
- **Πρόσβαση:** το tablet (`/`) και το `/admin` θέλουν admin σύνδεση. Τα `/tv`, `/play`, φόρμες και προσκλήσεις μένουν ανοιχτά. Τα ερωτηματολόγια (`PlayerIntake`, `PajamaIntake`, `BacheloretteIntake`) διαβάζονται μόνο από admin· οι ρυθμίσεις/περιεχόμενο αλλάζουν μόνο από admin. Οι κανόνες είναι στο πάνω μέρος του `server/entities.js`.
- **Control Panel API:** νέο URL `https://<domain>/api/functions/controlPanelApi` (ίδιο header `X-Control-Panel-Key`).
- Τα links/QR χρησιμοποιούν πλέον το domain που τρέχει η εφαρμογή (δεν είναι hard-coded στο `deal-of-game.base44.app`).

## 5. Δικές σου φωτογραφίες & βίντεο (Admin → 🖼️ Φωτογραφίες & Βίντεο)

Ανεβάζεις αρχεία από το Admin και διαλέγεις πού εμφανίζονται (βίντεο ανά σελίδα, εικόνες, γκαλερί Heist/Pajama). Τα αρχεία σερβίρονται από `/media/...`.

**Στο Railway χρειάζεται Volume, αλλιώς τα αρχεία χάνονται σε κάθε deploy:**
1. Στο project: **+ New → Volume**, σύνδεσέ το στο service της εφαρμογής, Mount path: `/data`.
2. Στο service → **Variables**: `UPLOAD_DIR` = `/data/uploads` (προαιρετικά `MAX_UPLOAD_MB`, προεπιλογή 300).
3. Redeploy.

Τοπικά τα αρχεία πάνε στο `uploads/` (είναι στο `.gitignore`).

## 6. Ειδοποιήσεις (push), μετρητής επισκέψεων, εφαρμογή (PWA)

- **Push:** Admin → 🔔 Ειδοποιήσεις → «Ενεργοποίηση σε αυτή τη συσκευή» (κάνε το σε κάθε συσκευή). Έρχεται ειδοποίηση όταν συμπληρώνεται το `/invitation`, το `/pajama-invite` (κράτηση θέσης) ή το `/pajama-form`. Τα VAPID κλειδιά δημιουργούνται αυτόματα και μένουν στη βάση (προαιρετικά: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). Βάλε σωστό email στο `ADMIN_EMAILS`.
- **Επισκέψεις:** Admin → 📈 Επισκέψεις Site (μετράει το `/site`).
- **PWA:** το app εγκαθίσταται σε κινητό και MacBook (οδηγίες στην καρτέλα 🔔). Στο iPhone οι ειδοποιήσεις δουλεύουν μόνο αφού το προσθέσεις στην οθόνη Αφετηρίας. Εικονίδια: `public/icons/` (αντικατάστησέ τα με δικά σου με τα ίδια ονόματα).
- Μετά από `git pull` τρέξε `npm install` (νέο πακέτο `web-push`).
