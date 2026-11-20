import fsp from 'node:fs/promises';

// Έλεγχος ότι το περιεχόμενο ταιριάζει με την κατάληξη (όχι απλώς όνομα .jpg) + απόρριψη SVG με scripts.
export async function validateContent(file, ext) {
  const fh = await fsp.open(file, 'r');
  try {
    const head = Buffer.alloc(32);
    const { bytesRead } = await fh.read(head, 0, 32, 0);
    const b = head.subarray(0, bytesRead);
    const ascii = (from, to) => b.subarray(from, to).toString('latin1');
    switch (ext) {
      case '.jpg': case '.jpeg': return b[0] === 0xff && b[1] === 0xd8;
      case '.png': return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      case '.gif': return ascii(0, 3) === 'GIF';
      case '.webp': return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
      case '.avif': return ascii(4, 8) === 'ftyp';
      case '.mp4': case '.mov': case '.m4a': return ascii(4, 8) === 'ftyp';
      case '.webm': return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
      case '.ogg': return ascii(0, 4) === 'OggS';
      case '.wav': return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE';
      case '.mp3': return ascii(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
      case '.aac': return (b[0] === 0xff && (b[1] & 0xf0) === 0xf0) || ascii(0, 3) === 'ID3' || ascii(4, 8) === 'ftyp';
      case '.svg': {
        const text = (await fsp.readFile(file, 'utf8')).slice(0, 2_000_000);
        if (!/<svg[\s>]/i.test(text)) return false;
        return !/<script|\son[a-z]+\s*=|javascript:|<foreignObject|<iframe|<embed|<object/i.test(text);
      }
      default: return true;
    }
  } finally { await fh.close(); }
}
