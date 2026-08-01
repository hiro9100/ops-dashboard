/* Café Verdure のサイトを1ファイルのHTMLとして書き出す。
   ビルダー本体の blocks.js / templates.js / site-css.js をそのまま読み込んで
   使うので、ブロックやCSSを直せばこの見本も同じように直る。

   写真は data URI で埋め込むため、出来上がったHTMLは単体で開ける。
   実行: node examples/build-verdure.js
*/
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, Date, JSON });
for (const f of ['assets/site-css.js', 'assets/blocks.js', 'assets/templates.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
/* 各ファイルは const で宣言しているので、そのままでは ctx のプロパティにならない。
   同じコンテキストで動く後続スクリプトからは参照できるので、そこで受け渡す。 */
vm.runInContext(
  'globalThis.__api = { BLOCKS, TEMPLATES, SITE_CSS, SITE_JS, fontStack };', ctx);
const { BLOCKS, SITE_CSS, SITE_JS, fontStack } = ctx.__api;

const photo = JSON.parse(fs.readFileSync(path.join(__dirname, 'verdure-photos.json'), 'utf8'));

/* ---------- 配色 ----------
   写真の緑・白壁・木の色と、お品書きの深緑＋生成りに合わせる。 */
const theme = {
  primary: '#4e6046', accent: '#8a7a5c', bg: '#fdfcf8', surface: '#f2efe6',
  text: '#2b2b26', muted: '#71705f', border: '#e0dccd', dark: '#2f342c',
  radius: 4, max: 1080, font: 'gothic', fontHead: 'mincho',
};
const motion = { anim: 'fadeup', dur: 1000, stagger: 40, ease: 'cubic-bezier(.2,.7,.3,1)', reveal: true };
const meta = {
  lang: 'ja',
  title: 'Café Verdure｜木漏れ日のガーデンカフェ',
  description: '緑に囲まれた小さなカフェ。自家焙煎のコーヒーと、季節の野菜を使ったプレートをご用意しています。テラス席もございます。',
};

/* ---------- ページの中身 ---------- */
const blocks = [
  ['header', {
    logo: 'Café Verdure', sticky: true, cta: 'ご予約', ctaHref: '#access',
    nav: [
      { label: 'お店について', href: '#about' },
      { label: 'おすすめ', href: '#signature' },
      { label: 'お品書き', href: '#menu' },
      { label: 'アクセス', href: '#access' },
    ],
  }],

  ['hero', {
    layout: 'cover', eyebrow: 'GARDEN CAFÉ', overlay: 46, anchor: 'top',
    image: photo.exterior, deco: 'glass', decoStrength: 60, grain: true,
    title: '木漏れ日の下で、\nひと息を。',
    text: '緑に囲まれた小さな一軒。淹れたてのコーヒーと、季節の野菜のプレートを。',
    buttons: [
      { label: 'お品書きを見る', href: '#menu', style: 'primary' },
      { label: 'アクセス', href: '#access', style: 'ghost' },
    ],
    anims: { title: { a: 'maskline' }, text: { a: 'fadeup', d: 300 } },
  }],

  ['about', {
    eyebrow: 'ABOUT', title: '緑を眺めながら、\nゆっくりと。',
    image: photo.interior, reverse: false, bg: '', anchor: 'about',
    body: '大きな窓いっぱいに庭の緑が広がる、木のぬくもりのある店内です。\n\n'
      + '一枚板のテーブルと、ゆったり座れる椅子。となりの席との距離をすこし広めにとっているので、'
      + '読書やお仕事にも、静かなおしゃべりにも使っていただけます。\n\n'
      + 'お一人でふらりと立ち寄って、窓の外を眺めているだけの時間も、どうぞ大切に。',
    buttons: [{ label: 'お品書きを見る', href: '#menu', style: 'ghost' }],
    anims: { image: { a: 'wipe' } },
  }],

  ['features', {
    eyebrow: 'SIGNATURE', title: 'まずはこの3つを', style: 'image', cols: 'c3',
    text: '迷ったら、この組み合わせがおすすめです。\nお食事のご提供は 11:00 から 15:00 まで。数に限りがございますので、お早めにどうぞ。',
    bg: '', anchor: 'signature',
    items: [
      { image: photo.latte, title: 'カフェラテ　¥600',
        text: 'ミルクの甘みが立つよう、浅めに焙煎した豆で。ホットもアイスもご用意しています。' },
      { image: photo.cake, title: 'バスクチーズケーキ　¥600',
        text: '表面をしっかり焼き込んだ、濃厚だけれど後味の軽い一切れ。数量限定です。' },
      { image: photo.food, title: 'サンドイッチプレート　¥1,100',
        text: '自家製全粒粉パンに、生ハムと彩り野菜を。サラダと季節のスープが付きます。' },
    ],
    anims: { card0: { a: 'slideup' }, card1: { a: 'slideup', d: 120 }, card2: { a: 'slideup', d: 240 } },
  }],

  ['menu', {
    eyebrow: 'MENU', title: 'お品書き', text: '', cols: 'c2',
    note: '価格はすべて税込です。', bg: 'surface', anchor: 'menu',
    groups: [
      { name: 'COFFEE', note: 'HOT / ICED', items:
        'Drip Coffee | ドリップコーヒー | 550\n'
        + 'Café Latte | カフェラテ | 600\n'
        + 'Cappuccino | カプチーノ | 600\n'
        + 'Americano | アメリカーノ | 500\n'
        + 'Espresso | エスプレッソ | 450' },
      { name: 'TEA', note: 'HOT / ICED', items:
        'Organic Earl Grey | オーガニック アールグレイ | 550\n'
        + 'Jasmine Tea | ジャスミンティー | 550\n'
        + 'Herbal Tea | ハーブティー | 600' },
      { name: 'FOOD', note: 'プレートはサラダ・スープ付', items:
        'Quiche Plate | キッシュプレート | 1,200\n'
        + 'Sandwich Plate | サンドイッチプレート | 1,100\n'
        + 'Soup | 季節のスープ | 500' },
      { name: 'SWEETS', note: '', items:
        'Basque Cheesecake | バスクチーズケーキ | 600\n'
        + 'Chocolate Cake | ガトーショコラ | 600\n'
        + 'Affogato | アフォガート | 650' },
      { name: 'DRINK OTHERS', note: '', items:
        'Fresh Lemonade | 自家製レモネード | 600\n'
        + 'Apple Juice | りんごジュース | 500\n'
        + 'Sparkling Water | スパークリングウォーター | 500' },
    ],
  }],

  /* 写真をそのまま見せる間（ま）。テラスの紹介を兼ねる。 */
  ['hero', {
    layout: 'cover', eyebrow: 'TERRACE', overlay: 50, anchor: 'terrace',
    image: photo.terrace, deco: 'dust', decoStrength: 55,
    title: '風の抜ける、\nテラス席。',
    text: '気持ちのよい日は、木々に囲まれた外の席でどうぞ。ペットとご一緒でも大丈夫です。',
    buttons: [],
    anims: { title: { a: 'maskline' } },
  }],

  ['contact', {
    eyebrow: 'ACCESS', title: 'アクセス・ご予約',
    text: 'テラス席・4名さま以上のご利用は、お電話でのご予約を承っております。',
    tel: '03-1234-5678', email: 'hello@cafe-verdure.jp',
    address: '東京都〇〇区〇〇 2-14-3',
    hours: '11:00 - 18:00（L.O. 17:30）／ 火曜・水曜 定休',
    form: true, action: '', submit: '予約を申し込む', bg: 'surface', anchor: 'access',
  }],

  ['footer', {
    logo: 'Café Verdure',
    links: [
      { label: 'お店について', href: '#about' },
      { label: 'お品書き', href: '#menu' },
      { label: 'アクセス', href: '#access' },
    ],
    copy: '© 2026 Café Verdure',
  }],
];

/* ---------- 書き出し（app.js の fullHTML と同じ組み立て） ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function readableOn(hex) {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  const n = parseInt(full, 16);
  if (isNaN(n) || full.length !== 6) return '#ffffff';
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.42 ? '#111111' : '#ffffff';
}

const themeCSS = `:root{
  --c-primary:${theme.primary};
  --c-accent:${theme.accent};
  --c-bg:${theme.bg};
  --c-surface:${theme.surface};
  --c-text:${theme.text};
  --c-muted:${theme.muted};
  --c-border:${theme.border};
  --c-dark:${theme.dark};
  --radius:${theme.radius}px;
  --max:${theme.max}px;
  --font:${fontStack(theme.font)};
  --font-head:${fontStack(theme.fontHead)};
  --c-on-primary:${readableOn(theme.primary)};
  --c-on-accent:${readableOn(theme.accent)};
  --c-on-dark:${readableOn(theme.dark)};
  --ta-dur:${motion.dur / 1000}s;
  --ta-stagger:${motion.stagger / 1000}s;
  --ta-ease:${motion.ease};
}`;

const body = blocks
  .map(([type, props]) => BLOCKS[type].render(Object.assign({}, BLOCKS[type].defaults, props)))
  .join('\n\n')
  .replace(/ data-(?:el|elname|elkind|prop|imgprop)="[^"]*"/g, '');

const html = `<!DOCTYPE html>
<html lang="${esc(meta.lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:type" content="website">
<style>
${themeCSS}
${SITE_CSS}
</style>
</head>
<body class="tpl-shop sty-edit" data-anim="${esc(motion.anim)}" data-reveal="${motion.reveal ? 1 : 0}" data-smooth="1">

${body}

<script>${SITE_JS}<\/script>
</body>
</html>`;

const out = path.join(__dirname, 'cafe-verdure.html');
fs.writeFileSync(out, html);
console.log(`${out} を作成しました (${Math.round(html.length / 1024)} KB)`);
