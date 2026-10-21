import { ACCOUNTS, readLog, writeLog, resultsFor, sanitize } from './_lib.js';

// POST { action: 'login' | 'spin', code, branch }
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, branch } = req.body || {};
  const code = sanitize(req.body && req.body.code);
  const account = ACCOUNTS[code];
  if (!account || account.branch !== branch) {
    return res.status(401).json({ error: 'Kode pegawai atau office branch tidak terdaftar.' });
  }

  try {
    const log = await readLog();
    const results = resultsFor(log, code);
    const total = account.chances.length;

    if (action === 'login') return res.json({ total, results });

    if (action === 'spin') {
      if (results.length >= total) {
        return res.status(403).json({ error: 'Seluruh kesempatan sudah digunakan.', total, results });
      }
      const planned = account.chances[results.length];
      const record = {
        at: new Date().toISOString(), code, branch,
        chance: results.length + 1, dest: planned.dest, type: planned.type
      };
      const line = [record.at, code, branch, record.chance, record.dest, record.type].join('|');
      await writeLog(log + (log && !log.endsWith('\n') ? '\n' : '') + line + '\n');
      return res.json({ total, results: results.concat(record), record });
    }

    return res.status(400).json({ error: 'Action tidak dikenal.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error. Coba lagi.' });
  }
}
