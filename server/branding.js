import path from 'node:path';
import fs from 'node:fs';
import { query } from './db.js';
import { UPLOAD_DIR } from './media.js';
import { BRANDING_FIELD, BRANDING_PATHS, brandingMap } from '../src/lib/appBranding.js';

// Εικονίδιο εφαρμογής / εκκίνηση iPhone / εικόνα κοινοποίησης από το Admin.
// Αν το Admin έχει ανεβάσει δική του εικόνα για μια σταθερή διεύθυνση (π.χ. /icons/icon-192.png),
// τη σερβίρουμε εδώ, πριν από τα ενσωματωμένα αρχεία. Αλλιώς περνά στο επόμενο (το αρχικό αρχείο).
const CACHE_MS = 20_000;
let cached = { at: 0, map: {} };

export async function currentBranding({ force = false } = {}) {
  if (!force && Date.now() - cached.at < CACHE_MS) return cached.map;
  try {
    const { rows } = await query(
      "SELECT data FROM records WHERE entity = 'AppSetting' AND data->>'key' = 'media_overrides' ORDER BY updated_date DESC LIMIT 1",
    );
    cached = { at: Date.now(), map: brandingMap(rows[0]?.data?.value?.[BRANDING_FIELD]) };
  } catch {
    cached = { ...cached, at: Date.now() }; // βάση μη διαθέσιμη: κρατάμε ό,τι ξέραμε
  }
  return cached.map;
}

export const forgetBranding = () => { cached = { at: 0, map: {} }; };

export function brandingRoutes() {
  return async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!BRANDING_PATHS.includes(req.path)) return next();
    const url = (await currentBranding())[req.path];
    if (!url) return next();
    const file = path.join(UPLOAD_DIR, path.basename(url));
    if (!file.startsWith(UPLOAD_DIR + path.sep) || !fs.existsSync(file)) return next();
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(file);
  };
}
