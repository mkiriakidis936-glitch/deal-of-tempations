# Modes — κατάσταση και επόμενα βήματα (10.0.0)

Ενεργά ψηφιακά modes (`src/data/modes/modeRegistry.js` → `NEW_MODES`):

- **Deal of Temptation — Η Ταινία** (`deal_movie`): χάρτης 5 ηπείρων, Γρήγορο σετ / 48 / 72 ώρες, 3 Τροχοί Ποινών, Καρέκλα Ανάκρισης, 4 παιχνίδια, υποχρεωτική κλήρωση μετά από κάθε ήπειρο, εντάλματα/Wanted/Καταζητούμενη.
- **Pajama Lockdown 18+** (`lockdown`)
- **Pajama Heist & Arrest** (`marathon_4h`)
- **Villa Takeover 48/72** (`villa_takeover`)

Κλασικές μηχανές: **Classic** και **Arrest Heist** (Tablet/TV pages).

Αποσυρμένα (δεν επανέρχονται): Beach Bar, Pedi-Glam, Mega Marathon.

## Media (10.0.0)
- Όλα τα αρχεία του φακέλου MEGA (`11_MEGA_UPDATE`) έχουν θέση με το ίδιο όνομα: βίντεο χάρτη, σκηνικά ηπείρων, εικονίδια, φόντα, νύχια, δοκιμασίες, πράξεις, κάρτες, Villa.
- Βίντεο εκπομπής TV: Welcome → Show Open → Meet the Cast → Countdown, διάλειμμα (έξοδος / loop / επιστροφή), φινάλε (Recap → Winner Reveal), 10 stingers.
- Η «🔗 Αυτόματη σύνδεση» (Admin → Χάρτης media) πιάνει εικόνες, βίντεο και ήχο, και δέχεται και τα παλιά ονόματα (π.χ. `villa_hero.jpg`, `01_welcome_video.mp4`).

## Επόμενα
1. Να δημιουργηθούν οι εικόνες που λείπουν από τα prompts: `act01–09` (16:9 & 9:16), `card_*` (4:5 & 16:9), `movie_beerpong.jpg`, `movie_deal_or_no_deal.jpg`, ζώνες/ρόλοι/βραβεία/κωδικός Villa.
2. Οι σκηνές της βιβλιοθήκης που είναι «ανενεργές» (δεν εμφανίζονται πουθενά) να συνδεθούν σε ποινές/τετράγωνα ή να αφαιρεθούν.
3. Δοκιμή σε πραγματικές συσκευές (Smart TV, iPhone, Android, Tablet) με πλήρη βραδιά.
