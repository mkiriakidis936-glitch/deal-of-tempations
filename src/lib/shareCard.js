// 12.0.0 · Κάρτα αναμνήσεων για Instagram story (1080×1920), φτιαγμένη στο κινητό με canvas.
// Δεν ανεβαίνει πουθενά: η παίκτρια τη μοιράζεται ή την αποθηκεύει η ίδια.

const W = 1080; const H = 1920;

export function drawShareCard(canvas, { name, position, total, points, badges = [], date = new Date(), color = '#ff2fb3' }) {
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  const F = (w, s, italic = true) => `${italic ? 'italic ' : ''}${w} ${s}px "Fira Sans Condensed","Fira Sans",system-ui,sans-serif`;
  // Σκηνή
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b0430'); bg.addColorStop(0.5, '#12073a'); bg.addColorStop(1, '#070320');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  const glow = (x, y, r, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); };
  glow(W / 2, 700, 700, 'rgba(107,28,255,0.55)'); glow(0, 0, 700, 'rgba(45,226,255,0.25)'); glow(W, 0, 700, 'rgba(255,47,179,0.28)'); glow(W / 2, H + 100, 800, 'rgba(255,47,179,0.35)');
  // Δέσμες
  c.save(); c.globalCompositeOperation = 'screen';
  [[150, '45,226,255'], [930, '255,47,179']].forEach(([x, rgb]) => {
    const g = c.createLinearGradient(0, 0, 0, 1400); g.addColorStop(0, `rgba(${rgb},0.22)`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(x, -20); c.lineTo(x - 300, 1400); c.lineTo(x + 300, 1400); c.closePath(); c.fill();
  });
  c.restore();
  c.textAlign = 'center';
  const gold = (y0, y1) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#fff4b8'); g.addColorStop(0.6, '#ffd23f'); g.addColorStop(1, '#ff8a00'); return g; };
  // Τίτλος σε μαρκίζα
  c.fillStyle = '#2a0f78'; roundRect(c, 110, 150, W - 220, 230, 40); c.fill();
  c.lineWidth = 8; c.strokeStyle = '#ffd23f'; c.stroke();
  for (let x = 140; x < W - 120; x += 34) { bulb(c, x, 172); bulb(c, x, 358); }
  c.font = F(800, 40); c.fillStyle = '#2de2ff'; c.fillText('DEAL OF TEMPTATION', W / 2, 240);
  c.font = F(900, 96); c.fillStyle = gold(250, 350); c.fillText('Η ΤΑΙΝΙΑ', W / 2, 340);
  // Όνομα
  c.fillStyle = color; roundRect(c, 140, 470, W - 280, 150, 30); c.fill();
  c.font = F(900, 92); c.fillStyle = '#fff'; c.fillText(upperEl(name).slice(0, 16), W / 2, 578);
  // Θέση & πόντοι
  c.font = F(900, 260); c.fillStyle = gold(700, 950); c.fillText(`#${position}`, W / 2, 930);
  c.font = F(700, 40, false); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(`θέση από ${total}`, W / 2, 990);
  c.fillStyle = '#050112'; roundRect(c, 260, 1040, W - 520, 170, 26); c.fill(); c.strokeStyle = 'rgba(255,210,63,0.5)'; c.lineWidth = 4; c.stroke();
  c.font = F(900, 120); c.fillStyle = '#ffe066'; c.shadowColor = 'rgba(255,160,0,0.9)'; c.shadowBlur = 30; c.fillText(String(points), W / 2, 1168); c.shadowBlur = 0;
  c.font = F(800, 30); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillText('ΠΟΝΤΟΙ', W / 2, 1250);
  // Παράσημα
  badges.slice(0, 4).forEach((b, i) => {
    const y = 1330 + i * 120;
    c.fillStyle = 'rgba(58,22,150,0.85)'; roundRect(c, 150, y, W - 300, 100, 50); c.fill();
    c.strokeStyle = 'rgba(120,180,255,0.5)'; c.lineWidth = 3; c.stroke();
    c.font = F(400, 56, false); c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(b.icon, 185, y + 70);
    c.font = F(900, 46); c.fillStyle = '#fff4b8'; c.fillText(b.title, 270, y + 66);
    c.textAlign = 'center';
  });
  c.font = F(700, 34, false); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillText(date.toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, H - 90);
  return canvas;
}

// Κεφαλαία ελληνικά χωρίς τόνους (ΓΙΟΥΝΑ, όχι ΓΙΟΎΝΑ).
export const upperEl = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function bulb(c, x, y) { const g = c.createRadialGradient(x, y, 0, x, y, 10); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.5, '#ffcf3a'); g.addColorStop(1, 'rgba(255,140,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill(); }

export async function shareCardBlob(opts) {
  const canvas = drawShareCard(document.createElement('canvas'), opts);
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
}
