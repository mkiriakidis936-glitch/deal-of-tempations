# Deal of Temptation

React (Vite) + Express + PostgreSQL. Τρέχει σε ένα service στο Railway: ο server σερβίρει το build του frontend και το API.

```
src/        frontend (το ίδιο με πριν· το src/api/base44Client.js μιλάει πλέον με τον δικό μας server)
server/     Express API: auth (JWT), entities (Postgres JSONB), realtime (SSE), functions
scripts/    migrate-assets.mjs (εικόνες/βίντεο από Base44) και import-data.mjs (δεδομένα)
```

## 0. ΠΡΙΝ κλείσεις τον λογαριασμό Base44

1. **Εικόνες/βίντεο:** πριν κλείσεις το Base44, τρέξε τη μετανάστευση με το δημόσιο `DATABASE_URL` της PostgreSQL από το Railway. Το script ελέγχει κώδικα και εγγραφές της βάσης, κατεβάζει τα αρχεία στο `public/assets` με μοναδικά SHA-256 ονόματα και ενημερώνει τις αποθηκευμένες διευθύνσεις.
   ```bash
   npm install
   DATABASE_URL="postgresql://..." node scripts/migrate-assets.mjs
   ```
   Αν δεν δοθεί `DATABASE_URL`, μεταφέρονται μόνο οι αναφορές που βρίσκονται στα αρχεία του κώδικα — όχι οι φωτογραφίες που είναι αποθηκευμένες στη βάση.
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
2. Στο service → **Variables**: `UPLOAD_DIR` = `/data/uploads` (προαιρετικά `MAX_UPLOAD_MB`, προεπιλογή 300). Αν το `UPLOAD_DIR` λείπει, ο server χρησιμοποιεί αυτόματα το `RAILWAY_VOLUME_MOUNT_PATH/uploads`.
3. Redeploy.

Τοπικά τα αρχεία πάνε στο `uploads/` (είναι στο `.gitignore`).

## 6. Ειδοποιήσεις (push), μετρητής επισκέψεων, εφαρμογή (PWA)

- **Push:** Admin → 🔔 Ειδοποιήσεις → «Ενεργοποίηση σε αυτή τη συσκευή» (κάνε το σε κάθε συσκευή). Έρχεται ειδοποίηση όταν συμπληρώνεται το `/invitation`, το `/pajama-invite` (κράτηση θέσης) ή το `/pajama-form`. Τα VAPID κλειδιά δημιουργούνται αυτόματα και μένουν στη βάση (προαιρετικά: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). Βάλε σωστό email στο `ADMIN_EMAILS`.
- **Επισκέψεις:** Admin → 📈 Επισκέψεις Site (μετράει το `/site`).
- **PWA:** το app εγκαθίσταται σε κινητό και MacBook (οδηγίες στην καρτέλα 🔔). Στο iPhone οι ειδοποιήσεις δουλεύουν μόνο αφού το προσθέσεις στην οθόνη Αφετηρίας. Εικονίδια: `public/icons/` (αντικατάστησέ τα με δικά σου με τα ίδια ονόματα).
- Μετά από `git pull` τρέξε `npm install` (νέο πακέτο `web-push`).

## 7. Site με δύο events, σενάριο, αλλαγή φωτογραφιών από παντού

- `/site` δείχνει το Heist Night (προεπιλογή) ή το Pajama Pedi-Glam (`/site?event=pajama`) με κουμπιά στο μενού.
- Admin → 🌐 Site & Σενάριο: γράφεις το σενάριο («τι είναι το παιχνίδι») και αλλάζεις όλα τα κείμενα κάθε event (τίτλοι, πρόγραμμα, πρακτικά, FAQ, ημερομηνία).
- Admin → 🖼️ Φωτογραφίες & Βίντεο: αλλαγή/διαγραφή/προσθήκη (εικόνες ανά σημείο, γκαλερί με αντικατάσταση, επιπλέον βίντεο στο site).
- Όταν είσαι συνδεδεμένη/ος ως admin, στις σελίδες `/site`, `/promo`, `/invitation`, `/pajama-invite`, `/pajama-form`, `/tv`, `/play` εμφανίζεται κάτω αριστερά το κουμπί **✏️ Αλλαγή φωτό/βίντεο**: πατάς ✏️ πάνω σε οποιαδήποτε φωτογραφία/βίντεο και την αλλάζεις επιτόπου.

## Νέα modes (Μεγάλο Update)

Τέσσερα ξεχωριστά ψηφιακά modes στο SetupScreen: `pedi_extended`, `lockdown`, `beach_bar`, `marathon_4h`.

- Περιεχόμενο: `src/data/modes/*` (κάρτες, ερωτήσεις, αποστολές από το PDF).
- Κορμός: `src/lib/modeKit.js` (συγχρονισμένο χρονόμετρο, ήχοι WebAudio, state στο `state.mg`).
- UI: `src/components/modes/` (`ModeGame` για tablet, `ModeTV`, `ModeMobile`).
- Ασφάλεια: κουμπί ΣΤΟΠ σε tablet και κινητά, υπενθύμιση σε κάρτες με δέσιμο, επιλογή «χωρίς αλκοόλ» στο Beach Bar.
- Οι μυστικές αποστολές φτάνουν στο κινητό μέσω του live state (/play) με δόνηση και τοπική ειδοποίηση όσο η σελίδα είναι ανοιχτή.

### Φόρμα, Site & Admin για τα νέα modes
- `/modes-form` (και `/modes-form?mode=lockdown`…): φόρμα όπου η καλεσμένη διαλέγει ένα ή περισσότερα modes. Αποθηκεύεται στο `PajamaIntake` (`formType: 'modes'`) και εγκρίνεται από Admin → Ερωτηματολόγια → Pajama (με φίλτρο ανά mode).
- `/site?event=extended|lockdown|beachbar|marathon4h`: οι 4 νέες καρτέλες του site. Τα κείμενα αλλάζουν από Admin → 🌐 Site & Σενάριο.
- Admin → 🎮 Νέα Modes: επεξεργασία καρτών, ερωτήσεων, αποστολών, mini-games, True/False, ASMR clues, επιλογών και ρυθμίσεων Lockdown, Chaos Powers, Shop και Beach Bar (αποθήκευση στο AppSetting `modes_content`). Τα στοιχεία που συνδέονται με σταθερούς μηχανισμούς δεν μπορούν να προστεθούν ή να διαγραφούν από το Admin.
- Στο Setup του tablet, όταν διαλέξεις νέο mode, προ-συμπληρώνονται οι εγκεκριμένες που το ζήτησαν.
