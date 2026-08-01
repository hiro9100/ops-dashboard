/* スクロール連動ヒーローの見本。4種を縦に並べる。
   実行: node examples/build-scroll-demo.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, Date, JSON });
for (const f of ['assets/site-css.js', 'assets/blocks.js', 'assets/templates.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
vm.runInContext('globalThis.__api={BLOCKS,SITE_CSS,SITE_JS,fontStack,HERO_SCROLLS};', ctx);
const { BLOCKS, SITE_CSS, SITE_JS, fontStack, HERO_SCROLLS } = ctx.__api;
const photo = JSON.parse(fs.readFileSync(path.join(__dirname, 'verdure-photos.json'), 'utf8'));

const PIC = { zoomout: photo.exterior, parallax: photo.terrace,
  curtain: photo.interior, maskzoom: photo.exterior };
const COPY = {
  zoomout: ['写真が縮んで枠に収まる', '全画面の写真が、スクロールで角の丸い1枚に収まります。'],
  parallax: ['写真と文字がずれて流れる', '写真はゆっくり、文字は速く。奥行きが出ます。'],
  curtain: ['幕が上下に開く', '閉じた幕が割れて、写真が現れます。'],
  maskzoom: ['文字の中から写真が広がる', '写真で塗った文字が拡大し、画面いっぱいの写真になります。'],
};

const sections = HERO_SCROLLS.filter(([k]) => k !== 'none').map(([key]) => {
  const [title, text] = COPY[key];
  const hero = BLOCKS.hero.render(Object.assign({}, BLOCKS.hero.defaults, {
    layout: 'cover', eyebrow: key.toUpperCase(), overlay: 44, anchor: `s-${key}`,
    image: PIC[key], scroll: key, scrollLen: 220, title, text,
    buttons: [{ label: 'ボタン', href: '#', style: 'primary' }],
  }));
  /* どこまで進んだか分かるよう、間に区切りを入れる */
  return hero + `\n<section class="sec"><div class="wrap"><div class="sec-head">
    <span class="eyebrow">NEXT</span><h2 class="sec-title">${title}のあと</h2>
    <p class="sec-sub">ヒーローが動ききると、ふつうのセクションに渡ります。</p></div></div></section>`;
});

const theme = { primary:'#4e6046', accent:'#8a7a5c', bg:'#fdfcf8', surface:'#f2efe6',
  text:'#2b2b26', muted:'#71705f', border:'#e0dccd', dark:'#2f342c',
  radius:4, max:1080, font:'gothic', fontHead:'mincho' };
const on = (h) => { const n=parseInt(h.slice(1),16);
  const L=(v)=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
  return (0.2126*L((n>>16)&255)+0.7152*L((n>>8)&255)+0.0722*L(n&255))>0.42?'#111111':'#ffffff'; };

fs.writeFileSync(path.join(__dirname, 'hero-scroll.html'), `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>スクロール連動ヒーローの見本</title>
<style>
:root{--c-primary:${theme.primary};--c-accent:${theme.accent};--c-bg:${theme.bg};
--c-surface:${theme.surface};--c-text:${theme.text};--c-muted:${theme.muted};
--c-border:${theme.border};--c-dark:${theme.dark};--radius:${theme.radius}px;--max:${theme.max}px;
--font:${fontStack(theme.font)};--font-head:${fontStack(theme.fontHead)};
--c-on-primary:${on(theme.primary)};--c-on-accent:${on(theme.accent)};--c-on-dark:${on(theme.dark)};
--ta-dur:1s;--ta-stagger:.04s;--ta-ease:cubic-bezier(.2,.7,.3,1);}
${SITE_CSS}
</style></head>
<body class="tpl-shop sty-edit" data-anim="fadeup" data-reveal="0">
${sections.join('\n')}
<script>${SITE_JS}<\/script></body></html>`);
console.log('examples/hero-scroll.html を作成しました');
