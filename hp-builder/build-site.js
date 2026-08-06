/* 公開用の一式を組み立てる。

   出力先はリポジトリの直下の docs/。ここは動かせない。
   GitHub Pages の「ブランチから配信」で選べるフォルダは
   「/（リポジトリ直下）」か「/docs」の2つだけで、
   hp-builder/docs のような深い場所は選択肢に出てこない（実際の画面で確認）。

   Netlify や普通のレンタルサーバーにアップする場合も、
   docs/ の中身をそのまま上げれば動く（ビルドもサーバー処理も不要）。

   実行: node build-site.js
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, '..', 'docs');

/* 先に各ページを作り直しておく（中身が古いまま公開されるのを防ぐ） */
/* 公開ページで動いてよい JavaScript の指紋を、先に取り直す。
   ここを忘れると、配信側が古い指紋のまま動き、まともなページまで
   「よその script」と見なして弾く。組み立てに含めて、ずれないようにする。 */
for (const s of ['tools/runtime-hash.js', 'build.js', 'examples/build-service-lp.js', 'examples/build-verdure.js',
  'examples/build-deco-demo.js', 'examples/build-scroll-demo.js', 'examples/build-collage-demo.js']) {
  execFileSync(process.execPath, [path.join(ROOT, s)], { cwd: ROOT, stdio: 'pipe' });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'app'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'demo'), { recursive: true });

/* Pages は既定で Jekyll を通す。_ で始まる名前などが消されないよう止めておく */
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

const put = (from, to) => {
  fs.copyFileSync(path.join(ROOT, from), path.join(OUT, to));
  return `${to}  (${Math.round(fs.statSync(path.join(OUT, to)).size / 1024)} KB)`;
};

/* すでに main の直下から公開されていたファイル。
   Pages の配信元を /docs へ移すと、docs/ に無いものは全部404になる。
   同じ名前で入れておけば、これまでのURLがそのまま生き続ける。 */
const KEEP = ['ops-dashboard_6.html'];

const made = [
  put('examples/service-lp.html', 'index.html'),          // 入口はサービスLP
  put('dist/index.html', 'app/index.html'),               // 編集ツール本体
  put('examples/cafe-verdure.html', 'demo/cafe-verdure.html'),
  put('examples/hero-deco.html', 'demo/hero-deco.html'),
  put('examples/hero-scroll.html', 'demo/hero-scroll.html'),
  put('examples/hero-collage.html', 'demo/hero-collage.html'),
];

/* 業種ごとの見本写真。ツール本体には焼き込まず、ここから配る。
   元は art/。docs/ は上でまるごと作り直しているので、ここで写す。 */
const ART = path.join(ROOT, 'art');
if (fs.existsSync(ART)) {
  const pics = fs.readdirSync(ART).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  if (pics.length) {
    fs.mkdirSync(path.join(OUT, 'art'), { recursive: true });
    let bytes = 0;
    for (const f of pics) {
      fs.copyFileSync(path.join(ART, f), path.join(OUT, 'art', f));
      bytes += fs.statSync(path.join(ART, f)).size;
    }
    made.push(`art/  (${pics.length}枚 ${Math.round(bytes / 1024)} KB｜業種の見本写真)`);
  }
}

for (const name of KEEP) {
  const from = path.join(ROOT, '..', name);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(OUT, name));
    made.push(`${name}  (これまでのURLを保つため同梱)`);
  } else {
    console.warn(`※ ${name} が見つからないので同梱していません`);
  }
}

/* 見本の入口。デモを直接たどれるようにしておく */
fs.writeFileSync(path.join(OUT, 'demo', 'index.html'), `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>見本｜PAGE STUDIO</title>
<style>
:root{color-scheme:light}
body{margin:0;background:#fafafa;color:#27272a;
  font-family:"Helvetica Neue",Arial,"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif;
  line-height:1.9;padding:clamp(40px,8vw,110px) clamp(20px,5vw,64px)}
.w{max-width:760px;margin:0 auto}
h1{font-size:clamp(26px,3.4vw,40px);margin:0 0 8px;letter-spacing:.02em}
p.lead{color:#71717a;margin:0 0 clamp(32px,5vw,56px)}
ul{list-style:none;margin:0;padding:0;border-top:1px solid #e4e4e7}
li{border-bottom:1px solid #e4e4e7}
a{display:block;padding:22px 4px;text-decoration:none;color:inherit;
  transition:opacity .5s cubic-bezier(.165,.84,.44,1),padding-left .25s}
a:hover{opacity:.45;padding-left:10px;transition:opacity .06s cubic-bezier(.165,.84,.44,1),padding-left .25s}
b{display:block;font-size:16.5px}
small{color:#71717a;font-size:13px}
.back{display:inline-block;margin-top:44px;font-size:13.5px;color:#ed646f}
</style></head><body><div class="w">
<h1>見本</h1>
<p class="lead">このツールで作ったページと、動きの一覧です。</p>
<ul>
  <li><a href="./cafe-verdure.html"><b>Café Verdure</b><small>写真を埋め込んだ完成サイト。慣性スクロール・段差つきの出現つき</small></a></li>
  <li><a href="./hero-deco.html"><b>ヒーローの装飾 9種</b><small>すりガラス・ふわふわ雲・光の粒など。マウスを動かすと反応します</small></a></li>
  <li><a href="./hero-scroll.html"><b>スクロール連動ヒーロー 4種</b><small>写真が縮む・幕が開く・文字の中から写真が広がる</small></a></li>
  <li><a href="./hero-collage.html"><b>コラージュ・ヒーロー</b><small>敷き詰めた写真に、斜めの写真と縦書きの帯を重ねる型</small></a></li>
</ul>
<a class="back" href="../">← トップにもどる</a>
</div></body></html>`);
made.push('demo/index.html');

console.log('docs/ を作成しました');
made.forEach((m) => console.log('  ' + m));
console.log(`\n合計 ${Math.round(
  fs.readdirSync(OUT, { recursive: true })
    .map((f) => path.join(OUT, f))
    .filter((f) => fs.statSync(f).isFile())
    .reduce((a, f) => a + fs.statSync(f).size, 0) / 1024)} KB`);
