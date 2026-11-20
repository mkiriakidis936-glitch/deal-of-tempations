import test from 'node:test';
import assert from 'node:assert/strict';
import * as gameContent from '../src/data/gameContent.js';
import * as extendedContent from '../src/data/modes/extendedContent.js';
import * as lockdownContent from '../src/data/modes/lockdownContent.js';
import * as beachBarContent from '../src/data/modes/beachBarContent.js';
import * as pajamaContent from '../src/data/pajamaContent.js';
import * as pajamaSabotage from '../src/data/pajamaSabotage.js';
import { PAJAMA_TOTAL_MINUTES } from '../src/data/pajamaProgram.js';

const unsafe = /hogtie|blindfold|restraint|δεσίμ|δεμέν|δέσιμο|ακινητοπ|zip.?ties|duct tape|παγάκι|παγάκια|ice cube|γαργαλ|tickle|σφηνάκ|\bshot\b|αλκοόλ|alcohol|χωρίς χέρια|μάτια κλειστά|τυφλά|περιορισμός κίνησης|touch|μασάζ|massage|άγγιγμα|αγγίζ|ακουμπ/i;
const structuralKeys = new Set(['id', 'fate', 'cat', 'categoryId', 'type', 'icon', 'effect', 'reward', 'order', 'scored', 'modeId', 'phase']);

function collectUnsafe(value, path = 'root', out = []) {
  if (typeof value === 'string') {
    if (unsafe.test(value)) out.push({ path, value });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafe(item, `${path}[${index}]`, out));
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (!structuralKeys.has(key)) collectUnsafe(item, `${path}.${key}`, out);
    }
  }
  return out;
}

test('all shipped game content exposes no restraint, blindfold, ice, touch, tickle or alcohol instructions', () => {
  const collections = {
    gameContent,
    extendedContent,
    lockdownContent,
    beachBarContent,
    pajamaContent,
    pajamaSabotage,
  };
  const found = Object.entries(collections).flatMap(([name, collection]) => collectUnsafe(collection, name));
  assert.deepEqual(found, []);
});

test('Standalone Pajama Lockdown and its Marathon act both last 60 minutes', () => {
  assert.equal(lockdownContent.LOCKDOWN_SECONDS, 60 * 60);
  assert.equal(lockdownContent.MARATHON_LOCKDOWN_SECONDS, 60 * 60);
});

test('Pajama Pedi-Glam seven-act program totals exactly five hours including breaks', () => {
  assert.equal(PAJAMA_TOTAL_MINUTES, 300);
});
