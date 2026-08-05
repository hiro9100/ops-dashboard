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
/* 読み込みは、使うものだけを名指しする。
   firebase-functions/v2 や firebase-admin を丸ごと読むと、使っていない
   Realtime Database まで引きずり込み、その依存が足りずに
   「Functions codebase could not be analyzed」で落ちる（実際に起きた）。 */
const crypto = require('crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

initializeApp();

const REGION = 'asia-northeast1';
const db = getFirestore();
const bucket = () => getStorage().bucket();

/* ---------------- 制限 ----------------
   他人のHTMLを自分のドメインで配るので、置きっぱなしにはできない。 */
const MAX_BYTES = 3 * 1024 * 1024;   // 1ページの上限。写真込みでもこれで足りる
const MAX_SITE_BYTES = 12 * 1024 * 1024;  // サイト全体の上限
const MAX_PAGES = 20;                // 1サイトのページ数
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
    tx.set(ref, { n: n + 1, day, at: FieldValue.serverTimestamp() });
    return true;
  });
}

/* ---------------- 預かる ---------------- */
exports.publishSite = onRequest({ region: REGION, maxInstances: 10, cors: false, memory: '512MiB' }, async (req, res) => {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST でお願いします' });

  try {
    const { siteId, editToken, title, html, pages } = req.body || {};

    /* 1ページのときは html、複数ページのときは pages で来る。
       どちらも「path とHTMLの組」の並びに直してから先へ進む */
    let list;
    if (Array.isArray(pages)) {
      list = pages;
    } else if (typeof html === 'string' && html) {
      list = [{ path: 'index', html }];
    } else {
      return res.status(400).json({ error: 'ページの中身がありません' });
    }

    if (!list.length) return res.status(400).json({ error: 'ページの中身がありません' });
    if (list.length > MAX_PAGES) {
      return res.status(400).json({ error: `ページは${MAX_PAGES}枚までです` });
    }

    let total = 0;
    for (const p of list) {
      if (typeof p.html !== 'string' || !p.html) {
        return res.status(400).json({ error: 'ページの中身がありません' });
      }
      /* 住所はそのままファイル名になる。上の階へ抜ける道を作らせない */
      if (!/^[a-z0-9-]{1,40}$/.test(String(p.path || ''))) {
        return res.status(400).json({ error: 'ページのアドレスの形が違います' });
      }
      const n = Buffer.byteLength(p.html, 'utf8');
      if (n > MAX_BYTES) {
        return res.status(413).json({ error: '写真が多すぎます。枚数を減らすか、小さい写真にしてください' });
      }
      total += n;
    }
    if (total > MAX_SITE_BYTES) {
      return res.status(413).json({ error: 'サイト全体が大きすぎます。写真の枚数を減らしてください' });
    }
    /* このツールが作ったものかは、組み立て情報を持つホームで見る */
    const home = list.find((p) => p.path === 'index');
    if (!home) return res.status(400).json({ error: 'ホーム（index）がありません' });
    if (!home.html.includes(MARK)) {
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

    await Promise.all(list.map((p) =>
      bucket().file(`sites/${id}/${p.path}.html`).save(Buffer.from(p.html, 'utf8'), {
        contentType: 'text/html; charset=utf-8',
        resumable: false,
        metadata: { cacheControl: 'no-store' },   // 配信側の見出しは serveSite で付ける
      })));

    /* 前より減ったときに、消したページが残り続けないようにする */
    const keep = new Set(list.map((p) => `sites/${id}/${p.path}.html`));
    try {
      const [olds] = await bucket().getFiles({ prefix: `sites/${id}/` });
      await Promise.all(olds.filter((f) => !keep.has(f.name)).map((f) => f.delete()));
    } catch (e) { console.warn('古いページを消せませんでした', e); }

    await db.collection('sites').doc(id).set({
      title: String(title || '').slice(0, 120),
      tokenHash: sha(tok),
      pages: list.map((p) => p.path),
      bytes: total,
      updatedAt: FieldValue.serverTimestamp(),
      ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
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

/* ================================================================
   お問い合わせを受け取る

     POST /api/form      公開したページのフォームから届く
     POST /api/messages  持ち主が読む（合言葉が要る）

   メールは送らない。送るには外の配信業者と、その鍵の管理が要る。
   代わりに預かって、編集画面から読めるようにする。
   持ち主の証明は公開と同じ合言葉なので、覚えるものは増えない。
   ================================================================ */
const MAX_FIELD = 4000;              // 1つの欄の長さ
const MAX_MSG_PER_DAY = 30;          // 同じ回線から1日に送れる数
const MAX_KEEP = 500;                // 1サイトに貯める数

const trim = (v) => String(v == null ? '' : v).slice(0, MAX_FIELD).trim();

exports.submitForm = onRequest({ region: REGION, maxInstances: 10, cors: false, memory: '256MiB' }, async (req, res) => {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST でお願いします' });

  try {
    const { siteId, name, email, message, company } = req.body || {};

    /* 機械よけ。人には見えない欄が埋まっていたら、静かに受けたことにする。
       はっきり断ると、避けかたを教えることになる。 */
    if (trim(company)) return res.json({ ok: true });

    const id = String(siteId || '').trim();
    if (!/^[a-z0-9-]{4,40}$/.test(id)) return res.status(400).json({ error: '送り先が分かりませんでした' });

    const nm = trim(name), em = trim(email), msg = trim(message);
    if (!nm || !em || !msg) return res.status(400).json({ error: 'お名前・メールアドレス・お問い合わせ内容を入れてください' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return res.status(400).json({ error: 'メールアドレスの形が違うようです' });

    const site = await db.collection('sites').doc(id).get();
    if (!site.exists) return res.status(404).json({ error: 'この送り先はもうありません' });

    /* 同じ回線からの送りすぎを止める。持ち主の受信箱が埋まらないように */
    const day = new Date().toISOString().slice(0, 10);
    const qref = db.collection('quota').doc(`msg_${day}_${sha(clientIp(req)).slice(0, 32)}`);
    const okQuota = await db.runTransaction(async (tx) => {
      const snap = await tx.get(qref);
      const n = snap.exists ? (snap.data().n || 0) : 0;
      if (n >= MAX_MSG_PER_DAY) return false;
      tx.set(qref, { n: n + 1, day, at: FieldValue.serverTimestamp() });
      return true;
    });
    if (!okQuota) return res.status(429).json({ error: '送信が続いています。しばらく待ってからお試しください' });

    const box = db.collection('sites').doc(id).collection('messages');
    await box.add({ name: nm, email: em, message: msg, at: FieldValue.serverTimestamp() });

    /* 貯まりすぎたら古いものから捨てる。置きっぱなしにしない方針は公開と同じ */
    const all = await box.orderBy('at', 'desc').offset(MAX_KEEP).limit(50).get();
    await Promise.all(all.docs.map((doc) => doc.ref.delete()));

    return res.json({ ok: true });
  } catch (e) {
    console.error('form failed', e);
    return res.status(500).json({ error: '送れませんでした。少し待ってもう一度お試しください' });
  }
});

/* ---------------- 持ち主が読む ---------------- */
exports.listMessages = onRequest({ region: REGION, maxInstances: 10, cors: false, memory: '256MiB' }, async (req, res) => {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST でお願いします' });

  try {
    const { siteId, editToken } = req.body || {};
    const id = String(siteId || '').trim();
    if (!/^[a-z0-9-]{4,40}$/.test(id)) return res.status(400).json({ error: 'サイトIDの形が違います' });

    const site = await db.collection('sites').doc(id).get();
    if (!site.exists) return res.status(404).json({ error: 'そのサイトは見つかりませんでした' });
    if (site.data().tokenHash !== sha(String(editToken || ''))) {
      return res.status(403).json({ error: 'このサイトを開く合言葉が違います' });
    }

    const snap = await db.collection('sites').doc(id).collection('messages')
      .orderBy('at', 'desc').limit(100).get();
    return res.json({
      messages: snap.docs.map((doc) => {
        const v = doc.data();
        return { id: doc.id, name: v.name, email: v.email, message: v.message,
          at: v.at ? v.at.toDate().toISOString() : null };
      }),
    });
  } catch (e) {
    console.error('list failed', e);
    return res.status(500).json({ error: '読み出せませんでした。少し待ってもう一度お試しください' });
  }
});

/* ================================================================
   ヒーローの絵を作る

     POST /api/image   { prompt, shape }  →  { images: ["data:image/..."] }

   鍵はここにしか置かない。編集画面に埋めると、ツールを手にした人
   全員がその鍵を読めて、持ち主の請求で他人が絵を作れてしまう。
   鍵は Secret Manager に入れ、リポジトリにも書き出したHTMLにも出さない。

     firebase functions:secrets:set OPENAI_API_KEY

   費用は「ヒーローの数」ではなく「使う人の数 × 作り直した回数」で
   効いてくる。だから回線ごとの上限を必ず通す。

   ここは既定で出さない（.env の HP_IMAGE で切り替える）。

   defineSecret は deploy のたびに Secret Manager を必ず見に行く。
   その API を有効にしていないプロジェクトでは 403 が返り、この窓口
   ひとつのために deploy 全体が止まる——サイトも写真も出せなくなる。
   実際にそれが起き、8回続けて出せていなかった（起動画面の作り替えも
   業種の写真も、出ていないことに気づけないまま止まっていた）。

   使えるようにする手順（3つとも要る）:
     1. Secret Manager API を有効にする
        https://console.cloud.google.com/apis/library/secretmanager.googleapis.com?project=bildy-4e45e
     2. firebase functions:secrets:set OPENAI_API_KEY
        （鍵はここでだけ渡す。リポジトリにも会話にも貼らない）
     3. functions/.env の HP_IMAGE を 1 にして push

   .env は deploy のときにも動くときにも読まれるので、この1か所で
   両方そろう。合言葉ではないので、そのまま置いてよい。
   ================================================================ */
const IMAGE_ON = process.env.HP_IMAGE === '1';

const IMG_MODEL = 'gpt-image-1';
const MAX_IMG_PER_DAY = 12;          // 同じ回線から1日に作れる枚数
const MAX_PROMPT = 900;
/* 枠の形。ヒーローは横長、まるい写真や商品は正方形、縦組みは縦長 */
const IMG_SHAPES = { wide: '1536x1024', square: '1024x1024', tall: '1024x1536' };

/* 鍵の置き場所を触るのは、ここだけ。HP_IMAGE が 1 のときしか通らない。
   0 のままなら Secret Manager を一度も見に行かないので、deploy は通る。 */
const OPENAI_API_KEY = IMAGE_ON
  ? require('firebase-functions/params').defineSecret('OPENAI_API_KEY')
  : null;

if (IMAGE_ON) exports.generateImage = onRequest({
  region: REGION, maxInstances: 5, cors: false, memory: '512MiB',
  timeoutSeconds: 120,               // 絵ができるまで10〜30秒かかる。60秒では足りない
  secrets: [OPENAI_API_KEY],
}, async (req, res) => {
  cors(res, req.headers.origin);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST でお願いします' });

  try {
    const key = OPENAI_API_KEY.value();
    if (!key) return res.status(503).json({ error: 'いまは絵を作れません（鍵が設定されていません）' });

    const prompt = String((req.body || {}).prompt || '').trim().slice(0, MAX_PROMPT);
    if (prompt.length < 4) return res.status(400).json({ error: 'どんな絵にしたいか、もう少し書いてください' });
    const size = IMG_SHAPES[(req.body || {}).shape] || IMG_SHAPES.wide;

    /* 上限。作りすぎを止める */
    const day = new Date().toISOString().slice(0, 10);
    const qref = db.collection('quota').doc(`img_${day}_${sha(clientIp(req)).slice(0, 32)}`);
    const okQuota = await db.runTransaction(async (tx) => {
      const snap = await tx.get(qref);
      const n = snap.exists ? (snap.data().n || 0) : 0;
      if (n >= MAX_IMG_PER_DAY) return false;
      tx.set(qref, { n: n + 1, day, at: FieldValue.serverTimestamp() });
      return true;
    });
    if (!okQuota) {
      return res.status(429).json({ error: `今日はここまでです（1日${MAX_IMG_PER_DAY}枚まで）。写真を選ぶこともできます` });
    }

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: IMG_MODEL, prompt, size, n: 1 }),
    });
    if (!r.ok) {
      /* 相手の言い分をそのまま出さない。鍵や組織の名前が混ざることがある */
      console.error('image api failed', r.status, (await r.text()).slice(0, 500));
      return res.status(502).json({ error: '絵を作れませんでした。少し待ってもう一度お試しください' });
    }
    const out = await r.json();
    const images = (out.data || [])
      .map((d) => (d.b64_json ? `data:image/png;base64,${d.b64_json}` : ''))
      .filter(Boolean);
    if (!images.length) return res.status(502).json({ error: '絵を受け取れませんでした' });

    return res.json({ images });
  } catch (e) {
    console.error('image failed', e);
    return res.status(500).json({ error: '絵を作れませんでした。少し待ってもう一度お試しください' });
  }
});

/* ---------------- 返す ---------------- */
exports.serveSite = onRequest({ region: REGION, maxInstances: 10, cors: false, memory: '256MiB' }, async (req, res) => {
  try {
    /* Hosting からは元のパスがそのまま来る（/s/xxx あるいは /s/xxx/） */
    /* /s/<サイトID> ／ /s/<サイトID>/ ／ /s/<サイトID>/<ページ>.html */
    const parts = decodeURIComponent(String(req.path || '')).split('/').filter(Boolean);
    const id = parts[1] || '';
    if (!/^[a-z0-9-]{4,40}$/.test(id)) return notFound(res);

    const raw = (parts[2] || 'index').replace(/\.html$/, '');
    if (!/^[a-z0-9-]{1,40}$/.test(raw)) return notFound(res);

    const file = bucket().file(`sites/${id}/${raw}.html`);
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
