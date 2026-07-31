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

/* ---------------- 保存 / 読み込み ---------------- */
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      flash('保存しました');
    } catch (e) {
      flash('保存できません（画像が大きすぎるかも）');
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
    return s.blocks.length ? s : null;
  } catch (e) { return null; }
}

/* ================================================================
   HTML生成
   ================================================================ */
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
  --ta-dur:${(state.motion.dur / 1000)}s;
  --ta-stagger:${(state.motion.stagger / 1000)}s;
  --ta-ease:${state.motion.ease};
}`;
}

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
<body class="tpl-${esc(state.template)}" data-anim="${esc(state.motion.anim)}" data-reveal="${state.motion.reveal ? 1 : 0}">

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
      });

      pdoc.addEventListener('dblclick', (e) => {
        const t = e.target.closest('[data-prop]');
        const blk = e.target.closest('[data-bid]');
        if (!t || !blk) return;
        e.preventDefault();
        startEdit(t, blk.dataset.bid, t.dataset.prop);
      });

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
    pdoc.body.className = `tpl-${state.template}`;
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
    renderList(); renderEditor(); save();
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
    $('#addMenu').hidden = true;
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

/* ---- ブロック追加メニュー ---- */
function renderAddMenu() {
  const exists = new Set(state.blocks.map((b) => b.type));
  // 常設ブロック（消してしまった場合のみ出る）→ 通常ブロックの順に並べる
  const order = Object.keys(BLOCKS).filter((t) => BLOCKS[t].unique).concat(ADDABLE);
  const types = order.filter((t) => !(BLOCKS[t].unique && exists.has(t)));
  $('#addMenu').innerHTML = types.map((t) =>
    `<button data-type="${t}" draggable="true" title="ドラッグして位置を指定できます">
      <span class="bl-ic">${BLOCKS[t].icon}</span>${BLOCKS[t].label}</button>`).join('');
}
$('#btnAdd').addEventListener('click', (e) => {
  e.stopPropagation();
  renderAddMenu();
  $('#addMenu').hidden = !$('#addMenu').hidden;
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.add-wrap')) $('#addMenu').hidden = true;
});
$('#addMenu').addEventListener('dragstart', (e) => {
  const t = e.target.closest('button')?.dataset.type;
  if (!t) return;
  drag = { mode: 'add', type: t };
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/plain', 'add:' + t);
});
$('#addMenu').addEventListener('dragend', clearDrag);

$('#addMenu').addEventListener('click', (e) => {
  const t = e.target.closest('button')?.dataset.type;
  if (!t) return;
  const nb = makeBlock(t);
  let at = state.blocks.findIndex((b) => b.id === selected) + 1;
  if (!at) at = state.blocks.length;
  // フッターより下には入れない
  const fi = state.blocks.findIndex((b) => b.type === 'footer');
  if (t !== 'footer' && fi >= 0 && at > fi) at = fi;
  if (t === 'header') at = 0;
  if (t === 'footer') at = state.blocks.length;
  state.blocks.splice(at, 0, nb);
  selected = nb.id;
  $('#addMenu').hidden = true;
  refresh();
  setTimeout(() => scrollToBlock(nb.id), 220);
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
      （青枠＝テキスト12種 / 紫枠＝画像・カード12種）。
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
  save();
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
  save();
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

/* ---- 画像を端末から選ぶ ---- */
const filePicker = document.createElement('input');
filePicker.type = 'file';
filePicker.accept = 'image/*';
let pickPath = null;
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick]');
  if (!btn) return;
  pickPath = { path: btn.dataset.pick, scope: btn.closest('#tab-design') ? 'theme' : 'block' };
  filePicker.value = '';
  filePicker.click();
});
filePicker.addEventListener('change', () => {
  const file = filePicker.files[0];
  if (!file || !pickPath) return;
  if (file.size > 1.5 * 1024 * 1024) {
    if (!confirm('画像が大きめです（1.5MB超）。保存できないことがあります。続けますか？')) return;
  }
  const r = new FileReader();
  r.onload = () => {
    const b = state.blocks.find((x) => x.id === selected);
    if (b) { setPath(b, pickPath.path, r.result); renderEditor(); renderPreview(); save(); }
  };
  r.readAsDataURL(file);
});

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

const MOTION_FIELDS = [
  { key: 'anim', label: '見出しの文字アニメ', type: 'select', options: TEXT_ANIMS,
    hint: 'すべての見出しに適用されます（ヒーローは個別に変更できます）' },
  { key: 'dur', label: 'アニメの長さ', type: 'range', min: 150, max: 2500, suffix: 'ms' },
  { key: 'stagger', label: '1文字ごとのずらし', type: 'range', min: 0, max: 200, suffix: 'ms' },
  { key: 'ease', label: 'イージング（速度の変化）', type: 'select', options: MOTION_EASES },
  { key: 'reveal', label: 'ブロックをスクロールで出現させる', type: 'toggle' },
];

function renderDesign() {
  $('#tab-design').innerHTML = THEME_FIELDS.map(([g, fs]) =>
    `<div class="sec-label">${g}</div>` + fs.map((f) => {
      const path = `theme.${f.key}`;
      const val = state.theme[f.key];
      return `<div class="f"><label>${esc(f.label)}</label>${inputHTML(f, val, path)}</div>`;
    }).join('')).join('')
    + `<div class="sec-label">動き</div>`
    + MOTION_FIELDS.map((f) => {
        const path = `motion.${f.key}`;
        const val = state.motion[f.key];
        if (f.type === 'toggle') return `<div class="f">${inputHTML(f, val, path)}</div>`;
        return `<div class="f"><label>${esc(f.label)}</label>${inputHTML(f, val, path)}
          ${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}</div>`;
      }).join('')
    + `<button class="add-btn" id="btnReplayAnim" style="margin-top:6px">▶ プレビューで再生</button>`;
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
  if (!path.startsWith('theme.') && !path.startsWith('meta.') && !path.startsWith('motion.')) return;
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
  renderPreview(); save();
}
$('#tab-design').addEventListener('input', themeInput);
$('#tab-design').addEventListener('click', (e) => {
  if (e.target.id === 'btnReplayAnim') renderPreview(true);
});
/* select や toggle を変えたら、すぐ動きを確認できるよう作り直す */
$('#tab-design').addEventListener('change', (e) => {
  const path = e.target.dataset.path || '';
  if (path.startsWith('motion.')) renderPreview(true);
});
$('#tab-page').addEventListener('input', themeInput);

/* ---- タブ切り替え ---- */
$$('.tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

/* ================================================================
   テンプレート選択
   ================================================================ */
function renderTplGrid() {
  $('#tplGrid').innerHTML = Object.entries(TEMPLATES).map(([k, t]) => {
    const [c1, c2, c3] = t.swatch;
    return `<button class="tpl-card" data-tpl="${k}">
      <div class="tpl-prev" style="background:${c3}">
        <div class="bar" style="background:${c1};width:38%"></div>
        <div class="big" style="background:${c1};opacity:.85;width:80%"></div>
        <div class="bar" style="background:${c2};width:52%;opacity:.7"></div>
        <div class="row"><span style="background:${c1};opacity:.25"></span><span style="background:${c1};opacity:.25"></span><span style="background:${c2};opacity:.35"></span></div>
      </div>
      <div class="tpl-meta"><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></div>
    </button>`;
  }).join('');
}
const openModal = (id) => { $(id).hidden = false; };
const closeModal = (id) => { $(id).hidden = true; };

let askBeforeSwitch = false; // 起動直後の選択では確認しない

$('#btnTemplates').addEventListener('click', () => {
  askBeforeSwitch = true;
  renderTplGrid(); openModal('#tplModal');
});
$('#tplClose').addEventListener('click', () => closeModal('#tplModal'));
$('#tplGrid').addEventListener('click', (e) => {
  const k = e.target.closest('[data-tpl]')?.dataset.tpl;
  if (!k) return;
  if (askBeforeSwitch && !confirm('テンプレートを切り替えると、いまの内容は置きかわります。よろしいですか？')) return;
  state = buildState(k);
  selected = state.blocks[1]?.id || state.blocks[0]?.id;
  closed.clear();
  closeModal('#tplModal');
  refresh();
});

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
  $('#addMenu').hidden = true;
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
  else if (b.id === 'mAdd') { openSheet('left'); setTimeout(() => $('#btnAdd').click(), 260); }
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
  } else {
    renderTplGrid();
    openModal('#tplModal');
    state = buildState('corporate');
    selected = state.blocks[1].id;
    refresh();
  }
})();
