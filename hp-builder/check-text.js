/* 画面に出る文字に、日本語でないものが混ざっていないか調べる。

   書いているうちに、ハングルやキリル文字、英単語がそのまま残ってしまうこと
   が実際に何度かあった。目で読むと日本語に見えてしまって気づけないので、
   機械で見る。

   実行: node check-text.js
*/
const fs = require('fs');
const path = require('path');

/* 見る範囲は、手で書いたファイル全部。
   画面に出る文字だけを見ていたら、ワークフローのエラーメッセージに
   ハングルが紛れ込んでいた（自分で書いて、自分で気づけなかった）。
   人が読むところは、置き場所を問わず全部見る。 */
const ROOT = path.join(__dirname, '..');
const ROOTS = ['hp-builder', '.github'];
const EXT = new Set(['.js', '.html', '.md', '.yml', '.yaml', '.json']);
/* 機械が作ったものは見ない（元になったファイルの方を見ている） */
const SKIP_DIR = new Set(['node_modules', '.git', 'docs', 'dist']);
const GENERATED = /^hp-builder\/examples\/.*\.html$/;
/* このファイル自身は見ない。探している文字を、探すために持っているから */
const SELF = 'hp-builder/check-text.js';

function collect(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) {
      if (!SKIP_DIR.has(e.name)) collect(rel, out);
    } else if (EXT.has(path.extname(e.name)) && !GENERATED.test(rel) && rel !== SELF) {
      out.push(rel);
    }
  }
  return out;
}
const FILES = ROOTS.flatMap((d) => collect(d));

/* 日本語の文章に混ざっていたら困る文字 */
const FOREIGN = /[가-힣ᄀ-ᇿЀ-ӿ؀-ۿ฀-๿]/;
const JP = /[぀-ヿ一-鿿]/;

/* 文字列リテラルを雑に拾う。厳密なパースは要らない
   （見つけたいのは「日本語の中の異物」なので、取りこぼしても害はない） */
const STRINGS = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;

/* 日本語の文の中に、生の英単語が居座っていないか。

   ここは絞り込みが要る。「WEB予約」「Drip Coffee」「SaaS」「Google」は
   どれも正しい日本語の文章に出てくる。実際に起きた事故は
   「未来を creates」のように、日本語の動詞や名詞のかわりに
   小文字の英単語が入り込む形だった。そこだけを見る。

   合図は「日本語のすぐ隣に、空白をはさんで小文字の語がある」こと。
   ファイル名（index.html）やアンカー名（#about）は記号がくっついているので、
   前後の1文字を見れば区別できる。 */
const ENGLISH = /[a-z][a-z'-]{2,}/g;
const GLUE = /[.#/\-_'@:]/;                       // これが隣にあれば名前であって文章ではない

/* 日本語の文の中にそのまま出てきても不自然でない、決まった名前 */
const ALLOW = new Set(['www', 'htdocs', 'index', 'html', 'css', 'src', 'href',
  'iframe', 'srcdoc', 'canvas', 'px', 'vw', 'vh', 'em', 'rem',
  'sticky', 'playwright', 'npm', 'node', 'firebase']);

function strayEnglish(s) {
  const hits = [];
  let m;
  ENGLISH.lastIndex = 0;
  while ((m = ENGLISH.exec(s))) {
    const before = s[m.index - 1] || '';
    const after = s[m.index + m[0].length] || '';
    if (ALLOW.has(m[0])) continue;
    if (GLUE.test(before) || GLUE.test(after)) continue;
    if (/[A-Za-z]/.test(before) || /[A-Za-z]/.test(after)) continue;
    /* 空白をまたいだ隣が日本語なら、日本語の文に紛れ込んでいる */
    const lhs = s.slice(0, m.index).replace(/\s+$/, '').slice(-1);
    const rhs = s.slice(m.index + m[0].length).replace(/^\s+/, '').slice(0, 1);
    if (JP.test(lhs) || JP.test(rhs)) hits.push(m[0]);
  }
  return hits;
}

let bad = 0;
const report = (file, line, kind, text) => {
  console.log(`  NG ${file}:${line}  ${kind}`);
  console.log(`     ${text.trim().slice(0, 92)}`);
  bad++;
};

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');

  /* 1. 日本語以外の文字体系 — コメントも含めて全部見る */
  lines.forEach((ln, i) => {
    if (FOREIGN.test(ln)) report(rel, i + 1, `日本語でない文字 ${ln.match(FOREIGN)[0]}`, ln);
  });

  /* 2. 日本語の文字列に混ざった英単語 */
  lines.forEach((ln, i) => {
    let m;
    STRINGS.lastIndex = 0;
    while ((m = STRINGS.exec(ln))) {
      const s = m[1] ?? m[2] ?? m[3] ?? '';
      if (!JP.test(s)) continue;                 // 日本語を含まない文字列は対象外
      if (/[<>{}=;:]|--|\/\//.test(s)) continue; // HTML片やCSS値は文章ではない
      for (const w of strayEnglish(s)) report(rel, i + 1, `日本語の中の英単語 "${w}"`, s);
    }
  });
}

console.log(bad ? `\n見つかった問題: ${bad}件` : '文字づかいの問題はありません');
process.exit(bad ? 1 : 0);
