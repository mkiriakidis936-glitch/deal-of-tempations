import { MODE_MEDIA } from '@/data/brandArt';
import { CONT_SLUG, TRIAL_MECH, CARD_ART, NAIL_ART, actArtId } from '@/data/modes/movieMedia';

// Η ΤΑΙΝΙΑ: διαβάζει τις θέσεις media του mode deal_movie (Admin → Χάρτης media). Κενό = δεν έχει ανέβει.
export const movieArt = (id) => (id ? MODE_MEDIA.deal_movie?.sections?.find((s) => s.id === id)?.image || '' : '');
export const firstArt = (...ids) => ids.map(movieArt).find(Boolean) || '';
export const actTvArt = (act) => movieArt(actArtId(act?.title) && `${actArtId(act.title)}_16x9`);
export const actPhoneArt = (act) => movieArt(actArtId(act?.title) && `${actArtId(act.title)}_9x16`);
export const contArt = (kind, continent) => (CONT_SLUG[continent] ? movieArt(`${kind}_${continent}`) : '');
export const trialArt = (trialId, tv = false) => (TRIAL_MECH[trialId] ? movieArt(`mech_${trialId}${tv ? '_tv' : ''}`) : '');
export const cardArt = (cardId, tv = false) => (CARD_ART[cardId] ? movieArt(`cardart_${cardId}${tv ? '_tv' : ''}`) : '');
export const nailArt = (color) => movieArt(NAIL_ART[color] ? NAIL_ART[color] : '');
