import { put, list } from '@vercel/blob';
import { promises as fs } from 'node:fs';

// Akun terdaftar: kode pegawai -> branch + hasil tiap kesempatan (berurutan).
// Tambah pegawai baru di sini.
export const ACCOUNTS = {
  'DANIEL280493-TJ-BSD': {
    branch: 'BSD',
    chances: [
      { dest: 'Vietnam', type: 'Single' },
      { dest: 'Japan', type: 'Single' }
    ]
  }
};

const FILE = 'results.txt';
const LOCAL = process.env.LOCAL_STORE_FILE; // hanya untuk dev lokal

// Format file, satu baris per kejadian:
//   2026-10-21T04:55:00.000Z|KODE|BRANCH|1|Vietnam|Single
//   2026-10-21T05:10:00.000Z|KODE|RESET
export async function readLog() {
  if (LOCAL) return fs.readFile(LOCAL, 'utf8').catch(() => '');
  const { blobs } = await list({ prefix: FILE });
  const b = blobs.find((x) => x.pathname === FILE);
  if (!b) return '';
  const res = await fetch(b.url + '?t=' + Date.now(), { cache: 'no-store' });
  return res.ok ? res.text() : '';
}

export async function writeLog(text) {
  if (LOCAL) return fs.writeFile(LOCAL, text);
  await put(FILE, text, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'text/plain; charset=utf-8',
    cacheControlMaxAge: 60
  });
}

// Hasil aktif tiap kode (entri sebelum RESET terakhir diabaikan)
export function resultsFor(log, code) {
  let out = [];
  for (const line of log.split('\n')) {
    const p = line.split('|');
    if (p[1] !== code) continue;
    if (p[2] === 'RESET') out = [];
    else out.push({ at: p[0], code: p[1], branch: p[2], chance: Number(p[3]), dest: p[4], type: p[5] });
  }
  return out;
}

export function sanitize(code) {
  return String(code || '').trim().toUpperCase();
}
