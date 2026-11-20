import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSENT_OPTIONS, consentOf, consentPending, allConfirmed, anyOptOut, blockedBy, pickAllowed, isValidConsentEntry, randomExitCode,
} from '../src/lib/consent.js';

const players = [{ id: 'a' }, { id: 'b' }];
const mg = {
  consentRequired: true,
  consent: { players: { a: { optOuts: ['touch', 'alcohol'], confirmed: true, at: 1 }, b: { optOuts: [], confirmed: true, at: 2 } } },
};

test('consent: εκκρεμεί μόνο όταν ζητείται και δεν έχει ολοκληρωθεί', () => {
  assert.equal(consentPending({}), false);                                   // παλιές συνεδρίες
  assert.equal(consentPending({ consentRequired: true }), true);
  assert.equal(consentPending({ consentRequired: true, consent: { done: true } }), false);
});

test('consent: επιβεβαιώσεις και όρια ανά παίκτρια', () => {
  assert.equal(allConfirmed(mg, players), true);
  assert.equal(allConfirmed({ consent: { players: { a: { confirmed: true, optOuts: [] } } } }, players), false);
  assert.deepEqual(consentOf(mg, 'a').optOuts, ['touch', 'alcohol']);
  assert.deepEqual(consentOf(mg, 'zzz'), { optOuts: [], confirmed: false });
  assert.equal(anyOptOut(mg, 'alcohol', players), true);
  assert.equal(anyOptOut(mg, 'camera', players), false);
});

test('consent: το φίλτρο μπλοκάρει κάρτες που παραβιάζουν τα όρια', () => {
  assert.deepEqual(blockedBy(mg, 'a', 'Δώσε ένα απαλό άγγιγμα στο χέρι'), ['touch']);
  assert.deepEqual(blockedBy(mg, 'a', 'Πιες ένα σφηνάκι'), ['alcohol']);
  assert.deepEqual(blockedBy(mg, 'b', 'Πιες ένα σφηνάκι'), []);              // η b δεν έχει όρια
  const cards = ['Γαργάλημα 10″', 'Πες ένα αστείο'];
  assert.equal(pickAllowed(cards, mg, 'a'), 'Πες ένα αστείο');
  assert.equal(pickAllowed(['Γαργάλημα'], mg, 'a'), null);                  // καμία κατάλληλη -> null (PASS)
  assert.equal(pickAllowed(['Γαργάλημα', 'Αστείο'], mg, ['a', 'b']), 'Αστείο'); // ομαδική κάρτα: ισχύουν τα όρια όλων
});

test('consent: έγκυρη/άκυρη καταχώρηση', () => {
  assert.equal(isValidConsentEntry({ optOuts: ['touch'], confirmed: true, at: 5 }), true);
  assert.equal(isValidConsentEntry({ optOuts: ['hack'], confirmed: true, at: 5 }), false);
  assert.equal(isValidConsentEntry({ optOuts: [], confirmed: 'yes', at: 5 }), false);
  assert.equal(isValidConsentEntry({ optOuts: [], confirmed: true }), false);
  assert.equal(CONSENT_OPTIONS.length, new Set(CONSENT_OPTIONS.map((o) => o.id)).size);
});

test('Exit Code: 4 διαφορετικά ψηφία, όχι ακολουθία, όχι σταθερός 6969', () => {
  const seen = new Set();
  for (let i = 0; i < 300; i += 1) {
    const code = randomExitCode();
    assert.match(code, /^\d{4}$/);
    assert.equal(new Set(code).size, 4);
    assert.ok(!['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'].includes(code));
    seen.add(code);
  }
  assert.ok(seen.size > 50);
});
