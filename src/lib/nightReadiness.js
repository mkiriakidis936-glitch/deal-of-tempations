// 12.0.0 · «Έτοιμοι για βραδιά;» — ένας κατάλογος ελέγχων, πράσινο / πορτοκαλί / κόκκινο, με το «πώς το φτιάχνεις».
// Καθαρή συνάρτηση. level: 'ok' | 'warn' (δεν σταματά τη βραδιά) | 'bad' (φτιάξ' το πριν ξεκινήσεις) | 'info'.

export function readinessChecks({ state = {}, presence = {}, tv = null, lights = null, media = null, tabletOnline = true, eventHours = 6, now = Date.now() } = {}) {
  const out = [];
  const add = (id, level, title, fix = '') => out.push({ id, level, title, fix });
  const players = (state.players || []).filter((p) => !p.bot);
  const mg = state.mg || {};

  add('tablet', tabletOnline ? 'ok' : 'bad', tabletOnline ? 'Το Tablet είναι online' : 'Το Tablet δεν έχει δίκτυο', 'Έλεγξε το WiFi του Tablet.');

  if (!tv?.online) add('tv', 'bad', 'Η TV δεν είναι ανοιχτή', 'Άνοιξε τον σύνδεσμο της TV στη Samsung (browser) ή πάτα «📺 Στείλε στην TV».');
  else {
    add('tv', 'ok', `Η TV είναι ανοιχτή${tv.w ? ` (${tv.w}×${tv.h})` : ''}`);
    if (tv.w && tv.w < tv.h) add('tv-orient', 'warn', 'Η TV φαίνεται κάθετη', 'Γύρισε τη συσκευή οριζόντια ή άνοιξε σε πλήρη οθόνη.');
    add('tv-sound', tv.sound ? 'ok' : 'bad', tv.sound ? 'Ο ήχος της TV είναι ξεκλείδωτος' : 'Ο ήχος της TV είναι κλειδωμένος', 'Πάτα μία φορά οπουδήποτε στην οθόνη της TV (με το τηλεχειριστήριο ή το ποντίκι).');
  }

  if (!players.length) add('phones', 'bad', 'Δεν έχει μπει καμία παίκτρια', 'Δείξε το QR της βραδιάς για να μπουν από τα κινητά.');
  else {
    const on = players.filter((p) => presence[p.id] && now - presence[p.id] < 60000).length;
    add('phones', on === players.length ? 'ok' : on === 0 ? 'bad' : 'warn', `Κινητά συνδεδεμένα ${on}/${players.length}`, on === players.length ? '' : 'Όποια λείπει, ας ανοίξει ξανά τη σελίδα του παιχνιδιού.');
  }

  if (mg.consentRequired) {
    const done = players.filter((p) => mg.consent?.players?.[p.id]?.confirmed).length;
    add('consent', done === players.length && players.length ? 'ok' : 'bad', `Όρια & συναίνεση ${done}/${players.length}`, 'Κάθε παίκτρια επιβεβαιώνει τα όριά της από το κινητό πριν ξεκινήσει.');
  }

  if (state.stopActive || mg.stop) add('stop', 'bad', 'Το ΣΤΟΠ είναι ενεργό', 'Όταν όλες είναι εντάξει, πάτα ξανά ΣΤΟΠ.');

  if (!lights || lights.auth?.type === 'none') add('lights', 'info', 'Φώτα σπιτιού: δεν έχουν συνδεθεί (προαιρετικό)', 'Admin → Φώτα & Samsung TV.');
  else if (lights.auth?.expired) add('lights', 'bad', 'Το token των φώτων έληξε', 'Admin → Φώτα: βάλε νέο token (ισχύει 24 ώρες) ή κάνε μόνιμη σύνδεση.');
  else {
    const hours = lights.auth?.type === 'pat' ? (lights.auth.expiresAt - now) / 3600000 : Infinity;
    if (!lights.enabled) add('lights', 'warn', 'Τα φώτα είναι συνδεδεμένα αλλά κλειστά', 'Admin → Φώτα → «Τα φώτα ακολουθούν το παιχνίδι».');
    else if (hours < eventHours) add('lights', 'warn', `Το token των φώτων λήγει σε ~${Math.max(0, Math.round(hours))} ώρες`, 'Θα σβήσει πριν τελειώσει η βραδιά. Βάλε νέο token ή κάνε μόνιμη σύνδεση.');
    else add('lights', 'ok', `Φώτα έτοιμα (${(lights.devices || []).filter((d) => d.role !== 'off').length} στο παιχνίδι)`);
    if (lights.lastError) add('lights-err', 'warn', `Φώτα: ${lights.lastError}`, 'Δοκίμασε «Δοκιμή λάμπες» στο Admin.');
  }

  if (media) {
    if (media.missingRequired || media.broken) add('media', 'warn', `Φωτογραφίες/βίντεο: ${media.missingRequired} απαραίτητα λείπουν${media.broken ? `, ${media.broken} χαλασμένα` : ''}`, 'Admin → Φωτογραφίες & βίντεο → Χάρτης. Το παιχνίδι παίζει και χωρίς αυτά.');
    else add('media', 'ok', 'Φωτογραφίες & βίντεο εντάξει');
  }

  if (state.musicOff) add('music', 'info', 'Η μουσική ηπείρου είναι κλειστή', 'Tablet → 🎬 Βίντεο & ήχος.');
  if ((state.players || []).some((p) => p.bot)) add('bots', 'warn', 'Παίζουν εικονικές παίκτριες (πρόβα)', 'Βγάλ\' τες πριν από την πραγματική βραδιά.');

  const bad = out.filter((c) => c.level === 'bad').length;
  const warn = out.filter((c) => c.level === 'warn').length;
  return { checks: out, bad, warn, ready: bad === 0 };
}
