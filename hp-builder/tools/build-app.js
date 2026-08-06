/* ================================================================
   配信用の編集ツールを、分けて組み立てる

   これまでは 840KB のHTML 1枚を配っていた。1枚だと、

     ・出し直すたびに、全員がまた 840KB をぜんぶ取り直す
       （1文字直しただけでも、置き場に残ったぶんは使えない）
     ・置き場に長く持たせられない。HTMLは書き替わるものなので
       「ずっと使ってよい」とは言えず、毎回聞きにいくことになる

   1万人が月に2回開くだけで 16GB。Hosting のただの枠は 10GB／月なので、
   ここだけで足が出る。

   そこで、配信用は中身をファイルに分け、名前に指紋を入れる。

     app/index.html      … 骨組みだけ（2万字ほど）。毎回聞きにいく
     app/a/app.1a2b3c4d.js … 中身。名前が変わらないかぎり同じものなので
                             「1年そのまま使ってよい」と言える

   直したファイルだけ名前が変わる。次に開いた人は、変わったぶんだけ
   取り直す。文章を1つ直した日の配りなおしは、840KB ではなく数十KB。

   手元で使う 1枚もの（dist/index.html）はこれまでどおり作る。
   file:// で開く道と、まるごと配る道は、どちらも残す。

     node tools/build-app.js <出し先>
   ================================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'dist', 'app');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const stamp = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 8);

function main() {
  let html = read('index.html');
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'a'), { recursive: true });

  /* 参照しているものを、書いてある順に拾う。
     index.html を直したときに拾い漏れないよう、決め打ちの一覧は持たない */
  const refs = [...html.matchAll(/(?:<script src="([^"]+)"><\/script>|<link rel="stylesheet" href="([^"]+)">)/g)]
    .map((m) => m[1] || m[2]);
  if (!refs.length) { console.error('index.html から読み込むものが見つかりません'); process.exit(1); }

  const made = [];
  for (const ref of refs) {
    const src = read(ref);
    const ext = path.extname(ref);
    const name = `${path.basename(ref, ext)}.${stamp(src)}${ext}`;
    fs.writeFileSync(path.join(OUT, 'a', name), src);
    /* 差し替えは1つずつ。まとめて置換すると、名前が部分一致したときに壊れる */
    html = html.split(ref).join(`a/${name}`);
    made.push({ name, bytes: Buffer.byteLength(src, 'utf8') });
  }

  if (/(?:src|href)="assets\//.test(html)) {
    console.error('差し替えられなかった参照があります');
    process.exit(1);
  }

  fs.writeFileSync(path.join(OUT, 'index.html'), html);

  const total = made.reduce((a, x) => a + x.bytes, 0);
  const shell = Buffer.byteLength(html, 'utf8');
  console.log(`分けて組み立てました: ${path.relative(ROOT, OUT)}`);
  console.log(`  index.html  ${Math.round(shell / 1024)} KB（骨組み。毎回聞きにいく）`);
  console.log(`  a/ に ${made.length}件  ${Math.round(total / 1024)} KB（指紋つき。1年そのまま使ってよい）`);
  const big = [...made].sort((a, b) => b.bytes - a.bytes).slice(0, 3);
  big.forEach((x) => console.log(`    ${x.name}  ${Math.round(x.bytes / 1024)} KB`));
}

main();
