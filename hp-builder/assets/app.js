/* ================================================================
   かんたんHP作成ツール — 編集画面のロジック
   state（サイトのデータ）→ HTML生成 → プレビュー / 書き出し
   ================================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const STORE_KEY = 'hp-builder-v1';

let state = null;      // { template, meta, theme, pages:[{id,name,path,title,desc,blocks}] }
let pageIdx = 0;       // 編集中のページ
let selected = null;   // 編集中のブロックID
let selectedEl = null; // 編集中の要素 {role, kind, name}
let uidSeq = 0;
const DEFAULT_MOTION = { anim: 'fadeup', dur: 900, stagger: 40, ease: 'cubic-bezier(.2,.7,.3,1)',
  reveal: true, smooth: true };
const uid = () => `b${Date.now().toString(36)}${(uidSeq++).toString(36)}`;
const closed = new Set(); // 折りたたんでいる繰り返し項目

/* ---------------- データの組み立て ---------------- */
const clone = (o) => JSON.parse(JSON.stringify(o));

function makeBlock(type, override = {}) {
  return { id: uid(), type, props: Object.assign(clone(BLOCKS[type].defaults), clone(override)) };
}

/* ================================================================
   ページ

   1枚のページで足りる人が大半なので、はじめは1枚しか無い。
   足したときだけ、ページを選ぶ帯が出る。

   ページは「名前・住所・中身」を持つ。住所（path）はファイル名になり、
   そのままアドレスの末尾になる。ホームだけは index で固定。

   配色・デザインの型・動きはサイト全体で共通。ページごとに変えられると
   バラバラのサイトになってしまい、直す場所も増える。
   ================================================================ */
const HOME_PATH = 'index';
const page = () => state.pages[Math.min(pageIdx, state.pages.length - 1)] || state.pages[0];
const isHome = (pg) => state.pages.indexOf(pg) === 0;

function makePage(name, blocks, path) {
  return { id: uid(), name, path: path || slugPath(name), title: '', desc: '', blocks };
}

/* 名前から住所を作る。日本語の名前でもアドレスに出せるよう、
   英数字が無いときは page-2 のような通し番号にする。 */
function slugPath(name, taken = []) {
  let s = String(name || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
  if (!s || s === HOME_PATH) s = '';
  let out = s || `page-${state.pages.length + 1}`;
  const used = new Set([HOME_PATH, ...taken]);
  let n = 2;
  while (used.has(out)) out = `${s || 'page'}-${n++}`;
  return out;
}

/* ================================================================
   お問い合わせフォームの届け先

   「見た目だけのフォーム」は、いちばんたちの悪い作りかたになる。
   押した人は送ったつもりで待ち、受け取る側は何も来ないことに
   気づかない。だから既定を「このツールで受け取る」にする。

   受け口は公開のときと同じ Cloud Function。サイトIDが決まるのは
   公開したあとなので、それまでは「まだ受け取れない」と出す。
   blocks.js の render から呼ばれる。
   ================================================================ */
const formEndpoint = () => (typeof PUBLISH === 'object' && PUBLISH.endpoint
  ? PUBLISH.endpoint.replace(/\/publish$/, '/form') : '');

function formAttrs(p) {
  if (p.formTo !== 'here') return '';
  const ep = formEndpoint();
  const id = (state && state.meta && state.meta.siteId) || '';
  if (!ep || !id) return ' data-form-wait="1"';   // 公開すれば受け取れるようになる
  return ` data-form="${esc(ep)}" data-site="${esc(id)}"${attr('data-thanks', p.thanks)}`;
}

/* リンク先が指しているページを引く。blocks.js の linkAttr から呼ばれる。
   消されたページを指していたら null（リンクは無効になるだけで、壊れない） */
function pageRef(id) {
  const pg = (state.pages || []).find((x) => x.id === id);
  if (!pg) return null;
  return { name: pg.name, href: state.pages.indexOf(pg) === 0 ? './' : `./${pg.path}.html` };
}

/* ページの出発点。ヘッダーとフッターはどのページにも要るので、
   いまのホームのものをそのまま借りる。1枚ずつ作り直させない。 */
function newPageBlocks(kind) {
  const home = state.pages[0].blocks;
  const same = (t) => { const b = home.find((x) => x.type === t); return b ? Object.assign(clone(b), { id: uid() }) : makeBlock(t); };
  const mid = { blank: [], about: ['about', 'features'], menu: ['menu'], contact: ['contact'] }[kind] || [];
  return [same('header'), ...mid.map((t) => makeBlock(t)), same('footer')];
}

/* テンプレートの配色を、そのまま state の配色にする。
   「薄いところを自動でそろえるか」は state だけが持つ設定なので、
   ここで必ず付ける（付け忘れると、書き出して読み直したときに
   持ち物が増えて、前後で中身が一致しなくなる）。 */
const themeOf = (t) => Object.assign({ autoTone: true }, clone(t));

function buildState(tplKey) {
  const t = TEMPLATES[tplKey];
  return {
    template: tplKey,
    meta: {
      title: t.blocks[0]?.props?.logo || 'My Website',
      description: 'このサイトの説明を入れてください。検索結果やSNSでの共有時に表示されます。',
      lang: 'ja',
    },
    theme: themeOf(t.theme),
    style: t.style || '',
    rules: !!t.rules,
    motion: clone(DEFAULT_MOTION),
    pages: [{ id: uid(), name: 'ホーム', path: HOME_PATH, title: '', desc: '',
      blocks: t.blocks.map((b) => makeBlock(b.type, b.props)) }],
  };
}

/* 部分ごとに組むときの出発点。
   ヘッダーとフッターだけ置いた空のページにする。この2つは
   「選ぶもの」ではなくどのページにも要るので、最初から入れておく。
   配色は無彩色寄りの corporate を借りる（あとでデザインタブから変えられる）。 */
function buildCustomState() {
  return {
    template: 'custom',
    meta: {
      title: 'My Website',
      description: 'このサイトの説明を入れてください。検索結果やSNSでの共有時に表示されます。',
      lang: 'ja',
    },
    theme: themeOf(TEMPLATES.corporate.theme),
    style: '',
    rules: false,
    motion: clone(DEFAULT_MOTION),
    pages: [{ id: uid(), name: 'ホーム', path: HOME_PATH, title: '', desc: '',
      blocks: [makeBlock('header'), makeBlock('footer')] }],
  };
}

/* 動きの初期設定 */
const MOTION_EASES = [
  ['cubic-bezier(.2,.7,.3,1)', 'なめらか（標準）'],
  ['cubic-bezier(.16,1,.3,1)', 'ぬるっと減速'],
  ['cubic-bezier(.34,1.56,.64,1)', '行き過ぎて戻る'],
  ['cubic-bezier(.76,0,.24,1)', 'ためて一気に'],
  ['linear', '等速'],
];

/* ================================================================
   取り消し / やり直し
   state をまるごと JSON にして積む。
   画像をデータURLで持てるので、件数と合計サイズの両方に上限を設ける。
   ================================================================ */
const hist = { stack: [], idx: -1, lastKey: null, lastAt: 0 };
const HIST_MAX = 40;
const HIST_BYTES = 12e6;
let applyingHistory = false;

function pushHistory(key) {
  if (applyingHistory || !state) return;
  const json = JSON.stringify(state);
  if (hist.stack[hist.idx] === json) return;          // 中身が変わっていない

  const now = Date.now();
  const sameRun = key && key === hist.lastKey && now - hist.lastAt < 800;
  if (sameRun && hist.idx === hist.stack.length - 1 && hist.idx > 0) {
    hist.stack[hist.idx] = json;                      // 連続した入力はひとまとめ
  } else {
    hist.stack.length = hist.idx + 1;                 // やり直し分は捨てる
    hist.stack.push(json);
    hist.idx = hist.stack.length - 1;
  }
  hist.lastKey = key || null;
  hist.lastAt = now;
  trimHistory();
  updateHistoryButtons();
}

function trimHistory() {
  while (hist.stack.length > HIST_MAX) { hist.stack.shift(); hist.idx--; }
  let total = hist.stack.reduce((n, j) => n + j.length, 0);
  while (total > HIST_BYTES && hist.stack.length > 2) {
    total -= hist.stack.shift().length;
    hist.idx--;
  }
  if (hist.idx < 0) hist.idx = 0;
}

function resetHistory() {
  hist.stack = [JSON.stringify(state)];
  hist.idx = 0;
  hist.lastKey = null;
  updateHistoryButtons();
}

function applyHistory(step) {
  const next = hist.idx + step;
  if (next < 0 || next >= hist.stack.length) return;
  if (editing) commitEdit();
  hist.idx = next;
  hist.lastKey = null;

  applyingHistory = true;
  state = JSON.parse(hist.stack[hist.idx]);
  selectedEl = null;
  if (!page().blocks.some((b) => b.id === selected)) {
    selected = page().blocks[1]?.id || page().blocks[0]?.id || null;
  }
  renderList(); renderEditor(); renderDesign(); renderPage(); renderPreview(true);
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 容量超過は無視 */ }
  applyingHistory = false;

  updateHistoryButtons();
  flash(step < 0 ? '元に戻しました' : 'やり直しました');
}
const undo = () => applyHistory(-1);
const redo = () => applyHistory(1);

function updateHistoryButtons() {
  $('#btnUndo').disabled = hist.idx <= 0;
  $('#btnRedo').disabled = hist.idx >= hist.stack.length - 1;
}
$('#btnUndo').addEventListener('click', undo);
$('#btnRedo').addEventListener('click', redo);

/* キーボード。文字入力中はブラウザ本来の取り消しに任せる */
function historyKey(e) {
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
  const a = (e.target.ownerDocument || document).activeElement;
  const typing = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
  if (typing || editing) return;
  e.preventDefault();
  e.shiftKey ? redo() : undo();
}
document.addEventListener('keydown', historyKey);

/* ---------------- 保存 / 読み込み ---------------- */
let saveTimer;
function save(key) {
  pushHistory(key);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      flash('保存しました');
    } catch (e) {
      /* 画像を入れすぎるとブラウザの保存上限（おおむね5MB）を超える。
         編集も書き出しも続けられるので、その旨だけ伝える。 */
      flash('自動保存の上限を超えました。今すぐHTMLを書き出してください');
    }
  }, 400);
}
function flash(msg) {
  const el = $('#saved');
  el.textContent = msg;
  clearTimeout(flash._t);
  flash._t = setTimeout(() => { el.textContent = ''; }, 1800);
}
/* 外から来た state を、いまの版で扱える形に整える。
   自動保存からの復帰でも、書き出したHTMLの読み込みでも同じ手当てが要る。 */
function migrate(s) {
  if (!s) return null;
  s.motion = Object.assign(clone(DEFAULT_MOTION), s.motion || {}); // 旧データ対策
  if (s.style === undefined) s.style = (TEMPLATES[s.template] || {}).style || '';
  s.meta = Object.assign({ title: 'My Website', description: '', lang: 'ja' }, s.meta || {});
  /* 薄いところを自動でそろえるかどうか。前に作ったものは、そのときの色を
     そのまま残したいので、決めた色を動かすまでは作り直さない（既定は自動）。 */
  if (s.theme && s.theme.autoTone === undefined) s.theme.autoTone = true;

  /* ページを持たない時代のデータは、まるごと1枚目のページにする。
     前に作ったページを読み込んでも、そのまま続きから直せる。 */
  if (!Array.isArray(s.pages)) {
    s.pages = [{ id: uid(), name: 'ホーム', path: HOME_PATH, title: '', desc: '', blocks: s.blocks || [] }];
  }
  delete s.blocks;

  const paths = new Set();
  const seen = new Set();   // id が重複すると、選択も並べ替えも別のものに効いてしまう
  s.pages.forEach((pg, i) => {
    if (!pg.id || seen.has(pg.id)) pg.id = uid();
    seen.add(pg.id);
    pg.name = pg.name || (i ? `ページ${i + 1}` : 'ホーム');
    pg.path = i === 0 ? HOME_PATH : String(pg.path || '').replace(/[^a-z0-9-]/g, '') || `page-${i + 1}`;
    while (paths.has(pg.path)) pg.path += '-2';
    paths.add(pg.path);
    // 知らないブロックが混ざっていたら捨てる（定義を消した時の保険）
    pg.blocks = (pg.blocks || []).filter((b) => BLOCKS[b.type]);
    pg.blocks.forEach((b) => {
      if (!b.id || seen.has(b.id)) b.id = uid();
      seen.add(b.id);
    });
  });
  s.pages = s.pages.filter((pg) => pg.blocks.length);
  return s.pages.length ? s : null;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch (e) { return null; }
}

/* ================================================================
   HTML生成
   ================================================================ */
/* 背景色の明るさから、その上に置いて読める文字色を決める。
   利用者が明るい色をメインに選んでも白文字で潰れないようにするため。 */
function readableOn(hex) {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const n = parseInt(full, 16);
  if (isNaN(n) || full.length !== 6) return '#ffffff';
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.42 ? '#111111' : '#ffffff';
}

function themeCSS(t) {
  return `:root{
  --c-primary:${t.primary};
  --c-accent:${t.accent};
  --c-bg:${t.bg};
  --c-surface:${t.surface};
  --c-text:${t.text};
  --c-muted:${t.muted};
  --c-border:${t.border};
  --c-dark:${t.dark};
  --radius:${t.radius}px;
  --max:${t.max}px;
  --font:${fontStack(t.font)};
  --font-head:${fontStack(t.fontHead)};
  --c-on-primary:${readableOn(t.primary)};
  --c-on-accent:${readableOn(t.accent)};
  --c-on-dark:${readableOn(t.dark)};
  --ta-dur:${(state.motion.dur / 1000)}s;
  --ta-stagger:${(state.motion.stagger / 1000)}s;
  --ta-ease:${state.motion.ease};
}`;
}

/* テンプレート名と「デザインの型」を body のクラスにする */
const bodyClass = () => `tpl-${state.template}${state.style ? ` sty-${state.style}` : ''}`
  + (state.rules ? ' has-rules' : '');

const bodyHTML = (pg = page()) => pg.blocks.map((b) => BLOCKS[b.type].render(b.props)).join('\n\n');

/* 書き出し時は編集画面専用の属性を取り除く（動作に必要な data-ta/-ia/-anim/-delay は残す） */
/* 書き出しでは編集用の目印を全部落とす。imgprop も忘れずに
   （落とし忘れると、画像枠の属性が書き出したHTMLに残る） */
const exportBody = (pg) => bodyHTML(pg).replace(/ data-(?:el|elname|elkind|prop|imgprop|gopage)="[^"]*"/g, '');

/* 書き出し用の完成HTML（1ファイルで動く） */
/* ================================================================
   書き出したHTMLから編集を再開できるようにする

   保存先がブラウザの中しかないと、機種を変えた時点で全部消える。
   かといってサーバーは持たない方針なので、書き出したHTML自身に
   組み立て情報を持たせて、それを読み込めば続きから編集できる形にした。
   利用者が管理するファイルは、これまでどおり1枚のままで済む。

   写真は本文にすでに入っているので、そのまま埋めると倍の重さになる。
   本文に出てくるデータURLを順番に数えて、番号だけを持たせる。
   ================================================================ */
const SITE_DATA_ID = 'hp-builder-data';
const IMG_REF = '@@hpimg:';

/* 本文に出てくるデータURLを、出てきた順に重複なく集める */
function bodyImages(html) {
  const out = [];
  const seen = new Set();
  const re = /"(data:image\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push(m[1]);
  }
  return out;
}

/* 写真を番号に置き換えた state を返す。
   本文に出てこない写真（表示されない項目に入っているものなど）は、
   参照しようがないのでそのまま持たせる。 */
function slimState(imgs, forPublish) {
  const idx = new Map(imgs.map((s, i) => [s, i]));
  const walk = (o) => {
    for (const k in o) {
      const v = o[k];
      if (typeof v === 'string' && idx.has(v)) o[k] = IMG_REF + idx.get(v);
      else if (v && typeof v === 'object') walk(v);
    }
  };
  const s = clone(state);
  walk(s);
  /* 公開する版から合言葉を外す。公開ページは誰でも保存できるので、
     入れたままだと拾った人がそのサイトを上書きできてしまう。
     手元にダウンロードする版には残す（それが持ち主の証明になる）。 */
  if (forPublish) delete s.meta.editToken;
  return s;
}

/* 番号を写真に戻す */
function fattenState(s, imgs) {
  const walk = (o) => {
    for (const k in o) {
      const v = o[k];
      if (typeof v === 'string' && v.startsWith(IMG_REF)) {
        const i = Number(v.slice(IMG_REF.length));
        o[k] = imgs[i] ?? '';
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(s);
  return s;
}

/* ================================================================
   1ページぶんのHTML

   ページが1枚なら、これまでどおり index.html が1つ出るだけ。
   2枚以上あるときは、ページごとに1ファイル。組み立て情報は
   ホーム（index.html）にだけ入れる。全ページに入れると、写真を
   ページの数だけ持つことになって、まとめて重くなる。

   ホーム以外には目印だけ置いて、間違って読み込まれたときに
   「index.html を読み込んでください」と言えるようにする。
   ================================================================ */
const SITE_SUB_MARK = 'hp-builder-sub';

function pageTitle(pg) {
  if (pg.title) return pg.title;
  return isHome(pg) ? state.meta.title : `${pg.name}｜${state.meta.title}`;
}
const pageDesc = (pg) => pg.desc || state.meta.description;

/* そのページのアドレス。ホームは末尾なし、ほかは <住所>.html */
const pagePath = (pg) => (isHome(pg) ? 'index.html' : `${pg.path}.html`);
function pageURL(pg) {
  const raw = String(state.meta.siteUrl || '');
  if (!raw) return '';
  /* ホームは、控えてもらったアドレスをそのまま出す。こちらで
     末尾を足したり削ったりすると、打った人の覚えと食い違う */
  if (isHome(pg)) return raw;
  return `${raw.replace(/\/index\.html$/, '').replace(/\/+$/, '')}/${pg.path}.html`;
}

function pageHTML(pg, forPublish) {
  const m = state.meta;
  const body = exportBody(pg);
  const url = pageURL(pg);
  /* 組み立て情報。</script> が中に現れると、そこでタグが閉じてしまうので逃がす */
  const data = isHome(pg)
    ? JSON.stringify(slimState(bodyImages(body), forPublish)).replace(/<\//g, '<\\/')
    : null;
  return `<!DOCTYPE html>
<html lang="${esc(m.lang || 'ja')}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle(pg))}</title>
<meta name="description" content="${esc(pageDesc(pg))}">
<meta property="og:title" content="${esc(pageTitle(pg))}">
<meta property="og:description" content="${esc(pageDesc(pg))}">
<meta property="og:type" content="website">${url ? `
<link rel="canonical" href="${esc(url)}">
<meta property="og:url" content="${esc(url)}">` : ''}
<style>
${themeCSS(state.theme)}
${SITE_CSS}
${shapeMaskCSS(usedShapes(state))}
${textFillCSS(usedFills(state))}
</style>
</head>
<body class="${esc(bodyClass())}" data-anim="${esc(state.motion.anim)}" data-reveal="${state.motion.reveal ? 1 : 0}" data-smooth="${state.motion.smooth ? 1 : 0}">

${body}

<script>${SITE_JS}<\/script>
${data ? `<!-- このファイルを編集ツールに読み込むと、続きから編集できます -->
<script type="application/json" id="${SITE_DATA_ID}">${data}<\/script>`
       : `<!-- 編集の続きは index.html から。この印はそのための目印です -->
<script type="application/json" id="${SITE_SUB_MARK}">{"home":"index.html"}<\/script>`}
</body>
</html>`;
}

/* サイト全体を書き出す。[{name, html}] を返す */
const siteFiles = (forPublish) =>
  state.pages.map((pg) => ({ name: pagePath(pg), path: isHome(pg) ? HOME_PATH : pg.path, html: pageHTML(pg, forPublish) }));

/* 1ページだけのときの、これまでどおりの書き出し */
const fullHTML = (forPublish) => pageHTML(state.pages[0], forPublish);

/* 書き出したHTMLを読んで state に戻す。
   このツールが作ったものでなければ null を返す。 */
function stateFromHTML(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const tag = doc.getElementById(SITE_DATA_ID);
  /* ホーム以外のページを読み込まれたときは、どこを読めばいいかを返す */
  if (!tag) return doc.getElementById(SITE_SUB_MARK) ? 'sub' : null;
  let s;
  try { s = JSON.parse(tag.textContent); } catch { return null; }
  if (!s || !(Array.isArray(s.blocks) || Array.isArray(s.pages))) return null;
  /* 数える範囲は、書き出したときと同じ「本文だけ」に揃える。
     生成サイトのCSSには data:image/svg+xml が1つ入っているので、
     文書ぜんぶを数えると番号が1つずれる（実測で確認）。
     style は head にあるので body を見れば外れるが、script は body の中にある。 */
  const bodyOnly = doc.body.innerHTML.replace(/<script[\s\S]*?<\/script>/gi, '');
  return fattenState(s, bodyImages(bodyOnly));
}

/* ================================================================
   プレビュー
   ================================================================ */
const PREVIEW_CSS = `
[data-bid]{position:relative;transition:outline-color .15s}
[data-bid]{outline:2px solid transparent;outline-offset:-2px}
[data-bid]:hover{outline-color:rgba(76,141,255,.45);cursor:pointer}
[data-bid].__sel{outline-color:#4c8dff}

/* クリックできる要素。position は下の [data-imgprop] と同じ理由で :where() */
[data-el]{outline:1px dashed transparent;outline-offset:3px;
  transition:outline-color .12s}
:where([data-el]){position:relative}
[data-el]:hover{outline-color:rgba(76,141,255,.85);cursor:pointer}
[data-el].__elsel{outline:2px solid #4c8dff;outline-style:solid}
[data-el]:hover::after,[data-el].__elsel::after{
  content:attr(data-elname);position:absolute;top:2px;left:2px;z-index:20;
  background:#4c8dff;color:#fff;border-radius:4px;padding:1px 7px;pointer-events:none;
  font:700 10px/1.7 -apple-system,"Hiragino Sans",sans-serif;letter-spacing:.04em;white-space:nowrap}
[data-elkind="ia"]:hover::after,[data-elkind="ia"].__elsel::after{background:#8b5cf6}
[data-elkind="ia"]:hover{outline-color:rgba(139,92,246,.85)}
[data-elkind="ia"].__elsel{outline-color:#8b5cf6}

/* ダブルクリックで直接編集できる場所。
   position を強く当てると、自分で位置を決めている文字（写真の上に乗せる印など）が
   編集画面だけ流れに戻って落ちる。ここも :where() で当てる。 */
[data-prop]{outline:1px dashed transparent;outline-offset:3px;
  transition:outline-color .12s}
:where([data-prop]){position:relative}
[data-prop]:hover{outline-color:rgba(76,141,255,.85);cursor:text}
[data-prop]:hover::after{
  content:attr(data-elname) " ✎";position:absolute;top:2px;left:2px;z-index:20;
  background:#4c8dff;color:#fff;border-radius:4px;padding:1px 7px;pointer-events:none;
  font:700 10px/1.7 -apple-system,"Hiragino Sans",sans-serif;letter-spacing:.04em;white-space:nowrap}

/* 画像を差し替えられる枠。

   position は :where() で当てる（強さ 0）。ブロック側が自分で配置を
   決めている枠（回るカード・円で切り替わる面・背景いっぱいの写真など）は
   position:absolute なので、ここで relative に上書きすると並びが崩れる。
   実際、3Dカルーセルが編集画面だけ縦に散らばっていた。
   自分で位置を決めていない枠にだけ relative が入ればよい。 */
[data-imgprop]{cursor:pointer}
:where([data-imgprop]){position:relative}
[data-imgprop]:hover::after{
  content:"画像を選ぶ";background:#8b5cf6;color:#fff;position:absolute;top:2px;left:2px;z-index:21;
  border-radius:4px;padding:1px 7px;pointer-events:none;white-space:nowrap;
  font:700 10px/1.7 -apple-system,"Hiragino Sans",sans-serif;letter-spacing:.04em}
[data-imgprop].__imgdrop{
  outline:3px dashed #8b5cf6!important;outline-offset:-3px;
  background:rgba(139,92,246,.22)!important}
[data-imgprop].__imgdrop::after{content:"ここに放す";background:#8b5cf6;opacity:1}

/* 編集中 */
[data-prop].__editing{
  outline:2px solid #f59e0b!important;outline-offset:3px;cursor:text;
  background:rgba(245,158,11,.10);white-space:pre-wrap;border-radius:3px}
[data-prop].__editing::after{
  content:"編集中 — Esc で取り消し / 外をクリックで確定";background:#f59e0b;color:#3a2a05;
  top:auto;bottom:calc(100% + 5px);opacity:1}
`;

let pdoc = null;
function initPreview() {
  const f = $('#preview');
  return new Promise((res) => {
    f.addEventListener('load', () => {
      pdoc = f.contentDocument;
      pdoc.getElementById('s-base').textContent = SITE_CSS;
      pdoc.getElementById('s-edit').textContent = PREVIEW_CSS;
      pdoc.addEventListener('click', (e) => {
        if (editing && editing.el.contains(e.target)) return;  // 編集中の中身のクリックは通す
        e.preventDefault();
        if (editing) commitEdit();

        /* ほかのページへのリンクを押したら、そのページに移る。
           プレビューは1枚のHTMLなので本当には飛べないが、
           押した人が期待するのは「そのページが出ること」なので合わせる */
        const go = e.target.closest('[data-gopage]');
        if (go) { const i = state.pages.findIndex((x) => x.id === go.dataset.gopage); if (i >= 0) return gotoPage(i); }

        const blk = e.target.closest('[data-bid]');
        if (!blk) return;
        const elt = e.target.closest('[data-el]');
        if (elt) selectEl(blk.dataset.bid, elt.dataset.el, elt.dataset.elkind, elt.dataset.elname, elt.dataset.prop);
        else { selectedEl = null; select(blk.dataset.bid); }

        /* 画像枠。まだ写真が入っていなければ、そのまま端末の写真選択を開く。
           入っているときに開いてしまうと、位置を直したいだけのときに
           毎回ファイル選択が出てしまうので、右の欄で調整できるようにする。 */
        const slot = e.target.closest('[data-imgprop]');
        if (slot) {
          const bb = page().blocks.find((x) => x.id === blk.dataset.bid);
          const has = bb && getPath(bb.props, slot.dataset.imgprop);
          if (has) selectImgSlot(blk.dataset.bid, slot.dataset.imgprop, slot.dataset.elname);
          else openImagePicker(blk.dataset.bid, slot.dataset.imgprop);
        }
      });

      /* ---- 画像ファイルのドラッグ&ドロップ（PC） ---- */
      let dropSlot = null;
      const clearDropSlot = () => {
        if (dropSlot) dropSlot.classList.remove('__imgdrop');
        dropSlot = null;
      };
      pdoc.addEventListener('dragover', (e) => {
        if (![...(e.dataTransfer.types || [])].includes('Files')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const slot = e.target.closest('[data-imgprop]');
        if (slot === dropSlot) return;
        clearDropSlot();
        if (slot) { dropSlot = slot; slot.classList.add('__imgdrop'); }
      });
      pdoc.addEventListener('dragleave', (e) => { if (!e.relatedTarget) clearDropSlot(); });
      pdoc.addEventListener('drop', (e) => {
        if (![...(e.dataTransfer.types || [])].includes('Files')) return;
        e.preventDefault();
        const slot = e.target.closest('[data-imgprop]');
        const blk = e.target.closest('[data-bid]');
        clearDropSlot();
        if (!slot || !blk) { flash('画像の枠に重ねて放してください'); return; }
        const f = e.dataTransfer.files[0];
        if (f) setImage(blk.dataset.bid, slot.dataset.imgprop, f);
      });

      pdoc.addEventListener('dblclick', (e) => {
        const t = e.target.closest('[data-prop]');
        const blk = e.target.closest('[data-bid]');
        if (!t || !blk) return;
        e.preventDefault();
        startEdit(t, blk.dataset.bid, t.dataset.prop);
      });

      pdoc.addEventListener('keydown', historyKey);
      pdoc.addEventListener('keydown', (e) => {
        if (!editing) return;
        if (e.key === 'Escape') { e.preventDefault(); commitEdit(true); }
        else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commitEdit(); }
      });
      pdoc.addEventListener('focusout', (e) => {
        if (editing && e.target === editing.el) setTimeout(() => { if (editing) commitEdit(); }, 0);
      });
      res();
    }, { once: true });
    f.srcdoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style id="s-base"></style><style id="s-theme"></style><style id="s-edit"></style>
</head><body></body></html>`;
  });
}

/* いま使われている「絵から作った形」だけを集める。
   書き出すCSSを、使っている分だけにするため。 */
/* いま使われている「絵の塗り」だけを集める */
/* サイト全体で使っている形・塗りを集める。ページごとに違うCSSを持たせると
   ページを移ったときに絵が変わって見えるので、どのページにも同じものを敷く */
const allBlocks = (st) => (st.pages || []).flatMap((pg) => pg.blocks || []);

function usedFills(st) {
  const set = new Set();
  allBlocks(st).forEach((b) => {
    Object.values((b.props && b.props.fills) || {}).forEach((v) => set.add(v));
  });
  return [...set];
}

function usedShapes(st) {
  const set = new Set();
  allBlocks(st).forEach((b) => { if (b.props && b.props.shape) set.add(b.props.shape); });
  return [...set];
}

let pvTimer;
function renderPreview(now = false) {
  if (editing) return;   // 直接編集の最中に作り直すと入力が消えるので触らない
  clearTimeout(pvTimer);
  const run = () => {
    if (!pdoc) return;
    pdoc.getElementById('s-theme').textContent = themeCSS(state.theme)
      + '\n' + shapeMaskCSS(usedShapes(state))
      + '\n' + textFillCSS(usedFills(state));
    pdoc.body.className = bodyClass();
    pdoc.body.setAttribute('data-anim', state.motion.anim);
    pdoc.body.setAttribute('data-reveal', state.motion.reveal ? '1' : '0');
    pdoc.body.setAttribute('data-smooth', state.motion.smooth ? '1' : '0');
    pdoc.body.innerHTML = bodyHTML();
    // 生成されたトップレベル要素とブロックを対応づける（クリックで選択できるように）
    [...pdoc.body.children].forEach((el, i) => {
      const b = page().blocks[i];
      if (!b) return;
      el.dataset.bid = b.id;
      if (b.id === selected) el.classList.add('__sel');
    });
    const s = pdoc.createElement('script');
    s.textContent = SITE_JS;
    pdoc.body.appendChild(s);
    markSelectedEl();
  };
  now ? run() : (pvTimer = setTimeout(run, 160));
}

function highlight() {
  if (!pdoc) return;
  $$('[data-bid]', pdoc).forEach((el) => el.classList.toggle('__sel', el.dataset.bid === selected));
  markSelectedEl();
}

/* 選択中の要素に枠を戻す（プレビューを作り直すと消えるため） */
function markSelectedEl() {
  if (!pdoc) return;
  $$('[data-el].__elsel', pdoc).forEach((el) => el.classList.remove('__elsel'));
  if (!selectedEl || !selected) return;
  const blk = pdoc.querySelector(`[data-bid="${selected}"]`);
  const el = blk && blk.querySelector(`[data-el="${selectedEl.role}"]`);
  if (el) el.classList.add('__elsel');
}

/* ================================================================
   プレビュー上での直接編集（ダブルクリック）
   ================================================================ */
let editing = null;   // {el, blockId, prop, raw}
const getPath = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

function startEdit(el, blockId, prop) {
  if (editing) commitEdit();
  const b = page().blocks.find((x) => x.id === blockId);
  if (!b) return;
  const raw = String(getPath(b.props, prop) ?? '');

  editing = { el, blockId, prop, raw };
  el.textContent = raw;            // 文字アニメで分割された span を元のテキストに戻す
  el.classList.add('__editing');
  /* plaintext-only なら改行だけの素直な入力になる。未対応のブラウザは true にする */
  try { el.contentEditable = 'plaintext-only'; } catch (e) { el.contentEditable = 'true'; }
  el.focus();

  const r = pdoc.createRange();
  r.selectNodeContents(el);
  const sel = pdoc.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

function commitEdit(cancel = false) {
  if (!editing) return;
  const { el, blockId, prop, raw } = editing;
  const typed = el.innerText.replace(/\u00a0/g, ' ').replace(/\n+$/, '');
  editing = null;

  el.contentEditable = 'false';
  el.classList.remove('__editing');

  const b = page().blocks.find((x) => x.id === blockId);
  const val = cancel ? raw : typed;
  if (b && val !== raw) {
    setPath(b.props, prop, val);
    renderList(); renderEditor(); save(`i:${prop}:${blockId}`);
  }
  renderPreview(true);
}

/* 写真の枠そのものを選ぶ。位置・大きさ・背景ぬきの操作を右の欄に出す */
function selectImgSlot(blockId, prop, name) {
  selected = blockId;
  selectedEl = { kind: 'img', prop, name: name || '写真', role: `img:${prop}` };
  renderList(); renderEditor(); highlight();
  if (isMobile()) openSheetForEdit();
}

const FIT0 = { x: 50, y: 50, z: 100 };
const fitOf = (b, prop) => Object.assign({}, FIT0, getPath(b.props, `${prop}Fit`) || {});

function setFit(prop, key, val) {
  const b = page().blocks.find((x) => x.id === selected);
  if (!b) return;
  const f = fitOf(b, prop);
  f[key] = val;
  /* 既定のままなら持たない。書き出しに余計な style を出さないため */
  if (f.x === 50 && f.y === 50 && f.z === 100) setPath(b.props, `${prop}Fit`, undefined);
  else setPath(b.props, `${prop}Fit`, f);
  renderPreview(true);
  save(`fit:${prop}:${b.id}`);
}

function selectEl(blockId, role, kind, name, prop) {
  selected = blockId;
  selectedEl = { role, kind, name, prop };
  renderList(); renderEditor(); highlight();
  if (isMobile()) openSheetForEdit();
}
/* スマホで要素を選んだとき、編集シートが閉じていれば開く。
   シートで下半分が隠れるので、選んだ要素を上のほうへ寄せておく。 */
function openSheetForEdit() {
  switchTab('edit');
  if (!$('#panelRight').classList.contains('open')) openSheet('right', 'edit');
  const el = pdoc && pdoc.querySelector('[data-el].__elsel');
  if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}
function scrollToBlock(id) {
  const el = pdoc && pdoc.querySelector(`[data-bid="${id}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ================================================================
   左パネル：ブロック一覧
   ================================================================ */
/* ページを選ぶ帯。1枚しかないうちは出さない。
   ページという考えかたを、必要になるまで見せない（大半の人は1枚で足りる） */
function renderPageBar() {
  const bar = $('#pageBar');
  bar.hidden = state.pages.length < 2;
  if (bar.hidden) return;
  bar.innerHTML = state.pages.map((pg, i) => `<button class="pg${i === pageIdx ? ' on' : ''}" data-pg="${i}">
      ${esc(pg.name)}<small>${i === 0 ? '/' : `/${esc(pg.path)}.html`}</small>
    </button>`).join('') + '<button class="pg add" id="pgAdd" title="ページを追加">＋</button>';
}

$('#pageBar').addEventListener('click', (e) => {
  if (e.target.closest('#pgAdd')) return openPageModal();
  const b = e.target.closest('[data-pg]');
  if (b) gotoPage(Number(b.dataset.pg));
});

function gotoPage(i) {
  if (i === pageIdx || !state.pages[i]) return;
  if (editing) commitEdit();
  pageIdx = i;
  selected = page().blocks[1]?.id || page().blocks[0]?.id || null;
  selectedEl = null;
  closed.clear();
  refresh();
  if (pdoc) pdoc.defaultView.scrollTo(0, 0);
}

/* ================================================================
   届いたお問い合わせ

   預かった内容を読む。持ち主の証明は公開と同じ合言葉で、
   その合言葉は手元のデータの中にあるので、入力を求めない。
   ================================================================ */
async function loadInbox() {
  const box = $('#inboxList');
  const id = state.meta.siteId;
  const tok = state.meta.editToken;
  $('#inboxReload').hidden = !(id && tok);

  if (!id) {
    $('#inboxSub').textContent = '';
    box.innerHTML = `<p class="inbox-none">まだ公開していません。<br>
      「公開する」でこのツールから公開すると、お問い合わせを受け取れるようになります。</p>`;
    return;
  }
  if (!tok) {
    $('#inboxSub').textContent = '';
    box.innerHTML = `<p class="inbox-none">このサイトの合言葉が手元にありません。<br>
      公開したときに書き出した index.html を「保存したファイルから続ける」で読み込んでください。</p>`;
    return;
  }

  $('#inboxSub').textContent = '新しいものから100件まで。';
  box.innerHTML = '<p class="inbox-none">読み込んでいます…</p>';
  let j = {};
  try {
    const r = await fetch(formEndpoint().replace(/\/form$/, '/messages'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: id, editToken: tok }),
    });
    j = await r.json();
    if (!r.ok) throw new Error(j.error || `読み出せませんでした（${r.status}）`);
  } catch (e) {
    box.innerHTML = `<p class="inbox-none">${esc(e.message || 'つながりませんでした')}</p>`;
    return;
  }
  const list = j.messages || [];
  if (!list.length) {
    box.innerHTML = '<p class="inbox-none">まだ届いていません。</p>';
    return;
  }
  box.innerHTML = list.map((m) => `<div class="ib">
    <div class="ib-h"><b>${esc(m.name)}</b>
      <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>
      <time>${esc(m.at ? new Date(m.at).toLocaleString('ja-JP') : '')}</time></div>
    <p>${nl2br(esc(m.message))}</p>
  </div>`).join('');
}
$('#btnInbox').addEventListener('click', () => { openModal('#inboxModal'); loadInbox(); });
$('#inboxReload').addEventListener('click', loadInbox);
$('#inboxClose').addEventListener('click', () => closeModal('#inboxModal'));

/* ---------------- ページを追加する ---------------- */
let pgKind = 'blank';
function openPageModal() {
  pgKind = 'blank';
  $('#pgName').value = '';
  $('#pgPath').value = '';
  $$('#pgKinds button').forEach((b) => b.classList.toggle('on', b.dataset.kind === 'blank'));
  openModal('#pageModal');
  setTimeout(() => $('#pgName').focus(), 60);
}
$('#btnAddPage').addEventListener('click', openPageModal);
$('#pgCancel').addEventListener('click', () => closeModal('#pageModal'));
$('#pgKinds').addEventListener('click', (e) => {
  const b = e.target.closest('[data-kind]');
  if (!b) return;
  pgKind = b.dataset.kind;
  $$('#pgKinds button').forEach((x) => x.classList.toggle('on', x === b));
});
/* 名前を打つあいだ、アドレスを一緒に作る。自分で直したらそれ以上いじらない */
$('#pgName').addEventListener('input', () => {
  if ($('#pgPath').dataset.touched) return;
  $('#pgPath').value = slugPath($('#pgName').value, state.pages.map((p) => p.path));
});
$('#pgPath').addEventListener('input', (e) => {
  e.target.dataset.touched = '1';
  e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
});
$('#pgMake').addEventListener('click', () => {
  const name = $('#pgName').value.trim() || `ページ${state.pages.length + 1}`;
  const path = slugPath($('#pgPath').value || name, state.pages.map((p) => p.path));
  state.pages.push(makePage(name, newPageBlocks(pgKind), path));
  closeModal('#pageModal');
  pageIdx = state.pages.length - 1;
  selected = page().blocks[1]?.id || page().blocks[0]?.id;
  selectedEl = null;
  closed.clear();
  refresh();
  save('page:add');
  flash(`「${name}」を作りました`);
});

function renderList() {
  renderPageBar();
  const wrap = $('#blockList');
  wrap.innerHTML = page().blocks.map((b, i) => {
    const def = BLOCKS[b.type];
    const label = b.props.title || b.props.logo || def.label;
    const fixed = def.unique;   // ヘッダー・フッターは位置が決まっているので動かさない
    return `<div class="bl-item${b.id === selected ? ' on' : ''}" data-id="${b.id}"
        draggable="${fixed ? 'false' : 'true'}">
      <span class="bl-grip">${fixed ? '&nbsp;' : '⠿'}</span>
      <span class="bl-ic">${def.icon}</span>
      <span class="bl-name">${esc(label)}<br><span class="bl-sub">${def.label}</span></span>
      <span class="bl-ops">
        <button data-act="up" title="上へ"${i === 0 ? ' disabled' : ''}>↑</button>
        <button data-act="down" title="下へ"${i === page().blocks.length - 1 ? ' disabled' : ''}>↓</button>
        <button data-act="dup" title="複製">⧉</button>
        <button data-act="del" title="削除">✕</button>
      </span>
    </div>`;
  }).join('');
}

$('#blockList').addEventListener('click', (e) => {
  const item = e.target.closest('.bl-item');
  if (!item) return;
  const id = item.dataset.id;
  const i = page().blocks.findIndex((b) => b.id === id);
  const act = e.target.closest('button')?.dataset.act;

  if (!act) { selectedEl = null; select(id); scrollToBlock(id); return; }
  if (act === 'up' && i > 0) page().blocks.splice(i - 1, 0, page().blocks.splice(i, 1)[0]);
  if (act === 'down' && i < page().blocks.length - 1) page().blocks.splice(i + 1, 0, page().blocks.splice(i, 1)[0]);
  if (act === 'dup') {
    const c = clone(page().blocks[i]); c.id = uid();
    page().blocks.splice(i + 1, 0, c); selected = c.id;
  }
  if (act === 'del') {
    if (!confirm(`「${BLOCKS[page().blocks[i].type].label}」を削除しますか？`)) return;
    page().blocks.splice(i, 1);
    if (selected === id) selected = page().blocks[Math.min(i, page().blocks.length - 1)]?.id || null;
  }
  refresh();
});

/* ================================================================
   ドラッグ&ドロップ（並べ替え / 位置を指定して追加）
   ================================================================ */
const listEl = $('#blockList');
let drag = null;   // {mode:'move', id} または {mode:'add', type}

/* ヘッダーは先頭、フッターは末尾に固定されるので、その内側に収める */
function clampIdx(i) {
  const lo = page().blocks[0] && page().blocks[0].type === 'header' ? 1 : 0;
  const fi = page().blocks.findIndex((b) => b.type === 'footer');
  const hi = fi >= 0 ? fi : page().blocks.length;
  return Math.min(Math.max(i, lo), hi);
}

/* マウス位置から挿入先を求める（各項目の上半分なら手前） */
function dropIndex(y) {
  const items = $$('.bl-item', listEl);
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect();
    if (y < r.top + r.height / 2) return i;
  }
  return items.length;
}

function showLine(idx) {
  const items = $$('.bl-item', listEl);
  items.forEach((it) => it.classList.remove('over-top', 'over-bottom'));
  if (!items.length) return;
  if (idx < items.length) items[idx].classList.add('over-top');
  else items[items.length - 1].classList.add('over-bottom');
}
function clearDrag() {
  drag = null;
  listEl.classList.remove('dropping');
  $$('.bl-item', listEl).forEach((it) => it.classList.remove('over-top', 'over-bottom', 'dragging'));
}

listEl.addEventListener('dragstart', (e) => {
  const it = e.target.closest('.bl-item');
  if (!it || it.getAttribute('draggable') === 'false') return;
  drag = { mode: 'move', id: it.dataset.id };
  it.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', it.dataset.id);
});
listEl.addEventListener('dragend', clearDrag);

listEl.addEventListener('dragover', (e) => {
  if (!drag) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = drag.mode === 'add' ? 'copy' : 'move';
  listEl.classList.add('dropping');
  showLine(clampIdx(dropIndex(e.clientY)));
});
listEl.addEventListener('dragleave', (e) => {
  if (!listEl.contains(e.relatedTarget)) {
    $$('.bl-item', listEl).forEach((it) => it.classList.remove('over-top', 'over-bottom'));
    listEl.classList.remove('dropping');
  }
});

function performDrop(y) {
  if (!drag) return;
  let at = clampIdx(dropIndex(y));

  if (drag.mode === 'move') {
    const from = page().blocks.findIndex((b) => b.id === drag.id);
    if (from < 0) return clearDrag();
    if (at > from) at--;                       // 自分を抜いた分だけ詰まる
    if (at !== from) {
      page().blocks.splice(at, 0, page().blocks.splice(from, 1)[0]);
    }
    selected = drag.id;
  } else {
    const nb = makeBlock(drag.type);
    page().blocks.splice(at, 0, nb);
    selected = nb.id;
    selectedEl = null;
  }
  clearDrag();
  refresh();
  const id = selected;
  setTimeout(() => scrollToBlock(id), 220);
}

listEl.addEventListener('drop', (e) => {
  if (!drag) return;
  e.preventDefault();
  performDrop(e.clientY);
});

/* ---- タッチでの並べ替え（HTML5のドラッグ&ドロップは指では動かないため） ----
   移動・終了は document で受ける。setPointerCapture が使えない環境でも
   確実に最後まで追えるようにするため。 */
let touchDrag = false;

function onTouchMove(e) {
  if (!touchDrag || !drag) return;
  e.preventDefault();
  showLine(clampIdx(dropIndex(e.clientY)));
  const r = listEl.getBoundingClientRect();          // 端に寄ったら自動スクロール
  if (e.clientY < r.top + 40) listEl.scrollTop -= 8;
  else if (e.clientY > r.bottom - 40) listEl.scrollTop += 8;
}
function stopTouchDrag() {
  touchDrag = false;
  document.removeEventListener('pointermove', onTouchMove);
  document.removeEventListener('pointerup', onTouchEnd);
  document.removeEventListener('pointercancel', onTouchCancel);
}
function onTouchEnd(e) {
  if (!touchDrag) return;
  stopTouchDrag();
  performDrop(e.clientY);
}
function onTouchCancel() { stopTouchDrag(); clearDrag(); }

listEl.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') return;             // マウスは標準のD&Dに任せる
  const it = e.target.closest('.bl-item');
  if (!it || it.getAttribute('draggable') === 'false') return;
  if (!e.target.closest('.bl-grip')) return;         // 掴む場所からだけ始める
  e.preventDefault();
  touchDrag = true;
  drag = { mode: 'move', id: it.dataset.id };
  it.classList.add('dragging');
  listEl.classList.add('dropping');
  try { listEl.setPointerCapture(e.pointerId); } catch (err) { /* 使えなくても続行 */ }
  document.addEventListener('pointermove', onTouchMove, { passive: false });
  document.addEventListener('pointerup', onTouchEnd);
  document.addEventListener('pointercancel', onTouchCancel);
});

/* ================================================================
   ブロックを追加（実物サンプル付きの一覧）
   サンプルは iframe の中に、生成サイトと同じCSSで縮小して描く。
   ================================================================ */
const CATS = [['all', 'すべて'], ['基本', '基本'], ['スクロール', 'スクロール連動'],
              ['3D', '3D'], ['図解', '数字・図解'], ['演出', '演出']];
const catOf = (def) => (def.tag === '数字' ? '図解' : def.tag || '基本');
let addCat = 'all';

/* サンプル用のCSS。スクロール連動のブロックは動かないので、
   代表的な瞬間で止めて見えるようにする。 */
/* 見本は、いつも「広い画面の並び」で描く。

   見本の中身は生成サイトと同じCSSなので、メディアクエリが効く。
   iframe を画面幅のまま置くと、スマホでは iframe 自体が狭いと判定されて、
   「写真 左 ／ 文章 右」が縦積みで出てしまう。名前とかたちが食い違って、
   かたちで選べなくなる。
   そこで iframe を GAL_W の幅で描かせ、丸ごと縮めて枠に収める。
   縮む分、カードの文字や余白は 1/縮尺 倍にして、画面上の見た目を保つ。 */
const GAL_W = 1180;

function galGeom(f) {
  const wrap = f.parentElement;
  /* 枠がまだ描かれていない（開く前など）ときは、画面の幅から見積もる。
     900px を決め打ちにすると、スマホでもPC用の並びで作ってしまう。 */
  const W = wrap.clientWidth || Math.min(window.innerWidth - 48, GAL_W);
  const H = wrap.clientHeight || Math.round(window.innerHeight * 0.52);
  return { W, H, gs: Math.min(1, W / GAL_W), cols: W < 520 ? 1 : W < 900 ? 2 : 3 };
}

/* 見本の数に合わせて枠の高さを決める。
   1段あたりのカードは cols 枚で、1枚はおよそ 0.72:1。
   少ないときだけ縮め、多いときは今までどおり（中でスクロールさせる）。 */
function fitGalHeight(wrap, n) {
  if (!wrap) return;
  const W = wrap.clientWidth || Math.min(window.innerWidth - 48, GAL_W);
  const cols = W < 520 ? 1 : W < 900 ? 2 : 3;
  const rows = Math.ceil(Math.max(1, n) / cols);
  const need = Math.round((W / cols) * 0.86 * rows + 28);
  /* flex:1 は flex-basis:0 なので、height だけ書いても効かない
     （縦並びの中では flex-basis が高さを決める）。min-height（56vh）も
     効いていると縮まないので、3つまとめてここで外す。
     ほかの一覧は今までどおりにしたいので、CSSではなくここで当てる */
  wrap.style.flex = '0 0 auto';
  wrap.style.minHeight = '0';
  wrap.style.height = `${Math.min(need, Math.round(window.innerHeight * 0.56))}px`;
}

/* iframe を広い幅で描かせて、枠のぶんだけ縮める */
function sizeGalFrame(f, g) {
  f.style.position = 'absolute';
  f.style.top = '0';
  f.style.left = '0';
  f.style.width = `${GAL_W}px`;
  f.style.minHeight = '0';
  f.style.height = `${Math.round(g.H / g.gs)}px`;
  f.style.transformOrigin = 'top left';
  f.style.transform = `scale(${g.gs})`;
}

const galleryCSS = (g) => {
  const u = (px) => Math.round(px / g.gs);   // 画面上で px ぶんに見える大きさ
  return `
body{margin:0;background:#0d1016;padding:${u(14)}px;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif}
.gg{display:grid;grid-template-columns:repeat(${g.cols},1fr);gap:${u(14)}px;
  align-items:start}   /* 高さは各カードの中身なりに。そろえると下が空く */
.gc{display:block;width:100%;padding:0;text-align:left;cursor:pointer;position:relative;
  background:#171a21;border:${u(1)}px solid #2a2f3a;border-radius:${u(12)}px;overflow:hidden;
  transition:border-color .15s,transform .15s;color:#e7ebf0;font:inherit}
.gc-hit{position:absolute;inset:0;z-index:5}
.gc:hover{border-color:#4c8dff;transform:translateY(-${u(3)}px)}
/* いま当たっている形。選び直す画面で「どれが今のか」が要る */
.gc.on{border-color:#4c8dff;box-shadow:0 0 0 ${u(2)}px rgba(76,141,255,.35)}
/* 高さと中の縮尺は、下の script が実寸から決める。
   ここに書くのは、その値が入るまでの見た目だけ */
.gc-prev{height:${u(176)}px;overflow:hidden;position:relative;background:var(--c-bg);
  border-bottom:${u(1)}px solid #2a2f3a}
.gc-scale{width:${GAL_W}px;transform:scale(var(--s,1));transform-origin:top left;
  pointer-events:none;color:var(--c-text);background:var(--c-bg)}
.gc-meta{padding:${u(11)}px ${u(13)}px ${u(13)}px}
.gc-meta b{font-size:${u(13)}px;display:inline-block;margin-right:${u(7)}px}
.gc-meta i{font-style:normal;font-size:${u(10)}px;font-weight:800;color:#9db4ff;
  border:${u(1)}px solid #33436b;border-radius:${u(4)}px;padding:${u(1)}px ${u(6)}px}
.gc-meta small{display:block;color:#98a2b3;font-size:${u(11)}px;line-height:1.6;
  margin-top:${u(5)}px}

/* --- サンプルの中で、動く前提の見た目を止める --- */
.gc-scale .pinsec{height:auto!important}
/* 画面いっぱい前提のブロックは、見本では低くする。
   そのままだと上端しか写らず、真っ白なカードに見える（実際にそうなった） */
.gc-scale .pin-in{position:static;height:360px}
.gc-scale .stackcard{position:static;height:auto;min-height:150px}
.gc-scale .stack{gap:14px}
.gc-scale .clip-box{height:360px}
.gc-scale .clip-b{clip-path:circle(34% at 50% 50%)}
/* 見本では手前の文字だけ出す。奥の文字も出すと、円の中で重なって読めない */
.gc-scale .clip-b .in-txt{display:none}
.gc-scale .shift-pane{min-height:360px}
.gc-scale .tl-rail::after{transform:scaleY(.55)}
.gc-scale .tl-item::before{border-color:var(--c-primary);background:var(--c-primary)}
.gc-scale .hs-track{transform:translateX(-40px)}
.gc-scale .sec{padding:44px 0}
.gc-scale .slot{font-size:44px}
.gc-scale [data-ta] .ch,.gc-scale .rv{opacity:1!important;transform:none!important}
`;
};

/* 見本の枠に、1ブロックまるごとを収める。
   カードの幅は列数で変わるので、実際に測ってから中の縮尺を決める。
   縦に長すぎるブロック（全画面のものなど）は上限で切る。 */
const fitJS = (g) => `
(function () {
  var MAXH = ${Math.round(240 / g.gs)};
  function fit() {
    document.querySelectorAll('.gc-prev').forEach(function (box) {
      var inner = box.firstElementChild;
      if (!inner) return;
      var s = box.clientWidth / ${GAL_W};
      inner.style.setProperty('--s', s);
      box.style.height = Math.min(Math.round(inner.offsetHeight * s), MAXH) + 'px';
    });
  }
  fit();
  /* 写真が後から入ると高さが変わる。読み終わりで測り直す */
  addEventListener('load', fit);
})();
`;

function galleryTypes() {
  const exists = new Set(page().blocks.map((b) => b.type));
  const order = Object.keys(BLOCKS).filter((t) => BLOCKS[t].unique).concat(ADDABLE);
  return order.filter((t) => !(BLOCKS[t].unique && exists.has(t)))
    .filter((t) => addCat === 'all' || catOf(BLOCKS[t]) === addCat);
}

function renderCatBar() {
  $('#catBar').innerHTML = CATS.map(([k, l]) =>
    `<button data-cat="${k}" class="${addCat === k ? 'on' : ''}">${l}</button>`).join('');
}

function renderGallery() {
  const f = $('#galFrame');
  const cards = galleryTypes().map((t) => {
    const def = BLOCKS[t];
    const sample = def.render(clone(def.defaults));
    /* サンプルには header や form が入るので、button ではなく div で包む
       （button の中でそれらに出会うと、パーサが button を閉じて構造が壊れる） */
    return `<div class="gc" data-type="${t}" role="button" tabindex="0" title="${esc(def.about || '')}">
      <span class="gc-hit"></span>
      <div class="gc-prev"><div class="gc-scale">${sample}</div></div>
      <div class="gc-meta"><b>${esc(def.label)}</b>${def.tag ? `<i>${esc(def.tag)}</i>` : ''}</div>
    </div>`;
  }).join('');

  const g = galGeom(f);
  sizeGalFrame(f, g);
  f.srcdoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<style>${themeCSS(state.theme)}\n${SITE_CSS}\n${galleryCSS(g)}</style></head>
<body class="${esc(bodyClass())}"><div class="gg">${cards}</div>
<script>${SITE_JS}<\/script><script>${fitJS(g)}<\/script></body></html>`;

  f.addEventListener('load', () => {
    const gdoc = f.contentDocument;
    gdoc.addEventListener('click', (e) => {
      const t = e.target.closest('.gc')?.dataset.type;
      if (t) addBlock(t);
    });
  }, { once: true });
}

/* ================================================================
   アニメーションのサンプル一覧
   動きは静止画では伝わらないので、実際にくり返し再生して見せる。
   ================================================================ */
let animPick = null;   // 選ばれたときに呼ぶ処理

const ANIM_GAL_CSS = `
body{margin:0;background:#0d1016;padding:14px;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif}
.ag{display:grid;grid-template-columns:repeat(auto-fill,minmax(164px,1fr));gap:10px}
.ag-card{display:block;width:100%;padding:0;cursor:pointer;color:#e7ebf0;font:inherit;
  background:#171a21;border:1px solid #2a2f3a;border-radius:10px;overflow:hidden;
  transition:border-color .15s,transform .15s;position:relative}
/* 再生のたびに中身を作り替えるので、クリックは動かない層で受ける
   （作り替えた瞬間に押すとクリックが消えるため） */
.ag-hit{position:absolute;inset:0;z-index:5;background:transparent}
.ag-card:hover{border-color:#4c8dff;transform:translateY(-2px)}
.ag-card.on{border-color:#4c8dff;box-shadow:0 0 0 1px #4c8dff inset}
.ag-stage{height:88px;display:grid;place-items:center;overflow:hidden;
  background:var(--c-bg);color:var(--c-text);border-bottom:1px solid #2a2f3a;padding:8px}
.ag-txt{font-size:18px;font-weight:800;color:var(--c-text);font-family:var(--font-head);
  --ta-dur:.9s;--ta-stagger:.05s;--ta-ease:cubic-bezier(.2,.7,.3,1);--ta-delay:0s}
.ag-img{width:96px;height:62px;border-radius:8px;
  background:linear-gradient(140deg,var(--c-primary),var(--c-accent));
  --ta-dur:.9s;--ta-ease:cubic-bezier(.2,.7,.3,1)}
.ag-meta{padding:8px 9px;font-size:11.5px;font-weight:700;text-align:center;line-height:1.4}
.ag-card.on .ag-meta{color:#9db4ff}
`;

const ANIM_GAL_JS = `
var CH='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@';
function split(el){
  var t = el.getAttribute('data-txt') || '';
  var mask = el.classList.contains('ta-maskline');
  el.textContent = '';
  var ln = document.createElement('span'); ln.className = 'ln';
  if(mask){
    var c = document.createElement('span'); c.className = 'ch';
    c.style.setProperty('--i', 0); c.textContent = t; ln.appendChild(c);
  } else {
    Array.from(t).forEach(function(ch, i){
      var s = document.createElement('span'); s.className = 'ch';
      s.style.setProperty('--i', i); s.textContent = ch; s.setAttribute('data-c', ch);
      if(el.classList.contains('ta-slidealt')) s.style.setProperty('--dir', i % 2 ? '-.9em' : '.9em');
      if(el.classList.contains('ta-scatter')){
        s.style.setProperty('--x', ((Math.random()*2-1)*2.2).toFixed(2)+'em');
        s.style.setProperty('--y', ((Math.random()*2-1)*1.4).toFixed(2)+'em');
        s.style.setProperty('--r', ((Math.random()*2-1)*90).toFixed(0)+'deg');
      }
      ln.appendChild(s);
    });
  }
  el.appendChild(ln);
}
function play(card){
  var el = card.querySelector('.ag-txt, .ag-img');
  if(!el) return;
  el.classList.remove('in');
  if(el.classList.contains('ag-txt') && !el.classList.contains('ta-fillgrad') && !el.classList.contains('ta-none')) split(el);
  void el.offsetWidth;                       /* いったんリフローさせて再生し直す */
  el.classList.add('in');
  if(el.classList.contains('ta-scramble')) scramble(el);
  if(el.classList.contains('ta-type')) type(el);
}
function scramble(el){
  var chs = [].slice.call(el.querySelectorAll('.ch')), f = 0;
  chs.forEach(function(c){ c.dataset.final = c.textContent; c.style.opacity = 1; });
  (function tick(){
    chs.forEach(function(c, i){
      var st = i*3;
      if(f >= st+40) c.textContent = c.dataset.final;
      else if(f >= st) c.textContent = CH[Math.floor(Math.random()*CH.length)];
    });
    if(f++ < chs.length*3+40) requestAnimationFrame(tick);
    else chs.forEach(function(c){ c.textContent = c.dataset.final; });
  })();
}
function type(el){
  var chs = [].slice.call(el.querySelectorAll('.ch'));
  chs.forEach(function(c, i){ c.style.opacity = 1; c.classList.remove('show');
    setTimeout(function(){ c.classList.add('show'); }, i*70); });
}
var cards = [].slice.call(document.querySelectorAll('.ag-card'));
function playAll(){ cards.forEach(function(c, i){ setTimeout(function(){ play(c); }, i*70); }); }
cards.forEach(function(c){
  c.addEventListener('pointerenter', function(){ play(c); });
  c.querySelector('.ag-hit').addEventListener('click', function(e){
    e.stopPropagation();
    parent.pickAnim(c.dataset.k);
  });
});
playAll();
setInterval(playAll, 3600);
`;

function openAnimGallery(kind, current, onPick) {
  animPick = onPick;
  const list = kind === 'ta' ? TEXT_ANIMS : IMAGE_ANIMS;
  $('#animTitle').textContent = kind === 'ta' ? '文字のアニメーションを選ぶ' : '画像・要素のアニメーションを選ぶ';

  const cards = list.map(([k, label]) => {
    const inner = kind === 'ta'
      ? `<span class="ag-txt ta-${k}" data-ta data-txt="動きを見る">動きを見る</span>`
      : `<div class="ag-img ia-${k}${k === 'none' ? '' : ' ia-on'}"></div>`;
    return `<button class="ag-card${k === current ? ' on' : ''}" data-k="${k}">
      <span class="ag-hit"></span>
      <div class="ag-stage">${inner}</div>
      <div class="ag-meta">${esc(label)}</div>
    </button>`;
  }).join('');

  $('#animFrame').srcdoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<style>${themeCSS(state.theme)}\n${SITE_CSS}\n${ANIM_GAL_CSS}</style></head>
<body class="${esc(bodyClass())}"><div class="ag">${cards}</div>
<script>${ANIM_GAL_JS}<\/script></body></html>`;
  openModal('#animModal');
}

/* ================================================================
   ヒーロー装飾のサンプル一覧
   動きも、ポインタへの反応も、止まった絵では伝わらない。
   実物のヒーローをそのまま縮めて並べ、枠の中でポインタを追わせる。
   ================================================================ */
const DECO_GAL_CSS = `
body{margin:0;background:#0d1016;padding:14px;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif}
/* 見本は縮尺が決まっているので、桁を伸縮させると右と下に白が余る。
   列幅は縮尺後の幅ちょうどに固定する。 */
.dg{display:grid;grid-template-columns:repeat(auto-fill,292px);gap:13px;justify-content:center}
.dc{position:relative;background:#171a21;border:1px solid #2a2f3a;border-radius:11px;
  overflow:hidden;cursor:pointer;transition:border-color .15s,transform .15s}
.dc:hover{border-color:#4c8dff;transform:translateY(-3px)}
.dc.on{border-color:#4c8dff;box-shadow:0 0 0 1px #4c8dff inset}
/* 見本の中の要素を押せてしまうと選べないので、当たり判定は1枚かぶせる。
   ポインタの動きは下まで通す必要があるため、クリックだけを受ける。 */
.dc-hit{position:absolute;inset:0;z-index:9}
.dc-prev{height:186px;overflow:hidden;position:relative;background:var(--c-bg)}
.dc-scale{width:1100px;transform:scale(.2655);transform-origin:top left;
  color:var(--c-text);background:var(--c-bg)}
.dc-scale .hero{min-height:700px;padding:0;display:grid;align-items:center}
/* 一覧の中では貼り付け（sticky）を切る。切らないと縮小枠の中で
   区間の高さ（200vh）がそのまま出て、カードが縦に伸びてしまう。 */
.dc-scale .hsc{height:auto}
.dc-scale .hsc-in{position:static;height:700px}
.dc-scale .hero-title{font-size:52px}
.dc-scale [data-ta] .ch,.dc-scale .rv{opacity:1!important;transform:none!important}
/* ヘッダーの見本は、いつも広い画面の並びで見せる。
   この一覧の iframe はスマホでは狭いので、そのままだとメニューが
   ハンバーガーに化けて、どの型を選んでも同じ絵になってしまう。 */
.dc-scale .nav{display:flex;position:static;flex-direction:row;align-items:center;
  gap:28px;background:none;border:0;padding:0;margin-left:auto}
.dc-scale .nav a{padding:0;border:0}
.dc-scale .hdr .btn{display:inline-flex}
.dc-scale .hdr-toggle{display:none}
.dc-scale .hdr-in{height:72px}
/* ヘッダーの見本は、バーとその下が少し見えれば足りる */
.dc-hdr{height:96px}
/* 溶け方の見本。下の縁が主役なので、ヒーローを短くして縁を大きく見せる。
   下に地の色の帯を少し残さないと、どこまでが溶けなのか分からない。 */
.dc-melt{height:150px}
.dc-melt .dc-scale .hero{min-height:470px}
.dc-melt .dc-scale{padding-bottom:90px}
/* 形の見本は、抜けかたが分かればよい。数が多いので小さめに並べて、
   ひと目で見比べられるようにする */
.dg.small{grid-template-columns:repeat(auto-fill,196px)}
/* フッターの見本。丸ごと1つ入る高さにする */
.dc-ftr{height:150px}
.dc-ftr .dc-scale .ftr{padding-top:34px;padding-bottom:24px}
.dc-shape{height:124px;overflow:hidden}
/* 小さいカードに合わせて、見本の縮尺も落とす。
   合わせないと右と下が切れて、形が分からなくなる。 */
.dc-shape .dc-scale{width:1100px;transform:scale(.176)}
.dc-shape .about-media{background:linear-gradient(135deg,var(--c-primary),var(--c-accent))}
.dc-hdr .hero{min-height:420px}
.dc-meta{padding:10px 12px 12px;color:#e7ebf0}
.dc-meta b{font-size:13px;display:block}
.dc-meta small{color:#98a2b3;font-size:11px;line-height:1.6;display:block;margin-top:3px}
`;

/* 当たり判定の板はクリックだけ受け取り、ポインタの移動は下のヒーローへ流す。
   こうしないと「追従するはずの装飾が動かない見本」になってしまう。 */
const DECO_GAL_JS = `
document.querySelectorAll('.dc').forEach(function(card){
  var hero = card.querySelector('.hero'), hit = card.querySelector('.dc-hit');
  hit.addEventListener('click', function(){ parent.pickDeco(card.dataset.k); });
  hit.addEventListener('pointermove', function(e){
    if(!hero) return;
    hero.dispatchEvent(new PointerEvent('pointermove',
      {clientX:e.clientX, clientY:e.clientY, bubbles:false}));
  });
  hit.addEventListener('pointerleave', function(){
    if(hero) hero.dispatchEvent(new PointerEvent('pointerleave'));
  });
});
`;

const DECO_ABOUT = {
  none: '装飾なし。写真や背景色だけで見せます。',
  clouds: '光のかたまりがゆっくり漂います。ポインタで奥行きがずれます。',
  glass: '大小2枚のガラスがポインタを追い、背後の写真をぼかします。写真の上でいちばん効きます。',
  aurora: 'メインカラーとアクセントカラーが溶け合って流れます。',
  dust: 'ゆっくり昇る粒。ポインタが近づくと押しのけられます。',
  spot: 'ポインタのまわりだけが明るくなります。',
  depth: '写真と文字が逆向きに動いて、立体に見えます。',
  silk: '絹のような光の帯が、ゆっくり横切ります。',
};

const MELT_ABOUT = {
  none: '下の縁はまっすぐ。ふつうの区切りです。',
  flow: '長い1本のゆるやかな曲がり。いちばん素直で、どの配色にも合います。',
  slope: '左が深く、右へ向かって上がります。写真を右に置くときに。',
  swell: '真ん中が大きくふくらみます。文字を真ん中に置くときに。',
  drip: 'ゆるい縁から、3つだけ大きく垂れます。',
  bubble: '浅い縁の下に、切れた玉だけが残ります。',
  own: '自分で描いた縁の画像を読み込んで、そのとおりに流し込みます。',
};

const SCROLL_ABOUT = {
  none: 'スクロールしても動きません。ふつうのヒーローです。',
  zoomout: '全画面の写真が、スクロールで角の丸い1枚に収まります。',
  parallax: '写真はゆっくり、文字は速く流れて奥行きが出ます。',
  curtain: '閉じた幕が上下に割れて、写真が現れます。',
  maskzoom: '見出しの形に開いた穴が広がり、画面いっぱいの写真になります。',
};

const HDR_ABOUT = {
  line: '地の色に細い線。いちばん素直で、どんなページにも合います。',
  solid: 'メインカラーで塗ります。色をはっきり出したいとき。文字は白になります。',
  glass: '下の中身が透けます。写真の多いページと相性がいい。',
  clear: '地も線もなし。ヒーローとひと続きに見えます。',
  over: 'ヒーローの上に乗せます。写真が画面の上端から始まります。写真のときは自動で白字になります。',
  float: '角の丸い島が浮きます。軽く見せたいとき。',
};

/* 文字の塗り。グラデーションはCSSだけ、絵のものは text-fills.js から */
const TEXT_FILL_LIST = [
  ['', 'None'],
  ['gold', 'Gold'],
  ['fire', 'Fire'],
  ['metal', 'Metal'],
  ['night', 'Night'],
  ['rainbow', 'Rainbow'],
  ['brand', 'Brand'],
  ['flame', 'Flame Photo'],
  ['polydark', 'Poly Dark'],
  ['polylight', 'Poly Light'],
  ['own', 'Custom'],
];

const FTR_ABOUT = {
  bar: '左に名前、右にリンク。いちばん素直な形。',
  center: '名前・リンク・年を縦に真ん中で。静かに終わる。',
  big: '左にひとこと、右にリンクを縦に。住所や営業時間もここに。',
  light: '濃い地ではなく、薄い地に線を1本。全体を軽く見せたいとき。',
  cta: '最後にもう一度、してほしいことを置く。',
  minimal: '名前と年だけの細い帯。',
};

const SHAPE_ABOUT = {
  '': '切り抜きなし。枠のかたちのまま出ます。',
  round: '角を大きく丸めます。やわらかい印象に。',
  circle: '真ん丸に抜きます。人の顔や商品の1枚に。',
  egg: 'たまご形。丸より少しやわらかい。',
  diamond: '角の丸いひし形。斜めに置いたような形。',
  arch: '上が半円のアーチ。入口や建物の写真と相性がいい。',
  leaf: '対角の2隅だけ大きく丸めた木の葉形。',
  hex: '六角形。かたく、図鑑のように並べたいとき。',
  slant: '下辺を斜めに切ります。流れが出ます。',
  notch: '右上の角を四角く欠きます。',
  step: '大小2つの四角をずらして重ねた形。',
  ticket: '左右がへこんだチケット形。',
  cross: '丸みのある十字。',
  sparkle: '4点のきらめき。差し色の1枚に。',
  slats: '4本の柱。上下の丸みが交互に入れかわります。',
  arches: '3連のアーチ。',
  wave: '下の辺が波打ちます。',
  blob: '手で描いたような、まるいかたまり。',
  dots: '丸が3×3でつながった形。',
  bars: '斜めの帯が重なった形。',
  wavebar: '縦の棒が並んだ形。音の波のように。',
  own: '形の画像を読み込むと、その形どおりに抜きます。',
};

const GAL_KINDS = {
  deco: { list: () => HERO_DECOS, about: DECO_ABOUT, what: '装飾',
    title: 'ヒーローの装飾を選ぶ',
    sub: 'くり返し再生されます。カードにマウスを乗せる（タップする）とすぐ再生します。' },
  scroll: { list: () => HERO_SCROLLS, about: SCROLL_ABOUT, what: 'スクロール連動',
    title: 'スクロール連動のしかたを選ぶ',
    sub: 'スクロールの途中の一場面で止めて並べています。' },
  ftr: { list: () => BLOCKS.footer.fields[0].options, about: FTR_ABOUT, what: 'フッターの型',
    title: 'フッターの型を選ぶ',
    sub: 'いまのフッターを、それぞれの型で出しています。' },
  shape: { list: () => FIELD.shape.options, about: SHAPE_ABOUT, what: '写真の形',
    title: '写真の形を選ぶ',
    sub: 'いまの写真で、抜けかたを並べています。' },
  melt: { list: () => HERO_MELTS, about: MELT_ABOUT, what: '下の縁の形',
    title: '下の縁の形を選ぶ',
    sub: 'いまのヒーローの下を、それぞれの形で流し込んでいます。持ち込みは、読み込んだ画像のとおりに抜きます。' },
  hdr: { list: () => HDR_BARS, about: HDR_ABOUT, what: 'ヘッダーのバー',
    title: 'ヘッダーのバーを選ぶ',
    sub: 'いまのヘッダーを、それぞれの型で出しています。下はヒーローの頭です。' },
};

let decoPick = null;

/* kind: 'deco'（装飾）/ 'scroll'（スクロール連動）/ 'hdr'（ヘッダーのバー）。
   どれも「上のほうを縮めて並べる」点は同じなので、一覧は共通にする。 */
/* そのブロックが持っている写真を1枚だけ拾う（見本用） */
function firstImage(props) {
  for (const k of ['image', 'imageA', 'imageB']) if (props[k]) return props[k];
  for (const list of ['items', 'photos']) {
    for (const it of props[list] || []) if (it.image || it.src) return it.image || it.src;
  }
  return '';
}

/* 絵を選ぶ一覧。名前ではなく絵で選べるように、小さく並べる。
   100種を平らに並べると目で追えないので、組ごとに見出しを立て、
   絞り込みの欄も置く。名前が思い浮かぶ人はそちらのほうが速い */
let iconPick = null;
let iconNow = null;
function drawIconGrid(q = '') {
  const key = q.trim().toLowerCase();
  const hit = (k) => !key || k.includes(key) || ICONS[k].label.toLowerCase().includes(key);
  const cell = (k) =>
    `<button class="ic-cell${k === iconNow ? ' on' : ''}" data-ic="${k}" title="${esc(ICONS[k].label)}">
      ${iconSVG(k)}<small>${esc(ICONS[k].label)}</small>
    </button>`;
  const html = ICON_BY_GROUP.map(([title, keys]) => {
    const found = keys.filter(hit);
    if (!found.length) return '';
    return `<h3 class="ic-head">${esc(title)}</h3>
      <div class="ic-grid">${found.map(cell).join('')}</div>`;
  }).join('');
  $('#iconGrid').innerHTML = html || '<p class="ic-none">見つかりませんでした。</p>';
}
function openIconGallery(path, current) {
  iconPick = path;
  iconNow = current;
  $('#iconFind').value = '';
  drawIconGrid('');
  openModal('#iconModal');
}
$('#iconFind').addEventListener('input', (e) => drawIconGrid(e.target.value));
$('#iconGrid').addEventListener('click', (e) => {
  const k = e.target.closest('[data-ic]')?.dataset.ic;
  if (!k || !iconPick) return;
  const b = page().blocks.find((x) => x.id === selected);
  if (b) {
    setPath(b.props, iconPick.replace(/^props\./, ''), k);
    renderEditor(); renderPreview(true); save(`icon:${iconPick}:${b.id}`);
  }
  closeModal('#iconModal');
  iconPick = null;
});
$('#iconClose').addEventListener('click', () => { iconPick = null; closeModal('#iconModal'); });

/* 見本のカードを組む。
   この一覧は「アニメーションを選ぶ」画面と、空白から組むときの
   ヘッダー／フッターの段で、どちらも同じものを使う。 */
/* フッターの型のうち「ひとこと」や「ボタン」を使うものは、文章が空だと
   何も出ない。型を選んだ時点で見本の文章を入れておき、あとから書き替え
   てもらう。すでに何か書いてあれば、そのまま残す。 */
function withFtrSample(props, style) {
  const pr = FOOTER_PRESETS.find((x) => x.props.style === style);
  const out = Object.assign({}, props, { style });
  for (const k of ['text', 'cta', 'ctaHref']) {
    if (!out[k] && pr && pr.props[k]) out[k] = pr.props[k];
  }
  return out;
}

function decoCards(kind, current) {
  const k = GAL_KINDS[kind] || GAL_KINDS.deco;
  const list = k.list();
  const about = k.about;

  /* 見本は「いま編集中のヒーロー」から作る。文言も写真もそのまま使うので、
     自分のページでどう見えるかが分かる。 */
  const b = page().blocks.find((x) => x.id === selected);
  const base = b && b.type === 'hero' ? b.props
    : (page().blocks.find((x) => x.type === 'hero') || { props: BLOCKS.hero.defaults }).props;

  /* 形の見本は、いま選んでいるブロックの写真で作る。自分の写真で
     どう抜けるかが分かるように。写真がまだ無ければ目印の枠を出す。 */
  const b0 = page().blocks.find((x) => x.id === selected) || { props: {} };

  /* ヘッダーの見本は、いま使っているヘッダーの上にヒーローの頭を敷いて作る。
     すりガラスや無色は、下に何かが無いと違いが出ないため。 */
  const hb = page().blocks.find((x) => x.type === 'header');
  const hprops = hb ? hb.props : BLOCKS.header.defaults;
  const fb = page().blocks.find((x) => x.type === 'footer');
  const fprops = fb ? fb.props : BLOCKS.footer.defaults;

  const cards = list.map(([key, label]) => {
    let sample;
    if (kind === 'ftr') {
      sample = BLOCKS.footer.render(withFtrSample(fprops, key));
    } else if (kind === 'shape') {
      /* いま選んでいるブロックの写真を、その形で抜いて並べる。
         枠は生成サイトと同じ .about-media を使うので、実物どおりに出る。 */
      const im = firstImage(b0.props);
      sample = `<div class="${key ? `shp-${esc(key)}` : ''}" style="width:1100px${
        key === 'own' && b0.props.shapeMask ? `;--shape:url('${esc(b0.props.shapeMask)}')` : ''}">
        <div class="about-media" style="aspect-ratio:16/10">${
          im ? `<img src="${esc(im)}" alt="">` : '<span class="ph"></span>'}</div></div>`;
    } else if (kind === 'melt') {
      /* 溶け方は「ヒーローの下の縁」なので、下まで入る高さで見せる。
         色も写真も無いヒーローだと白に白を流すことになって何も見えない。
         見本のときだけメインカラーを敷いて、形が分かるようにする。 */
      const plain = !base.image && !base.bg && base.layout !== 'cover';
      sample = BLOCKS.hero.render(Object.assign({}, base,
        { anchor: '', anims: {}, scroll: 'none', melt: key, meltDepth: 100 },
        plain ? { bg: 'primary' } : {}));
    } else if (kind === 'hdr') {
      sample = BLOCKS.header.render(Object.assign({}, hprops, { bar: key, sticky: false }))
        + BLOCKS.hero.render(Object.assign({}, base,
          { anchor: '', anims: {}, scroll: 'none', layout: 'cover' }));
    } else {
      /* スクロール連動は「途中の1コマ」を静止画で見せる。実際に貼り付けると
         一覧の中では動かせないので、進み具合 --p を決め打ちで入れる。 */
      sample = BLOCKS.hero.render(Object.assign({}, base, { anchor: '', anims: {}, layout: 'cover' },
        kind === 'scroll' ? { scroll: key } : { deco: key }));
    }
    const frozen = kind === 'scroll' && key !== 'none' ? ' style="--p:.45"' : '';
    return `<div class="dc${key === current ? ' on' : ''}" data-k="${esc(key)}" role="button" tabindex="0" title="${esc(about[key] || '')}">
      <span class="dc-hit"></span>
      <div class="dc-prev${kind === 'hdr' ? ' dc-hdr' : ''}${kind === 'shape' ? ' dc-shape' : ''}${kind === 'ftr' ? ' dc-ftr' : ''}${kind === 'melt' ? ' dc-melt' : ''}">
        <div class="dc-scale ${esc(bodyClass())}"${frozen}>${sample}</div></div>
      <div class="dc-meta"><b>${esc(label)}</b></div>
    </div>`;
  }).join('');
  return cards;
}

/* カードを敷いた1枚のHTML。iframe の srcdoc にそのまま入れる */
const decoDoc = (kind, cards) => `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<style>${themeCSS(state.theme)}\n${SITE_CSS}\n${shapeMaskCSS(Object.keys(SHAPE_MASKS))}\n${DECO_GAL_CSS}</style></head>
<body class="${esc(bodyClass())}"><div class="dg${kind === 'shape' ? ' small' : ''}">${cards}</div>
<script>${SITE_JS}<\/script><script>${DECO_GAL_JS}<\/script></body></html>`;

function openDecoGallery(kind, current, onPick) {
  decoPick = onPick;
  const k = GAL_KINDS[kind] || GAL_KINDS.deco;
  $('#animTitle').textContent = k.title;
  $('#animSub').textContent = k.sub;
  $('#animFrame').srcdoc = decoDoc(kind, decoCards(kind, current));
  openModal('#animModal');
}

window.pickDeco = (key) => {
  closeModal('#animModal');
  if (decoPick) decoPick(key);
  decoPick = null;
};

/* サンプル一覧（iframe）から呼ばれる */
window.pickAnim = (key) => {
  closeModal('#animModal');
  if (animPick) animPick(key);
  animPick = null;
};
$('#animClose').addEventListener('click', () => closeModal('#animModal'));

function addBlock(type) {
  const nb = makeBlock(type);
  let at = page().blocks.findIndex((b) => b.id === selected) + 1;
  if (!at) at = page().blocks.length;
  const fi = page().blocks.findIndex((b) => b.type === 'footer');
  if (type !== 'footer' && fi >= 0 && at > fi) at = fi;   // フッターより下には入れない
  if (type === 'header') at = 0;
  if (type === 'footer') at = page().blocks.length;
  page().blocks.splice(at, 0, nb);
  selected = nb.id;
  selectedEl = null;
  closeModal('#addModal');
  if (isMobile()) closeSheets();
  refresh();
  setTimeout(() => scrollToBlock(nb.id), 240);
  flash(`「${BLOCKS[type].label}」を追加しました`);
}

function openAddGallery() {
  renderCatBar();
  /* 先に開く。閉じているあいだは枠の幅が 0 で、列数も縮尺も決められない
     （実際、スマホでPC用の並びのまま出て、右が切れていた）。 */
  openModal('#addModal');
  renderGallery();
}
$('#btnAdd').addEventListener('click', openAddGallery);
$('#addClose').addEventListener('click', () => closeModal('#addModal'));

/* 画面の向きや大きさが変わると、列数と縮尺が合わなくなる。開いている一覧だけ作り直す */
let galResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(galResizeTimer);
  galResizeTimer = setTimeout(() => {
    if (!$('#addModal').hidden) renderGallery();
    if (!$('#buildModal').hidden) renderBldGallery();
  }, 180);
});
$('#catBar').addEventListener('click', (e) => {
  const c = e.target.closest('button')?.dataset.cat;
  if (!c) return;
  addCat = c;
  renderCatBar();
  renderGallery();
});

/* ================================================================
   右パネル：編集フォーム（fields から自動生成）
   ================================================================ */
/* ================================================================
   リンク先をえらぶ

   URLを手で書かせない。ホームページを持っていない人にとって、
   「#contact」も「tel:03-…」も知らない書きかたで、打ち間違えても
   間違えたことに気づけない（押しても何も起きないだけ）。

   何をしたいか（ページへ／この中の場所へ／電話／メール／外のサイト）を
   選ぶと、その先は選択肢か、ふつうの電話番号・メールアドレスの入力になる。
   持つ値は今までどおりの文字列のままなので、書き出したHTMLは変わらない。
   ================================================================ */
const LINK_KINDS = [
  ['page', 'ページへ'],
  ['anchor', 'このページの中へ'],
  ['tel', '電話をかける'],
  ['mail', 'メールを送る'],
  ['url', '外のサイトへ'],
  ['', 'リンクなし'],
];

function linkKind(v) {
  const s = String(v || '');
  if (!s) return '';
  if (s.startsWith('page:')) return 'page';
  if (s.startsWith('#')) return 'anchor';
  if (s.startsWith('tel:')) return 'tel';
  if (s.startsWith('mailto:')) return 'mail';
  return 'url';
}

/* いまのサイトにあるアンカー（＃で飛べる場所）を集める */
function anchorList() {
  const out = [];
  page().blocks.forEach((b) => {
    if (b.props && b.props.anchor) out.push([`#${b.props.anchor}`, `${BLOCKS[b.type].label}（#${b.props.anchor}）`]);
  });
  return out;
}

function linkHTML(val, path) {
  const kind = linkKind(val);
  const sel = (opts, cur, extra = '') =>
    `<select data-linkval="${path}"${extra}>${opts.map(([v, l]) =>
      `<option value="${esc(v)}"${String(cur) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;

  let body = '';
  if (kind === 'page') {
    const cur = val.slice(5);
    const opts = state.pages.map((pg) => [pg.id, pg.name]);
    body = state.pages.length > 1
      ? sel(opts, cur)
      : `<p class="hint">ページはホームだけです。「＋ ページを追加」で増やすと、ここから選べます。</p>`;
  } else if (kind === 'anchor') {
    const list = anchorList();
    body = list.length
      ? sel(list.concat(list.some(([v]) => v === val) ? [] : [[val, val]]), val)
      : `<p class="hint">飛び先がまだありません。ブロックの「アンカーID」を付けると、ここから選べます。</p>`;
  } else if (kind === 'tel') {
    body = `<input type="tel" data-linkval="${path}" data-pre="tel:" value="${esc(val.slice(4))}" placeholder="03-0000-0000">`;
  } else if (kind === 'mail') {
    body = `<input type="email" data-linkval="${path}" data-pre="mailto:" value="${esc(val.slice(7))}" placeholder="hello@example.com">`;
  } else if (kind === 'url') {
    body = `<input type="url" data-linkval="${path}" value="${esc(val)}" placeholder="https://...">`;
  }
  return `<div class="lk"><select data-linkkind="${path}">${LINK_KINDS.map(([v, l]) =>
      `<option value="${esc(v)}"${kind === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>${body}</div>`;
}

/* 種類を変えたら、その種類の初期値に置きかえる */
function linkDefault(kind) {
  if (kind === 'page') return `page:${state.pages[0].id}`;
  if (kind === 'anchor') return anchorList()[0]?.[0] || '#';
  if (kind === 'tel') return 'tel:';
  if (kind === 'mail') return 'mailto:';
  if (kind === 'url') return 'https://';
  return '';
}

function inputHTML(f, val, path) {
  const p = `data-path="${path}"`;
  switch (f.type) {
    case 'textarea':
      return `<textarea ${p} rows="${f.rows || 4}">${esc(val ?? '')}</textarea>`;
    case 'select':
      return `<select ${p}>${f.options.map(([v, l]) =>
        `<option value="${esc(v)}"${String(val ?? '') === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    case 'toggle':
      return `<label class="sw"><input type="checkbox" ${p}${val ? ' checked' : ''}>${esc(f.label)}</label>`;
    case 'color':
      return `<div class="f-row"><input type="color" ${p} value="${esc(val)}">
        <input type="text" data-path="${path}" value="${esc(val)}"></div>`;
    case 'range':
      return `<div class="f-row"><input type="range" ${p} min="${f.min ?? 0}" max="${f.max ?? 100}" value="${val ?? 0}" data-suffix="${esc(f.suffix || '')}">
        <span class="f-val">${val ?? 0}${f.suffix || ''}</span></div>`;
    case 'icon':
      return `<button class="pick wide ico-pick" data-iconpick="${path}">
        <span class="ico-prev">${iconSVG(val || 'wifi')}</span>${esc((ICONS[val] || {}).label || '選ぶ')}
      </button>`;
    case 'link':
      return linkHTML(String(val ?? ''), path);
    case 'mask':
      return `<button class="pick wide" data-mask="${path}">${val ? '別の形にする' : '形の画像を読み込む'}</button>
        ${val ? `<div class="mask-prev" style="-webkit-mask-image:url('${esc(val)}');mask-image:url('${esc(val)}')"></div>
        <button class="pick wide" data-maskclear="${path}">形を外す</button>` : ''}`;
    case 'image':
      return `<div class="img-f">
        <input type="text" ${p} value="${esc(val ?? '')}" placeholder="https://... または端末から選択">
        <button class="pick" data-pick="${path}">画像を選ぶ</button>
      </div>${val ? `<img class="img-thumb" src="${esc(val)}" alt="">
        <button class="pick wide" data-cut="${path}">背景をぬく</button>` : ''}`;
    default:
      return `<input type="text" ${p} value="${esc(val ?? '')}">`;
  }
}

function fieldHTML(f, props, base) {
  if (f.showIf && !f.showIf(props)) return '';
  const path = `${base}.${f.key}`;
  const val = props[f.key];

  if (f.type === 'list') {
    const items = val || [];
    const rows = items.map((it, i) => {
      const key = `${path}.${i}`;
      const isClosed = closed.has(key);
      const title = it[f.titleKey] || `項目 ${i + 1}`;
      return `<div class="li${isClosed ? ' closed' : ''}" data-i="${i}">
        <div class="li-h" data-fold="${key}">
          <span class="n">${i + 1}</span>
          <span class="t">${esc(title)}</span>
          <button data-lact="up" data-i="${i}" title="上へ">↑</button>
          <button data-lact="down" data-i="${i}" title="下へ">↓</button>
          <button data-lact="del" data-i="${i}" title="削除">✕</button>
        </div>
        <div class="li-b"${isClosed ? ' hidden' : ''}>
          ${f.item.map((sf) => fieldHTML(sf, it, key)).join('')}
        </div>
      </div>`;
    }).join('');
    return `<div class="f">
      <label>${esc(f.label)}</label>
      <div class="list" data-list="${path}">
        ${rows}
        <button class="li-add" data-lact="add">＋ ${esc(f.addLabel || '追加')}</button>
      </div>
    </div>`;
  }

  if (f.type === 'toggle') {
    return `<div class="f">${inputHTML(f, val, path)}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
  }
  return `<div class="f">
    <label>${esc(f.label)}</label>
    ${inputHTML(f, val, path)}
    ${f.gallery ? `<button class="anim-gal" data-gal="${esc(f.gallery)}" data-galpath="${path}"
      style="margin-top:8px">▦ サンプルを見ながら選ぶ</button>` : ''}
    ${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}
  </div>`;
}

/* 「あとで直せばいい」つまみ。
   最初に見せるのは中身（文字・写真・リンク）だけにして、
   速さ・向き・大きさ・余白のような調整はたたんでおく。
   数タップで作り終える人の前に、全部を並べない。 */
/* ボタンの行き先は、ここには入れない。どこへ飛ぶかはボタンの文字と
   同じくらい大事な中身で、ページを足せるようになってからは
   「打つもの」ではなく「選ぶもの」になったので、前に出す。 */
const ADV_KEYS = new Set([
  'anchor', 'bg', 'cols', 'plate', 'plateShift',
  'speed', 'dir', 'size', 'ratio', 'scrollLen', 'decoStrength', 'decoLabel', 'meltDepth',
  'overlay', 'grain', 'sticky', 'height', 'sep', 'outline', 'auto', 'poster',
  'action', 'method',
]);
const isAdv = (f) => f.adv === true || ADV_KEYS.has(f.key);

function renderEditor() {
  const box = $('#tab-edit');
  const b = page().blocks.find((x) => x.id === selected);
  if (!b) {
    box.innerHTML = `<div class="empty">左の一覧、またはプレビューを<br>クリックしてブロックを選んでください。</div>`;
    return;
  }
  const def = BLOCKS[b.type];
  const keep = box.scrollTop;
  const open = advOpen ? ' open' : '';
  const basic = def.fields.filter((f) => !isAdv(f));
  const adv = def.fields.filter(isAdv);
  const advHTML = adv.map((f) => fieldHTML(f, b.props, 'props')).join('').trim();
  box.innerHTML = `<div class="edit-head"><span class="bl-ic">${def.icon}</span>${esc(def.label)}</div>`
    + elementPanel(b)
    + basic.map((f) => fieldHTML(f, b.props, 'props')).join('')
    + (advHTML ? `<details class="adv"${open}><summary>こまかい調整</summary>${advHTML}</details>` : '');
  box.scrollTop = keep;
}

/* たたんだ状態は覚えておく（開いて直して、また別のブロックへ、が続くので） */
let advOpen = false;
$('#tab-edit').addEventListener('toggle', (e) => {
  if (e.target.classList && e.target.classList.contains('adv')) advOpen = e.target.open;
}, true);

/* 選択中の要素にアニメーションを付けるパネル */
function elementPanel(b) {
  if (!selectedEl) {
    /* 使い方の説明は、必要になった人だけが読めばいい。
       ふだんは1行にして、たたんでおく。 */
    return `<details class="el-hint"><summary>プレビューの触りかた</summary>
      <b>ダブルクリック</b>で文字をその場で書き換え。<br>
      <b>1回クリック</b>で、その要素に動きを付ける。<br>
      <b>写真をクリック</b>で、大きさと位置を直す（空の枠なら写真を選ぶ）。
    </details>`;
  }
  /* 写真の枠を選んだとき。位置と大きさをここで直す */
  if (selectedEl.kind === 'img') {
    const f = fitOf(b, selectedEl.prop);
    return `<div class="el-panel">
      <div class="eh">
        <span class="badge">写真</span>
        <span class="en">${esc(selectedEl.name)}</span>
        <button class="ex" data-elclose title="選択を解除">✕</button>
      </div>
      <div class="f"><label>大きさ（枠いっぱいまで寄せる）</label>
        <div class="f-row">
          <input type="range" data-fit="z" min="100" max="260" step="5" value="${f.z}">
          <span class="f-val">${f.z}%</span>
        </div>
      </div>
      <div class="f"><label>横の位置（左 ↔ 右）</label>
        <div class="f-row">
          <input type="range" data-fit="x" min="0" max="100" value="${f.x}">
          <span class="f-val">${f.x}%</span>
        </div>
      </div>
      <div class="f"><label>縦の位置（上 ↕ 下）</label>
        <div class="f-row">
          <input type="range" data-fit="y" min="0" max="100" value="${f.y}">
          <span class="f-val">${f.y}%</span>
        </div>
      </div>
      <div class="el-tip">枠から出た分が切れます。顔や商品が切れていたら、ここで寄せてください。</div>
      <button class="tb-btn" data-fitreset>まん中・等倍に戻す</button>
      <button class="tb-btn" data-repick="${esc(selectedEl.prop)}">写真を選び直す</button>
      <button class="tb-btn" data-cut="props.${esc(selectedEl.prop)}">背景をぬく</button>
    </div>`;
  }

  const isText = selectedEl.kind === 'ta';
  const cfg = (b.props.anims || {})[selectedEl.role] || {};
  const list = isText ? TEXT_ANIMS : IMAGE_ANIMS;
  const cur = cfg.a || 'none';
  const delay = cfg.d || 0;
  return `<div class="el-panel">
    <div class="eh">
      <span class="badge">${isText ? 'テキスト' : '画像・要素'}</span>
      <span class="en">${esc(selectedEl.name)}</span>
      <button class="ex" data-elclose title="選択を解除">✕</button>
    </div>
    ${selectedEl.prop ? `<button class="tb-btn edit-now" data-editnow>✎ 文字を編集</button>
      <div class="el-tip">プレビューをダブルタップしても編集できます</div>` : ''}
    <div class="f"><label>アニメーション</label>
      <select data-elk="a">${list.map(([v, l]) =>
        `<option value="${v}"${cur === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
      <button class="anim-gal" data-animgal="${isText ? 'ta' : 'ia'}">▦ サンプルを見ながら選ぶ</button>
    </div>
    <div class="f"><label>開始までの待ち</label>
      <div class="f-row">
        <input type="range" data-elk="d" min="0" max="1500" step="50" value="${delay}" data-suffix="ms">
        <span class="f-val">${delay}ms</span>
      </div>
    </div>
    ${isText ? textFillField(b) : ''}
  </div>`;
}

/* 文字を絵やグラデーションで塗る欄（見出しなどのテキスト要素だけ） */
function textFillField(b) {
  const cur = (b.props.fills || {})[selectedEl.role] || '';
  const own = (b.props.fillImgs || {})[selectedEl.role] || '';
  return `<div class="f"><label>文字の塗り</label>
    <select data-txfill>${TEXT_FILL_LIST.map(([v, l]) =>
      `<option value="${v}"${cur === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
    ${cur === 'own' ? `<button class="pick wide" data-txfimg>${own ? '別の画像にする' : '画像を選ぶ'}</button>
      ${own ? `<img class="img-thumb" src="${esc(own)}" alt="">` : ''}` : ''}
    <div class="hint">背景を文字の形に切り抜きます。文字は文字のままなので、あとから書き換えられます。</div>
  </div>`;
}

function setTextFill(val) {
  const b = page().blocks.find((x) => x.id === selected);
  if (!b || !selectedEl) return;
  b.props.fills = b.props.fills || {};
  if (val) b.props.fills[selectedEl.role] = val;
  else delete b.props.fills[selectedEl.role];
  renderEditor(); renderPreview(true); save(`txf:${selectedEl.role}:${b.id}`);
}

/* 要素パネルの操作 */
$('#tab-edit').addEventListener('click', (e) => {
  if (e.target.closest('[data-elclose]')) { selectedEl = null; renderEditor(); highlight(); return; }

  /* 絵を選ぶ */
  const ip = e.target.closest('[data-iconpick]');
  if (ip) {
    const b0 = page().blocks.find((x) => x.id === selected);
    const cur = b0 ? getPath(b0.props, ip.dataset.iconpick.replace(/^props\./, '')) : '';
    openIconGallery(ip.dataset.iconpick, cur);
    return;
  }

  /* 文字を自分の画像で塗る */
  if (e.target.closest('[data-txfimg]') && selectedEl) {
    openImagePicker(selected, `fillImgs.${selectedEl.role}`, 'txf');
    return;
  }

  /* 写真の枠のボタン */
  const rp = e.target.closest('[data-repick]');
  if (rp) { openImagePicker(selected, rp.dataset.repick); return; }
  if (e.target.closest('[data-fitreset]') && selectedEl && selectedEl.kind === 'img') {
    const b0 = page().blocks.find((x) => x.id === selected);
    if (b0) {
      setPath(b0.props, `${selectedEl.prop}Fit`, undefined);
      renderEditor(); renderPreview(true); save(`fit:${selectedEl.prop}:${selected}`);
    }
    return;
  }
  /* フィールドに付いたサンプル一覧ボタン（いまは装飾のみ） */
  const fg = e.target.closest('[data-gal]');
  if (fg) {
    const bb = page().blocks.find((x) => x.id === selected);
    if (!bb) return;
    const kind = fg.dataset.gal;
    const key = fg.dataset.galpath.split('.').pop();
    const gk = GAL_KINDS[kind] || GAL_KINDS.deco;
    openDecoGallery(kind, bb.props[key] || (kind === 'hdr' ? 'line' : 'none'), (picked) => {
      if (bb.type === 'footer' && key === 'style') Object.assign(bb.props, withFtrSample(bb.props, picked));
      else bb.props[key] = picked;
      renderEditor(); renderPreview(true); save();
      flash(`${gk.what}を「${(gk.list().find((d) => d[0] === picked) || [, picked])[1]}」にしました`);
    });
    return;
  }

  const ag = e.target.closest('[data-animgal]');
  if (ag && selectedEl) {
    const b0 = page().blocks.find((x) => x.id === selected);
    const cur0 = ((b0 && b0.props.anims) || {})[selectedEl.role] || {};
    openAnimGallery(ag.dataset.animgal, cur0.a || 'none', (key) => {
      const bb = page().blocks.find((x) => x.id === selected);
      if (!bb) return;
      bb.props.anims = bb.props.anims || {};
      const c = Object.assign({}, bb.props.anims[selectedEl.role]);
      c.a = key;
      if (key === 'none' && !c.d) delete bb.props.anims[selectedEl.role];
      else bb.props.anims[selectedEl.role] = c;
      renderEditor(); renderPreview(true); save(`a:${selectedEl.role}:gal:${selected}`);
    });
    return;
  }
  if (e.target.closest('[data-editnow]')) {
    if (!selectedEl || !selectedEl.prop || !pdoc) return;
    const blk = pdoc.querySelector(`[data-bid="${selected}"]`);
    const el = blk && blk.querySelector(`[data-prop="${selectedEl.prop}"]`);
    if (!el) return;
    if (isMobile()) closeSheets();     // キーボードで隠れるのでシートは閉じる
    el.scrollIntoView({ block: 'center' });
    startEdit(el, selected, selectedEl.prop);
  }
});
$('#tab-edit').addEventListener('input', (e) => {
  /* 写真の位置・大きさ。作り直しは軽いので、動かしながら見られる */
  const fk = e.target.dataset.fit;
  if (fk && selectedEl && selectedEl.kind === 'img') {
    setFit(selectedEl.prop, fk, Number(e.target.value));
    e.target.parentElement.querySelector('.f-val').textContent = `${e.target.value}%`;
    return;
  }

  const key = e.target.dataset.elk;
  if (!key || !selectedEl) return;
  const b = page().blocks.find((x) => x.id === selected);
  if (!b) return;
  b.props.anims = b.props.anims || {};
  const cur = Object.assign({}, b.props.anims[selectedEl.role]);
  cur[key] = key === 'd' ? Number(e.target.value) : e.target.value;
  if ((!cur.a || cur.a === 'none') && !cur.d) delete b.props.anims[selectedEl.role];
  else b.props.anims[selectedEl.role] = cur;
  if (e.target.type === 'range') e.target.parentElement.querySelector('.f-val').textContent = e.target.value + 'ms';
  renderPreview(true);  // 付けた動きをすぐ確認できるよう作り直す
  save(`a:${selectedEl.role}:${key}:${selected}`);
});

/* ---- 値の書き込み ---- */
function setPath(root, path, val) {
  const ks = path.split('.');
  let o = root;
  for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
  o[ks[ks.length - 1]] = val;
}
function readEl(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'range' || el.type === 'number') return Number(el.value);
  return el.value;
}

$('#tab-edit').addEventListener('input', (e) => {
  const el = e.target;
  if (!el.dataset.path) return;   // 要素パネル（data-elk）は別のハンドラが処理する
  const b = page().blocks.find((x) => x.id === selected);
  if (!b) return;
  setPath(b, el.dataset.path, readEl(el));
  if (el.type === 'range') el.parentElement.querySelector('.f-val').textContent = el.value + (el.dataset.suffix || '');
  renderList();
  renderPreview();
  save(`p:${el.dataset.path}:${selected}`);
});

/* select / checkbox は showIf の出し分けがあるのでフォームごと作り直す */
$('#tab-edit').addEventListener('change', (e) => {
  /* 文字の塗りは、ブロックの props ではなく要素ごとに持つので、道順を持たない */
  if (e.target.hasAttribute('data-txfill')) { setTextFill(e.target.value); return; }
  if (e.target.dataset.linkkind !== undefined) return setLink(e.target.dataset.linkkind, linkDefault(e.target.value), true);
  if (!e.target.dataset.path) return;
  if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'file') renderEditor();
});

/* ---- リンク先 ---- */
function setLink(path, value, redraw) {
  const b = page().blocks.find((x) => x.id === selected);
  if (!b) return;
  setPath(b.props, path.replace(/^props\./, ''), value);
  if (redraw) renderEditor();
  renderPreview(true);
  save(`lk:${path}`);
}
$('#tab-edit').addEventListener('input', (e) => {
  const path = e.target.dataset.linkval;
  if (path === undefined) return;
  setLink(path, (e.target.dataset.pre || '') + e.target.value, false);
});
$('#tab-edit').addEventListener('change', (e) => {
  const path = e.target.dataset.linkval;
  if (path === undefined || e.target.tagName !== 'SELECT') return;
  const v = e.target.value;
  setLink(path, linkKind(v) === 'anchor' || v.startsWith('#') ? v : `page:${v}`, false);
});

/* ---- 繰り返し項目の操作 ---- */
$('#tab-edit').addEventListener('click', (e) => {
  const b = page().blocks.find((x) => x.id === selected);
  if (!b) return;

  const fold = e.target.closest('.li-h');
  if (fold && !e.target.closest('button')) {
    const k = fold.dataset.fold;
    closed.has(k) ? closed.delete(k) : closed.add(k);
    renderEditor();
    return;
  }

  const btn = e.target.closest('[data-lact]');
  if (!btn) return;
  const listEl = btn.closest('.list');
  const path = listEl.dataset.list;
  const arr = path.split('.').slice(1).reduce((o, k) => o[k], b.props);
  const i = Number(btn.dataset.i);
  const act = btn.dataset.lact;

  if (act === 'add') {
    // 直前の項目と同じ形の空データを作る
    const fdef = findListField(b.type, path);
    const blank = {};
    (fdef?.item || []).forEach((sf) => { blank[sf.key] = sf.type === 'toggle' ? false : ''; });
    arr.push(blank);
    closed.delete(`${path}.${arr.length - 1}`);
  }
  if (act === 'del') arr.splice(i, 1);
  if (act === 'up' && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
  if (act === 'down' && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);

  renderEditor(); renderList(); renderPreview(); save();
});

function findListField(type, path) {
  const key = path.split('.').pop();
  const walk = (fields) => {
    for (const f of fields) {
      if (f.key === key && f.type === 'list') return f;
      if (f.type === 'list') { const r = walk(f.item); if (r) return r; }
    }
    return null;
  };
  return walk(BLOCKS[type].fields);
}

/* ================================================================
   画像の取り込み
   プレビューの画像をタップ（スマホならカメラロールが開く）／
   PCはファイルをドロップ／右パネルのボタン、の3経路。
   スマホの写真はそのままだと数MBあり保存できなくなるので、
   取り込むときに長辺1600pxまで縮小する。
   ================================================================ */
const IMG_MAX = 1600;
const IMG_QUALITY = 0.82;

const readAsDataURL = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

async function loadImage(file) {
  if (window.createImageBitmap) {
    /* 写真の向き（EXIF）を反映してくれる */
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* 下の方法へ */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const im = new Image();
    await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = url; });
    return im;
  } finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
}

async function toDataURL(file) {
  /* SVGとGIFは描き直すと壊れる（ベクタ / アニメーション）ためそのまま使う */
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return readAsDataURL(file);
  const src = await loadImage(file);
  const scale = Math.min(1, IMG_MAX / Math.max(src.width, src.height));
  if (scale === 1 && file.size <= 400 * 1024) return readAsDataURL(file);   // 十分小さい
  const cv = document.createElement('canvas');
  cv.width = Math.round(src.width * scale);
  cv.height = Math.round(src.height * scale);
  cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
  if (src.close) src.close();
  return cv.toDataURL('image/jpeg', IMG_QUALITY);
}

async function setImage(blockId, prop, file) {
  const b = page().blocks.find((x) => x.id === blockId);
  if (!b || !file) return;
  if (!file.type.startsWith('image/')) { flash('画像ファイルを選んでください'); return; }
  flash('画像を読み込んでいます…');
  try {
    const url = await toDataURL(file);
    setPath(b.props, prop, url);
    renderEditor(); renderPreview(true); save(`img:${prop}:${blockId}`);
    const kb = Math.round(url.length / 1400);
    const total = Math.round(JSON.stringify(state).length / 1400);
    flash(total > 3500 ? `画像を入れました（合計約${total}KB・保存上限が近いです）`
                       : `画像を入れました（約${kb}KB）`);
  } catch (e) {
    flash('画像を読み込めませんでした');
  }
}

/* ファイル選択（スマホではカメラロールが開く） */
const filePicker = document.createElement('input');
filePicker.type = 'file';
filePicker.accept = 'image/*';
let pickTarget = null;
function openImagePicker(blockId, prop, kind) {
  if (!blockId || !prop) return;
  pickTarget = { blockId, prop, kind };
  filePicker.value = '';
  filePicker.click();
}
filePicker.addEventListener('change', () => {
  const f = filePicker.files[0];
  if (!f || !pickTarget) return;
  if (pickTarget.kind === 'mask') setMask(pickTarget.blockId, pickTarget.prop, f);
  else if (pickTarget.kind === 'txf') setFillImage(pickTarget.blockId, pickTarget.prop, f);
  else setImage(pickTarget.blockId, pickTarget.prop, f);
});

/* ================================================================
   自分で用意した形で抜く

   持ち込まれた絵を「抜き型」に直す。
   ・透明を含む絵（PNGなど）… その透明をそのまま使う
   ・透明を含まない絵（白地に色の形など）… ふちから背景をたどって外し、
     残ったところを形とみなす
   どちらも、最後は「形のところだけ不透明」の絵になる。
   これを mask-image に敷けば、送られてきた形のとおりに抜ける。
   ================================================================ */
const MASK_MAX = 560;   // 抜き型に細かさは要らない。軽くしておく

function hasAlpha(d) {
  for (let i = 3; i < d.length; i += 4 * 97) if (d[i] < 250) return true;
  return false;
}

async function fileToMask(file) {
  const src = await loadImage(file);
  const scale = Math.min(1, MASK_MAX / Math.max(src.width, src.height));
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(src.width * scale));
  cv.height = Math.max(1, Math.round(src.height * scale));
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0, cv.width, cv.height);
  if (src.close) src.close();

  const im = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = im.data;
  if (!hasAlpha(d)) knockOut(im, 26);        // 白地などの背景を外す
  /* 残ったところを真っ黒にそろえる。マスクは濃さしか見ないが、
     半透明のふちを残したいので alpha はそのまま使う。 */
  for (let i = 0; i < d.length; i += 4) { d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; }
  ctx.putImageData(im, 0, 0);

  const webp = cv.toDataURL('image/webp', 0.9);
  return webp.startsWith('data:image/webp') ? webp : cv.toDataURL('image/png');
}

/* 文字を塗る画像。文字の面積ぶんしか見えないので、写真ほどの大きさは要らない */
const FILL_MAX = 900;

async function setFillImage(blockId, prop, file) {
  const b = page().blocks.find((x) => x.id === blockId);
  if (!b || !file) return;
  if (!file.type.startsWith('image/')) { flash('画像ファイルを選んでください'); return; }
  flash('画像を読み込んでいます…');
  try {
    const src = await loadImage(file);
    const scale = Math.min(1, FILL_MAX / Math.max(src.width, src.height));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(src.width * scale));
    cv.height = Math.max(1, Math.round(src.height * scale));
    cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
    if (src.close) src.close();
    const webp = cv.toDataURL('image/webp', 0.72);
    const url = webp.startsWith('data:image/webp') ? webp : cv.toDataURL('image/jpeg', 0.75);
    const role = prop.split('.').pop();
    b.props.fillImgs = b.props.fillImgs || {};
    b.props.fillImgs[role] = url;
    b.props.fills = b.props.fills || {};
    b.props.fills[role] = 'own';
    renderEditor(); renderPreview(true); save(`txfimg:${role}:${blockId}`);
    flash(`この画像で文字を塗ります（約${Math.round(url.length / 1400)}KB）`);
  } catch (e) {
    flash('画像を読み込めませんでした');
  }
}

async function setMask(blockId, prop, file) {
  const b = page().blocks.find((x) => x.id === blockId);
  if (!b || !file) return;
  if (!file.type.startsWith('image/')) { flash('画像ファイルを選んでください'); return; }
  flash('形を読み取っています…');
  try {
    const url = await fileToMask(file);
    setPath(b.props, prop, url);
    /* 「持ち込み」に切り替える先は、欄の名前から決める。
       shapeMask なら写真の形、meltMask ならヒーローの下の縁。 */
    const target = prop.replace(/Mask$/, '');
    if (target !== prop) b.props[target] = 'own';
    renderEditor(); renderPreview(true); save(`mask:${prop}:${blockId}`);
    flash(`この形で抜きます（約${Math.round(url.length / 1400)}KB）`);
  } catch (e) {
    flash('この画像からは形を読み取れませんでした');
  }
}

document.addEventListener('click', (e) => {
  const mb = e.target.closest('[data-mask]');
  if (mb) { openImagePicker(selected, mb.dataset.mask.replace(/^props\./, ''), 'mask'); return; }
  const mc = e.target.closest('[data-maskclear]');
  if (mc) {
    const b = page().blocks.find((x) => x.id === selected);
    if (!b) return;
    const mp = mc.dataset.maskclear.replace(/^props\./, '');
    setPath(b.props, mp, '');
    const mt = mp.replace(/Mask$/, '');
    if (mt !== mp) b.props[mt] = '';
    renderEditor(); renderPreview(true); save();
    flash('形を外しました');
  }
});

/* 右パネルの「画像を選ぶ」ボタン */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick]');
  if (!btn) return;
  openImagePicker(selected, btn.dataset.pick.replace(/^props\./, ''));
});

/* ================================================================
   背景をぬく

   端末の中だけで行う。写真はどこにも送らない。

   やり方は「ふちから、背景に近い色をたどって消す」。
   全体から背景色に近い画素を消すやり方だと、被写体の中の白（皿・服・歯）
   まで抜けてしまう。ふちからつながっている画素だけを消せばそれが起きない。

   人物や雑多な背景をきれいに抜くには学習済みモデルが要る（数MB）。
   それは file:// で開いても動くという今の作りと引き換えになるので、
   ここでは単色・白っぽい背景に絞る。
   ================================================================ */
let cutState = null;   // { blockId, prop, src, img, out }

const CUT_MAX = 1400;  // 透過PNGは重い。抜くときはここまで縮める

/* ふちの画素から、背景の代表色を決める（中央値ではなく最頻の近傍平均） */
function edgeColor(d, w, h) {
  const pick = [];
  const at = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  const step = Math.max(1, Math.round(Math.min(w, h) / 60));
  for (let x = 0; x < w; x += step) { pick.push(at(x, 0)); pick.push(at(x, h - 1)); }
  for (let y = 0; y < h; y += step) { pick.push(at(0, y)); pick.push(at(w - 1, y)); }
  /* 平均だと、ふちに写り込んだ濃い物に引っぱられる。
     いちばん多い色の近くだけを平均する。 */
  let best = null, bestN = -1;
  for (const c of pick) {
    let n = 0;
    for (const o of pick) {
      if (Math.abs(c[0] - o[0]) + Math.abs(c[1] - o[1]) + Math.abs(c[2] - o[2]) < 60) n++;
    }
    if (n > bestN) { bestN = n; best = c; }
  }
  const near = pick.filter((o) =>
    Math.abs(best[0] - o[0]) + Math.abs(best[1] - o[1]) + Math.abs(best[2] - o[2]) < 60);
  const sum = near.reduce((a, o) => [a[0] + o[0], a[1] + o[1], a[2] + o[2]], [0, 0, 0]);
  return sum.map((v) => Math.round(v / near.length));
}

/* ふちからたどって、背景に近い画素を透明にする。
   戻り値は「背景と判定した割合」。ほぼ全部消えたときに知らせるため。 */
function knockOut(im, tol) {
  const { data: d, width: w, height: h } = im;
  const bg = edgeColor(d, w, h);
  const lim = tol * 3;                       // R+G+B の差の合計で見る
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (seen[i]) return;
    const j = i * 4;
    if (Math.abs(d[j] - bg[0]) + Math.abs(d[j + 1] - bg[1]) + Math.abs(d[j + 2] - bg[2]) > lim) return;
    seen[i] = 1; stack.push(i);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  /* ふちを1段なじませる。境目がギザギザのままだと切り抜きに見えない */
  let cut = 0;
  for (let i = 0; i < seen.length; i++) {
    if (seen[i]) { d[i * 4 + 3] = 0; cut++; continue; }
    const x = i % w, y = (i / w) | 0;
    let n = 0;
    if (x > 0 && seen[i - 1]) n++;
    if (x < w - 1 && seen[i + 1]) n++;
    if (y > 0 && seen[i - w]) n++;
    if (y < h - 1 && seen[i + w]) n++;
    if (n) d[i * 4 + 3] = Math.round(255 * (1 - n / 6));
  }
  return cut / seen.length;
}

function cutRender() {
  if (!cutState) return;
  const { img: src } = cutState;
  const cv = $('#cutCanvas');
  const scale = Math.min(1, CUT_MAX / Math.max(src.width, src.height));
  cv.width = Math.round(src.width * scale);
  cv.height = Math.round(src.height * scale);
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.drawImage(src, 0, 0, cv.width, cv.height);
  const im = ctx.getImageData(0, 0, cv.width, cv.height);
  const ratio = knockOut(im, +$('#cutTol').value);
  ctx.putImageData(im, 0, 0);

  const note = $('#cutNote');
  if (ratio > 0.92) note.textContent = 'ほとんど消えてしまいました。範囲を狭めてください。';
  else if (ratio < 0.03) note.textContent = 'あまり抜けていません。範囲を広げてください。';
  else note.textContent = `背景と判断したところ：${Math.round(ratio * 100)}%`;
}

function openCutout(blockId, prop) {
  const b = page().blocks.find((x) => x.id === blockId);
  const src = b && getPath(b.props, prop);
  if (!src) return;
  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.onload = () => {
    cutState = { blockId, prop, img: im };
    openModal('#cutModal');
    cutRender();
  };
  im.onerror = () => flash('この画像は読み込めませんでした（別のサイトの画像は抜けません）');
  im.src = src;
}

$('#cutTol').addEventListener('input', () => {
  $('#cutTolVal').textContent = $('#cutTol').value;
  cutRender();
});
$('#cutCancel').addEventListener('click', () => { cutState = null; closeModal('#cutModal'); });
/* 透過つきで、なるべく軽く書き出す。

   JPEG は透明を持てないので使えない。PNG は写真だと非常に重く、
   512pxの写真でも 255KB になった（1ページ3MBの上限に当たる）。
   WebP は透明を持てて写真に強いので、使えるならそちらを使い、
   それでも重いときは縦横を落とす。 */
function cutEncode(cv) {
  const webp = cv.toDataURL('image/webp', 0.86);
  return webp.startsWith('data:image/webp') ? webp : cv.toDataURL('image/png');
}

const CUT_KB_MAX = 700;

function cutSmall(cv) {
  let url = cutEncode(cv);
  let w = cv.width, h = cv.height;
  /* 3回まで縮めて様子を見る。それ以上は形が崩れるので、重いまま出して知らせる */
  for (let i = 0; i < 3 && url.length / 1400 > CUT_KB_MAX; i++) {
    w = Math.round(w * 0.75); h = Math.round(h * 0.75);
    const c2 = document.createElement('canvas');
    c2.width = w; c2.height = h;
    c2.getContext('2d').drawImage(cv, 0, 0, w, h);
    url = cutEncode(c2);
  }
  return url;
}

$('#cutApply').addEventListener('click', () => {
  if (!cutState) return;
  const { blockId, prop } = cutState;
  const url = cutSmall($('#cutCanvas'));
  const b = page().blocks.find((x) => x.id === blockId);
  if (b) {
    setPath(b.props, prop, url);
    renderEditor(); renderPreview(true); save(`cut:${prop}:${blockId}`);
    const kb = Math.round(url.length / 1400);
    flash(kb > CUT_KB_MAX ? `背景をぬきました（約${kb}KB・写真としては重めです）`
                          : `背景をぬきました（約${kb}KB）。元に戻すときは「取り消し」`);
  }
  cutState = null;
  closeModal('#cutModal');
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cut]');
  if (!btn) return;
  openCutout(selected, btn.dataset.cut.replace(/^props\./, ''));
});

/* たまにしか使わないものは「…」の中。開いたら、外を押すと閉じる */
$('#btnMore').addEventListener('click', (e) => {
  e.stopPropagation();
  const m = $('#moreMenu');
  m.hidden = !m.hidden;
  $('#btnMore').setAttribute('aria-expanded', String(!m.hidden));
});
document.addEventListener('click', () => {
  const m = $('#moreMenu');
  if (m && !m.hidden) { m.hidden = true; $('#btnMore').setAttribute('aria-expanded', 'false'); }
});
$('#moreMenu').addEventListener('click', () => { $('#moreMenu').hidden = true; });

/* 編集画面の外にファイルを落としても、ブラウザがそれを開いてしまわないように */
['dragover', 'drop'].forEach((t) =>
  document.addEventListener(t, (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault(); }));

/* ================================================================
   デザインタブ / ページ設定タブ
   ================================================================ */
/* 決めるのは4色だけ。残りは決めた色から作る（tone.js）。
   8色が並んでいると手が止まる。「メインカラー」「文字色」は分かるが、
   「薄いエリア」「うすい文字」「線」「濃いエリア」は、どこに出るかを
   知らないと決められない。 */
const BASE_COLORS = [
  { key: 'primary', label: 'メインカラー', type: 'color' },
  { key: 'accent', label: 'アクセントカラー', type: 'color' },
  { key: 'bg', label: '背景色', type: 'color' },
  { key: 'text', label: '文字色', type: 'color' },
];
/* 決めた色を変えたら作り直す色。これ以外を変えても薄い色は動かさない */
const TONE_TRIGGERS = new Set(['primary', 'bg', 'text']);

const THEME_FIELDS = [
  ['文字', [
    { key: 'font', label: '本文のフォント', type: 'select', options: FONTS.map((f) => [f[0], f[1]]) },
    { key: 'fontHead', label: '見出しのフォント', type: 'select', options: FONTS.map((f) => [f[0], f[1]]) },
  ]],
  ['かたち', [
    { key: 'radius', label: '角の丸み', type: 'range', min: 0, max: 32, suffix: 'px' },
    { key: 'max', label: 'コンテンツの幅', type: 'range', min: 880, max: 1400, suffix: 'px' },
  ]],
];

/* デザインの型（影・罫線・見出しの構えがまとめて変わる） */
const STYLES = [
  ['', '標準（影と丸み）'],
  ['mono', 'モノクロ調（罫線・角なし）'],
  ['soft', 'やわらかい（丸み・影）'],
  ['bold', '太い（見出しを大きく）'],
  ['edit', '誌面のような（余白・細い線）'],
];

const MOTION_FIELDS = [
  { key: 'anim', label: '見出しの文字アニメ', type: 'select', options: TEXT_ANIMS,
    hint: 'すべての見出しに適用されます（ヒーローは個別に変更できます）' },
  { key: 'dur', label: 'アニメの長さ', type: 'range', min: 150, max: 2500, suffix: 'ms' },
  { key: 'stagger', label: '1文字ごとのずらし', type: 'range', min: 0, max: 200, suffix: 'ms' },
  { key: 'ease', label: 'イージング（速度の変化）', type: 'select', options: MOTION_EASES },
  { key: 'reveal', label: 'ブロックをスクロールで出現させる', type: 'toggle' },
  { key: 'smooth', label: '慣性スクロール（少し滑って止まる）', type: 'toggle',
    hint: 'マウスの環境だけで効きます。指の操作と「動きを減らす」設定では切れます' },
];

/* 決めた色から作った4色を、名前とどこに出るかつきで見せる。
   自動でそろえているあいだも、何色になったかは見えるようにしておく
   （黙って決められるのがいちばん分かりにくい）。 */
function toneStrip() {
  const t = state.theme;
  return `<div class="tone-list">${TONE_KEYS.map(([k, label, where]) =>
    `<div class="tone"><i style="background:${esc(t[k])}"></i>
      <b>${esc(label)}</b><small>${esc(where)}</small><em>${esc(t[k])}</em></div>`).join('')}</div>`;
}

function renderDesign() {
  const auto = state.theme.autoTone !== false;
  $('#tab-design').innerHTML =
    `<div class="sec-label">配色</div>
     <button class="anim-gal" id="btnPalGal" style="margin:0 0 14px">▦ 配色を一覧から選ぶ</button>
     <div class="sec-label">決める色</div>`
    + BASE_COLORS.map((f) =>
      `<div class="f"><label>${esc(f.label)}</label>${inputHTML(f, state.theme[f.key], `theme.${f.key}`)}</div>`).join('')
    + `<div class="f"><label class="sw"><input type="checkbox" data-path="theme.autoTone"${auto ? ' checked' : ''}>薄いところは自動でそろえる</label>
        <div class="hint">上の色から、薄いエリア・うすい文字・線・濃いエリアを作ります。
          地に対して読める明るさになるまで戻すので、色を変えても文字が潰れません。</div></div>`
    + `<div class="sec-label">${auto ? 'ついてくる色' : '薄いところ'}</div>`
    + (auto ? `<div id="toneStrip">${toneStrip()}</div>`
            : TONE_KEYS.map(([k, label, where]) =>
              `<div class="f"><label>${esc(label)}</label>${inputHTML({ key: k, type: 'color' }, state.theme[k], `theme.${k}`)}
                <div class="hint">${esc(where)}</div></div>`).join(''))
    + THEME_FIELDS.map(([g, fs]) =>
    `<div class="sec-label">${g}</div>` + fs.map((f) => {
      const path = `theme.${f.key}`;
      const val = state.theme[f.key];
      return `<div class="f"><label>${esc(f.label)}</label>${inputHTML(f, val, path)}</div>`;
    }).join('')).join('')
    + `<div class="sec-label">デザインの型</div>`
    + `<div class="f"><label>全体の造形</label>
        <select data-path="style">${STYLES.map(([v, l]) =>
          `<option value="${v}"${state.style === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <div class="hint">影・罫線・見出しの構えがまとめて変わります</div></div>`
    + `<div class="f"><label class="sw"><input type="checkbox" data-path="rules"${state.rules ? ' checked' : ''}>縦の罫線を通す</label>
        <div class="hint">左・中央・右に細い線が入り、全体が図面のように締まります</div></div>`
    + `<div class="sec-label">動き</div>`
    + MOTION_FIELDS.map((f) => {
        const path = `motion.${f.key}`;
        const val = state.motion[f.key];
        if (f.type === 'toggle') return `<div class="f">${inputHTML(f, val, path)}</div>`;
        return `<div class="f"><label>${esc(f.label)}</label>${inputHTML(f, val, path)}
          ${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
      }).join('')
    + `<button class="anim-gal" id="btnAnimGal" style="margin-top:0">▦ サンプルを見ながら選ぶ</button>`
    + `<button class="add-btn" id="btnReplayAnim" style="margin-top:8px">▶ プレビューで再生</button>`;
}
function renderPage() {
  const pg = page();
  const many = state.pages.length > 1;
  const i = state.pages.indexOf(pg);
  /* ページが1枚なら「サイト」も「ページ」も同じものなので、分けて見せない。
     2枚目ができた時点で、はじめて「このページ」と「サイト全体」を分ける */
  const perPage = many ? `
    <div class="sec-label">このページ（${esc(pg.name)}）</div>
    <div class="f"><label>ページの名前</label>
      <input type="text" id="pgRename" value="${esc(pg.name)}"${i === 0 ? ' disabled' : ''}></div>
    ${i === 0 ? '<div class="hint">ホームの名前とアドレスは変えられません。</div>' : `
    <div class="f"><label>アドレス</label>
      <div class="pg-path"><span>…/</span><input type="text" id="pgRepath" value="${esc(pg.path)}"><span>.html</span></div></div>`}
    <div class="f"><label>タブに出す名前（空ならページ名＋サイト名）</label>
      <input type="text" data-page="title" value="${esc(pg.title)}" placeholder="${esc(pageTitle(pg))}"></div>
    <div class="f"><label>このページの説明（空ならサイトの説明）</label>
      <textarea data-page="desc" rows="3" placeholder="${esc(pageDesc(pg))}">${esc(pg.desc)}</textarea></div>
    <div class="pg-ops">
      <button class="tb-btn" data-pgact="up"${i <= 1 ? ' disabled' : ''}>← 前へ</button>
      <button class="tb-btn" data-pgact="down"${i === 0 || i === state.pages.length - 1 ? ' disabled' : ''}>後ろへ →</button>
      <button class="tb-btn" data-pgact="dup">複製する</button>
      <button class="tb-btn" data-pgact="del"${i === 0 ? ' disabled' : ''}>このページを削除</button>
    </div>` : '';

  $('#tab-page').innerHTML = perPage + `
    <div class="sec-label">サイト全体（ブラウザのタブ名・検索結果に出ます）</div>
    <div class="f"><label>${many ? 'サイトの名前' : 'ページタイトル'}</label><input type="text" data-path="meta.title" value="${esc(state.meta.title)}"></div>
    <div class="f"><label>${many ? 'サイトの説明' : 'ページの説明'}</label><textarea data-path="meta.description" rows="4">${esc(state.meta.description)}</textarea></div>
    <div class="f"><label>言語</label><input type="text" data-path="meta.lang" value="${esc(state.meta.lang)}"></div>
    <div class="sec-label">つかいかた</div>
    <div class="hint" style="line-height:2">
      ・左でブロックの並べかえ・追加・削除<br>
      ・プレビューを直接クリックしても選べます<br>
      ・「アンカーID」を付けると、メニューから <b>#id</b> でリンクできます<br>
      ・ボタンやメニューの「リンク先」から、ほかのページを選べます<br>
      ・内容はこのブラウザに自動保存されます${many ? `<br>
      ・保存すると、${state.pages.length}枚ぶんをまとめたZIPになります` : ''}
    </div>`;
}

/* ページの名前・アドレス・並び・削除 */
$('#tab-page').addEventListener('input', (e) => {
  const pg = page();
  if (e.target.id === 'pgRename') { pg.name = e.target.value; renderPageBar(); renderPreview(); return save('pg:name'); }
  if (e.target.id === 'pgRepath') {
    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    pg.path = e.target.value;
    renderPageBar(); save('pg:path');
    return;
  }
  const k = e.target.dataset.page;
  if (k) { pg[k] = e.target.value; save(`pg:${k}`); }
});
$('#tab-page').addEventListener('change', (e) => {
  /* 打ち終わったところで、空や重なりを直す。打っている途中に直すと入力が飛ぶ */
  if (e.target.id !== 'pgRepath') return;
  const pg = page();
  pg.path = slugPath(e.target.value || pg.name, state.pages.filter((x) => x !== pg).map((x) => x.path));
  e.target.value = pg.path;
  renderPageBar(); renderPreview(true); save('pg:path');
});
$('#tab-page').addEventListener('click', (e) => {
  const act = e.target.closest('[data-pgact]')?.dataset.pgact;
  if (!act) return;
  const i = pageIdx;
  const pg = state.pages[i];
  if (act === 'up' && i > 1) { state.pages.splice(i - 1, 0, state.pages.splice(i, 1)[0]); pageIdx = i - 1; }
  if (act === 'down' && i > 0 && i < state.pages.length - 1) { state.pages.splice(i + 1, 0, state.pages.splice(i, 1)[0]); pageIdx = i + 1; }
  if (act === 'dup') {
    const c = clone(pg);
    c.id = uid();
    c.name = `${pg.name}のコピー`;
    c.path = slugPath(c.name, state.pages.map((x) => x.path));
    c.blocks.forEach((b) => { b.id = uid(); });
    state.pages.splice(i + 1, 0, c);
    pageIdx = i + 1;
  }
  if (act === 'del') {
    if (i === 0) return;
    const linked = allBlocks(state).filter((b) => JSON.stringify(b.props).includes(`page:${pg.id}`)).length;
    const warn = linked ? `\n\nこのページへのリンクが${linked}か所あります。リンクは効かなくなります。` : '';
    if (!confirm(`「${pg.name}」を削除しますか？${warn}`)) return;
    state.pages.splice(i, 1);
    pageIdx = Math.min(i, state.pages.length - 1);
  }
  selected = page().blocks[1]?.id || page().blocks[0]?.id || null;
  selectedEl = null;
  refresh();
  save(`pg:${act}`);
});

/* 決めた色から、薄いところを作り直す。
   自動をやめている人の色は触らない。 */
function applyTone() {
  if (state.theme.autoTone === false) return false;
  Object.assign(state.theme, toneFromBase(state.theme));
  return true;
}

function themeInput(e) {
  const el = e.target;
  const path = el.dataset.path || '';
  if (path !== 'style' && path !== 'rules'
    && !path.startsWith('theme.') && !path.startsWith('meta.') && !path.startsWith('motion.')) return;
  setPath(state, path, readEl(el));

  /* 決める色を動かしたら、薄いところも一緒に動かす。
     欄は作り直さない（色を選んでいる途中でピッカーが閉じてしまう）。
     見えている見本の中身だけ書き替える。 */
  if (TONE_TRIGGERS.has(path.slice(6)) && applyTone()) {
    const strip = $('#toneStrip');
    if (strip) strip.innerHTML = toneStrip();
  }

  if (el.type === 'range') {
    el.parentElement.querySelector('.f-val').textContent = el.value + (el.dataset.suffix || '');
  }
  // カラーピッカーと16進数の入力欄を同期させる（作り直すとピッカーが閉じるので値だけ更新）
  if (el.type === 'color') {
    const t = el.parentElement.querySelector('input[type=text]');
    if (t) t.value = el.value;
  } else if (el.type === 'text' && /^#[0-9a-f]{6}$/i.test(el.value)) {
    const c = el.parentElement.querySelector('input[type=color]');
    if (c) c.value = el.value;
  }
  renderPreview(); save(`t:${path}`);
}
$('#tab-design').addEventListener('input', themeInput);
$('#tab-design').addEventListener('click', (e) => {
  if (e.target.id === 'btnReplayAnim') renderPreview(true);
  if (e.target.id === 'btnPalGal') { renderPalGrid(); openModal('#palModal'); return; }
  if (e.target.id === 'btnAnimGal') {
    openAnimGallery('ta', state.motion.anim, (key) => {
      state.motion.anim = key;
      renderDesign(); renderPreview(true); save('t:motion.anim');
    });
  }
});
/* select や toggle を変えたら、すぐ動きを確認できるよう作り直す */
$('#tab-design').addEventListener('change', (e) => {
  const path = e.target.dataset.path || '';
  if (path === 'theme.autoTone') {
    /* 入れた瞬間にそろえる。「自動にしたのに何も起きない」を作らない */
    applyTone();
    renderDesign(); renderPreview(true); save('t:tone');
    return;
  }
  if (path.startsWith('motion.') || path === 'style' || path === 'rules') renderPreview(true);
});
$('#tab-page').addEventListener('input', themeInput);   // サイト全体の欄

/* ---- タブ切り替え ---- */
$$('.tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

/* ================================================================
   テンプレート選択
   ================================================================ */
/* テーマの色などを、まとめて style 属性に書ける形にする（カードごとに配色を変えるため） */
function themeVars(t, override) {
  if (override) t = Object.assign({}, t, override);
  return [
    `--c-primary:${t.primary}`, `--c-accent:${t.accent}`, `--c-bg:${t.bg}`,
    `--c-surface:${t.surface}`, `--c-text:${t.text}`, `--c-muted:${t.muted}`,
    `--c-border:${t.border}`, `--c-dark:${t.dark}`,
    `--c-on-primary:${readableOn(t.primary)}`, `--c-on-accent:${readableOn(t.accent)}`,
    `--c-on-dark:${readableOn(t.dark)}`,
    `--radius:${t.radius}px`, `--max:${t.max}px`,
    `--font:${fontStack(t.font)}`, `--font-head:${fontStack(t.fontHead)}`,
    '--ta-dur:.9s', '--ta-stagger:.04s', '--ta-ease:cubic-bezier(.2,.7,.3,1)',
  ].join(';');
}

const TPL_GAL_CSS = `
body{margin:0;background:#0d1016;padding:14px;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif}
.tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.tc{display:block;width:100%;padding:0;cursor:pointer;color:#e7ebf0;font:inherit;position:relative;
  background:#171a21;border:1px solid #2a2f3a;border-radius:12px;overflow:hidden;
  transition:border-color .15s,transform .15s}
.tc:hover{border-color:#4c8dff;transform:translateY(-3px)}
.tc-hit{position:absolute;inset:0;z-index:5}
.tc-prev{height:250px;overflow:hidden;border-bottom:1px solid #2a2f3a}
.tc-scale{width:1300px;transform:scale(.246);transform-origin:top left;pointer-events:none;
  color:var(--c-text);background:var(--c-bg)}
.tc-meta{padding:12px 14px 15px}
.tc-meta b{font-size:14px;display:block;margin-bottom:4px}
.tc-meta small{color:#98a2b3;font-size:11.5px;line-height:1.65;display:block}
.tc-sw{display:flex;gap:4px;margin-top:9px}
.tc-sw i{width:16px;height:16px;border-radius:4px;border:1px solid rgba(255,255,255,.18)}
/* 見出しの出現アニメは止めて、完成形で見せる */
.tc-scale [data-ta] .ch,.tc-scale .rv{opacity:1!important;transform:none!important}
.tc-scale .pinsec{height:auto!important}
.tc-scale .pin-in{position:static;height:520px}
`;

/* ================================================================
   配色の一覧
   いまのページの上から2〜3ブロックを、各パレットの色で描いて見比べる。
   ================================================================ */
const PAL_GAL_CSS = `
body{margin:0;background:#0d1016;padding:14px;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif}
.pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:14px}
.pc{display:block;width:100%;padding:0;cursor:pointer;color:#e7ebf0;font:inherit;position:relative;
  background:#171a21;border:1px solid #2a2f3a;border-radius:12px;overflow:hidden;
  transition:border-color .15s,transform .15s}
.pc:hover{border-color:#4c8dff;transform:translateY(-3px)}
.pc.on{border-color:#4c8dff;box-shadow:0 0 0 1px #4c8dff inset}
.pc-hit{position:absolute;inset:0;z-index:5}
.pc-prev{height:208px;overflow:hidden;border-bottom:1px solid #2a2f3a}
.pc-scale{width:1300px;transform:scale(.206);transform-origin:top left;pointer-events:none;
  color:var(--c-text);background:var(--c-bg)}
.pc-meta{padding:11px 13px 14px}
.pc-meta b{font-size:13px;display:block;margin-bottom:3px}
.pc-meta small{color:#98a2b3;font-size:11px;line-height:1.6;display:block}
.pc-sw{display:flex;gap:4px;margin-top:9px}
.pc-sw i{width:15px;height:15px;border-radius:4px;border:1px solid rgba(255,255,255,.18)}
.pc-scale [data-ta] .ch,.pc-scale .rv{opacity:1!important;transform:none!important}
.pc-scale .pinsec{height:auto!important}
.pc-scale .pin-in{position:static;height:460px}
.pc-scale .sl{position:static;transform:none!important;height:auto;padding:40px}
.pc-scale .sl-stage{position:static;transform:none!important}
`;

function currentPaletteKey() {
  const t = state.theme;
  const hit = PALETTES.find((p) => p.c.primary.toLowerCase() === String(t.primary).toLowerCase()
                                && p.c.bg.toLowerCase() === String(t.bg).toLowerCase());
  return hit ? hit.name : '';
}

function renderPalGrid() {
  /* いまのページの上のほうを、そのまま色だけ変えて見せる */
  const sample = page().blocks.slice(0, 3)
    .map((b) => BLOCKS[b.type].render(b.props)).join('');
  const cur = currentPaletteKey();

  const cards = PALETTES.map((pal, i) => `<div class="pc${pal.name === cur ? ' on' : ''}" data-pal="${i}" role="button" tabindex="0">
      <span class="pc-hit"></span>
      <div class="pc-prev" style="background:${pal.c.bg}">
        <div class="pc-scale ${esc(bodyClass())}" style="${themeVars(state.theme, pal.c)}">${sample}</div>
      </div>
      <div class="pc-meta"><b>${esc(pal.name)}</b><small>${esc(pal.desc)}</small>
        <span class="pc-sw">${[pal.c.primary, pal.c.accent, pal.c.bg, pal.c.surface, pal.c.text]
          .map((c) => `<i style="background:${c}"></i>`).join('')}</span>
      </div>
    </div>`).join('');

  const f = $('#palFrame');
  f.srcdoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<style>${SITE_CSS}\n${PAL_GAL_CSS}</style></head>
<body><div class="pg">${cards}</div></body></html>`;
  f.addEventListener('load', () => {
    f.contentDocument.addEventListener('click', (e) => {
      const i = e.target.closest('.pc')?.dataset.pal;
      if (i != null) applyPalette(+i);
    });
  }, { once: true });
}

function applyPalette(i) {
  const pal = PALETTES[i];
  if (!pal) return;
  Object.assign(state.theme, pal.c);   // 色だけ差し替え、丸み・幅・フォントは残す
  closeModal('#palModal');
  renderDesign(); renderPreview(true); save();
  flash(`配色を「${pal.name}」にしました`);
}

$('#palClose').addEventListener('click', () => closeModal('#palModal'));

function renderTplGrid() {
  const cards = Object.entries(TEMPLATES).map(([k, t]) => {
    /* 上から3ブロックだけ描いて、そのテンプレートの顔を見せる */
    const sample = t.blocks.slice(0, 3).map((b) => {
      const props = Object.assign(clone(BLOCKS[b.type].defaults), clone(b.props || {}));
      return BLOCKS[b.type].render(props);
    }).join('');
    return `<div class="tc" data-tpl="${k}" role="button" tabindex="0">
      <span class="tc-hit"></span>
      <div class="tc-prev" style="background:${t.theme.bg}">
        <div class="tc-scale tpl-${k}${t.style ? ` sty-${t.style}` : ''}${t.rules ? ' has-rules' : ''}" style="${themeVars(t.theme)}">${sample}</div>
      </div>
      <div class="tc-meta"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small>
        <span class="tc-sw">${t.swatch.map((c) => `<i style="background:${c}"></i>`).join('')}</span>
      </div>
    </div>`;
  }).join('');

  const f = $('#tplFrame');
  f.srcdoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<style>${SITE_CSS}\n${TPL_GAL_CSS}</style></head>
<body><div class="tg">${cards}</div></body></html>`;
  f.addEventListener('load', () => {
    f.contentDocument.addEventListener('click', (e) => {
      const k = e.target.closest('.tc')?.dataset.tpl;
      if (k) pickTemplate(k);
    });
  }, { once: true });
}
const openModal = (id) => { $(id).hidden = false; };
const closeModal = (id) => { $(id).hidden = true; };

/* ================================================================
   かんたんモード — 業種 → 店名 → 写真 → 完成

   ホームページを持っていない人が対象なので、決めることを3つに絞る。
   文章・配色・写真の配置は、こちらで埋める。
   ================================================================ */
/* ================================================================
   はじめる

   起動して最初に出る画面。ここでの分かれ道は2つだけにする。
     ・テンプレートから選ぶ … 出来上がったページを選んで差し替える
     ・空白からカスタマイズ … 順に選んで組み上げる
   どちらを選んでも、あとから全部変えられる。
   ================================================================ */
function openEasy() {
  closeModal('#tplModal');
  closeModal('#buildModal');
  openModal('#easyModal');
}

$('#ezStep0').addEventListener('click', (e) => {
  const way = e.target.closest('[data-way]')?.dataset.way;
  if (!way) return;
  closeModal('#easyModal');
  if (way === 'tpl') { renderTplGrid(); openModal('#tplModal'); }
  else openBuild(true);
});

/* ================================================================
   部分ごとに選んで組む

   テンプレートが「1ページまるごと」なのに対して、こちらは1段ずつ積む。
   1段目はヒーロー、2段目からは自由。選ぶたびに後ろのプレビューが伸びるので、
   出来上がりを見ながら次を決められる。

   途中でやめても元に戻せるよう、開始時の state を控えておく。
   ================================================================ */
let bldBefore = null;   // 「やめる」で戻すための、開始前の状態

/* 積んだ順に、選んだ型の名前を覚えておく。
   ブロックの種別名（「特徴」「紹介」）ではなく、選んだときに見えていた
   名前（「カード3つ（絵柄つき）」）を上の帯に出すため。
   保存する中身には入れない（作るときだけの覚書）。 */
const bldNames = new Map();

/* 型の見本は実物を描く。中身は BLOCKS の初期値そのままなので、
   ここで組んだ差分だけが型ごとの違いになる。 */
function presetSample(p) {
  const def = BLOCKS[p.type];
  return def.render(Object.assign(clone(def.defaults), clone(p.props)));
}

/* ================================================================
   順を追って組む

     ① 雰囲気をえらぶ（＝いちばん上）
     ② 必要なものにチェック（使い道で選ぶ）
     ③ ひとつずつ、かたちをえらぶ
     ④ できました

   ②で「かたち」ではなく「使い道」を聞くのが要。型の一覧はかたちで
   並んでいるが、かたちで選べるのは何を載せるか決まっている人だけ。
   はじめての人はその前で止まる——「うちに何が要るのか」が分からない。

   チェックした時点でページはもう組み上がっている。③はそれを1つずつ
   見直すだけなので、途中でやめても完成品が手元に残る。

   どの段にも「あとから変えられる」と出しておく。戻せないと思うと、
   人は選べなくなって手が止まる。
   ================================================================ */
const BLD_STEPS = ['hero', 'needs', 'shape', 'done'];
let bldI = 0;
let bldPhotos = [];        // ①で選んだ写真
let bldNeeds = [];         // ②でチェックした使い道のキー
let bldShapeI = 0;         // ③でいま何個目を見ているか
const bldNeedBlock = new Map();   // 使い道 → 置いたブロックのID

const bldStep = () => BLD_STEPS[bldI];

const BLD_HEAD = {
  hero: ['① サイトの雰囲気をえらぶ', 'いちばん上に来る、顔になる部分です。ここでサイトの印象が決まります。'],
  needs: ['② 必要なものをえらぶ', 'いま要りそうなものにチェックを付けてください。あとから足せます。'],
  shape: ['③ かたちをえらぶ', '選んだものを、ひとつずつ見ていきます。'],
  done: ['できました', 'ここから細かいところを整えます。'],
};

/* ③で見ていく順。かたちが1つしかないものは選ばせない（見せるものが無い） */
const shapeQueue = () => NEEDS.filter((n) => bldNeeds.includes(n.key) && n.picks.length > 1);
const nowNeed = () => shapeQueue()[bldShapeI] || null;

function bldList() {
  const st = bldStep();
  if (st === 'hero') return HERO_PRESETS;
  if (st === 'shape') {
    const n = nowNeed();
    if (!n) return [];
    return n.picks.map((k) => SECTION_PRESETS.find((p) => p.key === k)).filter(Boolean);
  }
  return [];
}

function renderBldSteps() {
  const now = bldI;
  $('#bldSteps').innerHTML = BLD_STEPS.map((k, i) => {
    const label = BLD_HEAD[k][0].replace(/^[①-⑤]\s*/, '');
    return `<span class="${i === now ? 'on' : (i < now ? 'past' : '')}">${esc(label)}</span>`;
  }).join('');
}

function renderBldStrip() {
  /* header と footer は最初から入っていて選ぶものではないので出さない */
  const picked = page().blocks.filter((b) => b.type !== 'header' && b.type !== 'footer');
  const sel = bldStep() === 'shape' ? bldNeedBlock.get((nowNeed() || {}).key) : null;
  $('#bldStrip').innerHTML = picked
    .map((b, i) => `<span class="${b.id === sel ? 'on' : ''}"><i>${i + 1}</i>${esc(bldNames.get(b.id) || BLOCKS[b.type].label)}</span>`)
    .join('');
  /* 積み上がりの帯は③でだけ出す。②では「1 Cover」だけが宙に浮いて見える */
  $('#bldStrip').hidden = bldStep() !== 'shape' || !picked.length;
  const on = $('#bldStrip .on');
  if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function renderBldHead() {
  const st = bldStep();
  let [title, sub] = BLD_HEAD[st];
  const q = shapeQueue();
  if (st === 'shape' && q.length) {
    const n = nowNeed();
    title = `③ ${n.label}の、かたちをえらぶ`;
    sub = `${bldShapeI + 1} / ${q.length}　${n.about}`;
  }
  $('#bldTitle').textContent = title;
  /* スマホでは説明が長いほど見本が見えなくなるので、要点だけにする */
  $('#bldSub').textContent = sub;

  $('#bldPhoto').hidden = st !== 'hero';
  $('#bldNeeds').hidden = st !== 'needs';
  $('#bldFinish').hidden = st !== 'done';
  $('#bldGal').hidden = st !== 'hero' && st !== 'shape';
  /* ③は選ばなくても先へ行ける。いま置いてある形のままでいい人もいる */
  $('#bldSkip').hidden = st !== 'shape';

  const hasHero = page().blocks.some((b) => b.type === 'hero' || b.type === 'collage');
  $('#bldCancel').hidden = st === 'done';
  $('#bldBack').hidden = bldI === 0;
  $('#bldDone').textContent = st === 'done' ? '編集をはじめる'
    : (st === 'shape' && bldShapeI < q.length - 1 ? 'つぎへ' : 'つぎへ');
  /* 雰囲気を選ばずには進ませない。空のページから始まっているので、
     何も無いまま先へ行っても選ぶものが見えない */
  $('#bldDone').disabled = st === 'hero' && !hasHero;
}

function renderBldGallery() {
  const st = bldStep();
  if (st !== 'hero' && st !== 'shape') return;
  const f = $('#bldFrame');
  const list = bldList();
  /* 見本が2〜3枚しかない段では、枠を詰める。
     決め打ちの高さのままだと、下に画面半分ぶんの空きが残る */
  fitGalHeight(f.parentElement, list.length);
  const g = galGeom(f);
  sizeGalFrame(f, g);

  const cur = st === 'shape' ? bldNames.get(bldNeedBlock.get((nowNeed() || {}).key)) : null;
  /* 説明は絵で足りる。名前だけ出し、言葉での補足はマウスを乗せたときに出す */
  const cards = list.map((p) => `<div class="gc${p.label === cur ? ' on' : ''}" data-key="${esc(p.key)}" role="button" tabindex="0"
      title="${esc(p.about || '')}">
      <span class="gc-hit"></span>
      <div class="gc-prev"><div class="gc-scale">${presetSample(p)}</div></div>
      <div class="gc-meta"><b>${esc(p.label)}</b></div>
    </div>`).join('');

  f.srcdoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<style>${themeCSS(state.theme)}\n${SITE_CSS}\n${galleryCSS(g)}</style></head>
<body class="${esc(bodyClass())}"><div class="gg">${cards}</div>
<script>${SITE_JS}<\/script><script>${fitJS(g)}<\/script></body></html>`;

  /* srcdoc を差し替えるたびに load が来るので、毎回付け直す
     （once で1回だけにすると、2段目以降が反応しなくなる） */
  f.onload = () => {
    f.contentDocument.addEventListener('click', (e) => {
      const k = e.target.closest('.gc')?.dataset.key;
      if (k) pickPreset(k);
    });
  };
}

function refreshBld() {
  renderBldSteps();
  renderBldHead();
  renderBldStrip();
  renderBldGallery();
}

/* ---------------- ② 必要なものをチェック ---------------- */
function renderNeeds() {
  $('#needList').innerHTML = NEEDS.map((n) => `<label class="need${bldNeeds.includes(n.key) ? ' on' : ''}">
      <input type="checkbox" data-need="${esc(n.key)}"${bldNeeds.includes(n.key) ? ' checked' : ''}>
      <span><b>${esc(n.label)}</b><small>${esc(n.about)}</small></span>
    </label>`).join('');
}
$('#needList').addEventListener('change', (e) => {
  const k = e.target.dataset.need;
  if (!k) return;
  bldNeeds = e.target.checked ? [...bldNeeds, k] : bldNeeds.filter((x) => x !== k);
  renderNeeds();
});

/* チェックしたものを、並び順どおりに置く。
   ここで一度ページを組み上げてしまうので、③を飛ばしても完成品が残る。
   すでに置いてあるものは触らない（②に戻って足し引きしても崩れない）。 */
function applyNeeds() {
  const want = NEEDS.filter((n) => bldNeeds.includes(n.key));
  /* 外したものは消す */
  [...bldNeedBlock.entries()].forEach(([k, id]) => {
    if (want.some((n) => n.key === k)) return;
    page().blocks = page().blocks.filter((b) => b.id !== id);
    bldNames.delete(id);
    bldNeedBlock.delete(k);
  });
  /* 足したものを、フッターの手前に順に積む */
  want.forEach((n) => {
    if (bldNeedBlock.has(n.key)) return;
    const p = SECTION_PRESETS.find((x) => x.key === n.picks[0]);
    if (!p) return;
    const nb = makeBlock(p.type, p.props);
    fillFromBiz(nb);
    bldNames.set(nb.id, p.label);
    bldNeedBlock.set(n.key, nb.id);
    const fi = page().blocks.findIndex((b) => b.type === 'footer');
    page().blocks.splice(fi < 0 ? page().blocks.length : fi, 0, nb);
  });
  spreadPhotos();
  selected = page().blocks[1]?.id || page().blocks[0]?.id;
  selectedEl = null;
  refresh();
}

function pickPreset(key) {
  const p = bldList().find((x) => x.key === key)
    || [...HERO_PRESETS, ...SECTION_PRESETS, ...FOOTER_PRESETS].find((x) => x.key === key);
  if (!p) return;
  const st = bldStep();

  /* ①：雰囲気は1ページに1つ。選び直したら差し替える */
  if (st === 'hero') {
    const old = page().blocks.find((b) => b.type === 'hero' || b.type === 'collage');
    if (old) {
      page().blocks = page().blocks.filter((b) => b.id !== old.id);
      bldNames.delete(old.id);
    }
    const nb = makeBlock(p.type, p.props);
    fillFromBiz(nb);
    bldNames.set(nb.id, p.label);
    const fi = page().blocks.findIndex((b) => b.type === 'footer');
    page().blocks.splice(fi < 0 ? page().blocks.length : fi, 0, nb);
    spreadPhotos();
    selected = nb.id;
    selectedEl = null;
    refresh();
    return refreshBld();
  }

  /* ③：いま見ている項目の形だけを、その場で入れ替える（位置は動かさない） */
  const n = nowNeed();
  if (st === 'shape' && n) {
    const oldId = bldNeedBlock.get(n.key);
    const at = page().blocks.findIndex((b) => b.id === oldId);
    const nb = makeBlock(p.type, p.props);
    fillFromBiz(nb);
    bldNames.set(nb.id, p.label);
    if (at >= 0) { page().blocks.splice(at, 1, nb); bldNames.delete(oldId); }
    else page().blocks.splice(Math.max(1, page().blocks.length - 1), 0, nb);
    bldNeedBlock.set(n.key, nb.id);
    spreadPhotos();
    selected = nb.id;
    selectedEl = null;
    refresh();
    refreshBld();
  }
}

/* 写真の枠を、上のブロックから順に埋めていく。
   ①で選んだ写真を先に使い、足りなくなったら業種に合わせた仮の絵にする。
   空の枠に「IMAGE」と出ているページは作りかけにしか見えず、そこで
   手が止まる。写真が1枚も無くても、形が見えている状態にする。

   すでに人が入れた写真には触らない（仮の絵と、①で選んだ写真だけ入れ替える）。 */
function spreadPhotos() {
  const ind = (state.biz && state.biz.ind) || 'company';
  const mine = new Set(bldPhotos);
  let i = 0, k = 0;
  page().blocks.forEach((b) => {
    imageSlots(b).forEach((slot) => {
      const cur = getPath(b.props, slot);
      if (cur && !isSampleArt(cur) && !mine.has(cur)) return;   // 人が入れたものは残す
      if (i < bldPhotos.length) setPath(b.props, slot, bldPhotos[i++]);
      else setPath(b.props, slot, sampleArt(ind, k++));
    });
  });
}

function bldUndo() {
  if (bldStep() === 'shape' && bldShapeI > 0) { bldShapeI -= 1; return refreshBld(); }
  bldI = Math.max(0, bldI - 1);
  if (bldStep() === 'shape') bldShapeI = Math.max(0, shapeQueue().length - 1);
  refreshBld();
}

/* ---------------- ① ビジネス情報 ---------------- */
const BIZ_FIELDS = [['bizName', 'name'], ['bizTel', 'tel'], ['bizMail', 'email'],
  ['bizAddr', 'address'], ['bizHours', 'hours']];

function renderBldInds() {
  const cur = state.biz && state.biz.ind;
  $('#bldInds').innerHTML = INDUSTRIES.map((i) =>
    `<button data-ind="${esc(i.key)}"${i.key === cur ? ' class="on"' : ''}><b>${i.icon}</b>${esc(i.label)}</button>`).join('');
}

$('#bldInds').addEventListener('click', (e) => {
  const k = e.target.closest('button')?.dataset.ind;
  if (!k) return;
  state.biz = Object.assign({}, state.biz, { ind: k });
  /* 写真がまだ無いうちは、業種の色に寄せる。あとで写真を入れたら
     そちらから作り直すので、ここで決めた色は残らない */
  if (!bldPhotos.length) { state.theme = themeFromIndustry(state.theme, k); applyTone(); }
  renderBldInds();
  spreadPhotos();     // 仮の絵も、その業種のものに描き直す
  applyBiz();
});
$('#bldFinish').addEventListener('input', (e) => {
  const f = BIZ_FIELDS.find(([id]) => e.target.id === id);
  if (!f) return;
  state.biz = Object.assign({}, state.biz, { [f[1]]: e.target.value.trim() });
  applyBiz();
});

/* 入れてもらった情報を、いま置いてあるブロックに反映する。
   名前はヘッダーとフッターに出るので、打っているそばから見える。 */
function applyBiz() {
  const z = state.biz || {};
  if (z.name) {
    state.meta.title = z.name;
    page().blocks.forEach((b) => {
      if (b.type === 'header' || b.type === 'footer') b.props.logo = z.name;
    });
  }
  page().blocks.forEach(fillFromBiz);
  refresh();
}

/* 1つのブロックに、分かっている情報を入れる。
   すでに人が書き替えたところは触らない（初期値のときだけ入れる）。 */
function fillFromBiz(b) {
  const z = state.biz || {};
  const def = BLOCKS[b.type].defaults;
  const put = (key, val) => {
    if (!val) return;
    if (b.props[key] === undefined) return;
    if (b.props[key] !== def[key]) return;   // 人が直したものは残す
    b.props[key] = val;
  };
  if (b.type === 'header' || b.type === 'footer') put('logo', z.name);
  if (b.type === 'contact') {
    put('tel', z.tel); put('email', z.email); put('address', z.address); put('hours', z.hours);
  }
  /* フッターは連絡先の欄を持たず、まとまった文章1つで見せる。
     型を選ぶと見本の文章が入るので、それも「まだ書き替えていない」
     ものとして扱い、分かっている住所と営業時間に置きかえる。 */
  if (b.type === 'footer' && (z.address || z.hours)) {
    const sample = new Set([def.text, ...FOOTER_PRESETS.map((x) => x.props.text).filter(Boolean)]);
    if (sample.has(b.props.text)) b.props.text = [z.hours, z.address].filter(Boolean).join('\n');
  }
  /* 業種を選んでいれば、ヒーローと紹介の文章をその業種のものにする */
  const ind = z.ind && INDUSTRIES.find((i) => i.key === z.ind);
  if (!ind) return;
  const c = ind.copy(z.name || 'お店の名前');
  if (b.type === 'hero') {
    put('eyebrow', c.hero.eyebrow); put('title', c.hero.title); put('text', c.hero.text);
  }
  if (b.type === 'about') { put('title', c.about.title); put('body', c.about.body); }
  if (b.type === 'features' && JSON.stringify(b.props.items) === JSON.stringify(def.items)) {
    b.props.items = clone(c.features);
  }
}

/* ---------------- ② 写真 ---------------- */
const bldPicker = document.createElement('input');
bldPicker.type = 'file';
bldPicker.accept = 'image/*';
bldPicker.multiple = true;

$('#bldPick').addEventListener('click', () => bldPicker.click());
bldPicker.addEventListener('change', async () => {
  const files = [...bldPicker.files].filter((f) => f.type.startsWith('image/'));
  bldPicker.value = '';
  if (!files.length) return;
  flash('写真を読み込んでいます…');
  for (const f of files) {
    try { bldPhotos.push(await toDataURL(f)); } catch { /* 読めない1枚は飛ばす */ }
  }
  $('#bldThumbs').innerHTML = bldPhotos.map((src) => `<img src="${esc(src)}" alt="">`).join('');
  $('#bldPickSub').textContent = `${bldPhotos.length}枚。この先のブロックにも順に入ります`;
  /* 写真に合わせて配色も寄せる。色をあとから選び直す手間を1つ減らす */
  try { state.theme = await paletteFromPhotos(state.theme, bldPhotos); applyTone(); } catch { /* 色は元のまま */ }
  spreadPhotos();
  refresh();
  refreshBld();
  flash(`${bldPhotos.length}枚を入れました`);
});

/* ---------------- ④ 仕上げ ---------------- */
$('#bldFinish').addEventListener('click', (e) => {
  const k = e.target.closest('[data-fin]')?.dataset.fin;
  if (!k) return;
  finishBuild();
  if (k === 'color') { switchTab('design'); if (isMobile()) openSheet('right', 'design'); }
  else if (k === 'anim') { switchTab('design'); if (isMobile()) openSheet('right', 'design'); flash('「動き」の欄で、出かたと速さを変えられます'); }
  else {
    switchTab('edit');
    if (isMobile()) openSheet('right', 'edit');
    flash('プレビューの写真をクリックすると、大きさと位置を直せます');
  }
});

function finishBuild() {
  bldBefore = null;
  closeModal('#buildModal');
  if (isMobile()) closeSheets();
  refresh();
  resetHistory();     // 組み上げたところを起点にする
}

function openBuild(fresh) {
  bldBefore = state ? clone(state) : null;

  bldPhotos = [];
  bldI = 0;
  bldShapeI = 0;
  bldNames.clear();
  bldNeedBlock.clear();
  bldNeeds = NEEDS.filter((n) => n.on).map((n) => n.key);   // よく要るものは最初から付けておく
  if (fresh || !state) state = buildCustomState();
  selected = page().blocks[0].id;
  selectedEl = null;
  closed.clear();
  $('#bldThumbs').innerHTML = '';
  $('#bldPickSub').textContent = '入れなくても大丈夫です。業種に合わせた仮の絵が入ります';
  BIZ_FIELDS.forEach(([id, key]) => { $(`#${id}`).value = (state.biz && state.biz[key]) || ''; });
  $('#bizMore').open = false;
  renderBldInds();
  renderNeeds();
  closeModal('#tplModal');
  closeModal('#easyModal');
  refresh();
  openModal('#buildModal');
  refreshBld();
}
const openBuildFlow = () => openBuild(true);

$('#tplToBuild').addEventListener('click', openBuildFlow);
$('#tplToEasy').addEventListener('click', openEasy);
$('#bldBack').addEventListener('click', bldUndo);
$('#bldCancel').addEventListener('click', () => {
  if (bldBefore) { state = bldBefore; selected = page().blocks[1]?.id || page().blocks[0]?.id; }
  bldBefore = null;
  selectedEl = null;
  closeModal('#buildModal');
  refresh();
});
/* ③は「いまの形のままでいい」で飛ばせる */
$('#bldSkip').addEventListener('click', () => bldNext(true));
$('#bldDone').addEventListener('click', () => bldNext(false));

function bldNext(skipAll) {
  const st = bldStep();
  if (st === 'hero') { bldI += 1; return refreshBld(); }
  if (st === 'needs') {
    applyNeeds();
    bldShapeI = 0;
    /* かたちを選ぶものが1つも無ければ、③は素通りする */
    bldI += shapeQueue().length ? 1 : 2;
    return refreshBld();
  }
  if (st === 'shape') {
    const q = shapeQueue();
    if (!skipAll && bldShapeI < q.length - 1) { bldShapeI += 1; return refreshBld(); }
    bldI += 1;
    return refreshBld();
  }
  finishBuild();
  const n = page().blocks.filter((b) => b.type !== 'header' && b.type !== 'footer').length;
  flash(`${n}段のページを組みました。ここから中身を書き替えられます`);
}

let askBeforeSwitch = false; // 起動直後の選択では確認しない

$('#btnTemplates').addEventListener('click', () => {
  askBeforeSwitch = true;
  renderTplGrid(); openModal('#tplModal');
});
$('#tplClose').addEventListener('click', () => closeModal('#tplModal'));
function pickTemplate(k) {
  if (askBeforeSwitch && !confirm('テンプレートを切り替えると、いまの内容は置きかわります。よろしいですか？')) return;
  state = buildState(k);
  selected = page().blocks[1]?.id || page().blocks[0]?.id;
  selectedEl = null;
  closed.clear();
  closeModal('#tplModal');
  refresh();
  resetHistory();     // テンプレートを選び直したらそこを起点にする
  flash(`「${TEMPLATES[k].name}」を読み込みました`);
}

/* ================================================================
   書き出し / コード表示 / リセット / 画面幅
   ================================================================ */
$('#btnExport').addEventListener('click', () => {
  const files = siteFiles(false);
  /* 1枚ならこれまでどおり index.html だけ。2枚以上のときは、
     続けてダウンロードさせようとすると2つ目以降で端末が止めるので、
     ZIPにまとめて1回で渡す。置き場所への持ち込みもZIPのほうが早い */
  const many = files.length > 1;
  const blob = many
    ? makeZip(files.map((f) => ({ name: f.name, text: f.html })))
    : new Blob([files[0].html], { type: 'text/html;charset=utf-8' });
  const name = many
    ? `${(state.meta.title || 'mysite').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 24)}.zip`
    : 'index.html';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  /* このHTMLが控えも兼ねていることは、伝えないと気づけない */
  flash(many
    ? `${name} を書き出しました（${files.length}ページ）。中の index.html を開けば続きから編集できます`
    : 'index.html を書き出しました。このファイルを開けば続きから編集できます');
});
/* ================================================================
   公開する

   ここが対象の利用者にとって最後の、そしていちばん高い壁になる。
   「HTMLを書き出しました」で放り出すと、その先に進めない。

   ただし本当のワンタップ公開には、こちら側のサーバーが要る。
   持たない方針なので、代わりに公開先まで手を引いて連れて行く。
   手順は文章で説明するのではなく、1手ずつ画面に出して、
   押すボタンをその場に置く。
   ================================================================ */
const HOSTS = [
  {
    key: 'netlify', name: 'Netlify Drop', tag: 'いちばん簡単',
    about: 'フォルダを放り込むだけで、すぐアドレスがもらえます。無料。',
    steps: (name) => [
      { t: 'いまのページを書き出します。',
        s: `${name} という名前のフォルダを作って、その中に入れてください。`,
        btn: 'HTMLを書き出す', act: 'export' },
      { t: 'Netlify Drop を開きます。',
        s: '登録なしで試せます（続けて使うにはあとで無料の登録が要ります）。',
        btn: 'Netlify Drop を開く', act: 'open', url: 'https://app.netlify.com/drop' },
      { t: 'さきほどのフォルダを、画面の枠に放り込みます。',
        s: 'ファイル1つではなく、フォルダごと放り込んでください。' },
      { t: 'アドレスが出たら公開できています。',
        s: '「〇〇.netlify.app」のような形です。次の画面で控えます。' },
    ],
  },
  {
    key: 'github', name: 'GitHub Pages', tag: '',
    about: '無料。手数は少し多いですが、あとから更新しやすい形です。',
    steps: () => [
      { t: 'いまのページを書き出します。',
        s: 'ファイル名は index.html のままにしてください。',
        btn: 'HTMLを書き出す', act: 'export' },
      { t: 'GitHub でリポジトリを1つ作ります（Public）。',
        s: '登録が要ります。名前がそのままアドレスの一部になります。',
        btn: 'リポジトリを作る', act: 'open', url: 'https://github.com/new' },
      { t: '書き出した index.html をアップロードします。',
        s: 'リポジトリの画面で「Add file」→「Upload files」。' },
      { t: 'Settings → Pages で、Source を「Deploy from a branch」、フォルダを「/ (root)」にして Save。',
        s: '数分で https://ユーザー名.github.io/リポジトリ名/ に出ます。' },
    ],
  },
  {
    key: 'server', name: 'いま持っているサーバー', tag: '',
    about: 'レンタルサーバーや会社のサーバーに、すでに置き場所がある場合。',
    steps: () => [
      { t: 'いまのページを書き出します。',
        s: 'ファイル名は index.html のままにしてください。',
        btn: 'HTMLを書き出す', act: 'export' },
      { t: 'FTPソフトや管理画面から、公開フォルダに置きます。',
        s: 'public_html / htdocs / www などの名前のフォルダです。' },
      { t: 'ブラウザでアドレスを開いて、表示されるか確かめます。',
        s: '画像も文字もこの1ファイルに入っているので、他に上げるものはありません。' },
    ],
  },
];

/* ---------------- そのまま公開する（Firebase 経由） ----------------
   ここだけが唯一の通信で、あとは今までどおり手元で完結している。
   設定が空なら、この道は選択肢に出さない。 */
const cloudReady = () => typeof PUBLISH === 'object' && !!PUBLISH.endpoint;

async function postSite(files) {
  let r;
  try {
    r = await fetch(PUBLISH.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: state.meta.siteId || '',
        editToken: state.meta.editToken || '',
        title: state.meta.title || '',
        /* ページが1枚のときは html だけ送る。前からある受け口を
           そのまま使えるので、古い版の受け口でも公開できる */
        ...(files.length === 1 ? { html: files[0].html }
                               : { pages: files.map((f) => ({ path: f.path, html: f.html })) }),
      }),
    });
  } catch {
    /* 通信できないときのブラウザの言い分は英語で出る。
       そのまま見せても何をすればいいか分からないので、言い換える。 */
    throw new Error('つながりませんでした。電波の入るところでもう一度お試しください');
  }
  let j = {};
  try { j = await r.json(); } catch { /* 下で扱う */ }
  if (!r.ok) throw new Error(j.error || `公開できませんでした（${r.status}）`);
  return j;
}

async function publishToCloud() {
  const first = !state.meta.siteId;
  let res = await postSite(siteFiles(true));

  state.meta.siteId = res.siteId;
  if (res.editToken) state.meta.editToken = res.editToken;
  state.meta.siteUrl = res.url;

  /* 初回はアドレスが決まる前に送っているので、canonical が入っていない。
     決まったアドレスを入れて、もう一度だけ送り直す。 */
  if (first) { try { await postSite(siteFiles(true)); } catch { /* 中身は載っているので続行 */ } }

  save('publish');
  return res.url;
}

let pubStep = 1;
let pubHost = null;
let pubBusy = false;

function renderPub() {
  $('#pubDots').innerHTML = [1, 2, 3].map((i) => `<i class="${i <= pubStep ? 'on' : ''}"></i>`).join('');
  $('#pubStep1').hidden = pubStep !== 1;
  $('#pubStep2').hidden = pubStep !== 2;
  $('#pubStep3').hidden = pubStep !== 3;
  $('#pubBack').hidden = pubStep === 1;
  $('#pubNext').hidden = pubStep === 1;

  if (pubStep === 1) {
    $('#pubTitle').textContent = 'どこに公開しますか？';
    $('#pubSub').textContent = 'はじめてなら、いちばん上をおすすめします。';
    const cloud = cloudReady() ? [`<button data-host="cloud">
      <b>このまま公開する<em>おすすめ</em></b>
      <small>押すだけで終わります。登録も、ファイルの置き場所も要りません。</small></button>`] : [];
    $('#pubHosts').innerHTML = cloud.concat(HOSTS.map((h) => `<button data-host="${esc(h.key)}">
      <b>${esc(h.name)}${h.tag ? `<em>${esc(h.tag)}</em>` : ''}</b>
      <small>${esc(h.about)}</small></button>`)).join('');
  } else if (pubStep === 2) {
    const h = HOSTS.find((x) => x.key === pubHost);
    const folder = (state.meta.title || 'mysite').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 24);
    $('#pubTitle').textContent = h.name;
    $('#pubSub').textContent = '上から順に進めてください。';
    $('#pubGuide').innerHTML = h.steps(folder).map((s) => `<li>${esc(s.t)}
      ${s.s ? `<small>${esc(s.s)}</small>` : ''}
      ${s.btn ? `<button class="tb-btn" data-act="${esc(s.act)}"${s.url ? ` data-url="${esc(s.url)}"` : ''}>${esc(s.btn)}</button>` : ''}
    </li>`).join('');
    $('#pubNext').textContent = '公開できた';
  } else {
    /* こちらで預かっているサイトは、住所も更新も自動。
       自分で置いた人は、住所を手で控えてもらう。 */
    const mine = !!state.meta.siteId;
    $('#pubTitle').textContent = '公開できました';
    $('#pubSub').textContent = '';
    $('#pubUrl').hidden = mine;
    $('.pub-note').hidden = mine;
    $('#pubUrl').value = state.meta.siteUrl || '';
    $('#pubNext').textContent = mine ? '閉じる' : '保存して閉じる';
    renderPubLive();
  }
}

function renderPubLive() {
  const u = state.meta.siteUrl;
  const box = $('#pubLive');
  box.hidden = !u;
  if (!u) return;
  const mine = !!state.meta.siteId;
  box.innerHTML = `<b>あなたのホームページ</b>
    <a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>
    <div class="pub-acts">
      <button class="tb-btn" id="pubCopy">アドレスをコピー</button>
      <button class="tb-btn" id="pubOpen">開いてみる</button>
      ${mine ? '<button class="tb-btn primary" id="pubAgain">直したので更新する</button>' : ''}
    </div>
    ${mine ? '<small>更新すると、同じアドレスのまま中身だけ入れ替わります。</small>'
           : '<small>次に直したときは、また書き出して同じ場所に上書きしてください。</small>'}`;

  $('#pubCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(u); flash('アドレスをコピーしました'); }
    catch { flash('コピーできませんでした。長押しで選んでください'); }
  });
  $('#pubOpen').addEventListener('click', () => open(u, '_blank', 'noopener'));
  const again = $('#pubAgain');
  if (again) {
    again.addEventListener('click', async () => {
      if (pubBusy) return;
      pubBusy = true;
      again.disabled = true;
      again.textContent = '更新しています…';
      try { await publishToCloud(); flash('更新しました'); }
      catch (err) { flash(String(err.message || err)); }
      finally { pubBusy = false; renderPub(); }
    });
  }
}

function openPublish() {
  pubStep = state.meta.siteUrl ? 3 : 1;
  pubHost = null;
  renderPub();
  openModal('#pubModal');
}

$('#btnPublish').addEventListener('click', openPublish);
$('#pubClose').addEventListener('click', () => closeModal('#pubModal'));
$('#pubBack').addEventListener('click', () => {
  pubStep = Math.max(1, pubStep - 1);
  renderPub();
});
$('#pubHosts').addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  const k = b?.dataset.host;
  if (!k || pubBusy) return;

  if (k === 'cloud') {
    pubBusy = true;
    b.disabled = true;
    const label = b.querySelector('b');
    const was = label.innerHTML;
    label.textContent = '公開しています…';
    try {
      await publishToCloud();
      pubStep = 3;
      renderPub();
      flash('公開しました');
    } catch (err) {
      label.innerHTML = was;
      b.disabled = false;
      flash(String(err.message || err));
    } finally {
      pubBusy = false;
    }
    return;
  }

  pubHost = k;
  pubStep = 2;
  renderPub();
});
$('#pubGuide').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.act === 'export') $('#btnExport').click();
  if (b.dataset.act === 'open') open(b.dataset.url, '_blank', 'noopener');
});
$('#pubNext').addEventListener('click', () => {
  if (pubStep === 2) { pubStep = 3; renderPub(); return; }
  const u = $('#pubUrl').value.trim();
  if (u && !/^https?:\/\//i.test(u)) { flash('https:// から始まるアドレスを入れてください'); return; }
  state.meta.siteUrl = u;
  save('siteUrl');
  renderPage();
  renderPreview(true);
  closeModal('#pubModal');
  flash(u ? '公開先を覚えました' : '閉じました');
});

/* ---------------- 書き出したHTMLを開いて続きから ---------------- */
const htmlPicker = document.createElement('input');
htmlPicker.type = 'file';
htmlPicker.accept = 'text/html,.html,.htm';

async function openSiteFile(file) {
  if (!file) return;
  let s = null;
  try {
    s = stateFromHTML(await file.text());
  } catch { /* 下のメッセージへ */ }
  if (s === 'sub') {
    flash('これは2ページ目以降のファイルです。index.html を読み込んでください');
    return;
  }
  if (!s) {
    flash('このHTMLはこのツールで作ったものではないようです');
    return;
  }
  if (!confirm('読み込むと、いまの内容は置きかわります。よろしいですか？')) return;
  state = migrate(s);
  pageIdx = 0;
  selected = page().blocks[1]?.id || page().blocks[0]?.id;
  selectedEl = null;
  closed.clear();
  closeModal('#easyModal');
  closeModal('#tplModal');
  closeModal('#buildModal');
  if (isMobile()) closeSheets();
  refresh();
  resetHistory();
  flash(`「${state.meta.title}」を読み込みました`);
}

$('#btnOpen').addEventListener('click', () => htmlPicker.click());
$('#ezOpen').addEventListener('click', () => htmlPicker.click());
htmlPicker.addEventListener('change', () => {
  const f = htmlPicker.files[0];
  htmlPicker.value = '';
  openSiteFile(f);
});

/* 画面にHTMLを放り込んでも開ける（パソコン）。
   写真は画像枠が受け取るので、ここではHTMLだけを相手にする。 */
addEventListener('dragover', (e) => {
  if ([...e.dataTransfer.items].some((i) => i.kind === 'file')) e.preventDefault();
});
addEventListener('drop', (e) => {
  const f = [...(e.dataTransfer.files || [])]
    .find((x) => /\.html?$/i.test(x.name) || x.type === 'text/html');
  if (!f) return;
  e.preventDefault();
  openSiteFile(f);
});

$('#btnCode').addEventListener('click', () => { $('#codeArea').value = fullHTML(); openModal('#codeModal'); });
$('#codeClose').addEventListener('click', () => closeModal('#codeModal'));
$('#codeCopy').addEventListener('click', async () => {
  const ta = $('#codeArea');
  try { await navigator.clipboard.writeText(ta.value); } catch (e) { ta.select(); document.execCommand('copy'); }
  flash('コピーしました');
});
$('#btnReset').addEventListener('click', () => {
  if (!confirm('編集した内容をすべて消して、テンプレート選択に戻ります。よろしいですか？')) return;
  localStorage.removeItem(STORE_KEY);
  location.reload();
});
/* ================================================================
   プレビューの幅（PC / タブレット / スマホ）

   欲しい幅が画面より広いときは、そのままでは出せない。iframe を
   「欲しい幅」で作ったうえで、外から縮めて見せる。中の CSS は
   欲しい幅で組まれるので、スマホからでも PC の並びをそのまま確かめられる。
   逆に PC からスマホ幅にするのは、ただ細くするだけで足りる。
   ================================================================ */
let devW = 1280;

function applyDevice() {
  const stage = $('#stage'), fit = $('#fit'), frame = $('#frame');
  if (!stage || !fit || !frame) return;
  const cs = getComputedStyle(stage);
  const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (availW <= 0 || availH <= 0) return;
  /* 縮めるのは入りきらないときだけ。広い画面で引き伸ばすと粗くなる。
     ほんの少し足りないだけ（1割ほど）なら、縮めずに枠のほうを詰める。
     スマホでスマホ幅を出すたびに「95%」と出ても、意味がない */
  const w = availW < devW && availW > devW * 0.88 ? availW : devW;
  const k = Math.min(1, availW / w);
  const h = Math.max(320, Math.round(availH / k));
  frame.style.width = `${Math.round(w)}px`;
  frame.style.height = `${h}px`;
  frame.style.transform = k < 1 ? `scale(${k.toFixed(4)})` : '';
  fit.style.width = `${Math.round(w * k)}px`;
  fit.style.height = `${Math.round(h * k)}px`;
  const z = $('#devZoom');
  if (z) {
    /* 縮めているときは、そのことを出す。出さないと「文字が小さい」と
       誤解される（実物と見え方が違う理由が分からない） */
    z.hidden = k >= 0.999;
    z.textContent = `${Math.round(k * 100)}%`;
  }
}

function setDevice(w) {
  devW = w;
  $$('#devices button').forEach((x) => x.classList.toggle('on', +x.dataset.w === w));
  applyDevice();
}

$('#devices').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  setDevice(+b.dataset.w);
});
addEventListener('resize', applyDevice);
/* 最初は、いま見ている端末に合わせる。スマホで開いていきなり PC 幅だと、
   何が起きたのか分からない。
   （isMobile はこの下で宣言しているので、ここでは同じ条件を直に書く） */
setDevice(matchMedia('(max-width:820px)').matches ? 390 : 1280);
$$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) m.hidden = true; }));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal').forEach((m) => (m.hidden = true)); });

/* ================================================================
   まとめて再描画
   ================================================================ */
function select(id) { selected = id; renderList(); renderEditor(); highlight(); }
function refresh() { renderList(); renderEditor(); renderDesign(); renderPage(); renderPreview(true); save(); }

/* ================================================================
   スマホ表示（下から出るシート＋下部ナビ）
   ================================================================ */
const isMobile = () => matchMedia('(max-width:820px)').matches;

function openSheet(which, tabTo) {
  if (!isMobile()) { if (tabTo) switchTab(tabTo); return; }
  const target = which === 'left' ? $('#panelLeft') : $('#panelRight');
  const other = which === 'left' ? $('#panelRight') : $('#panelLeft');
  other.classList.remove('open');
  if (tabTo) switchTab(tabTo);

  const already = target.classList.contains('open');
  target.classList.toggle('open', !already);
  toggleVeil(!already);
  $$('#mnav button[data-sheet]').forEach((b) =>
    b.classList.toggle('on', !already && b.dataset.sheet === which &&
      (!b.dataset.tabTo || b.dataset.tabTo === tabTo)));
}
function closeSheets() {
  $('#panelLeft').classList.remove('open');
  $('#panelRight').classList.remove('open');
  toggleVeil(false);
  $$('#mnav button').forEach((b) => b.classList.remove('on'));
}
function toggleVeil(show) {
  const v = $('#veil');
  if (show) { v.hidden = false; requestAnimationFrame(() => v.classList.add('show')); }
  else { v.classList.remove('show'); setTimeout(() => { v.hidden = true; }, 220); }
}
function switchTab(name) {
  $$('.tabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === name));
  ['edit', 'design', 'page'].forEach((t) => { $(`#tab-${t}`).hidden = t !== name; });
}

$('#mnav').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.sheet) openSheet(b.dataset.sheet, b.dataset.tabTo);
  else if (b.id === 'mAdd') { closeSheets(); openAddGallery(); }
  else if (b.id === 'mPublish') { closeSheets(); openPublish(); }
});
$('#veil').addEventListener('click', closeSheets);
$$('[data-closesheet]').forEach((b) => b.addEventListener('click', closeSheets));
addEventListener('resize', () => { if (!isMobile()) closeSheets(); });

/* ---------------- 起動 ---------------- */
(async function start() {
  await initPreview();
  const saved = load();
  if (saved) {
    state = saved;
    selected = page().blocks[1]?.id || page().blocks[0]?.id;
    refresh();
    resetHistory();
  } else {
    /* 初回はかんたんモードを正面に出す。
       テンプレート一覧は、そこから「テンプレートから選ぶ」で行ける。 */
    state = buildState('corporate');
    selected = page().blocks[1].id;
    refresh();
    resetHistory();
    openEasy();
  }
})();
