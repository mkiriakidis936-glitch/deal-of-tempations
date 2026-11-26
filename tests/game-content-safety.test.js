import test from 'node:test';
import assert from 'node:assert/strict';
import * as gameContent from '../src/data/gameContent.js';
import * as extendedContent from '../src/data/modes/extendedContent.js';
import * as lockdownContent from '../src/data/modes/lockdownContent.js';
import * as pajamaContent from '../src/data/pajamaContent.js';
import * as pajamaSabotage from '../src/data/pajamaSabotage.js';
import { PAJAMA_TOTAL_MINUTES } from '../src/data/pajamaProgram.js';

test('τα αρχικά κείμενα των καρτών εμφανίζονται όπως τα έγραψε η διοργανώτρια', () => {
  const glam = extendedContent.GLAM_CARDS.find((card) => card.id === 'g1');
  assert.match(glam.text, /μασάζ πέλματος/);
  assert.doesNotMatch(JSON.stringify(extendedContent), /Safe Digital Challenge/);
  assert.doesNotMatch(JSON.stringify(gameContent), /SAFE DIGITAL CHALLENGE/);
  assert.doesNotMatch(JSON.stringify(lockdownContent), /Safe Digital Challenge/);
  assert.doesNotMatch(JSON.stringify(pajamaContent), /Safe Digital Challenge/);
  assert.ok(pajamaSabotage);
});

test('Standalone Pajama Lockdown and its Marathon act both last 60 minutes', () => {
  assert.equal(lockdownContent.LOCKDOWN_SECONDS, 60 * 60);
  assert.equal(lockdownContent.MARATHON_LOCKDOWN_SECONDS, 60 * 60);
});

test('Pajama Pedi-Glam seven-act program totals exactly five hours including breaks', () => {
  assert.equal(PAJAMA_TOTAL_MINUTES, 300);
});
