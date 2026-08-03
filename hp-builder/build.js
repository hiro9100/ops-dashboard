/* index.html と assets/* を 1枚のHTMLにまとめて dist/index.html を作る。
   使い方: node build.js
   （公開・配布用。開発は分割されたファイルのまま行う） */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* <script> の中に "</script>" が出ると途中で閉じてしまうので潰す */
const safeJS = (s) => s.replace(/<\/script/gi, '<\\/script');

/* replace() の第2引数を「文字列」で渡すと $$ や $& が置換パターンとして解釈され、
   コード中の $$ が $ に化ける。必ず関数で渡すこと。 */
const inject = (html, needle, block) => html.replace(needle, () => block);

let html = read('index.html');

/* CSS を差し込む */
html = inject(html,
  '<link rel="stylesheet" href="assets/builder.css">',
  `<style>\n${read('assets/builder.css')}\n</style>`
);

/* JS を順番どおりに差し込む */
const scripts = ['assets/site-css.js', 'assets/shape-masks.js', 'assets/blocks.js', 'assets/templates.js',
                 'assets/publish-config.js', 'assets/presets.js', 'assets/easy.js', 'assets/app.js'];
for (const s of scripts) {
  html = inject(html,
    `<script src="${s}"></script>`,
    `<script>\n/* ===== ${s} ===== */\n${safeJS(read(s))}\n</script>`
  );
}

/* 差し込み漏れがないか確認（テンプレート名の変更などで壊れたら気付けるように） */
const left = html.match(/<(script src|link rel="stylesheet")[^>]*>/g);
if (left) {
  console.error('差し込めなかった参照があります:', left);
  process.exit(1);
}

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/index.html'), html);
console.log(`dist/index.html を作成しました (${(html.length / 1024).toFixed(0)} KB)`);

/* ---- ホスティング用（<html>/<head>/<body> の外枠を持たない断片） ----
   公開先が独自のHTML骨組みで包む場合に使う。中身は dist/index.html と同一。 */
const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [, 'かんたんHP作成ツール'])[1];
const styles = html.match(/<style>[\s\S]*?<\/style>/g) || [];
const bodyInner = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [, ''])[1];

const fragment = `<title>${title}</title>\n${styles.join('\n')}\n${bodyInner.trim()}\n`;
if (!/<div class="app"/.test(fragment)) {
  console.error('本体の取り出しに失敗しました');
  process.exit(1);
}
fs.writeFileSync(path.join(ROOT, 'dist/embed.html'), fragment);
console.log(`dist/embed.html を作成しました (${(fragment.length / 1024).toFixed(0)} KB)`);
