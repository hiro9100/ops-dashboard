/* ================================================================
   公開ページに入る「動きの部品」の指紋をとる

   公開ページは、他人が書いたHTMLを、こちらのドメインで配るもの。
   そのHTMLの中で JavaScript が動くと、同じドメインに置いてある
   編集画面の控え（合言葉を含む）が読めてしまう。実際に読めることを
   確かめてある（scratchpad/poc-origin.js）。

   そこで、公開ページで動いてよい JavaScript を1つに絞る。
   このツールが入れる動きの部品（SITE_JS）だけを許し、それ以外は
   ブラウザ側で実行させない（CSP の sha256）。

   指紋は組み立てのたびに変わるので、ここで数えて配信側に渡す。
   古いものも数個残す。配信側と編集画面は同時には入れ替わらないので、
   入れ替えの最中に公開した人だけが弾かれるのを防ぐ。

     node tools/runtime-hash.js
   ================================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'firebase', 'functions', 'runtime-hashes.json');
const KEEP = 5;   // 古い指紋をいくつ残すか

/* site-css.js は素の const だけの ファイル。読み込んで SITE_JS を取り出す */
function siteJS() {
  const src = fs.readFileSync(path.join(ROOT, "assets", "site-css.js"), "utf8");
  // eslint-disable-next-line no-new-func
  return new Function(`${src}\nreturn SITE_JS;`)();
}

const sha = (s) => `sha256-${crypto.createHash('sha256').update(s, 'utf8').digest('base64')}`;

function main() {
  const now = sha(siteJS());
  let prev = { current: '', allowed: [] };
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { /* はじめて */ }

  /* 同じなら書き替えない。組み立てのたびに差分が出るのを避ける */
  if (prev.current === now) {
    console.log(`動きの部品の指紋: ${now}（変わっていません）`);
    return;
  }
  const allowed = [now, ...(prev.allowed || []).filter((h) => h !== now)].slice(0, KEEP);
  fs.writeFileSync(OUT, `${JSON.stringify({ current: now, allowed }, null, 2)}\n`);
  console.log(`動きの部品の指紋: ${now}`);
  console.log(`  許すもの ${allowed.length}件（入れ替え中に公開した人が弾かれないよう、古いぶんも残す）`);
}

main();
