/* ================================================================
   公開したページを預かって、配信する

     POST /api/publish   ページを預かる（新規 or 上書き）
     GET  /s/<サイトID>   預かったページを返す

   持ち主の証明は「合言葉」だけで行う。ログインを求めない。
   ホームページを持っていない人が対象なので、アカウントを1つ増やす
   だけで脱落する。合言葉は書き出したHTMLの中に入っているので、
   利用者は自分が持っていることを意識しなくていい。

   合言葉そのものは保存せず、ハッシュだけを持つ。
   ================================================================ */
const crypto = require('crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'asia-northeast1', maxInstances: 10 });

const db = admin.firestore();
const bucket = () => admin.storage().bucket();

/* ---------------- 制限 ----------------
   他人のHTMLを自分のドメインで配るので、置きっぱなしにはできない。 */
const MAX_BYTES = 3 * 1024 * 1024;   // 1ページの上限。写真込みでもこれで足りる
const MAX_NEW_PER_DAY = 5;           // 同じ回線から1日に作れる新規サイト数
const MARK = 'id="hp-builder-data"'; // このツールが作ったHTMLの目印

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const token = () => crypto.randomBytes(24).toString('base64url');

/* サイトID。店名から読める形にして、後ろに衝突しない印を付ける。
   日本語の店名でもURLに出せるよう、英数字が無いときは印だけにする。 */
function makeId(title) {
  const slug = String(title || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  const tail = crypto.randomBytes(3).toString('hex');
  return slug ? `${slug}-${tail}` : `site-${tail}`;
}

const cors = (res, origin) => {
  /* 編集画面はこのドメインから開くとは限らない（file:// でも動く）ので、
     どこから来ても受ける。書き込みの可否は合言葉で決めており、
     ここを絞っても守りにはならない。 */
  res.set('Access-Control-Allow-Origin', origin || '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Max-Age', '3600');
};

const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim() || 'unknown';

/* 1日に作れる新規サイト数を、回線ごとに数える */
async function takeNewSiteSlot(ip) {
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.collection('quota').doc(`${day}_${sha(ip).slice(0, 32)}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const n = snap.exists ? (snap.data().n || 0) : 0;
    if (n >= MAX_NEW_PER_DAY) return false;
    tx.set(ref, { n: n + 1, day, at: admin.firestore.FieldValue.serverTimestamp() });
    return true;
  });
}

/* ---------------- 預かる ---------------- */
exports.publishSite = onRequest({ cors: false, memory: '512MiB' }, async (req, res) => {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST でお願いします' });

  try {
    const { siteId, editToken, title, html } = req.body || {};

    if (typeof html !== 'string' || !html) {
      return res.status(400).json({ error: 'ページの中身がありません' });
    }
    if (Buffer.byteLength(html, 'utf8') > MAX_BYTES) {
      return res.status(413).json({ error: '写真が多すぎます。枚数を減らすか、小さい写真にしてください' });
    }
    if (!html.includes(MARK)) {
      return res.status(400).json({ error: 'このツールで作ったページではないようです' });
    }

    let id = String(siteId || '').trim();
    let tok = String(editToken || '');
    let isNew = false;

    if (id) {
      /* 上書き。合言葉が合っているかだけを見る */
      if (!/^[a-z0-9-]{4,40}$/.test(id)) return res.status(400).json({ error: 'サイトIDの形が違います' });
      const snap = await db.collection('sites').doc(id).get();
      if (!snap.exists) return res.status(404).json({ error: 'そのサイトは見つかりませんでした' });
      if (snap.data().tokenHash !== sha(tok)) {
        return res.status(403).json({ error: 'このサイトを更新する合言葉が違います' });
      }
    } else {
      /* 新規 */
      if (!(await takeNewSiteSlot(clientIp(req)))) {
        return res.status(429).json({ error: `新しいサイトは1日${MAX_NEW_PER_DAY}件までです。明日またどうぞ` });
      }
      id = makeId(title);
      tok = token();
      isNew = true;
    }

    await bucket().file(`sites/${id}/index.html`).save(Buffer.from(html, 'utf8'), {
      contentType: 'text/html; charset=utf-8',
      resumable: false,
      metadata: { cacheControl: 'no-store' },   // 配信側の見出しは serveSite で付ける
    });

    await db.collection('sites').doc(id).set({
      title: String(title || '').slice(0, 120),
      tokenHash: sha(tok),
      bytes: Buffer.byteLength(html, 'utf8'),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(isNew ? { createdAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
    }, { merge: true });

    const url = `https://${process.env.GCLOUD_PROJECT}.web.app/s/${id}`;
    /* 合言葉は新規のときだけ返す。既存のものを問い合わせで引き出せると、
       合言葉を確かめている意味がなくなる。 */
    return res.json({ siteId: id, url, ...(isNew ? { editToken: tok } : {}) });
  } catch (e) {
    console.error('publish failed', e);
    return res.status(500).json({ error: '公開できませんでした。少し待ってもう一度お試しください' });
  }
});

/* ---------------- 返す ---------------- */
exports.serveSite = onRequest({ cors: false, memory: '256MiB' }, async (req, res) => {
  try {
    /* Hosting からは元のパスがそのまま来る（/s/xxx あるいは /s/xxx/） */
    const id = decodeURIComponent(String(req.path || '')).split('/').filter(Boolean)[1] || '';
    if (!/^[a-z0-9-]{4,40}$/.test(id)) return notFound(res);

    const file = bucket().file(`sites/${id}/index.html`);
    const [exists] = await file.exists();
    if (!exists) return notFound(res);

    const [buf] = await file.download();
    res.set('Content-Type', 'text/html; charset=utf-8');
    /* 1分だけ配信側に持たせる。直したものが出るまで待たせすぎない */
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(buf);
  } catch (e) {
    console.error('serve failed', e);
    return res.status(500).send('表示できませんでした');
  }
});

function notFound(res) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  return res.status(404).send(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>ページが見つかりません</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fafafa;color:#27272a;
font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif;text-align:center;padding:24px;line-height:1.9}
h1{font-size:19px;margin:0 0 6px}p{color:#71717a;font-size:13.5px;margin:0}</style></head>
<body><div><h1>ページが見つかりません</h1>
<p>アドレスが違うか、公開が取り下げられた可能性があります。</p></div></body></html>`);
}
