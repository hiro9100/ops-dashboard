/* ヒーロー装飾レイヤーの見本ページ。
   同じ写真・同じ文言で装飾だけを変え、8種類を縦に並べる。
   実行: node examples/build-deco-demo.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, Date, JSON });
for (const f of ['assets/site-css.js', 'assets/blocks.js', 'assets/templates.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
vm.runInContext('globalThis.__api = { BLOCKS, SITE_CSS, SITE_JS, fontStack, HERO_DECOS };', ctx);
const { BLOCKS, SITE_CSS, SITE_JS, fontStack, HERO_DECOS } = ctx.__api;

const photo = JSON.parse(fs.readFileSync(path.join(__dirname, 'verdure-photos.json'), 'utf8'));

const theme = {
  primary: '#4e6046', accent: '#8a7a5c', bg: '#fdfcf8', surface: '#f2efe6',
  text: '#2b2b26', muted: '#71705f', border: '#e0dccd', dark: '#2f342c',
  radius: 4, max: 1080, font: 'gothic', fontHead: 'mincho',
};

const COPY = {
  clouds: ['ふわふわ雲', '光のかたまりがゆっくり漂い、ポインタに合わせて奥行きがずれます。'],
  glass: ['すりガラス', 'ポインタを追いかけて、背後の写真がぼけます。大小2枚が違う速さで追います。'],
  aurora: ['オーロラ', 'メインカラーとアクセントカラーが溶け合って流れます。'],
  dust: ['光の粒', 'ゆっくり昇る粒。ポインタが近づくと押しのけられます。'],
  spot: ['スポットライト', 'ポインタのまわりだけが明るくなります。'],
  depth: ['奥行き', '写真と文字が逆向きに動いて、立体に見えます。'],
  silk: ['流れる線', '絹のような帯が、ゆっくり横切ります。'],
};

const heroes = HERO_DECOS.filter(([k]) => k !== 'none').map(([key, label]) => {
  const [title, text] = COPY[key];
  return BLOCKS.hero.render(Object.assign({}, BLOCKS.hero.defaults, {
    layout: 'cover', eyebrow: label.toUpperCase(), overlay: 46, anchor: `d-${key}`,
    image: photo.exterior, deco: key, decoStrength: 60, grain: false,
    title, text,
    buttons: [{ label: 'ボタンの見え方', href: '#', style: 'primary' }],
  }));
});

/* 粒状感は他と重ねられるので、最後に「雲＋粒状感」を1枚 */
heroes.push(BLOCKS.hero.render(Object.assign({}, BLOCKS.hero.defaults, {
  layout: 'cover', eyebrow: 'CLOUDS + GRAIN', overlay: 46, anchor: 'd-grain',
  image: photo.exterior, deco: 'clouds', decoStrength: 60, grain: true,
  title: '雲＋フィルムの粒状感',
  text: '粒状感は単独の装飾ではなく、どれにでも重ねられます。',
  buttons: [{ label: 'ボタンの見え方', href: '#', style: 'primary' }],
})));

function readableOn(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.42 ? '#111111' : '#ffffff';
}

const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ヒーロー装飾の見本</title>
<style>
:root{
  --c-primary:${theme.primary};--c-accent:${theme.accent};--c-bg:${theme.bg};
  --c-surface:${theme.surface};--c-text:${theme.text};--c-muted:${theme.muted};
  --c-border:${theme.border};--c-dark:${theme.dark};
  --radius:${theme.radius}px;--max:${theme.max}px;
  --font:${fontStack(theme.font)};--font-head:${fontStack(theme.fontHead)};
  --c-on-primary:${readableOn(theme.primary)};--c-on-accent:${readableOn(theme.accent)};
  --c-on-dark:${readableOn(theme.dark)};
  --ta-dur:1s;--ta-stagger:.04s;--ta-ease:cubic-bezier(.2,.7,.3,1);
}
${SITE_CSS}
.hero{min-height:78vh;display:grid;align-items:center}
</style></head>
<body class="tpl-shop sty-edit" data-anim="fadeup" data-reveal="0">
${heroes.join('\n\n')}
<script>${SITE_JS}<\/script>
</body></html>`;

const out = path.join(__dirname, 'hero-deco.html');
fs.writeFileSync(out, html);
console.log(`${out} を作成しました (${Math.round(html.length / 1024)} KB)`);
