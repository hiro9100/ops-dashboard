/* ================================================================
   かんたんHP作成ツール — 編集画面のロジック
   state（サイトのデータ）→ HTML生成 → プレビュー / 書き出し
   ================================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const STORE_KEY = 'hp-builder-v1';

let state = null;      // { template, meta, theme, blocks:[{id,type,props}] }
let selected = null;   // 編集中のブロックID
let selectedEl = null; // 編集中の要素 {role, kind, name}
let uidSeq = 0;
const DEFAULT_MOTION = { anim: 'fadeup', dur: 900, stagger: 40, ease: 'cubic-bezier(.2,.7,.3,1)', reveal: true };
const uid = () => `b${Date.now().toString(36)}${(uidSeq++).toString(36)}`;
const closed = new Set(); // 折りたたんでいる繰り返し項目

/* ---------------- データの組み立て ---------------- */
const clone = (o) => JSON.parse(JSON.stringify(o));

function makeBlock(type, override = {}) {
  return { id: uid(), type, props: Object.assign(clone(BLOCKS[type].defaults), clone(override)) };
}

function buildState(tplKey) {
  const t = TEMPLATES[tplKey];
  return {
    template: tplKey,
    meta: {
      title: t.blocks[0]?.props?.logo || 'My Website',
      description: 'このサイトの説明を入れてください。検索結果やSNSでの共有時に表示されます。',
      lang: 'ja',
    },
    theme: clone(t.theme),
    style: t.style || '',
    motion: clone(DEFAULT_MOTION),
    blocks: t.blocks.map((b) => makeBlock(b.type, b.props)),
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
  if (!state.blocks.some((b) => b.id === selected)) {
    selected = state.blocks[1]?.id || state.blocks[0]?.id || null;
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
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // 知らないブロックが混ざっていたら捨てる（定義を消した時の保険）
    s.blocks = (s.blocks || []).filter((b) => BLOCKS[b.type]);
    s.motion = Object.assign(clone(DEFAULT_MOTION), s.motion || {}); // 旧データ対策
    if (s.style === undefined) s.style = (TEMPLATES[s.template] || {}).style || '';
    return s.blocks.length ? s : null;
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
const bodyClass = () => `tpl-${state.template}${state.style ? ` sty-${state.style}` : ''}`;

const bodyHTML = () => state.blocks.map((b) => BLOCKS[b.type].render(b.props)).join('\n\n');

/* 書き出し時は編集画面専用の属性を取り除く（動作に必要な data-ta/-ia/-anim/-delay は残す） */
const exportBody = () => bodyHTML().replace(/ data-(?:el|elname|elkind|prop)="[^"]*"/g, '');

/* 書き出し用の完成HTML（1ファイルで動く） */
function fullHTML() {
  const m = state.meta;
  return `<!DOCTYPE html>
<html lang="${esc(m.lang || 'ja')}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.description)}">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${esc(m.description)}">
<meta property="og:type" content="website">
<style>
${themeCSS(state.theme)}
${SITE_CSS}
</style>
</head>
<body class="${esc(bodyClass())}" data-anim="${esc(state.motion.anim)}" data-reveal="${state.motion.reveal ? 1 : 0}">

${exportBody()}

<script>${SITE_JS}<\/script>
</body>
</html>`;
}

/* ================================================================
   プレビュー
   ================================================================ */
const PREVIEW_CSS = `
[data-bid]{position:relative;transition:outline-color .15s}
[data-bid]{outline:2px solid transparent;outline-offset:-2px}
[data-bid]:hover{outline-color:rgba(76,141,255,.45);cursor:pointer}
[data-bid].__sel{outline-color:#4c8dff}

/* クリックできる要素 */
[data-el]{position:relative;outline:1px dashed transparent;outline-offset:3px;
  transition:outline-color .12s}
[data-el]:hover{outline-color:rgba(76,141,255,.85);cursor:pointer}
[data-el].__elsel{outline:2px solid #4c8dff;outline-style:solid}
[data-el]:hover::after,[data-el].__elsel::after{
  content:attr(data-elname);position:absolute;top:2px;left:2px;z-index:20;
  background:#4c8dff;color:#fff;border-radius:4px;padding:1px 7px;pointer-events:none;
  font:700 10px/1.7 -apple-system,"Hiragino Sans",sans-serif;letter-spacing:.04em;white-space:nowrap}
[data-elkind="ia"]:hover::after,[data-elkind="ia"].__elsel::after{background:#8b5cf6}
[data-elkind="ia"]:hover{outline-color:rgba(139,92,246,.85)}
[data-elkind="ia"].__elsel{outline-color:#8b5cf6}

/* ダブルクリックで直接編集できる場所 */
[data-prop]{position:relative;outline:1px dashed transparent;outline-offset:3px;
  transition:outline-color .12s}
[data-prop]:hover{outline-color:rgba(76,141,255,.85);cursor:text}
[data-prop]:hover::after{
  content:attr(data-elname) " ✎";position:absolute;top:2px;left:2px;z-index:20;
  background:#4c8dff;color:#fff;border-radius:4px;padding:1px 7px;pointer-events:none;
  font:700 10px/1.7 -apple-system,"Hiragino Sans",sans-serif;letter-spacing:.04em;white-space:nowrap}

/* 画像を差し替えられる枠 */
[data-imgprop]{position:relative;cursor:pointer}
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
        const blk = e.target.closest('[data-bid]');
        if (!blk) return;
        const elt = e.target.closest('[data-el]');
        if (elt) selectEl(blk.dataset.bid, elt.dataset.el, elt.dataset.elkind, elt.dataset.elname, elt.dataset.prop);
        else { selectedEl = null; select(blk.dataset.bid); }

        /* 画像枠なら、そのまま端末の画像選択を開く */
        const slot = e.target.closest('[data-imgprop]');
        if (slot) openImagePicker(blk.dataset.bid, slot.dataset.imgprop);
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

let pvTimer;
function renderPreview(now = false) {
  if (editing) return;   // 直接編集の最中に作り直すと入力が消えるので触らない
  clearTimeout(pvTimer);
  const run = () => {
    if (!pdoc) return;
    pdoc.getElementById('s-theme').textContent = themeCSS(state.theme);
    pdoc.body.className = bodyClass();
    pdoc.body.setAttribute('data-anim', state.motion.anim);
    pdoc.body.setAttribute('data-reveal', state.motion.reveal ? '1' : '0');
    pdoc.body.innerHTML = bodyHTML();
    // 生成されたトップレベル要素とブロックを対応づける（クリックで選択できるように）
    [...pdoc.body.children].forEach((el, i) => {
      const b = state.blocks[i];
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
  const b = state.blocks.find((x) => x.id === blockId);
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

  const b = state.blocks.find((x) => x.id === blockId);
  const val = cancel ? raw : typed;
  if (b && val !== raw) {
    setPath(b.props, prop, val);
    renderList(); renderEditor(); save(`i:${prop}:${blockId}`);
  }
  renderPreview(true);
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
function renderList() {
  const wrap = $('#blockList');
  wrap.innerHTML = state.blocks.map((b, i) => {
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
        <button data-act="down" title="下へ"${i === state.blocks.length - 1 ? ' disabled' : ''}>↓</button>
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
  const i = state.blocks.findIndex((b) => b.id === id);
  const act = e.target.closest('button')?.dataset.act;

  if (!act) { selectedEl = null; select(id); scrollToBlock(id); return; }
  if (act === 'up' && i > 0) state.blocks.splice(i - 1, 0, state.blocks.splice(i, 1)[0]);
  if (act === 'down' && i < state.blocks.length - 1) state.blocks.splice(i + 1, 0, state.blocks.splice(i, 1)[0]);
  if (act === 'dup') {
    const c = clone(state.blocks[i]); c.id = uid();
    state.blocks.splice(i + 1, 0, c); selected = c.id;
  }
  if (act === 'del') {
    if (!confirm(`「${BLOCKS[state.blocks[i].type].label}」を削除しますか？`)) return;
    state.blocks.splice(i, 1);
    if (selected === id) selected = state.blocks[Math.min(i, state.blocks.length - 1)]?.id || null;
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
  const lo = state.blocks[0] && state.blocks[0].type === 'header' ? 1 : 0;
  const fi = state.blocks.findIndex((b) => b.type === 'footer');
  const hi = fi >= 0 ? fi : state.blocks.length;
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
    const from = state.blocks.findIndex((b) => b.id === drag.id);
    if (from < 0) return clearDrag();
    if (at > from) at--;                       // 自分を抜いた分だけ詰まる
    if (at !== from) {
      state.blocks.splice(at, 0, state.blocks.splice(from, 1)[0]);
    }
    selected = drag.id;
  } else {
    const nb = makeBlock(drag.type);
    state.blocks.splice(at, 0, nb);
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
const GALLERY_CSS = `
body{margin:0;background:#0d1016;padding:14px;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif}
.gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:14px}
.gc{display:block;width:100%;padding:0;text-align:left;cursor:pointer;position:relative;
  background:#171a21;border:1px solid #2a2f3a;border-radius:12px;overflow:hidden;
  transition:border-color .15s,transform .15s;color:#e7ebf0;font:inherit}
.gc-hit{position:absolute;inset:0;z-index:5}
.gc:hover{border-color:#4c8dff;transform:translateY(-3px)}
.gc-prev{height:176px;overflow:hidden;position:relative;background:var(--c-bg);
  border-bottom:1px solid #2a2f3a}
.gc-scale{width:1180px;transform:scale(.226);transform-origin:top left;
  pointer-events:none;color:var(--c-text);background:var(--c-bg)}
.gc-meta{padding:11px 13px 13px}
.gc-meta b{font-size:13px;display:inline-block;margin-right:7px}
.gc-meta i{font-style:normal;font-size:10px;font-weight:800;color:#9db4ff;
  border:1px solid #33436b;border-radius:4px;padding:1px 6px;vertical-align:1px}
.gc-meta small{display:block;color:#98a2b3;font-size:11px;line-height:1.6;margin-top:5px}

/* --- サンプルの中で、動く前提の見た目を止める --- */
.gc-scale .pinsec{height:auto!important}
.gc-scale .pin-in{position:static;height:640px}
.gc-scale .stackcard{position:static;height:auto;min-height:150px}
.gc-scale .stack{gap:14px}
.gc-scale .clip-box{height:640px}
.gc-scale .clip-b{clip-path:circle(34% at 50% 50%)}
.gc-scale .shift-pane{min-height:640px}
.gc-scale .tl-rail::after{transform:scaleY(.55)}
.gc-scale .tl-item::before{border-color:var(--c-primary);background:var(--c-primary)}
.gc-scale .hs-track{transform:translateX(-40px)}
.gc-scale .sec{padding:44px 0}
.gc-scale .slot{font-size:44px}
.gc-scale [data-ta] .ch,.gc-scale .rv{opacity:1!important;transform:none!important}
`;

function galleryTypes() {
  const exists = new Set(state.blocks.map((b) => b.type));
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
    return `<div class="gc" data-type="${t}" role="button" tabindex="0">
      <span class="gc-hit"></span>
      <div class="gc-prev"><div class="gc-scale">${sample}</div></div>
      <div class="gc-meta"><b>${esc(def.label)}</b>${def.tag ? `<i>${esc(def.tag)}</i>` : ''}
        <small>${esc(def.about || '')}</small></div>
    </div>`;
  }).join('');

  f.srcdoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<style>${themeCSS(state.theme)}\n${SITE_CSS}\n${GALLERY_CSS}</style></head>
<body class="${esc(bodyClass())}"><div class="gg">${cards}</div>
<script>${SITE_JS}<\/script></body></html>`;

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

const SCROLL_ABOUT = {
  none: 'スクロールしても動きません。ふつうのヒーローです。',
  zoomout: '全画面の写真が、スクロールで角の丸い1枚に収まります。',
  parallax: '写真はゆっくり、文字は速く流れて奥行きが出ます。',
  curtain: '閉じた幕が上下に割れて、写真が現れます。',
  maskzoom: '見出しの形に開いた穴が広がり、画面いっぱいの写真になります。',
};

let decoPick = null;

/* kind: 'deco'（装飾）/ 'scroll'（スクロール連動）。
   どちらも「ヒーローを縮めて並べる」点は同じなので、一覧は共通にする。 */
function openDecoGallery(kind, current, onPick) {
  decoPick = onPick;
  const list = kind === 'scroll' ? HERO_SCROLLS : HERO_DECOS;
  const about = kind === 'scroll' ? SCROLL_ABOUT : DECO_ABOUT;
  $('#animTitle').textContent = kind === 'scroll'
    ? 'スクロール連動のしかたを選ぶ' : 'ヒーローの装飾を選ぶ';

  /* 見本は「いま編集中のヒーロー」から作る。文言も写真もそのまま使うので、
     自分のページでどう見えるかが分かる。 */
  const b = state.blocks.find((x) => x.id === selected);
  const base = b && b.type === 'hero' ? b.props
    : (state.blocks.find((x) => x.type === 'hero') || { props: BLOCKS.hero.defaults }).props;

  const cards = list.map(([k, label]) => {
    /* スクロール連動は「途中の1コマ」を静止画で見せる。実際に貼り付けると
       一覧の中では動かせないので、進み具合 --p を決め打ちで入れる。 */
    const props = Object.assign({}, base, { anchor: '', anims: {}, layout: 'cover' },
      kind === 'scroll' ? { scroll: k } : { deco: k });
    const frozen = kind === 'scroll' && k !== 'none'
      ? ' style="--p:.45"' : '';
    return `<div class="dc${k === current ? ' on' : ''}" data-k="${esc(k)}" role="button" tabindex="0">
      <span class="dc-hit"></span>
      <div class="dc-prev"><div class="dc-scale ${esc(bodyClass())}"${frozen}>${BLOCKS.hero.render(props)}</div></div>
      <div class="dc-meta"><b>${esc(label)}</b><small>${esc(about[k] || '')}</small></div>
    </div>`;
  }).join('');

  $('#animFrame').srcdoc = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">
<style>${themeCSS(state.theme)}\n${SITE_CSS}\n${DECO_GAL_CSS}</style></head>
<body class="${esc(bodyClass())}"><div class="dg">${cards}</div>
<script>${SITE_JS}<\/script><script>${DECO_GAL_JS}<\/script></body></html>`;
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
  let at = state.blocks.findIndex((b) => b.id === selected) + 1;
  if (!at) at = state.blocks.length;
  const fi = state.blocks.findIndex((b) => b.type === 'footer');
  if (type !== 'footer' && fi >= 0 && at > fi) at = fi;   // フッターより下には入れない
  if (type === 'header') at = 0;
  if (type === 'footer') at = state.blocks.length;
  state.blocks.splice(at, 0, nb);
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
  renderGallery();
  openModal('#addModal');
}
$('#btnAdd').addEventListener('click', openAddGallery);
$('#addClose').addEventListener('click', () => closeModal('#addModal'));
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
    case 'image':
      return `<div class="img-f">
        <input type="text" ${p} value="${esc(val ?? '')}" placeholder="https://... または端末から選択">
        <button class="pick" data-pick="${path}">画像を選ぶ</button>
      </div>${val ? `<img class="img-thumb" src="${esc(val)}" alt="">` : ''}`;
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

function renderEditor() {
  const box = $('#tab-edit');
  const b = state.blocks.find((x) => x.id === selected);
  if (!b) {
    box.innerHTML = `<div class="empty">左の一覧、またはプレビューを<br>クリックしてブロックを選んでください。</div>`;
    return;
  }
  const def = BLOCKS[b.type];
  const keep = box.scrollTop;
  box.innerHTML = `<div class="edit-head"><span class="bl-ic">${def.icon}</span>${esc(def.label)}</div>`
    + elementPanel(b)
    + def.fields.map((f) => fieldHTML(f, b.props, 'props')).join('');
  box.scrollTop = keep;
}

/* 選択中の要素にアニメーションを付けるパネル */
function elementPanel(b) {
  if (!selectedEl) {
    return `<div class="el-hint">
      <b>ダブルクリック</b>で文字をその場で書き換えられます。<br>
      <b>1回クリック</b>すると、その要素にアニメーションを付けられます
      （青枠＝テキスト12種 / 紫枠＝画像・カード12種）。<br>
      <b>画像枠をクリック</b>すると端末の画像から選べます。
      パソコンなら画像ファイルを枠に放り込んでもOKです。
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
  </div>`;
}

/* 要素パネルの操作 */
$('#tab-edit').addEventListener('click', (e) => {
  if (e.target.closest('[data-elclose]')) { selectedEl = null; renderEditor(); highlight(); return; }
  /* フィールドに付いたサンプル一覧ボタン（いまは装飾のみ） */
  const fg = e.target.closest('[data-gal]');
  if (fg) {
    const bb = state.blocks.find((x) => x.id === selected);
    if (!bb) return;
    const kind = fg.dataset.gal;
    const key = fg.dataset.galpath.split('.').pop();
    openDecoGallery(kind, bb.props[key] || 'none', (picked) => {
      bb.props[key] = picked;
      renderEditor(); renderPreview(true); save();
      const list = kind === 'scroll' ? HERO_SCROLLS : HERO_DECOS;
      flash(`${kind === 'scroll' ? 'スクロール連動' : '装飾'}を`
        + `「${(list.find((d) => d[0] === picked) || [, picked])[1]}」にしました`);
    });
    return;
  }

  const ag = e.target.closest('[data-animgal]');
  if (ag && selectedEl) {
    const b0 = state.blocks.find((x) => x.id === selected);
    const cur0 = ((b0 && b0.props.anims) || {})[selectedEl.role] || {};
    openAnimGallery(ag.dataset.animgal, cur0.a || 'none', (key) => {
      const bb = state.blocks.find((x) => x.id === selected);
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
  const key = e.target.dataset.elk;
  if (!key || !selectedEl) return;
  const b = state.blocks.find((x) => x.id === selected);
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
  const b = state.blocks.find((x) => x.id === selected);
  if (!b) return;
  setPath(b, el.dataset.path, readEl(el));
  if (el.type === 'range') el.parentElement.querySelector('.f-val').textContent = el.value + (el.dataset.suffix || '');
  renderList();
  renderPreview();
  save(`p:${el.dataset.path}:${selected}`);
});

/* select / checkbox は showIf の出し分けがあるのでフォームごと作り直す */
$('#tab-edit').addEventListener('change', (e) => {
  if (!e.target.dataset.path) return;
  if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'file') renderEditor();
});

/* ---- 繰り返し項目の操作 ---- */
$('#tab-edit').addEventListener('click', (e) => {
  const b = state.blocks.find((x) => x.id === selected);
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
  const b = state.blocks.find((x) => x.id === blockId);
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
function openImagePicker(blockId, prop) {
  if (!blockId || !prop) return;
  pickTarget = { blockId, prop };
  filePicker.value = '';
  filePicker.click();
}
filePicker.addEventListener('change', () => {
  const f = filePicker.files[0];
  if (f && pickTarget) setImage(pickTarget.blockId, pickTarget.prop, f);
});

/* 右パネルの「画像を選ぶ」ボタン */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick]');
  if (!btn) return;
  openImagePicker(selected, btn.dataset.pick.replace(/^props\./, ''));
});

/* 編集画面の外にファイルを落としても、ブラウザがそれを開いてしまわないように */
['dragover', 'drop'].forEach((t) =>
  document.addEventListener(t, (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault(); }));

/* ================================================================
   デザインタブ / ページ設定タブ
   ================================================================ */
const THEME_FIELDS = [
  ['色', [
    { key: 'primary', label: 'メインカラー', type: 'color' },
    { key: 'accent', label: 'アクセントカラー', type: 'color' },
    { key: 'bg', label: '背景色', type: 'color' },
    { key: 'surface', label: '背景色（薄いエリア）', type: 'color' },
    { key: 'text', label: '文字色', type: 'color' },
    { key: 'muted', label: '文字色（うすい）', type: 'color' },
    { key: 'border', label: '線の色', type: 'color' },
    { key: 'dark', label: 'ダークエリアの色', type: 'color' },
  ]],
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
];

function renderDesign() {
  $('#tab-design').innerHTML =
    `<div class="sec-label">配色</div>
     <button class="anim-gal" id="btnPalGal" style="margin:0 0 14px">▦ 配色を一覧から選ぶ</button>`
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
  $('#tab-page').innerHTML = `
    <div class="sec-label">ページ情報（ブラウザのタブ名・検索結果に出ます）</div>
    <div class="f"><label>ページタイトル</label><input type="text" data-path="meta.title" value="${esc(state.meta.title)}"></div>
    <div class="f"><label>ページの説明</label><textarea data-path="meta.description" rows="4">${esc(state.meta.description)}</textarea></div>
    <div class="f"><label>言語</label><input type="text" data-path="meta.lang" value="${esc(state.meta.lang)}"></div>
    <div class="sec-label">つかいかた</div>
    <div class="hint" style="line-height:2">
      ・左でブロックの並べかえ・追加・削除<br>
      ・プレビューを直接クリックしても選べます<br>
      ・「アンカーID」を付けると、メニューから <b>#id</b> でリンクできます<br>
      ・内容はこのブラウザに自動保存されます<br>
      ・完成したら「HTMLを書き出す」で1ファイルとして保存できます
    </div>`;
}

function themeInput(e) {
  const el = e.target;
  const path = el.dataset.path || '';
  if (path !== 'style' && !path.startsWith('theme.') && !path.startsWith('meta.') && !path.startsWith('motion.')) return;
  setPath(state, path, readEl(el));

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
  if (path.startsWith('motion.') || path === 'style') renderPreview(true);
});
$('#tab-page').addEventListener('input', themeInput);

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
  const sample = state.blocks.slice(0, 3)
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
        <div class="tc-scale tpl-${k}${t.style ? ` sty-${t.style}` : ''}" style="${themeVars(t.theme)}">${sample}</div>
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

let askBeforeSwitch = false; // 起動直後の選択では確認しない

$('#btnTemplates').addEventListener('click', () => {
  askBeforeSwitch = true;
  renderTplGrid(); openModal('#tplModal');
});
$('#tplClose').addEventListener('click', () => closeModal('#tplModal'));
function pickTemplate(k) {
  if (askBeforeSwitch && !confirm('テンプレートを切り替えると、いまの内容は置きかわります。よろしいですか？')) return;
  state = buildState(k);
  selected = state.blocks[1]?.id || state.blocks[0]?.id;
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
  const blob = new Blob([fullHTML()], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'index.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  flash('index.html を書き出しました');
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
$('#devices').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  $$('#devices button').forEach((x) => x.classList.toggle('on', x === b));
  $('#frame').style.width = b.dataset.w;
});
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
  else if (b.id === 'mExport') $('#btnExport').click();
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
    selected = state.blocks[1]?.id || state.blocks[0]?.id;
    refresh();
    resetHistory();
  } else {
    renderTplGrid();
    openModal('#tplModal');
    state = buildState('corporate');
    selected = state.blocks[1].id;
    refresh();
    resetHistory();
  }
})();
