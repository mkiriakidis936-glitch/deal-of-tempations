import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedNames, planAutoLinks, applyLinks, applySceneLinks } from '../src/lib/autoLink.js';
import { pickSectionVariant } from '../src/lib/sectionVariants.js';
import { MEDIA_MODES, MODE_MEDIA_SECTIONS } from '../src/data/modes/modeRegistry.js';
import { MODE_COVER_SLOTS } from '../src/data/mediaSlots.js';
import { SCENES } from '../src/data/sceneLibrary.js';

test('κάθε ενεργό mode έχει cover + hero + ενότητες + 6 gallery (Villa 12, Ταινία 9, τα άλλα 7)', () => {
  for (const { id } of MEDIA_MODES) {
    const sections = { villa_takeover: 12, deal_movie: 9 }[id] || 7;
    const slots = expectedNames([{ id }], MODE_MEDIA_SECTIONS, MODE_COVER_SLOTS);
    assert.equal(new Set(slots.map((s) => s.field)).size, 8 + sections, `${id}: ${slots.length}`);
    assert.equal((MODE_MEDIA_SECTIONS[id] || []).length, sections, `${id} sections`);
  }
});

test('αυτόματη σύνδεση βρίσκει αρχεία με το πρόθεμα του server και δεν πατά γεμάτες θέσεις', () => {
  const library = [
    { name: 'mf3k2a-1b2c3d-classic-setup.jpg', url: '/media/a', kind: 'image' },
    { name: 'mf3k2b-aaaaaa-lockdown-gallery-03.jpg', url: '/media/b', kind: 'image' },
    { name: 'mf3k2c-bbbbbb-random.jpg', url: '/media/c', kind: 'image' },
  ];
  const plan = planAutoLinks(library, expectedNames(MEDIA_MODES, MODE_MEDIA_SECTIONS, MODE_COVER_SLOTS));
  assert.equal(plan.links.length, 2);
  assert.deepEqual(plan.unmatched, ['random']);
  const classic = applyLinks({}, plan.links.filter((l) => l.modeId === 'classic'));
  assert.equal(classic.sections.find((s) => s.id === 'setup').image, '/media/a');
  const lock = applyLinks({}, plan.links.filter((l) => l.modeId === 'lockdown'));
  assert.equal(lock.gallery[2], '/media/b');
  assert.equal(applyLinks({ hero: '/keep' }, [{ field: 'hero', url: '/new' }]).hero, '/keep');
});

test('σκηνές: ταιριάζουν με όνομα και δεν πατούν υπάρχουσες', () => {
  const sc = SCENES.find((s) => s.id === 'classic_sq_police');
  assert.ok(sc, 'classic_sq_police υπάρχει στη βιβλιοθήκη σκηνών');
  const plan = planAutoLinks([{ name: 'x1-abcdef-classic-sq-police.jpg', url: '/media/p', kind: 'image' }], expectedNames([], {}, [], SCENES));
  assert.deepEqual(applySceneLinks({}, plan.links), { classic_sq_police: '/media/p' });
  assert.deepEqual(applySceneLinks({ classic_sq_police: '/old' }, plan.links), { classic_sq_police: '/old' });
});

test('εναλλακτικές ενότητες εναλλάσσονται ζωντανά και δεν εμφανίζονται χωρίς εικόνα', () => {
  const sections = [{ id: 'level1', image: '/a' }, { id: 'briefing', image: '/b', alt: 'level1' }, { id: 'escape', image: '', alt: 'level1' }];
  assert.equal(pickSectionVariant('level1', sections, 0), 'level1');
  assert.equal(pickSectionVariant('level1', sections, 1), 'briefing');
  assert.equal(pickSectionVariant('level1', sections, 2), 'level1');
  assert.equal(pickSectionVariant('level2', sections, 5), 'level2');
  assert.equal(pickSectionVariant('level1', [{ id: 'level1', image: '' }, { id: 'briefing', image: '/b', alt: 'level1' }], 0), 'briefing');
});
