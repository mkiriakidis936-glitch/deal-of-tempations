import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaKindOf, isVideoUrl } from '../src/lib/mediaKind.js';

test('ο κοινός κανόνας αναγνωρίζει φωτογραφίες, βίντεο και ήχο', () => {
  assert.equal(mediaKindOf('/media/a.JPG'), 'image');
  assert.equal(mediaKindOf('/media/a.svg?v=2'), 'image');
  assert.equal(mediaKindOf('/media/clip.MOV'), 'video');
  assert.equal(mediaKindOf('/media/clip.m4v#t=1'), 'video');
  assert.equal(mediaKindOf('/media/song.m4a'), 'audio');
  assert.equal(mediaKindOf(''), '');
  assert.equal(isVideoUrl('/media/x.webm'), true);
  assert.equal(isVideoUrl('/media/x.png'), false);
});
