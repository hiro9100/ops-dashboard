/* ブロックの定義。
   1ブロック = { label, icon, fields(編集フォームの項目), defaults(初期値), render(HTML生成) }
   fields を書けば編集フォームは自動で作られる。ブロックを増やしたい時はここに足すだけ。 */

/* ---------- 小さなヘルパ ---------- */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const attr = (name, v) => (v ? ` ${name}="${esc(v)}"` : '');

/* 画像URLがあれば <img>、無ければ何も出さない（ロゴ・背景用） */
const img = (src, alt) => (src ? `<img src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy">` : '');
/* 画像を置く枠。未設定なら「IMAGE」のプレースホルダを出す */
const media = (src, alt) => (src ? img(src, alt) : '<span class="ph" aria-hidden="true"></span>');

/* セクションの外枠 */
function sec(type, p, inner, extraClass = '') {
  const cls = ['sec', `sec-${type}`, p.bg ? `bg-${p.bg}` : '', extraClass].filter(Boolean).join(' ');
  return `<section class="${cls}"${attr('id', p.anchor)}>\n  <div class="wrap">\n${inner}\n  </div>\n</section>`;
}

/* 見出しブロック（アイキャッチ・タイトル・サブ） */
function head(p, align = 'center') {
  if (!p.eyebrow && !p.title && !p.text) return '';
  return `    <div class="sec-head${align === 'left' ? ' left' : ''}">
${p.eyebrow ? `      <span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${esc(p.eyebrow)}</span>\n` : ''}${p.title ? `      <h2 class="sec-title"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>\n` : ''}${p.text ? `      <p class="sec-sub"${el(p, 'text', 'ta', '説明文', 'text')}>${nl2br(p.text)}</p>\n` : ''}    </div>`;
}

/* ボタン群 */
function buttons(list, extraClass = '') {
  if (!list || !list.length) return '';
  const items = list
    .filter((b) => b.label)
    .map((b) => `      <a class="btn${b.style && b.style !== 'primary' ? ' ' + b.style : ''}" href="${esc(b.href || '#')}">${esc(b.label)}</a>`)
    .join('\n');
  return items ? `    <div class="btn-row ${extraClass}">\n${items}\n    </div>` : '';
}

/* 文字アニメーションの一覧（サイト側CSSの ta-* と対応） */
const TEXT_ANIMS = [
  ['none', 'なし'],
  ['fadeup', 'フェードアップ'],
  ['maskline', '行マスクせり上げ'],
  ['blur', 'ぼかし解除'],
  ['flip3d', '3Dフリップ'],
  ['drop', '回転して落ちる'],
  ['bounce', '弾む'],
  ['slidealt', '左右交互スライド'],
  ['scatter', '散らばりから集合'],
  ['neon', 'ネオン点灯'],
  ['fillgrad', 'グラデーションで塗る'],
  ['scramble', 'スクランブル'],
  ['type', 'タイプライター'],
];
const TEXT_ANIMS_WITH_DEFAULT = [['', '全体設定に従う']].concat(TEXT_ANIMS);

/* 画像・要素アニメーションの一覧（サイト側CSSの ia-* と対応） */
const IMAGE_ANIMS = [
  ['none', 'なし'],
  ['zoomin', 'ズームイン'],
  ['zoomout', 'ズームアウト'],
  ['slideleft', '左から入る'],
  ['slideright', '右から入る'],
  ['slideup', '下から入る'],
  ['wipe', '下から開く（ワイプ）'],
  ['circle', '円形に開く'],
  ['blurin', 'ぼかし解除'],
  ['tilt3d', '3Dで起き上がる'],
  ['flipup', 'めくれて立つ'],
  ['kenburns', 'ゆっくりズーム（ループ）'],
  ['float', 'ふわふわ浮遊（ループ）'],
];

/* ============================================================
   ヒーローの装飾レイヤー
   写真や背景色の上に重ねる「金のかかったサイト」の質感担当。
   文字を守る暗幕（.hero.cover::before）より下に敷くので、
   どれを選んでも見出しが読めなくなることはない。
   ============================================================ */
/* スクロールに連動するヒーローの型。
   区間を長くとって中身を貼り付け（sticky）、進み具合 0→1 で動かす。 */
const HERO_SCROLLS = [
  ['none', 'なし（ふつうのヒーロー）'],
  ['zoomout', '写真が縮んで枠に収まる'],
  ['parallax', '写真と文字がずれて流れる'],
  ['curtain', '幕が上下に開く'],
  ['maskzoom', '文字の中から写真が広がる'],
];

const HERO_DECOS = [
  ['none', 'なし'],
  ['clouds', 'ふわふわ雲'],
  ['glass', 'すりガラス（ポインタ追従）'],
  ['aurora', 'オーロラ'],
  ['dust', '光の粒'],
  ['spot', 'スポットライト（ポインタ追従）'],
  ['depth', '奥行き（ポインタで視差）'],
  ['silk', '流れる線'],
  ['cursor', 'カーソルに丸がついてくる'],
];

/* 雲・オーロラの配置。実行時に乱数を使うと再読み込みのたびに絵が変わって
   落ち着かないので、値は決め打ちで持つ。
   [左%, 上%, 大きさvw, 横ゆれpx, 縦ゆれpx, 伸縮, 秒, 開始ずらし秒, 濃さ, 視差の強さ] */
const CLOUD_BLOBS = [
  [10, 18, 36, 62, -30, 1.14, 34, 0, 0.5, 26],
  [70, 10, 28, -74, 36, 1.1, 43, -8, 0.42, 17],
  [44, 58, 42, 46, -42, 1.18, 51, -19, 0.36, 34],
  [85, 54, 24, -52, -28, 1.12, 39, -27, 0.34, 12],
  [20, 76, 32, 70, 24, 1.08, 47, -13, 0.28, 22],
];
const AURORA_BLOBS = [
  [14, 20, 46, 90, -46, 1.2, 28, 0, 0.5, 30, 'var(--c-primary)'],
  [64, 8, 52, -96, 52, 1.24, 36, -11, 0.42, 20, 'var(--c-accent)'],
  [40, 62, 58, 62, -58, 1.16, 44, -22, 0.34, 38, 'var(--c-primary)'],
];

/* 外側の <i> がポインタ視差、内側の <b> がゆっくりした漂い。
   ひとつの要素に両方の transform は書けないので、2枚に分けている。 */
function blobs(list, withColor) {
  return list.map(([x, y, w, dx, dy, ds, dur, delay, op, pk, color]) =>
    `    <i style="left:${x}%;top:${y}%;width:${w}vw;--pk:${pk}"><b style="--dx:${dx}px;--dy:${dy}px;`
    + `--ds:${ds};animation-duration:${dur}s;animation-delay:${delay}s;opacity:${op}`
    + `${withColor ? `;--col:${color}` : ''}"></b></i>`).join('\n');
}

/* 「文字の中から写真が広がる」型の覆い。
   写真を文字で塗る（background-clip:text）やり方は、拡大すると
   写真が引き伸ばされて粗くなる。そこで写真は等倍のまま置いておき、
   その上に「文字の形だけ穴が開いた板」をかぶせて、穴のほうを広げる。
   穴の形は SVG なので、何倍に広げても輪郭がぼやけない。 */
function maskZoomLayer(p) {
  const raw = String(p.title || '').split('\n')[0].trim() || 'HELLO';
  const t = raw.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  /* 長い見出しでも枠からはみ出さないよう、文字数で大きさを決める */
  const size = Math.max(120, Math.min(420, Math.round(3400 / Math.max(2, raw.length))));
  /* CSS の mask は、画像を渡すと「明るさ」ではなく「不透明度」で見る。
     黒い文字を置いただけでは穴にならないので、SVG の中で先に抜いておく。 */
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4000 4000">`
    + `<defs><mask id="h"><rect width="4000" height="4000" fill="#fff"/>`
    + `<text x="2000" y="2000" fill="#000" text-anchor="middle" dominant-baseline="central" `
    + `font-family="sans-serif" font-weight="900" font-size="${size}">${t}</text></mask></defs>`
    + `<rect width="4000" height="4000" fill="#000" mask="url(%23h)"/></svg>`;
  return `  <div class="mzo" aria-hidden="true" style="--mzsvg:url(&quot;data:image/svg+xml,`
    + `${encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22').replace(/%2523/g, '%23')}&quot;)"></div>\n`;
}

/* 装飾レイヤーのHTML。強さは --deco-k（0〜1.5）で全体にかかる */
function decoLayer(p) {
  const kind = p.deco || 'none';
  if (kind === 'none' && !p.grain) return '';
  const k = ((p.decoStrength ?? 60) / 60).toFixed(2);
  let inner = '';
  if (kind === 'clouds') inner = blobs(CLOUD_BLOBS, false);
  else if (kind === 'aurora') inner = blobs(AURORA_BLOBS, true);
  else if (kind === 'glass') inner = '    <i class="gl gl1"></i>\n    <i class="gl gl2"></i>';
  else if (kind === 'spot') inner = '    <i class="sp"></i>';
  else if (kind === 'cursor') inner = `    <i class="cur"><b>${esc(p.decoLabel || 'SCROLL')}</b></i>`;
  else if (kind === 'dust') inner = '    <canvas class="du"></canvas>';
  else if (kind === 'silk') {
    inner = [0, 1, 2, 3, 4].map((i) =>
      `    <i class="sk" style="--n:${i};animation-duration:${20 + i * 5}s;animation-delay:${-i * 4}s"></i>`).join('\n');
  }
  const grain = p.grain ? `${inner ? '\n' : ''}    <u class="grain"></u>` : '';
  return `  <div class="deco"${kind === 'none' ? '' : ` data-deco="${esc(kind)}"`}`
    + ` style="--deco-k:${k}" aria-hidden="true">\n${inner}${grain}\n  </div>\n`;
}

/* 要素にアニメーション用の目印を付ける。
   role  : props.anims のキー
   kind  : 'ta'（文字）/ 'ia'（画像・要素）
   label : 編集画面に表示する名前
   ※ 遅延は style ではなく data-delay で渡す（既存の style 属性とぶつからないように） */
function el(p, role, kind, label, prop) {
  const cfg = (p.anims || {})[role] || {};
  let out = ` data-el="${esc(role)}" data-elname="${esc(label)}" data-elkind="${kind}" data-${kind}`;
  if (prop) out += ` data-prop="${esc(prop)}"`;   // ダブルクリックで直接編集できる
  if (cfg.a) out += ` data-anim="${esc(cfg.a)}"`;
  if (cfg.d) out += ` data-delay="${parseInt(cfg.d, 10) || 0}"`;
  return out;
}

/* 画像を差し替えられる枠であることを示す（タップで選択、ドロップで投入） */
const imgSlot = (prop) => ` data-imgprop="${esc(prop)}"`;

/* ダブルクリック編集だけを付ける（段落が複数あるなど、文字アニメを付けない場所用） */
function ed(prop, label) {
  return ` data-prop="${esc(prop)}" data-elname="${esc(label)}"`;
}

/* よく使う共通フィールド */
const FIELD = {
  bg: {
    key: 'bg', label: '背景色', type: 'select',
    options: [['', '標準'], ['surface', '薄いグレー'], ['primary', 'メインカラー'], ['dark', 'ダーク']],
  },
  anchor: { key: 'anchor', label: 'アンカーID', type: 'text', hint: 'メニューから #about のようにリンクできます' },
  eyebrow: { key: 'eyebrow', label: '小見出し', type: 'text' },
  title: { key: 'title', label: '見出し', type: 'textarea', rows: 2 },
  text: { key: 'text', label: '説明文', type: 'textarea' },
  cols: {
    key: 'cols', label: '横に並べる数', type: 'select',
    options: [['c2', '2列'], ['c3', '3列'], ['c4', '4列']],
  },
  btnItem: [
    { key: 'label', label: 'ボタン文字', type: 'text' },
    { key: 'href', label: 'リンク先', type: 'text' },
    { key: 'style', label: '見た目', type: 'select', options: [['primary', 'メイン'], ['ghost', '枠線'], ['accent', 'アクセント']] },
  ],
};

/* ============================================================
   コラージュ・ヒーロー
   写真を敷き詰めた背景に、斜めに切り出した写真と、
   縦書きの白い帯を重ねる型。報道・イベント・採用の顔に効く。

   手前の写真の置き場所は決め打ちで持つ。実行時に乱数で散らすと
   読み込むたびに絵が変わって落ち着かないため。
   [左%, 上%, 幅%, 傾き°, 重なり順, 出るまでの待ちms] */
const COLLAGE_SLOTS = [
  [3, 4, 34, -38, 3, 120],
  [56, -2, 26, 42, 2, 260],
  [37, 40, 32, -42, 3, 400],
  [74, 46, 22, 38, 2, 540],
  [13, 60, 20, 44, 1, 680],
];

/* 枠を θ 傾けて中身を戻すと、四隅が内側に食い込んで余白が出る。
   |sinθ|+|cosθ| 倍にしておけば、どの角度でも隙間なく埋まる。 */
function coverScale(deg) {
  const r = (deg * Math.PI) / 180;
  return (Math.abs(Math.sin(r)) + Math.abs(Math.cos(r))).toFixed(3);
}

/* 縦書きは font に頼らない。
   writing-mode に任せると、縦書き用の字送り（vmtx）を持たないフォントで
   漢字の送りがゼロになり、字が重なって潰れる（実測で確認）。
   1文字ずつ積むことで、どのフォントでも同じ見た目になる。 */
const V_ROTATE = 'ー〜～（）「」『』【】〔〕〈〉《》＜＞()[]{}<>=+－-—…';
const V_CORNER = '、。，．';

function vChar(ch) {
  if (ch === ' ' || ch === '\u3000') return '      <i class="cbc sp"></i>';
  const cls = V_ROTATE.includes(ch) ? ' rot' : (V_CORNER.includes(ch) ? ' cor' : '');
  return `      <i class="cbc${cls}">${esc(ch)}</i>`;
}

/* 1行＝1列。日本語の縦書きは右から読むので、
   最初の行がいちばん右に来るように並べる（CSS 側で row-reverse）。 */
function bands(text, side) {
  const cols = String(text || '').split('\n').map((t) => t.trim()).filter(Boolean);
  if (!cols.length) return '';
  return `    <div class="cband cband-${side}">
${cols.map((t, i) => `      <span class="cb" style="--i:${i}">
${[...t].map(vChar).join('\n')}
      </span>`).join('\n')}
    </div>`;
}

/* ============================================================
   ブロック本体
   ============================================================ */
const BLOCKS = {
  /* ---------------- ヘッダー ---------------- */
  header: {
    label: 'ヘッダー',
    icon: '▤',
    unique: true, // 1ページに1つだけ
    fields: [
      { key: 'logo', label: 'サイト名 / ロゴ文字', type: 'text' },
      { key: 'logoImage', label: 'ロゴ画像URL（任意）', type: 'image' },
      { key: 'sticky', label: 'スクロールしても上に固定', type: 'toggle' },
      { key: 'nav', label: 'メニュー', type: 'list', addLabel: 'メニューを追加',
        titleKey: 'label',
        item: [
          { key: 'label', label: '表示名', type: 'text' },
          { key: 'href', label: 'リンク先', type: 'text' },
        ] },
      { key: 'cta', label: 'ボタン文字（空でボタン無し）', type: 'text' },
      { key: 'ctaHref', label: 'ボタンのリンク先', type: 'text' },
    ],
    defaults: {
      logo: 'YOUR LOGO', logoImage: '', sticky: true,
      nav: [
        { label: 'サービス', href: '#features' },
        { label: '私たちについて', href: '#about' },
        { label: '料金', href: '#pricing' },
        { label: 'お問い合わせ', href: '#contact' },
      ],
      cta: 'お問い合わせ', ctaHref: '#contact',
    },
    render: (p) => `<header class="hdr${p.sticky ? ' sticky' : ''}">
  <div class="wrap hdr-in">
    <a class="logo" href="#"${ed('logo', 'サイト名')}>${p.logoImage ? img(p.logoImage, p.logo) : ''}${esc(p.logo)}</a>
    <nav class="nav">${(p.nav || []).filter((n) => n.label).map((n) => `<a href="${esc(n.href || '#')}">${esc(n.label)}</a>`).join('')}</nav>
    ${p.cta ? `<a class="btn sm" href="${esc(p.ctaHref || '#')}">${esc(p.cta)}</a>` : ''}
    <button class="hdr-toggle" aria-label="メニュー">☰</button>
  </div>
</header>`,
  },

  /* ---------------- ヒーロー ---------------- */
  hero: {
    label: 'ヒーロー',
    icon: '★',
    fields: [
      { key: 'layout', label: 'レイアウト', type: 'select',
        options: [['center', '中央ぞろえ'], ['left', '左ぞろえ'], ['split', '左右に画像'], ['cover', '背景画像いっぱい']] },
      FIELD.eyebrow,
      { key: 'title', label: 'キャッチコピー', type: 'textarea', rows: 2 },
      { key: 'text', label: '説明文', type: 'textarea' },
      { key: 'image', label: '画像URL', type: 'image' },
      { key: 'overlay', label: '背景画像の暗さ', type: 'range', min: 0, max: 90, suffix: '%',
        showIf: (p) => p.layout === 'cover' },
      { key: 'scroll', label: 'スクロール連動', type: 'select', options: HERO_SCROLLS, gallery: 'scroll',
        hint: '選ぶとヒーローが画面に貼り付き、スクロールの進み具合で動きます' },
      { key: 'scrollLen', label: '動ききるまでの長さ', type: 'range', min: 120, max: 320, suffix: '%',
        showIf: (p) => p.scroll && p.scroll !== 'none' },
      { key: 'deco', label: '装飾の動き', type: 'select', options: HERO_DECOS, gallery: 'deco',
        hint: 'ポインタ追従は指の環境では自動で止まります' },
      { key: 'decoStrength', label: '装飾の強さ', type: 'range', min: 10, max: 100, suffix: '%',
        showIf: (p) => p.deco && p.deco !== 'none' },
      { key: 'decoLabel', label: '丸の中の文字', type: 'text', showIf: (p) => p.deco === 'cursor' },
      { key: 'grain', label: 'フィルムの粒状感を足す', type: 'toggle' },
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      layout: 'center', eyebrow: 'WELCOME',
      title: 'ここにいちばん伝えたい\nキャッチコピーを',
      text: 'サービスの魅力を1〜2行で。訪れた人が「自分に関係ある」と感じる言葉を置きましょう。',
      image: '', overlay: 55, bg: '', anchor: 'top',
      deco: 'none', decoStrength: 60, grain: false, decoLabel: 'SCROLL',
      scroll: 'none', scrollLen: 200,
      buttons: [
        { label: '無料で相談する', href: '#contact', style: 'primary' },
        { label: 'くわしく見る', href: '#features', style: 'ghost' },
      ],
    },
    render: (p) => {
      const cover = p.layout === 'cover';
      const needsPointer = ['glass', 'spot', 'depth', 'clouds', 'aurora', 'cursor'].includes(p.deco);
      const cls = ['hero', cover ? 'cover center' : p.layout, p.bg ? `bg-${p.bg}` : '',
        p.deco && p.deco !== 'none' ? `has-deco dk-${p.deco}` : ''].filter(Boolean).join(' ');
      const body = `      ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${esc(p.eyebrow)}</span>` : ''}
      ${p.title ? `<h1 class="hero-title"${el(p, 'title', 'ta', 'キャッチコピー', 'title')}>${nl2br(p.title)}</h1>` : ''}
      ${p.text ? `<p class="hero-text"${el(p, 'text', 'ta', '説明文', 'text')}>${nl2br(p.text)}</p>` : ''}
${buttons(p.buttons)}`;
      const bg = cover
        ? `  <div class="hero-bg" style="--hero-overlay:rgba(15,23,42,${(p.overlay ?? 55) / 100})">${img(p.image, '')}</div>\n`
        : '';
      const inner = p.layout === 'split'
        ? `    <div class="hero-in">
      <div>\n${body}\n      </div>
      <div class="hero-media"${el(p, 'image', 'ia', '画像')}${imgSlot('image')}>${media(p.image, p.title)}</div>
    </div>`
        : `    <div class="hero-in">\n${body}\n    </div>`;
      /* スクロール連動のときは、長い区間の中に中身を貼り付ける（sticky）。
         区間の進み具合を --p（0〜1）としてCSSに渡し、動きはCSS側で書く。 */
      const sc = p.scroll && p.scroll !== 'none' ? p.scroll : '';
      const guts = `${bg}${decoLayer(p)}  <div class="wrap">
${inner}
  </div>`;
      if (!sc) {
        return `<section class="${cls}"${attr('id', p.anchor)}${needsPointer ? ' data-hpt' : ''}>
${guts}
</section>`;
      }
      const maskLayer = sc === 'maskzoom' ? maskZoomLayer(p) : '';
      return `<section class="${cls} hsc hsc-${esc(sc)}"${attr('id', p.anchor)}${needsPointer ? ' data-hpt' : ''}`
        + ` data-heroscroll style="--pin:${Math.max(120, Math.min(320, p.scrollLen ?? 200))}vh">
  <div class="hsc-in">
${maskLayer}${guts}
  </div>
</section>`;
    },
  },

  /* ---------------- 特徴・サービス ---------------- */
  features: {
    label: '特徴・サービス',
    icon: '◆',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text, FIELD.cols,
      { key: 'style', label: 'カードの形式', type: 'select', options: [['icon', 'アイコン'], ['num', '番号（手順）'], ['image', '画像']] },
      { key: 'items', label: '項目', type: 'list', addLabel: '項目を追加', titleKey: 'title',
        item: [
          { key: 'icon', label: 'アイコン（絵文字）', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
          { key: 'title', label: 'タイトル', type: 'text' },
          { key: 'text', label: '説明', type: 'textarea' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FEATURES', title: '選ばれている3つの理由',
      text: '強みを短い言葉で並べると伝わりやすくなります。',
      cols: 'c3', style: 'icon', bg: 'surface', anchor: 'features',
      items: [
        { icon: '⚡', title: 'とにかく速い', text: 'ご相談から最短3日で公開。スピードが必要な場面でもお任せください。' },
        { icon: '🎯', title: '目的に合わせて', text: '集客・採用・ブランディング。ゴールから逆算して設計します。' },
        { icon: '🤝', title: '公開後も伴走', text: '作って終わりにしません。運用のご相談もいつでもどうぞ。' },
      ],
    },
    render: (p) => sec('features', p,
      `${head(p)}
    <div class="grid ${p.cols || 'c3'}">
${(p.items || []).map((it, i) => `      <div class="card"${el(p, `card${i}`, 'ia', `カード${i + 1}`)}>
        ${p.style === 'image' ? `<div class="hero-media" style="aspect-ratio:16/10;margin-bottom:18px" data-elname="カード画像"${imgSlot(`items.${i}.image`)}>${media(it.image, it.title)}</div>` : ''}
        ${p.style === 'num' ? `<span class="num">${i + 1}</span>` : p.style === 'image' ? '' : `<span class="ic">${esc(it.icon || '◆')}</span>`}
        ${it.title ? `<h3${el(p, `card${i}.title`, 'ta', 'カード見出し', `items.${i}.title`)}>${esc(it.title)}</h3>` : ''}
        ${it.text ? `<p${el(p, `card${i}.text`, 'ta', 'カード説明', `items.${i}.text`)}>${nl2br(it.text)}</p>` : ''}
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- 紹介（画像＋文章） ---------------- */
  about: {
    label: '紹介（画像＋文章）',
    icon: '▧',
    fields: [
      FIELD.eyebrow, FIELD.title,
      { key: 'body', label: '本文', type: 'textarea', rows: 7 },
      { key: 'image', label: '画像URL', type: 'image' },
      { key: 'reverse', label: '画像を右側にする', type: 'toggle' },
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'ABOUT', title: '私たちについて',
      body: 'ここに会社やお店のストーリーを書きます。\n\nどんな想いで始めたのか、どんな人に届けたいのか。事実だけでなく背景を書くと、読み手との距離がぐっと縮まります。',
      image: '', reverse: false, bg: '', anchor: 'about',
      buttons: [{ label: 'もっと読む', href: '#', style: 'ghost' }],
    },
    render: (p) => sec('about', p,
      `    <div class="about-in${p.reverse ? ' rev' : ''}">
      <div class="about-media"${el(p, 'image', 'ia', '画像')}${imgSlot('image')}>${media(p.image, p.title)}</div>
      <div class="about-body">
        ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${esc(p.eyebrow)}</span>` : ''}
        ${p.title ? `<h2 class="sec-title"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>` : ''}
        <div${ed('body', '本文')}>${(p.body || '').split(/\n{2,}/).filter(Boolean).map((t) => `<p>${nl2br(t)}</p>`).join('\n          ')}</div>
${buttons(p.buttons)}
      </div>
    </div>`),
  },

  /* ---------------- ギャラリー ---------------- */
  gallery: {
    label: 'ギャラリー',
    icon: '▦',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '画像', type: 'list', addLabel: '画像を追加', titleKey: 'alt',
        item: [
          { key: 'src', label: '画像URL', type: 'image' },
          { key: 'alt', label: '説明（代替テキスト）', type: 'text' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'GALLERY', title: 'ギャラリー', text: '',
      bg: '', anchor: 'gallery',
      items: [{ src: '', alt: '写真1' }, { src: '', alt: '写真2' }, { src: '', alt: '写真3' },
        { src: '', alt: '写真4' }, { src: '', alt: '写真5' }, { src: '', alt: '写真6' }],
    },
    render: (p) => sec('gallery', p,
      `${head(p)}
    <div class="gal">
${(p.items || []).map((it, i) => `      <figure${el(p, `img${i}`, 'ia', `画像${i + 1}`)}${imgSlot(`items.${i}.src`)}>${media(it.src, it.alt)}</figure>`).join('\n')}
    </div>`),
  },

  /* ---------------- 料金 ---------------- */
  pricing: {
    label: '料金プラン',
    icon: '¥',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text, FIELD.cols,
      { key: 'items', label: 'プラン', type: 'list', addLabel: 'プランを追加', titleKey: 'name',
        item: [
          { key: 'name', label: 'プラン名', type: 'text' },
          { key: 'price', label: '価格', type: 'text' },
          { key: 'unit', label: '単位（/月 など）', type: 'text' },
          { key: 'features', label: '含まれる内容（改行区切り）', type: 'textarea' },
          { key: 'btn', label: 'ボタン文字', type: 'text' },
          { key: 'href', label: 'ボタンのリンク先', type: 'text' },
          { key: 'featured', label: 'おすすめとして目立たせる', type: 'toggle' },
          { key: 'tag', label: 'おすすめラベル', type: 'text' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'PRICING', title: '料金プラン', text: 'わかりやすい料金体系でご案内しています。',
      cols: 'c3', bg: 'surface', anchor: 'pricing',
      items: [
        { name: 'ライト', price: '¥50,000', unit: '〜', features: '1ページ構成\nスマホ対応\nお問い合わせフォーム', btn: '相談する', href: '#contact', featured: false, tag: '' },
        { name: 'スタンダード', price: '¥150,000', unit: '〜', features: '5ページまで\nスマホ対応\n写真撮影つき\n公開後1ヶ月サポート', btn: '相談する', href: '#contact', featured: true, tag: '人気' },
        { name: 'プレミアム', price: '要相談', unit: '', features: 'ページ数無制限\nオリジナルデザイン\nロゴ制作\n運用サポート', btn: '相談する', href: '#contact', featured: false, tag: '' },
      ],
    },
    render: (p) => sec('pricing', p,
      `${head(p)}
    <div class="grid ${p.cols || 'c3'}">
${(p.items || []).map((it, i) => `      <div class="plan${it.featured ? ' feat' : ''}"${el(p, `plan${i}`, 'ia', `プラン${i + 1}`)}>
        ${it.featured && it.tag ? `<span class="tag">${esc(it.tag)}</span>` : ''}
        <h3${el(p, `plan${i}.name`, 'ta', 'プラン名', `items.${i}.name`)}>${esc(it.name)}</h3>
        <div class="price">${esc(it.price)}${it.unit ? `<span>${esc(it.unit)}</span>` : ''}</div>
        <ul>${(it.features || '').split('\n').filter(Boolean).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        ${it.btn ? `<a class="btn${it.featured ? '' : ' ghost'}" href="${esc(it.href || '#')}">${esc(it.btn)}</a>` : ''}
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- よくある質問 ---------------- */
  faq: {
    label: 'よくある質問',
    icon: '?',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '質問', type: 'list', addLabel: '質問を追加', titleKey: 'q',
        item: [
          { key: 'q', label: '質問', type: 'text' },
          { key: 'a', label: '答え', type: 'textarea' },
          { key: 'open', label: '最初から開いておく', type: 'toggle' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FAQ', title: 'よくあるご質問', text: '', bg: '', anchor: 'faq',
      items: [
        { q: '制作にはどのくらいかかりますか？', a: '内容によりますが、1ページ構成であれば最短3日、5ページ程度で2〜3週間が目安です。', open: true },
        { q: '写真がないのですが大丈夫ですか？', a: 'はい。フリー素材のご提案や、撮影の手配も承っています。', open: false },
        { q: '公開後に自分で更新できますか？', a: '更新しやすい形でお渡しします。操作方法もレクチャーいたします。', open: false },
      ],
    },
    render: (p) => sec('faq', p,
      `${head(p)}
    <div class="faq">
${(p.items || []).map((it, i) => `      <details${it.open ? ' open' : ''}>
        <summary${ed(`items.${i}.q`, '質問')}>${esc(it.q)}</summary>
        <div class="a"${ed(`items.${i}.a`, '答え')}>${nl2br(it.a)}</div>
      </details>`).join('\n')}
    </div>`),
  },

  /* ---------------- CTA帯 ---------------- */
  cta: {
    label: 'CTA（行動を促す帯）',
    icon: '➤',
    fields: [
      FIELD.title, FIELD.text,
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: 'まずは気軽にご相談ください',
      text: '相談は無料です。ざっくりしたイメージだけでも大丈夫です。',
      bg: 'primary', anchor: '',
      buttons: [{ label: '無料で相談する', href: '#contact', style: 'ghost' }],
    },
    render: (p) => sec('cta', p,
      `    <div class="cta-in">
      ${p.title ? `<h2 class="sec-title"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>` : ''}
      ${p.text ? `<p${el(p, 'text', 'ta', '本文', 'text')}>${nl2br(p.text)}</p>` : ''}
${buttons(p.buttons, 'center')}
    </div>`),
  },

  /* ---------------- お問い合わせ ---------------- */
  contact: {
    label: 'お問い合わせ',
    icon: '✉',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'tel', label: '電話番号', type: 'text' },
      { key: 'email', label: 'メールアドレス', type: 'text' },
      { key: 'address', label: '住所', type: 'text' },
      { key: 'hours', label: '営業時間', type: 'text' },
      { key: 'form', label: '入力フォームを表示', type: 'toggle' },
      { key: 'action', label: 'フォームの送信先URL', type: 'text', hint: 'Googleフォーム等のURL。空なら見た目だけ', showIf: (p) => p.form },
      { key: 'submit', label: '送信ボタンの文字', type: 'text', showIf: (p) => p.form },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'CONTACT', title: 'お問い合わせ',
      text: 'お気軽にご連絡ください。2営業日以内にご返信します。',
      tel: '03-0000-0000', email: 'hello@example.com',
      address: '東京都〇〇区〇〇 1-2-3', hours: '平日 10:00 - 18:00',
      form: true, action: '', submit: '送信する', bg: 'surface', anchor: 'contact',
    },
    render: (p) => {
      const info = [['TEL', p.tel], ['EMAIL', p.email], ['ADDRESS', p.address], ['HOURS', p.hours]]
        .filter(([, v]) => v)
        .map(([k, v]) => `        <div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('\n');
      const form = p.form ? `      <form class="form"${attr('action', p.action)}${p.action ? ' method="post"' : ''}>
        <label>お名前<input type="text" name="name" required></label>
        <label>メールアドレス<input type="email" name="email" required></label>
        <label>お問い合わせ内容<textarea name="message" required></textarea></label>
        <button class="btn" type="submit">${esc(p.submit || '送信する')}</button>
      </form>` : '';
      const only1 = !info || !form ? ' only1' : '';
      return sec('contact', p,
        `${head(p)}
    <div class="contact-in${only1}">
${info ? `      <dl class="info">\n${info}\n      </dl>` : ''}
${form}
    </div>`);
    },
  },

  /* ---------------- 自由テキスト ---------------- */
  rich: {
    label: '自由テキスト',
    icon: '¶',
    fields: [
      FIELD.title,
      { key: 'body', label: '本文（空行で段落）', type: 'textarea', rows: 10 },
      { key: 'align', label: '配置', type: 'select', options: [['center', '中央寄せ'], ['left', '左寄せ']] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: '見出し', align: 'center', bg: '', anchor: '',
      body: 'ここに自由に文章を書けます。\n\n空行で区切ると段落になります。お知らせやポリシー、長めの説明文などにどうぞ。',
    },
    render: (p) => sec('rich', p,
      `    <div class="rich${p.align === 'left' ? ' left' : ''}">
      ${p.title ? `<h2 class="sec-title" style="text-align:${p.align === 'left' ? 'left' : 'center'}"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>` : ''}
      <div${ed('body', '本文')}>${(p.body || '').split(/\n{2,}/).filter(Boolean).map((t) => `<p>${nl2br(t)}</p>`).join('\n        ')}</div>
    </div>`),
  },

  /* ---------------- 流れる文字（マーキー） ---------------- */
  marquee: {
    label: '流れる文字',
    icon: '⟶',
    tag: '演出',
    about: '同じ言葉が横に流れ続けます。区切りのしるしや、CONTACT の手前に置く帯として。',
    fields: [
      { key: 'text', label: '流す言葉', type: 'text' },
      { key: 'sep', label: '区切り記号', type: 'text', hint: '空にすると言葉だけが並びます' },
      { key: 'speed', label: '流れる速さ', type: 'range', min: 8, max: 60, suffix: '秒/周' },
      { key: 'dir', label: '向き', type: 'select', options: [['l', '左へ'], ['r', '右へ']] },
      { key: 'size', label: '文字の大きさ', type: 'range', min: 30, max: 180, suffix: 'px' },
      { key: 'outline', label: '中を抜いた文字にする', type: 'toggle' },
      { key: 'href', label: 'リンク先（空でリンクなし）', type: 'text' },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      text: 'CONTACT', sep: '✳', speed: 22, dir: 'l', size: 96,
      outline: false, href: '', bg: 'primary', anchor: '',
    },
    /* 途切れずに流すため、同じ並びを2組出して片方が抜けた瞬間にもう片方が続く。
       中身は装飾なので、読み上げには1組だけ渡す。 */
    render: (p) => {
      const one = Array.from({ length: 6 }, () =>
        `<span class="mq-w">${esc(p.text)}</span>${p.sep ? `<span class="mq-s">${esc(p.sep)}</span>` : ''}`).join('');
      const inner = `<div class="mq-run">${one}</div><div class="mq-run" aria-hidden="true">${one}</div>`;
      const body = p.href
        ? `<a class="mq-in" href="${esc(p.href)}">${inner}</a>`
        : `<div class="mq-in">${inner}</div>`;
      const cls = ['sec', 'sec-marquee', p.bg ? `bg-${p.bg}` : '', p.outline ? 'mq-line' : '',
        p.dir === 'r' ? 'mq-r' : ''].filter(Boolean).join(' ');
      return `<section class="${cls}"${attr('id', p.anchor)}`
        + ` style="--mq-dur:${Math.max(4, p.speed || 22)}s;--mq-size:${Math.max(20, p.size || 96)}px">
${body}
</section>`;
    },
  },

  /* ---------------- コラージュ・ヒーロー ---------------- */
  collage: {
    label: 'コラージュ（縦書き＋斜め写真）',
    icon: '◈',
    tag: '演出',
    about: '写真を敷き詰めた背景に、斜めの写真と縦書きの白い帯を重ねます。イベント・採用・特集の顔に。',
    fields: [
      { key: 'bandR', label: '縦書きの帯（右寄せ・1行＝1列）', type: 'textarea', rows: 3,
        hint: '1行で1列。日本語の縦書きなので、最初の行がいちばん右に来ます' },
      { key: 'bandL', label: '縦書きの帯（左寄せ・1行＝1列）', type: 'textarea', rows: 3 },
      { key: 'photos', label: '写真', type: 'list', addLabel: '写真を追加', titleKey: 'alt',
        item: [
          { key: 'src', label: '画像', type: 'image' },
          { key: 'alt', label: '説明（代替テキスト）', type: 'text' },
        ] },
      { key: 'front', label: '手前に斜めで出す枚数', type: 'range', min: 2, max: 5 },
      { key: 'dark', label: '背景の暗さ', type: 'range', min: 20, max: 85, suffix: '%' },
      { key: 'gray', label: '背景の色を抜く', type: 'toggle' },
      { key: 'float', label: 'ゆっくり浮かせる', type: 'toggle' },
      { key: 'tall', label: '高さ', type: 'select',
        options: [['s', '低め'], ['m', 'ふつう'], ['l', '画面いっぱい']] },
      FIELD.anchor,
    ],
    defaults: {
      bandR: '社会を良くしたい、\nその挑戦を加速する',
      bandL: '社会課題へ挑む\nピッチコンテスト',
      front: 3, dark: 62, gray: true, float: true, tall: 'l', anchor: 'top',
      photos: [
        { src: '', alt: '写真1' }, { src: '', alt: '写真2' }, { src: '', alt: '写真3' },
        { src: '', alt: '写真4' }, { src: '', alt: '写真5' }, { src: '', alt: '写真6' },
      ],
    },
    render: (p) => {
      const pics = (p.photos || []).filter((x) => x && x.src);
      const nFront = Math.max(2, Math.min(5, p.front || 3));
      /* 同じ画像を何十枚も <img> で書くと、data URI がその数だけ複製されて
         書き出したHTMLが何MBにも膨らむ。URIはCSS変数として1回だけ置き、
         タイルは変数を参照するだけにする。 */
      /* style 属性の中なので、URL を囲む引用符はそのまま書けない */
      const vars = pics.map((it, i) => `--cp${i}:url(&quot;${esc(it.src)}&quot;)`).join(';');
      const n = pics.length;
      /* 画面が広いほど列が増えるので、余らせるくらい多めに敷いて溢れは隠す */
      const wall = Array.from({ length: 72 }, (_, i) =>
        `      <span class="cw"${n ? ` style="background-image:var(--cp${i % n})"` : ''}></span>`).join('\n');
      const front = COLLAGE_SLOTS.slice(0, nFront).map(([x, y, w, rot, z, d], i) => {
        const it = pics[i % Math.max(1, n)] || { src: '', alt: '' };
        return `      <figure class="cpic" style="left:${x}%;top:${y}%;--w:${w}%;--rot:${rot}deg;`
          + `--cov:${coverScale(rot)};z-index:${z};--d:${d}ms"${el(p, `pic${i}`, 'ia', `手前の写真${i + 1}`)}`
          + `${imgSlot(`photos.${i}.src`)}><span class="cpic-in">${media(it.src, it.alt)}</span></figure>`;
      }).join('\n');
      const cls = ['sec', 'sec-collage', `cg-${p.tall || 'l'}`, p.gray ? 'cg-gray' : '',
        p.float ? 'cg-float' : ''].filter(Boolean).join(' ');
      return `<section class="${cls}"${attr('id', p.anchor)} data-collage`
        + ` style="--cdark:${(p.dark ?? 62) / 100}${vars ? ';' + vars : ''}">
  <div class="cwall">
${wall}
  </div>
  <div class="cfront">
${front}
  </div>
${bands(p.bandR, 'r')}
${bands(p.bandL, 'l')}
</section>`;
    },
  },

  /* ---------------- お品書き（価格表） ---------------- */
  menu: {
    label: 'お品書き（価格表）',
    icon: '≡',
    about: 'カテゴリごとに品名と価格を並べます。カフェ・飲食店・サロンのメニューに。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'cols', label: '横に並べる数', type: 'select', options: [['c1', '1列'], ['c2', '2列']] },
      { key: 'groups', label: 'カテゴリ', type: 'list', addLabel: 'カテゴリを追加', titleKey: 'name',
        item: [
          { key: 'name', label: 'カテゴリ名', type: 'text' },
          { key: 'note', label: '右肩の注記', type: 'text', hint: 'HOT / ICED など。空でも構いません' },
          { key: 'items', label: '品目', type: 'textarea', rows: 6,
            hint: '1行に1品。「品名 | よみ | 価格」のように縦棒で区切ります' },
        ] },
      { key: 'note', label: '最後の注記', type: 'text' },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'MENU', title: 'お品書き', text: '', cols: 'c2',
      note: '価格はすべて税込です。', bg: '', anchor: 'menu',
      groups: [
        { name: 'COFFEE', note: 'HOT / ICED',
          items: 'ドリップコーヒー | Drip Coffee | 550\nカフェラテ | Café Latte | 600\nカプチーノ | Cappuccino | 600' },
        { name: 'FOOD', note: '',
          items: 'キッシュプレート | サラダ・スープ付 | 1,200\nサンドイッチプレート | サラダ・スープ付 | 1,100' },
      ],
    },
    /* 「品名 | よみ | 価格」の行を、名前・よみ・価格に分ける。
       縦棒が足りない書き方（「品名 価格」だけ等）でも壊れないように、
       最後の1つを価格、最初を品名、あいだをよみとして扱う。 */
    render: (p) => {
      const rows = (txt) => String(txt || '').split('\n').map((l) => l.trim()).filter(Boolean)
        .map((line) => {
          const c = line.split('|').map((s) => s.trim());
          const price = c.length > 1 ? c.pop() : '';
          return { name: c.shift() || '', sub: c.join(' '), price };
        });
      const groups = (p.groups || []).filter((g) => g.name || g.items).map((g, i) => `      <div class="mg"${el(p, `g${i}`, 'ia', `カテゴリ${i + 1}`)}>
        <div class="mg-h">
          <span class="mg-n"${ed(`groups.${i}.name`, 'カテゴリ名')}>${esc(g.name)}</span>
          <span class="mg-rule" aria-hidden="true"></span>
          ${g.note ? `<span class="mg-note">${esc(g.note)}</span>` : ''}
        </div>
        <dl class="mg-l">
${rows(g.items).map((it) => `          <div class="mi">
            <dt><b>${esc(it.name)}</b>${it.sub ? `<i>${esc(it.sub)}</i>` : ''}</dt>
            <dd>${esc(it.price)}</dd>
          </div>`).join('\n')}
        </dl>
      </div>`).join('\n');
      return sec('menu', p,
        `${head(p)}
    <div class="menu-cols ${p.cols === 'c1' ? 'c1' : 'c2'}">
${groups}
    </div>
${p.note ? `    <p class="menu-note"${ed('note', '注記')}>${esc(p.note)}</p>` : ''}`);
    },
  },

  /* ---------------- フッター ---------------- */
  footer: {
    label: 'フッター',
    icon: '▁',
    unique: true,
    fields: [
      { key: 'logo', label: 'サイト名', type: 'text' },
      { key: 'links', label: 'リンク', type: 'list', addLabel: 'リンクを追加', titleKey: 'label',
        item: [
          { key: 'label', label: '表示名', type: 'text' },
          { key: 'href', label: 'リンク先', type: 'text' },
        ] },
      { key: 'copy', label: 'コピーライト', type: 'text' },
    ],
    defaults: {
      logo: 'YOUR LOGO',
      links: [
        { label: 'プライバシーポリシー', href: '#' },
        { label: '特定商取引法に基づく表記', href: '#' },
        { label: 'お問い合わせ', href: '#contact' },
      ],
      copy: '© 2026 Your Company. All rights reserved.',
    },
    render: (p) => `<footer class="ftr">
  <div class="wrap">
    <div class="ftr-in">
      <span class="logo"${ed('logo', 'サイト名')}>${esc(p.logo)}</span>
      <nav class="ftr-nav">${(p.links || []).filter((l) => l.label).map((l) => `<a href="${esc(l.href || '#')}">${esc(l.label)}</a>`).join('')}</nav>
    </div>
    ${p.copy ? `<div class="copy"${ed('copy', 'コピーライト')}>${esc(p.copy)}</div>` : ''}
  </div>
</footer>`,
  },
  /* ================================================================
     ここから下は「スクロールに連動する」特別なブロック
     ================================================================ */

  /* ---------------- 3D製品ビュー ---------------- */
  product3d: {
    label: '3D製品ビュー',
    icon: '◉',
    tag: '3D',
    about: 'スクロールに合わせて立体が360°回転します。画像は不要で、形と色だけで作られます。',
    tall: true,
    fields: [
      { key: 'title', label: '見出し', type: 'text' },
      { key: 'text', label: '補足', type: 'text' },
      { key: 'shape', label: '形', type: 'select',
        options: [['slab', '板（スマホ・タブレット風）'], ['box', '箱（パッケージ風）'], ['tall', '縦長（ボトル・缶風）']] },
      { key: 'turns', label: '回転する回数', type: 'range', min: 1, max: 3, suffix: '周' },
      { key: 'height', label: 'スクロールの長さ', type: 'range', min: 200, max: 600, suffix: 'vh' },
      { key: 'body', label: '本体の色', type: 'color' },
      { key: 'face', label: '正面の色', type: 'color' },
      { key: 'items', label: '途中で出す説明', type: 'list', addLabel: '説明を追加', titleKey: 'value',
        item: [
          { key: 'value', label: '数値・見出し', type: 'text' },
          { key: 'label', label: '説明', type: 'text' },
          { key: 'at', label: '出すタイミング（0〜100%）', type: 'range', min: 0, max: 95, suffix: '%' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: 'スクロールで、360°。', text: 'あらゆる角度から確かめてください。',
      shape: 'slab', turns: 1, height: 400, body: '#8a93a3', face: '#2563eb',
      bg: 'dark', anchor: 'product',
      items: [
        { value: '0.38 kg', label: 'アルミ削り出し筐体', at: 15 },
        { value: '6.7 inch', label: '有機ELディスプレイ', at: 42 },
        { value: '72 h', label: '連続駆動バッテリー', at: 68 },
      ],
    },
    render: (p) => `<section class="pinsec${p.bg ? ` bg-${p.bg}` : ''}" data-p3d
  data-shape="${esc(p.shape || 'slab')}" data-turns="${+p.turns || 1}"
  data-body="${esc(p.body)}" data-face="${esc(p.face)}"
  style="height:${+p.height || 400}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="p3d-deg">000°</div>
    <canvas class="p3d"></canvas>
    <div class="p3d-spec">
${(p.items || []).map((it) => `      <div data-at="${(+it.at || 0) / 100}"><b>${esc(it.value)}</b>${esc(it.label)}</div>`).join('\n')}
    </div>
    <div class="pin-cap">
      ${p.title ? `<b${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</b>` : ''}
      ${p.text ? `<small${ed('text', '補足')}>${esc(p.text)}</small>` : ''}
    </div>
  </div>
</section>`,
  },

  /* ---------------- 分解図 ---------------- */
  exploded: {
    label: '分解図が組み上がる',
    icon: '▤',
    tag: '3D',
    about: 'バラバラの層がスクロールで合体します。各層に画像を入れれば実物の構造説明になります。',
    tall: true,
    fields: [
      { key: 'title', label: '見出し', type: 'text' },
      { key: 'text', label: '補足', type: 'text' },
      { key: 'height', label: 'スクロールの長さ', type: 'range', min: 200, max: 600, suffix: 'vh' },
      { key: 'items', label: '層（上から順）', type: 'list', addLabel: '層を追加', titleKey: 'label',
        item: [
          { key: 'label', label: '層の名前', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
          { key: 'color', label: '色（画像がないとき）', type: 'color' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: 'バラバラの部品が、組み上がる。', text: '4つの層でできています。',
      height: 380, bg: 'dark', anchor: 'structure',
      items: [
        { label: 'DISPLAY', image: '', color: '#22d3ee' },
        { label: 'LOGIC BOARD', image: '', color: '#a78bfa' },
        { label: 'BATTERY', image: '', color: '#fb7185' },
        { label: 'CHASSIS', image: '', color: '#a3e635' },
      ],
    },
    render: (p) => `<section class="pinsec${p.bg ? ` bg-${p.bg}` : ''}" data-exploded
  style="height:${+p.height || 380}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="exp"><div class="exp-in">
${(p.items || []).map((it, i) => `      <div class="exp-l" style="background:${esc(it.color || '#64748b')}"${imgSlot(`items.${i}.image`)} data-elname="層${i + 1}">${it.image ? img(it.image, it.label) : ''}<span>${esc(it.label)}</span></div>`).join('\n')}
    </div></div>
    <div class="pin-cap">
      ${p.title ? `<b${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</b>` : ''}
      ${p.text ? `<small${ed('text', '補足')}>${esc(p.text)}</small>` : ''}
    </div>
  </div>
</section>`,
  },

  /* ---------------- 横に流れるギャラリー ---------------- */
  hscroll: {
    label: '横に流れるギャラリー',
    icon: '⇥',
    tag: 'スクロール',
    about: '縦にスクロールすると、カードが横に流れていきます。実績一覧に向いています。',
    tall: true,
    fields: [
      FIELD.eyebrow, { key: 'title', label: '見出し', type: 'text' },
      { key: 'height', label: 'スクロールの長さ', type: 'range', min: 200, max: 600, suffix: 'vh' },
      { key: 'items', label: 'カード', type: 'list', addLabel: 'カードを追加', titleKey: 'title',
        item: [
          { key: 'no', label: '番号', type: 'text' },
          { key: 'title', label: 'タイトル', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'WORKS', title: '縦にスクロールすると、横に流れる。', height: 340,
      bg: '', anchor: 'works',
      items: [
        { no: '01', title: 'ブランドサイト', image: '' },
        { no: '02', title: 'プロダクト紹介', image: '' },
        { no: '03', title: '採用ページ', image: '' },
        { no: '04', title: 'イベントLP', image: '' },
        { no: '05', title: 'ポートフォリオ', image: '' },
        { no: '06', title: '店舗サイト', image: '' },
      ],
    },
    render: (p) => `<section class="pinsec${p.bg ? ` bg-${p.bg}` : ''}" data-hscroll
  style="height:${+p.height || 340}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="hs-head"><div class="wrap">
      ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${esc(p.eyebrow)}</span>` : ''}
      ${p.title ? `<h2 class="sec-title" style="margin:0"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>` : ''}
    </div></div>
    <div class="hs-track">
${(p.items || []).map((it, i) => `      <div class="hs-card"${imgSlot(`items.${i}.image`)} data-elname="カード${i + 1}">${it.image ? img(it.image, it.title) : ''}<em>${esc(it.no)}</em><b${ed(`items.${i}.title`, 'カード名')}>${esc(it.title)}</b></div>`).join('\n')}
    </div>
  </div>
</section>`,
  },

  /* ---------------- 積み重なるカード ---------------- */
  stackcards: {
    label: '積み重なるカード',
    icon: '▥',
    tag: 'スクロール',
    about: 'カードが重なりながら積み上がります。制作フローやサービス紹介に。',
    fields: [
      FIELD.eyebrow, FIELD.title,
      { key: 'items', label: 'カード', type: 'list', addLabel: 'カードを追加', titleKey: 'title',
        item: [
          { key: 'no', label: '番号・ラベル', type: 'text' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'text', label: '説明', type: 'textarea' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FLOW', title: '制作の流れ', bg: 'surface', anchor: 'flow',
      items: [
        { no: '01 / DISCOVER', title: 'まず、目的を言葉にする', text: '誰に何を届けたいのか。ここが曖昧なままだと、どれだけ綺麗に作っても刺さりません。' },
        { no: '02 / DESIGN', title: '迷わない導線を設計する', text: '読む順番と、押してほしいボタンを決める。装飾はそのあとです。' },
        { no: '03 / BUILD', title: '速く、軽く、実装する', text: '表示速度は離脱率に直結します。動きは目的があるところにだけ。' },
        { no: '04 / GROW', title: '公開してからが本番', text: '数字を見て、直す。作りっぱなしにしない仕組みまで用意します。' },
      ],
    },
    render: (p) => sec('stackcards', p,
      `${head(p)}
    <div class="stack" data-stack>
${(p.items || []).map((it, i) => `      <div class="stackcard">
        <span class="no"${ed(`items.${i}.no`, 'ラベル')}>${esc(it.no)}</span>
        <div>
          <h3${el(p, `card${i}.title`, 'ta', 'カード見出し', `items.${i}.title`)}>${esc(it.title)}</h3>
          <p${ed(`items.${i}.text`, 'カード説明')}>${nl2br(it.text)}</p>
        </div>
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- タイムライン ---------------- */
  timeline: {
    label: 'タイムライン',
    icon: '⌇',
    tag: 'スクロール',
    about: 'スクロールに合わせて線が伸び、通過した項目が点灯します。沿革や導入ステップに。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '項目', type: 'list', addLabel: '項目を追加', titleKey: 'title',
        item: [
          { key: 'label', label: 'ラベル（STEP 01 など）', type: 'text' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'text', label: '説明', type: 'textarea' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FLOW', title: 'ご依頼から公開まで', text: '', bg: '', anchor: 'steps',
      items: [
        { label: 'STEP 01', title: 'お問い合わせ', text: 'フォームからご連絡ください。2営業日以内にご返信します。' },
        { label: 'STEP 02', title: 'ヒアリング', text: 'オンラインで30分ほど。目的・期日・予算感をすり合わせます。' },
        { label: 'STEP 03', title: 'ご提案・お見積り', text: '構成案とデザインの方向性、金額をまとめてお出しします。' },
        { label: 'STEP 04', title: '制作', text: '途中経過を共有しながら進めます。修正は2回まで無料です。' },
        { label: 'STEP 05', title: '公開・運用', text: '公開後1ヶ月は無償サポート。更新方法もレクチャーします。' },
      ],
    },
    render: (p) => sec('timeline', p,
      `${head(p)}
    <div class="tl" data-timeline>
      <div class="tl-rail"></div>
${(p.items || []).map((it, i) => `      <div class="tl-item">
        <small${ed(`items.${i}.label`, 'ラベル')}>${esc(it.label)}</small>
        <b${el(p, `tl${i}.title`, 'ta', '項目見出し', `items.${i}.title`)}>${esc(it.title)}</b>
        <p${ed(`items.${i}.text`, '項目説明')}>${nl2br(it.text)}</p>
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- 円形マスクで切り替え ---------------- */
  clipreveal: {
    label: '円形マスクで切り替え',
    icon: '◍',
    tag: 'スクロール',
    about: 'スクロールすると円が開いて、下の世界に入れ替わります。ビフォーアフターや転換に。',
    tall: true,
    fields: [
      { key: 'height', label: 'スクロールの長さ', type: 'range', min: 150, max: 500, suffix: 'vh' },
      { key: 'titleA', label: '手前の見出し', type: 'text' },
      { key: 'textA', label: '手前の説明', type: 'text' },
      { key: 'imageA', label: '手前の画像URL', type: 'image' },
      { key: 'titleB', label: '奥の見出し', type: 'text' },
      { key: 'textB', label: '奥の説明', type: 'text' },
      { key: 'imageB', label: '奥の画像URL', type: 'image' },
      FIELD.anchor,
    ],
    defaults: {
      height: 260, anchor: 'change',
      titleA: 'これまでの当たり前を、', textA: 'そのままにしていませんか', imageA: '',
      titleB: '塗り替える。', textB: 'ここから、新しい体験がはじまります', imageB: '',
    },
    render: (p) => `<section class="pinsec" data-clip style="height:${+p.height || 260}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="clip-box">
      <div class="clip-side clip-a"${imgSlot('imageA')} data-elname="手前の画像">
        ${p.imageA ? img(p.imageA, p.titleA) : ''}
        <div class="in-txt">
          <h3${el(p, 'titleA', 'ta', '手前の見出し', 'titleA')}>${nl2br(p.titleA)}</h3>
          <p${ed('textA', '手前の説明')}>${esc(p.textA)}</p>
        </div>
      </div>
      <div class="clip-side clip-b"${imgSlot('imageB')} data-elname="奥の画像">
        ${p.imageB ? img(p.imageB, p.titleB) : ''}
        <div class="in-txt">
          <h3${ed('titleB', '奥の見出し')}>${nl2br(p.titleB)}</h3>
          <p${ed('textB', '奥の説明')}>${esc(p.textB)}</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  /* ---------------- 3Dカルーセル ---------------- */
  carousel3d: {
    label: '3Dカルーセル',
    icon: '◎',
    tag: '3D',
    about: '円環に並んだカードがゆっくり回ります。ドラッグで手動でも回せます。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: 'カード', type: 'list', addLabel: 'カードを追加', titleKey: 'title',
        item: [
          { key: 'title', label: 'タイトル', type: 'text' },
          { key: 'sub', label: '小さい文字', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'WORKS', title: '制作実績', text: 'ドラッグすると回せます。',
      bg: 'surface', anchor: 'carousel',
      items: [
        { title: 'ブランドサイト', sub: 'PROJECT 01', image: '' },
        { title: 'ECサイト', sub: 'PROJECT 02', image: '' },
        { title: '採用ページ', sub: 'PROJECT 03', image: '' },
        { title: 'コーポレート', sub: 'PROJECT 04', image: '' },
        { title: 'イベントLP', sub: 'PROJECT 05', image: '' },
        { title: 'ポートフォリオ', sub: 'PROJECT 06', image: '' },
      ],
    },
    render: (p) => sec('carousel', p,
      `${head(p)}
    <div class="car"><div class="car-in">
${(p.items || []).map((it, i) => `      <div class="car-it"${imgSlot(`items.${i}.image`)} data-elname="カード${i + 1}">${it.image ? img(it.image, it.title) : ''}<b${ed(`items.${i}.title`, 'カード名')}>${esc(it.title)}</b><small>${esc(it.sub)}</small></div>`).join('\n')}
    </div></div>`),
  },

  /* ---------------- スロット式カウンター ---------------- */
  slotstats: {
    label: '数字カウンター',
    icon: '＃',
    tag: '数字',
    about: '桁ごとに数字が縦に回って止まります。実績数値を見せるときに。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text, FIELD.cols,
      { key: 'items', label: '数値', type: 'list', addLabel: '数値を追加', titleKey: 'value',
        item: [
          { key: 'value', label: '数値（記号もOK）', type: 'text' },
          { key: 'label', label: '説明', type: 'text' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'NUMBERS', title: '数字で見る私たち', text: '', cols: 'c3',
      bg: 'surface', anchor: 'numbers',
      items: [
        { value: '128,400', label: '累計ダウンロード' },
        { value: '99.8%', label: '稼働率' },
        { value: '2,140', label: '導入企業' },
      ],
    },
    render: (p) => sec('slotstats', p,
      `${head(p)}
    <div class="slots grid ${p.cols || 'c3'}">
${(p.items || []).map((it, i) => `      <div><span class="slot" data-slot="${esc(it.value)}"></span><small${ed(`items.${i}.label`, '説明')}>${esc(it.label)}</small></div>`).join('\n')}
    </div>`),
  },

  /* ---------------- SVG線画のグラフ ---------------- */
  svgdraw: {
    label: '線が引かれるグラフ',
    icon: '⌁',
    tag: '図解',
    about: '棒グラフと折れ線が、線を引くように現れます。実績の推移や比較に。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '棒（最大6本）', type: 'list', addLabel: '棒を追加', titleKey: 'label',
        item: [
          { key: 'label', label: 'ラベル', type: 'text' },
          { key: 'value', label: '高さ（0〜100）', type: 'range', min: 5, max: 100, suffix: '' },
        ] },
      { key: 'line', label: '折れ線も引く', type: 'toggle' },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'GROWTH', title: '数字は伸びています', text: '導入社数の推移',
      line: true, bg: '', anchor: 'graph',
      items: [
        { label: '2021', value: 22 }, { label: '2022', value: 38 },
        { label: '2023', value: 55 }, { label: '2024', value: 74 },
        { label: '2025', value: 92 },
      ],
    },
    render: (p) => {
      const items = (p.items || []).slice(0, 6);
      const n = items.length || 1;
      const W = 600, H = 260, pad = 20;
      const bw = (W - pad * 2) / n * 0.56;
      const x = (i) => pad + (W - pad * 2) / n * (i + 0.5);
      const y = (v) => H - 24 - (H - 60) * (Math.max(5, Math.min(100, +v || 0)) / 100);
      return sec('svgdraw', p,
        `${head(p)}
    <div class="draw-wrap">
      <svg viewBox="0 0 ${W} ${H}" fill="none" stroke-width="2">
${items.map((it, i) => `        <rect x="${(x(i) - bw / 2).toFixed(1)}" y="${y(it.value).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - 24 - y(it.value)).toFixed(1)}" rx="4" stroke="var(--c-primary)"/>`).join('\n')}
${p.line ? `        <polyline points="${items.map((it, i) => `${x(i).toFixed(1)},${(y(it.value) - 10).toFixed(1)}`).join(' ')}" stroke="var(--c-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
        <line x1="${pad}" y1="${H - 24}" x2="${W - pad}" y2="${H - 24}" stroke="var(--c-border)"/>
      </svg>
      <div class="draw-lbl">${items.map((it, i) => `<span${ed(`items.${i}.label`, 'ラベル')}>${esc(it.label)}</span>`).join('')}</div>
    </div>`);
    },
  },

  /* ---------------- スライドページ ---------------- */
  slides: {
    label: 'スライドページ',
    icon: '❐',
    tag: 'スクロール',
    about: 'スクロール1回で1枚めくる全画面スライド。表示のたびに図と数字が最初から再生されます。',
    tall: true,
    fields: [
      { key: 'items', label: 'スライド', type: 'list', addLabel: 'スライドを追加', titleKey: 'title',
        item: [
          { key: 'no', label: '番号', type: 'text' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'lead', label: 'リード文', type: 'textarea' },
          { key: 'bullets', label: '箇条書き（改行区切り）', type: 'textarea' },
          { key: 'num', label: '大きな数字（任意）', type: 'text' },
          { key: 'suffix', label: '数字の単位', type: 'text' },
          { key: 'viz', label: '左の図', type: 'select',
            options: [['bar', '棒グラフが伸びる'], ['line', '線が描かれる'], ['ring', '円が満ちる']] },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      bg: 'dark', anchor: 'slides',
      items: [
        { no: '01', title: '速さで、選ばれる。', lead: 'ご相談から公開まで、最短3日。', num: '3', suffix: '日',
          bullets: '構成案は当日中にお出しします\n修正は2回まで無料\n公開後1ヶ月は無償サポート', viz: 'bar' },
        { no: '02', title: '数字で、伸ばす。', lead: '公開したあとの改善までが仕事です。', num: '182', suffix: '%',
          bullets: '問い合わせ数の推移を毎月共有\n離脱の多い場所から直す\n施策の効果を数字で確認', viz: 'line' },
        { no: '03', title: '長く、使える。', lead: '自分たちで更新できる形でお渡しします。', num: '96', suffix: '%',
          bullets: '専門知識がいらないシンプルな構造\n更新方法をレクチャー\n1ファイルで完結', viz: 'ring' },
      ],
    },
    render: (p) => {
      const items = (p.items || []);
      const n = Math.max(1, items.length);
      const viz = (kind, i) => {
        if (kind === 'line') {
          const pts = [[10, 150], [70, 122], [130, 128], [190, 84], [250, 60], [310, 24]];
          return `<svg viewBox="0 0 330 180" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="10" y1="168" x2="320" y2="168" stroke="var(--c-border)" stroke-width="2" data-draw style="--d:0s"/>
          <polyline points="${pts.map((q) => q.join(',')).join(' ')}" stroke="var(--c-primary)" data-draw style="--d:.15s"/>
          ${pts.map((q, k) => `<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="var(--c-primary)" stroke="none" data-draw style="--d:${(0.4 + k * 0.08).toFixed(2)}s"/>`).join('')}
        </svg>`;
        }
        if (kind === 'ring') {
          return `<svg viewBox="0 0 200 200" fill="none" stroke-width="14">
          <circle cx="100" cy="100" r="78" stroke="var(--c-border)"/>
          <circle cx="100" cy="100" r="78" stroke="var(--c-primary)" stroke-linecap="round"
                  transform="rotate(-90 100 100)" data-draw style="--d:.1s"/>
        </svg>`;
        }
        const hs = [34, 58, 46, 78, 96];
        return `<svg viewBox="0 0 330 180" fill="none">
          <line x1="10" y1="168" x2="320" y2="168" stroke="var(--c-border)" stroke-width="2" data-draw style="--d:0s"/>
          ${hs.map((h, k) => `<rect class="bar" x="${28 + k * 60}" y="${168 - h * 1.45}" width="34" height="${h * 1.45}" rx="3"
              fill="var(--c-primary)" style="--d:${(0.15 + k * 0.09).toFixed(2)}s"/>`).join('')}
        </svg>`;
      };

      const slides = items.map((it, i) => `      <div class="sl" style="--i:${i}">
        <div class="sl-viz">${viz(it.viz, i)}</div>
        <div class="sl-body">
          <span class="sl-no"${ed(`items.${i}.no`, '番号')}>${esc(it.no)}</span>
          ${it.num ? `<b class="sl-num" data-count="${esc(it.num)}"${it.suffix ? ` data-suffix="${esc(it.suffix)}"` : ''}>0</b>` : ''}
          <h3${el(p, `sl${i}.title`, 'ta', 'スライド見出し', `items.${i}.title`)}>${nl2br(it.title)}</h3>
          ${it.lead ? `<p class="sl-lead"${ed(`items.${i}.lead`, 'リード文')}>${nl2br(it.lead)}</p>` : ''}
          ${it.bullets ? `<ul>${(it.bullets || '').split('\n').filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`).join('\n');

      return `<section class="pinsec slidesec${p.bg ? ` bg-${p.bg}` : ''}" data-slides
  style="height:${n * 100}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="sl-stage">
${slides}
    </div>
    <nav class="sl-dots">${items.map((it, i) => `<button aria-label="${i + 1}枚目へ"${i === 0 ? ' class="on"' : ''}></button>`).join('')}</nav>
  </div>
</section>`;
    },
  },

  /* ---------------- 全画面メッセージ ---------------- */
  shift: {
    label: '全画面メッセージ',
    icon: '◧',
    tag: '演出',
    about: '画面いっぱいに1つの言葉だけを置きます。色を変えると空気が切り替わります。',
    fields: [
      { key: 'title', label: '見出し', type: 'textarea', rows: 2 },
      { key: 'text', label: '説明', type: 'text' },
      { key: 'bgColor', label: '背景色', type: 'color' },
      { key: 'fgColor', label: '文字色', type: 'color' },
      FIELD.anchor,
    ],
    defaults: {
      title: '白に、なる。', text: '色が変わると、空気が変わります。',
      bgColor: '#f4f1ea', fgColor: '#1a1a17', anchor: '',
    },
    render: (p) => `<section class="shift-pane" style="background:${esc(p.bgColor)};color:${esc(p.fgColor)}"${attr('id', p.anchor)}>
  <div class="wrap">
    ${p.title ? `<h3${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h3>` : ''}
    ${p.text ? `<p${ed('text', '説明')}>${esc(p.text)}</p>` : ''}
  </div>
</section>`,
  },
};

/* 追加メニューに出す順番（ヘッダー・フッターは常設なので除く） */
const ADDABLE = [
  'hero', 'collage', 'features', 'about', 'gallery', 'menu', 'marquee', 'pricing', 'faq', 'cta', 'contact', 'rich',
  'slides', 'product3d', 'exploded', 'hscroll', 'stackcards', 'timeline', 'clipreveal',
  'carousel3d', 'slotstats', 'svgdraw', 'shift',
];
