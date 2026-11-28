import test from 'node:test';
import assert from 'node:assert/strict';
import { announceKey, announcerLine } from '../src/lib/announcer.js';
import { actRecap } from '../src/lib/actRecap.js';
import { initCampaign, startAct } from '../src/lib/campaignEngine.js';

const players = [{ id: 'a', name: 'Γιούνα' }, { id: 'b', name: 'Αμάρα' }];
const nameOf = (id) => players.find((p) => p.id === id)?.name;

test('εκφωνητής: πράξη, Τροχός, Deal, φινάλε — και σιωπή όταν δεν αλλάζει κάτι', () => {
  const cg0 = initCampaign(players, { format: 'h48', now: 1000 });
  const cg1 = startAct(cg0, players, 2000);
  assert.match(announcerLine(announceKey(cg0), cg1, nameOf), /^Πράξη 1\./);
  assert.equal(announcerLine(announceKey(cg1), cg1, nameOf), null);
  assert.match(announcerLine(announceKey(cg1), { ...cg1, wheel: { pid: 'b', at: 3000 } }, nameOf), /Αμάρα/);
  assert.match(announcerLine(announceKey(cg1), { ...cg1, dond: { offerAt: 4000 } }, nameOf), /Deal/);
  assert.match(announcerLine(announceKey(cg1), { ...cg1, status: 'finale' }, nameOf, 'Γιούνα'), /νικήτρια.*Γιούνα/);
});

test('Previously on: έως 4 δυνατές στιγμές της πράξης που έκλεισε', () => {
  const log = [
    { t: 100, text: '🎲 Γιούνα έφερε 2 → Λεία' }, { t: 200, text: '🎡 Τροχός για Αμάρα' }, { t: 300, text: '🤝 Αμάρα: DEAL' },
    { t: 400, text: '↶ Αναίρεση' }, { t: 450, text: '💅 Γιούνα δήλωσε Κόκκινο' }, { t: 500, text: '👑 Γιούνα κέρδισε την πράξη' },
    { t: 900, text: '🎡 Τροχός στην επόμενη πράξη' },
  ].reverse();
  const r = actRecap({ log, conquered: { 0: { continent: 'classic', winner: 'a', at: 600 } } });
  assert.equal(r.winner, 'a');
  assert.ok(r.moments.length <= 4);
  assert.ok(r.moments.some((m) => m.includes('👑')));
  assert.ok(!r.moments.some((m) => m.includes('Αναίρεση') || m.includes('επόμενη')));
  assert.equal(actRecap({}), null);
});
