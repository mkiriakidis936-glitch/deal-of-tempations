import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateContent } from '../server/upload-validate.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upl-'));
const write = (name, data) => { const f = path.join(dir, name); fs.writeFileSync(f, data); return f; };
const ftyp = (brand) => Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from(`ftyp${brand}`), Buffer.alloc(20)]);

test('δέχεται πραγματικά αρχεία εικόνας/βίντεο/ήχου', async () => {
  assert.equal(await validateContent(write('a.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), '.jpg'), true);
  assert.equal(await validateContent(write('b.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), '.png'), true);
  assert.equal(await validateContent(write('c.mp4', ftyp('isom')), '.mp4'), true);
  assert.equal(await validateContent(write('d.mov', ftyp('qt  ')), '.mov'), true);
  assert.equal(await validateContent(write('e.webm', Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0])), '.webm'), true);
  assert.equal(await validateContent(write('f.mp3', Buffer.from('ID3\x03\x00\x00')), '.mp3'), true);
});

test('απορρίπτει αρχείο με λάθος περιεχόμενο', async () => {
  assert.equal(await validateContent(write('fake.jpg', 'hello world'), '.jpg'), false);
  assert.equal(await validateContent(write('fake.mp4', 'not a video at all'), '.mp4'), false);
});

test('SVG: δέχεται καθαρό, απορρίπτει script / on* / foreignObject', async () => {
  const head = '<svg xmlns="http://www.w3.org/2000/svg">';
  assert.equal(await validateContent(write('ok.svg', `${head}<rect width="1" height="1"/></svg>`), '.svg'), true);
  assert.equal(await validateContent(write('s1.svg', `${head}<script>alert(1)</script></svg>`), '.svg'), false);
  assert.equal(await validateContent(write('s2.svg', '<svg onload="x()" xmlns="http://www.w3.org/2000/svg"></svg>'), '.svg'), false);
  assert.equal(await validateContent(write('s3.svg', `${head}<foreignObject></foreignObject></svg>`), '.svg'), false);
});
