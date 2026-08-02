/* このツール自体のサービスLP。
   ツール本体のブロックだけで組んでいる（＝製品が自分自身を説明できる）。
   実行: node examples/build-service-lp.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, Date, JSON });
for (const f of ['assets/site-css.js', 'assets/blocks.js', 'assets/templates.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
vm.runInContext('globalThis.__api = { BLOCKS, SITE_CSS, SITE_JS, fontStack };', ctx);
const { BLOCKS, SITE_CSS, SITE_JS, fontStack } = ctx.__api;

/* ---------- 配色 ----------
   参考にしたSaaSのLPと同じ組み。ほぼ無彩色のグレー階調に、
   差し色をコーラル1色だけ。色数を絞るほど、写真とUIが前に出る。 */
const theme = {
  primary: '#ed646f', accent: '#f69ea5', bg: '#fafafa', surface: '#ffffff',
  text: '#27272a', muted: '#71717a', border: '#e4e4e7', dark: '#27272a',
  radius: 12, max: 1200, font: 'gothic', fontHead: 'gothic',
};
const motion = { anim: 'maskline', dur: 950, stagger: 36, ease: 'cubic-bezier(.16,1,.3,1)', reveal: true, smooth: true };
const meta = {
  lang: 'ja',
  title: 'ホームページを、プロンプトなしで。｜かんたんHP作成ツール',
  description: 'テンプレートを選んで、文字と写真を差し替えるだけ。制作会社のサイトと同じ作法の動きを持ったホームページが、HTML1ファイルで手に入ります。',
};

const blocks = [
  ['header', {
    logo: 'PAGE STUDIO', sticky: true, cta: '無料ではじめる', ctaHref: './app/',
    nav: [
      { label: 'できること', href: '#solutions' },
      { label: 'テンプレート', href: '#templates' },
      { label: '料金', href: '#price' },
      { label: 'よくある質問', href: '#faq' },
    ],
  }],

  ['hero', {
    layout: 'center', eyebrow: 'NO PROMPT, NO CODE', anchor: 'top', bg: '',
    title: '写真を数枚えらぶだけで、\nホームページができます。',
    text: '業種をえらぶ、名前を入れる、写真をえらぶ。決めるのはこの3つだけ。'
      + '文章も配色も写真の配置も、こちらで埋めます。',
    buttons: [
      { label: '無料ではじめる', href: './app/', style: 'primary' },
      { label: 'できることを見る', href: '#solutions', style: 'ghost' },
    ],
    anims: { title: { a: 'maskline' }, text: { a: 'fadeup', d: 260 } },
  }],

  /* 実績の数字を先に置く運び。持っていない数字は書かず、
     「中に入っているもの」の実数だけを出す。 */
  ['slotstats', {
    eyebrow: 'WHAT’S INSIDE', title: '', text: '', cols: 'c4',
    bg: 'surface', anchor: 'numbers',
    items: [
      { value: '3', label: '決めることの数' },
      { value: '10', label: '業種の型' },
      { value: '14', label: 'テンプレート' },
      { value: '25', label: '追加できるブロック' },
    ],
  }],

  ['features', {
    eyebrow: 'SOLUTIONS', title: 'ホームページ作りの、\nこんなところで止まりませんか。',
    text: '止まる場所は、だいたい決まっています。そこを先に外しました。',
    cols: 'c3', style: 'paren', bg: '', anchor: 'solutions',
    items: [
      { title: '何を書けばいいか分からない',
        text: '書かなくて構いません。業種をえらぶと、その商売に合った文章が'
          + 'すでに入った状態で出てきます。気になるところだけ直せば終わりです。' },
      { title: '写真をどこに置けばいいか分からない',
        text: 'まとめて選ぶだけで、こちらが配置します。1枚目は大きく上に、'
          + '残りはギャラリーへ。色も写真から拾って合わせます。' },
      { title: '公開のしかたが分からない',
        text: '書き出しはHTML1ファイル。サーバーに置くだけで公開できます。'
          + 'ビルドもデータベースも要りません。' },
    ],
  }],

  ['about', {
    eyebrow: '( 01 )', title: '決めるのは、3つだけ。',
    image: '', reverse: false, bg: 'surface', anchor: 'edit',
    body: '① 業種をえらぶ — カフェ、美容室、工務店など10種から近いものを1つ。\n\n'
      + '② 名前を入れる — お店や会社の名前。見出しとロゴに入ります。\n\n'
      + '③ 写真をえらぶ — カメラロールからまとめて。1枚目が大きく上に来て、'
      + '残りはギャラリーに並びます。写真の色みを拾って、配色もそこに合わせます。\n\n'
      + 'ここまでスマホで完結します。このあとは、気になるところだけ直してください。',
    buttons: [{ label: 'テンプレートを見る', href: './app/', style: 'ghost' }],
    anims: { image: { a: 'wipe' } },
  }],

  ['about', {
    eyebrow: '( 02 )', title: '動きは、\n作法まで持ってきました。',
    image: '', reverse: true, bg: '', anchor: 'motion',
    body: 'ホイールを止めたあと少し滑って止まる慣性スクロール。'
      + '見出し・説明・カードが 0.07秒ずつずれて組み上がる出現。\n\n'
      + 'ホバーは薄くなるのが 0.06秒、戻りが 0.5秒。ゆっくり薄くなるとためらって見えます。\n\n'
      + '寸法は画面幅に比例します。1440pxを基準に、広い画面では文字も余白も一緒に育ちます。',
    buttons: [{ label: '動きの一覧を見る', href: './demo/hero-deco.html', style: 'ghost' }],
    anims: { image: { a: 'tilt3d' } },
  }],

  ['hscroll', {
    eyebrow: 'TEMPLATES', title: '14種のテンプレート', height: 380,
    bg: 'surface', anchor: 'templates',
    items: [
      { no: '01', title: '採用・コーポレート', image: '' },
      { no: '02', title: 'ショップ・カフェ', image: '' },
      { no: '03', title: '複合施設・商業施設', image: '' },
      { no: '04', title: 'クリニック・サロン', image: '' },
      { no: '05', title: '解体・建設・職人', image: '' },
      { no: '06', title: 'SNS動画・クリエイティブ', image: '' },
    ],
  }],

  ['marquee', {
    text: 'NO PROMPT', sep: '✳', speed: 26, dir: 'l', size: 92,
    outline: false, href: '', bg: 'primary', anchor: '',
  }],

  ['pricing', {
    eyebrow: 'PRICE', title: 'ずっと無料で使えます',
    text: '書き出したHTMLはあなたのものです。ロゴも広告も入りません。',
    cols: 'c3', bg: '', anchor: 'price',
    items: [
      { name: 'FREE', price: '¥0', unit: '',
        features: 'テンプレート14種\nブロック25種\nHTML1ファイル書き出し\n商用利用OK',
        btn: 'はじめる', href: './app/', featured: true, tag: 'いまはこれだけ' },
      { name: 'テンプレート追加', price: '準備中', unit: '',
        features: '業種別のテンプレート\n配色パレットの追加\n作例つき',
        btn: '通知を受け取る', href: '#cta', featured: false, tag: '' },
      { name: '制作代行', price: 'ご相談', unit: '',
        features: '写真・文章の用意\n独自ドメインの設定\n公開までの代行',
        btn: '相談する', href: '#cta', featured: false, tag: '' },
    ],
  }],

  ['faq', {
    eyebrow: 'FAQ', title: 'よくあるご質問', text: '', bg: 'surface', anchor: 'faq',
    items: [
      { q: 'プログラミングの知識は要りますか？', open: true,
        a: '要りません。文字はプレビューの上でダブルクリック、写真は枠をタップして選ぶだけです。'
          + 'コードを開く必要は一度もありません。' },
      { q: 'どのくらいで形になりますか？', open: false,
        a: '業種をえらび、名前を入れ、写真をえらぶ。この3つだけで1枚できあがります。'
          + '写真が手元にあれば数分です。写真が無くても、あとから足せます。' },
      { q: '作ったサイトはどこに公開できますか？', open: false,
        a: 'HTML1ファイルで書き出されるので、レンタルサーバー、Netlify、GitHub Pages など、'
          + 'どこにでも置けます。ビルドもデータベースも不要です。' },
      { q: 'スマホだけで作れますか？', open: false,
        a: '作れます。820px以下では編集画面が1画面＋下から出るシートに切り替わります。'
          + '写真もカメラロールからそのまま入ります。' },
      { q: '写真がないのですが。', open: false,
        a: '写真が無い枠にはプレースホルダが出るので、まず文章だけで形にできます。'
          + '写真は後から差し替えられます。' },
      { q: '作ったデータは他のパソコンでも開けますか？', open: false,
        a: '保存先がブラウザの中なので、いまは引き継げません。'
          + 'HTMLを書き出して持ち運んでください。ここは次に直します。' },
    ],
  }],

  ['cta', {
    title: 'まずは1ページ、\n作ってみてください。',
    text: '登録もインストールも要りません。開いた瞬間から編集できます。',
    bg: 'primary', anchor: 'cta',
    buttons: [{ label: '無料ではじめる', href: './app/', style: 'ghost' }],
  }],

  ['footer', {
    logo: 'PAGE STUDIO',
    links: [
      { label: 'できること', href: '#solutions' },
      { label: 'テンプレート', href: '#templates' },
      { label: '料金', href: '#price' },
      { label: 'よくある質問', href: '#faq' },
    ],
    copy: '© 2026 PAGE STUDIO',
  }],
];

/* ---------- 書き出し ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function readableOn(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.42 ? '#111111' : '#ffffff';
}

const themeCSS = `:root{
  --c-primary:${theme.primary};--c-accent:${theme.accent};--c-bg:${theme.bg};
  --c-surface:${theme.surface};--c-text:${theme.text};--c-muted:${theme.muted};
  --c-border:${theme.border};--c-dark:${theme.dark};
  --radius:${theme.radius}px;--max:${theme.max}px;
  --font:${fontStack(theme.font)};--font-head:${fontStack(theme.fontHead)};
  --c-on-primary:${readableOn(theme.primary)};--c-on-accent:${readableOn(theme.accent)};
  --c-on-dark:${readableOn(theme.dark)};
  --ta-dur:${motion.dur / 1000}s;--ta-stagger:${motion.stagger / 1000}s;--ta-ease:${motion.ease};
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
<body class="tpl-corporate" data-anim="${esc(motion.anim)}" data-reveal="1" data-smooth="1">

${body}

<script>${SITE_JS}<\/script>
</body>
</html>`;

const out = path.join(__dirname, 'service-lp.html');
fs.writeFileSync(out, html);
console.log(`${out} を作成しました (${Math.round(html.length / 1024)} KB)`);
