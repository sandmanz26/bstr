import { SetupError, readLog, writeLog, sanitize } from './_lib.js';

// GET /__refresh?token=<REFRESH_TOKEN>&code=<KODE>   -> reset satu pegawai
// GET /__refresh?token=<REFRESH_TOKEN>&code=ALL      -> reset semua pegawai
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  const { token, code } = req.query;
  if (!process.env.REFRESH_TOKEN || token !== process.env.REFRESH_TOKEN) {
    return res.status(401).send('Unauthorized');
  }
  if (!code) return res.status(400).send('Tambahkan ?code=KODE_PEGAWAI atau ?code=ALL');

  let log;
  try { log = await readLog(); } catch (e) {
    console.error(e);
    return res.status(500).send(e instanceof SetupError ? e.message : 'Server error.');
  }
  const now = new Date().toISOString();
  if (String(code).toUpperCase() === 'ALL') {
    const codes = [...new Set(log.split('\n').map((l) => l.split('|')[1]).filter(Boolean))];
    await writeLog(log + codes.map((c) => `${now}|${c}|RESET\n`).join(''));
    return res.send(`Reset ${codes.length} pegawai.`);
  }
  await writeLog(log + `${now}|${sanitize(code)}|RESET\n`);
  res.send(`Reset ${sanitize(code)}.`);
}
