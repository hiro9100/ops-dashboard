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
const MAX_NEW_PER_DAY = 8;           // 同じ回線から1日に作れる新規サイト数
/* 全体でも1日ぶんの上限を持つ。回線ごとの数えかたは、下に書いたとおり
   完全ではない。抜けられたときに、青天井にならないための最後の壁。
   ふつうの使われかたでは当たらない数にしてある（当たったら記録に残す）。 */
const MAX_NEW_GLOBAL_PER_DAY = 800;
const MARK = 'id="hp-builder-data"'; // このツールが作ったHTMLの目印
/* 数えた札を置きっぱなしにしない。Firestore の TTL に消してもらう。
   1日1万人だと1年で数百万件たまり、読まないものに置き場代がかかる。
   （TTL の設定は一度だけ要る。firebase/README.md に手順を書いた） */
const QUOTA_TTL_DAYS = 3;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const token = () => crypto.randomBytes(24).toString('base64url');

/* 公開ページのアドレスの頭。既定は同じところ（…web.app/s/）。

   公開ページを別のドメインへ移すときは、.env の HP_SITE_BASE を
   そちらにする。編集画面に返すアドレスも、ここ1か所で揃う。
   なぜ移すのかは firebase/README.md の「別のドメインに移す」に書いた。 */
const siteBase = () => {
  const v = String(process.env.HP_SITE_BASE || '').trim();
  if (v) return v.endsWith('/') ? v : `${v}/`;
  return `https://${process.env.GCLOUD_PROJECT}.web.app/s/`;
};

/* 公開ページから、問い合わせの受け口へ送れるようにする先。
   同じところに居るあいだは 'self'。別のドメインへ移したら、
   受け口のあるドメインを名指しする（そうしないと守りが止める）。 */
const apiOrigin = () => {
  const v = String(process.env.HP_API_ORIGIN || '').trim();
  return v || "'self'";
};

/* 合言葉くらべ。長さで先に分かれると、そこから1文字ずつ当てられる。
   同じ長さに揃えてから、時間の変わらないやり方でくらべる。 */
function sameSecret(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  if (x.length !== y.length) { crypto.timingSafeEqual(x, x); return false; }
  return crypto.timingSafeEqual(x, y);
}

/* 公開ページで動いてよい JavaScript の指紋。組み立てのときに作る。
   これ以外は、預かるときに断り、配るときにも動かさない。 */
let RUNTIME = { current: '', allowed: [] };
try { RUNTIME = require('./runtime-hashes.json'); }
catch (e) { console.error('runtime-hashes.json が読めません。公開を受け付けません', e); }

const scriptHash = (body) =>
  `sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}`;

/* 預かるHTMLの中で、動く JavaScript はこのツールの部品だけに限る。

   公開ページは、こちらのドメインで配られる。そこで他人の JavaScript が
   動くと、同じドメインに置いてある編集画面の控え（合言葉を含む）が
   読める。実際に読めることを確かめてある。

   type が application/json のものは、書いてあるだけで動かないので通す。 */
function badScript(html) {
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    const body = m[2] || '';
    /* 外から読み込むものは、中身が見えないので一律で断る */
    if (/\bsrc\s*=/i.test(attrs)) return 'よそから読み込む仕掛けは入れられません';
    /* 動かない札のもの（組み立て情報など）は通す */
    if (/type\s*=\s*["']?application\/json["']?/i.test(attrs)) continue;
    if (!body.trim()) continue;
    if (!RUNTIME.allowed.includes(scriptHash(body))) {
      return 'このツールが入れたもの以外の仕掛けは入れられません';
    }
  }

  /* 属性に直接書く動き（onclick= など）も、同じ理由で断る。

     ここは script の中身を外してから見る。中身ごと見ると、部品の中の
     「i < n」と、そのあとの「 on…=」が1つの札に見えて、まともなページまで
     弾かれる（実際に弾かれた）。 */
  let markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');

  /* 属性の中の文字は、ブラウザが読むときに元へ戻る。
     javascript&colon; や &#106;avascript: と書かれると、
     そのままの形で探しても見つからない。先に戻してから探す。 */
  markup = markup
    .replace(/&#x([0-9a-f]+);?/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (m, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&colon;/gi, ':').replace(/&Tab;|&NewLine;/gi, ' ');

  /* 札の区切りは空白だけではない。<img src=x/onerror=…> のように
     斜線でも区切れる（ブラウザはこれを別の札として読む）。 */
  if (/<[^>]+[\s/]on[a-z]+\s*=/i.test(markup)) return '要素に直接書いた動き（on…=）は入れられません';
  if (/\bhref\s*=\s*["']?\s*javascript\s*:/i.test(markup)) return 'javascript: のリンクは入れられません';
  return '';
}

/* サイトID。店名から読める形にして、後ろに衝突しない印を付ける。
   日本語の店名でもURLに出せるよう、英数字が無いときは印だけにする。 */
function makeId(title) {
  const slug = String(title || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  const tail = crypto.randomBytes(6).toString('hex');
  return slug ? `${slug}-${tail}` : `site-${tail}`;
}

/* 空いているIDを押さえる。

   前は、作ったIDでいきなり書いていた（merge:true）。同じIDが先にあると、
   他人のサイトの合言葉と中身を黙って上書きできてしまう。印が3バイト
   しかなく、店名は「cafe」のように重なりやすいので、偶然でも起こりうる。

   create() は、すでにあると必ず失敗する。だから読んでから書くのと違って、
   同時に来ても片方しか通らない。空くまで数回だけ作り直す。 */
async function claimId(title, tokenHash) {
  for (let i = 0; i < 6; i += 1) {
    const id = makeId(title);
    try {
      await db.collection('sites').doc(id).create({
        tokenHash, createdAt: FieldValue.serverTimestamp(),
      });
      return id;
    } catch (e) {
      if (e.code !== 6 && !/ALREADY_EXISTS/i.test(String(e.message || ''))) throw e;
    }
  }
  return '';
}

const cors = (res, origin) => {
  /* 編集画面はこのドメインから開くとは限らない（file:// でも動く）ので、
     どこから来ても受ける。書き込みの可否は合言葉で決めており、
     ここを絞っても守りにはならない。 */
  res.set('Access-Control-Allow-Origin', origin || '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Max-Age', '3600');
  /* 返事に届いた問い合わせが入ることがある。途中の置き場に残さない */
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
};

/* 送ってきた回線。

   X-Forwarded-For の先頭を見ていたが、そこは送る側が好きに書ける。
   前に何か書いておけば、毎回ちがう回線に見せられ、1日の上限を
   いくらでも越えられる（数えている意味が無くなる）。

   この列は、通ってきた順に後ろへ足されていく。いちばん後ろは
   こちらの入口、その1つ前が、入口から見えた本当の相手。
   ここは書き足す側しか触れないので、送る側には作れない。 */
const clientIp = (req) => {
  const parts = String(req.headers['x-forwarded-for'] || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 2] || parts[0] || String(req.ip || '') || 'unknown';
};

/* 数えた札の捨てどき。Firestore の TTL がこの日時を過ぎたものを消す */
const ttlAt = () => new Date(Date.now() + QUOTA_TTL_DAYS * 86400 * 1000);

/* 1日に作れる数を数える。回線ごとと、全体と、両方見る。
   回線の見分けは完全ではないので、全体のぶんが最後の壁になる。 */
async function takeNewSiteSlot(ip) {
  const day = new Date().toISOString().slice(0, 10);
  const mine = db.collection('quota').doc(`${day}_${sha(ip).slice(0, 32)}`);
  const all = db.collection('quota').doc(`all_${day}`);
  return db.runTransaction(async (tx) => {
    const [a, b] = await tx.getAll(mine, all);
    const n = a.exists ? (a.data().n || 0) : 0;
    const g = b.exists ? (b.data().n || 0) : 0;
    if (n >= MAX_NEW_PER_DAY) return 'ip';
    if (g >= MAX_NEW_GLOBAL_PER_DAY) return 'all';
    tx.set(mine, { n: n + 1, day, at: FieldValue.serverTimestamp(), expireAt: ttlAt() });
    tx.set(all, { n: g + 1, day, at: FieldValue.serverTimestamp(), expireAt: ttlAt() });
    return '';
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
    if (!RUNTIME.allowed.length) {
      console.error('動きの部品の指紋が無いので、公開を受け付けられません');
      return res.status(503).json({ error: 'いまは公開できません。少し待ってもう一度お試しください' });
    }
    for (const p of list) {
      const why = badScript(p.html);
      if (why) return res.status(400).json({ error: why });
    }

    let id = String(siteId || '').trim();
    let tok = String(editToken || '');
    let isNew = false;
    let prevPages = [];

    if (id) {
      /* 上書き。合言葉が合っているかだけを見る */
      if (!/^[a-z0-9-]{4,40}$/.test(id)) return res.status(400).json({ error: 'サイトIDの形が違います' });
      const snap = await db.collection('sites').doc(id).get();
      if (!snap.exists) return res.status(404).json({ error: 'そのサイトは見つかりませんでした' });
      if (!sameSecret(snap.data().tokenHash, sha(tok))) {
        return res.status(403).json({ error: 'このサイトを更新する合言葉が違います' });
      }
      if (snap.data().disabled) {
        return res.status(423).json({ error: 'このサイトは止まっています。お問い合わせください' });
      }
      prevPages = Array.isArray(snap.data().pages) ? snap.data().pages : [];
    } else {
      /* 新規 */
      const full = await takeNewSiteSlot(clientIp(req));
      if (full === 'ip') {
        return res.status(429).json({ error: `新しいサイトは1日${MAX_NEW_PER_DAY}件までです。明日またどうぞ` });
      }
      if (full === 'all') {
        /* ここに当たるのは、ふつうの使われかたでは起きない。
           記録に残して、翌朝いちばんに気づけるようにする */
        console.error(`1日ぶんの新規作成が上限（${MAX_NEW_GLOBAL_PER_DAY}件）に達しました`);
        return res.status(429).json({ error: 'いまは新しいサイトを作れません。時間をおいてお試しください' });
      }
      tok = token();
      id = await claimId(title, sha(tok));
      if (!id) {
        console.error('空いているサイトIDを作れませんでした');
        return res.status(503).json({ error: '公開できませんでした。少し待ってもう一度お試しください' });
      }
      isNew = true;
    }

    await Promise.all(list.map((p) =>
      bucket().file(`sites/${id}/${p.path}.html`).save(Buffer.from(p.html, 'utf8'), {
        contentType: 'text/html; charset=utf-8',
        resumable: false,
        metadata: { cacheControl: 'no-store' },   // 配信側の見出しは serveSite で付ける
      })));

    /* 前より減ったときに、消したページが残り続けないようにする。

       毎回そのサイトの置き場を一覧していたが、公開のたびに必ず1往復
       増える。前に何を置いたかは自分で控えているので、それと今回の
       差だけを消す（減っていないときは、一度も触らない）。 */
    const before = (prevPages || []).filter((x) => !list.some((p) => p.path === x));
    if (before.length) {
      await Promise.all(before.map((x) =>
        bucket().file(`sites/${id}/${x}.html`).delete().catch((e) =>
          console.warn('古いページを消せませんでした', x, e.message))));
    }

    await db.collection('sites').doc(id).set({
      title: String(title || '').slice(0, 120),
      tokenHash: sha(tok),
      pages: list.map((p) => p.path),
      bytes: total,
      updatedAt: FieldValue.serverTimestamp(),
      ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
    }, { merge: true });

    const url = `${siteBase()}${id}`;
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
    /* 止めたサイトは、ページも受け口も止める。
       止めたあとに届き続けると、止めた意味が無い */
    if (site.data().disabled) return res.status(410).json({ error: 'この送り先はもうありません' });

    /* 同じ回線からの送りすぎを止める。持ち主の受信箱が埋まらないように */
    const day = new Date().toISOString().slice(0, 10);
    const qref = db.collection('quota').doc(`msg_${day}_${sha(clientIp(req)).slice(0, 32)}`);
    const okQuota = await db.runTransaction(async (tx) => {
      const snap = await tx.get(qref);
      const n = snap.exists ? (snap.data().n || 0) : 0;
      if (n >= MAX_MSG_PER_DAY) return false;
      tx.set(qref, { n: n + 1, day, at: FieldValue.serverTimestamp(), expireAt: ttlAt() });
      return true;
    });
    if (!okQuota) return res.status(429).json({ error: '送信が続いています。しばらく待ってからお試しください' });

    const box = db.collection('sites').doc(id).collection('messages');
    await box.add({ name: nm, email: em, message: msg, at: FieldValue.serverTimestamp() });

    /* 貯まりすぎたら古いものから捨てる。置きっぱなしにしない方針は公開と同じ。

       offset(500) で飛ばしていたが、Firestore は飛ばしたぶんも読んだ数に
       入れる。1通届くたびに500件ぶん読むことになり、通数に比例して
       効いてくる（1万人規模だと、ここだけで金額が跳ねる）。
       件数を数えて、あふれたときだけ、古いほうから消す。 */
    const cnt = await box.count().get();
    const over = cnt.data().count - MAX_KEEP;
    if (over > 0) {
      const old = await box.orderBy('at', 'asc').limit(Math.min(over, 50)).get();
      await Promise.all(old.docs.map((doc) => doc.ref.delete()));
    }

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
    if (!sameSecret(site.data().tokenHash, sha(String(editToken || '')))) {
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
      tx.set(qref, { n: n + 1, day, at: FieldValue.serverTimestamp(), expireAt: ttlAt() });
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

    /* 止めたサイトは配らない。苦情や乗っ取りに、その場で手を打てるように
       （sites/<id> の disabled を true にするだけで止まる） */
    const meta = await db.collection('sites').doc(id).get();
    if (!meta.exists) return notFound(res);
    if (meta.data().disabled) return gone(res);

    const file = bucket().file(`sites/${id}/${raw}.html`);
    const [exists] = await file.exists();
    if (!exists) return notFound(res);

    const [buf] = await file.download();
    res.set('Content-Type', 'text/html; charset=utf-8');
    /* 1分だけ配信側に持たせる。直したものが出るまで待たせすぎない */
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    securityHeaders(res);
    return res.status(200).send(buf);
  } catch (e) {
    console.error('serve failed', e);
    return res.status(500).send('表示できませんでした');
  }
});

/* 他人の書いたHTMLを、こちらのドメインで配るときの守り。

   ・script は、このツールの部品だけ動かす（指紋で照合）
     預かるときにも検めているが、そこを抜けても、ここで動かない
   ・外へ送る先を、絵と動画と自分のところだけに絞る
     万一なにか動いても、持ち出す先が無い
   ・枠に入れて出されるのを止める（別のサイトの一部に見せかけられる）
   ・行き先を、外へ知らせない

   いちばんの守りは、公開ページを編集画面と別のドメインに置くこと。
   同じところに居るかぎり、抜けたときの被害が編集画面まで届く。
   （firebase/README.md に手順を書いた） */
function securityHeaders(res) {
  const hashes = (RUNTIME.allowed || []).map((h) => `'${h}'`).join(' ');
  res.set('Content-Security-Policy', [
    "default-src 'none'",
    `script-src ${hashes || "'none'"}`,
    "style-src 'unsafe-inline'",
    "img-src data: blob: https:",
    "media-src data: blob: https:",
    "font-src data: https:",
    /* 動画ブロックは、YouTube か Vimeo の再生器を枠で借りる。
       ここを開けないと、動画を置いたページだけ空欄になる
       （default-src 'none' は枠の中身も止めるため）。
       借りられる先は、このツールが作れる2つだけに絞る。 */
    'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
    `connect-src ${apiOrigin()}`,
    `form-action ${apiOrigin()}`,
    "frame-ancestors 'none'",
    "base-uri 'none'",
  ].join('; '));
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.set('Cross-Origin-Resource-Policy', 'same-site');
}

function gone(res) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  return res.status(410).send(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>公開を止めています</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fafafa;color:#27272a;
font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif;text-align:center;padding:24px;line-height:1.9}
h1{font-size:19px;margin:0 0 6px}p{color:#71717a;font-size:13.5px;margin:0}</style></head>
<body><div><h1>このページは公開を止めています</h1>
<p>お心当たりのある方は、お問い合わせください。</p></div></body></html>`);
}

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
