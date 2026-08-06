/* ================================================================
   公開ページを、編集画面と別のドメインに移す

   なぜ移すか。

   編集画面（/app/）と受け口（/api/*）と公開ページ（/s/*）が同じ
   ドメインに居ると、ブラウザはこれを「同じ持ち主のもの」として扱う。
   公開ページは他人の書いたHTMLなので、そこで何かが動いた瞬間に、
   同じドメインに置いてある編集画面の控え（合言葉を含む）に手が届く。
   実際に届くことは確かめてある（scratchpad/poc-origin.js）。

   その道は、指紋の合う仕掛けしか動かさないことで塞いだ。ただ、塞ぎ方が
   1つでも抜けたとき、被害が編集画面まで及ぶ形そのものは残っている。
   別のドメインに置けば、抜けても公開ページの中だけで終わる。

   ここでやること（3か所を、いっぺんに揃える）:

     ① firebase.json      … 置き場を2つに分け、/s/** を新しいほうへ移す
     ② publish-config.js  … 編集画面が案内するアドレスを新しいほうにする
     ③ functions/.env     … 配信側が返すアドレスと、
                             公開ページから送ってよい先を新しいほうにする

   1か所でも欠けると、
     ①だけ … 編集画面が古いアドレスを案内し、そこはもう404
     ②だけ … 案内した先に何も無い
     ③だけ … 公開はできるが、問い合わせフォームだけ黙って動かない
   になる。だから1つの道具にまとめてある。

     node tools/split-origin.js <公開ページ用のサイトID>

   出す仕組み（.github/workflows/deploy.yml）から呼ばれる。
   置き場が実際に在るときだけ呼ばれるので、名前が取れていなくても
   これまでどおりの形のまま出る（出せなくなることはない）。
   ================================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..');
const FBJSON = path.join(REPO, 'firebase.json');
const CONF = path.join(ROOT, 'assets', 'publish-config.js');
const ENV = path.join(ROOT, 'firebase', 'functions', '.env');
const EMPTY = 'hp-builder/firebase/pages-root';

function main() {
  const site = String(process.argv[2] || '').trim();
  if (!/^[a-z0-9-]{3,30}$/.test(site)) {
    console.error('公開ページ用のサイトIDを渡してください（例: bildy-4e45e-pages）');
    process.exit(1);
  }
  const pagesBase = `https://${site}.web.app/s/`;

  /* ---------- ① firebase.json ---------- */
  const cfg = JSON.parse(fs.readFileSync(FBJSON, 'utf8'));
  if (Array.isArray(cfg.hosting)) {
    console.log('firebase.json はもう分かれています');
  } else {
    const main0 = cfg.hosting;
    const serve = (main0.rewrites || []).find((r) => r.source === '/s/**');
    if (!serve) { console.error('firebase.json に /s/** がありません'); process.exit(1); }
    /* 元のほうからは外す。残したままだと、古いアドレスでも同じところに
       置けてしまい、分けた意味が無くなる */
    main0.rewrites = main0.rewrites.filter((r) => r.source !== '/s/**');
    /* 並びにするときは、どちらの置き場かを必ず名指しする。
       1つのときは要らないが、2つになると名前が無いほうは出せない */
    cfg.hosting = [
      Object.assign({ site: process.env.HP_MAIN_SITE || 'bildy-4e45e' }, main0),
      {
        site,
        public: EMPTY,
        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
        rewrites: [serve],
      },
    ];
    fs.writeFileSync(FBJSON, `${JSON.stringify(cfg, null, 2)}\n`);
    console.log(`firebase.json: 置き場を2つに分けました（/s/** → ${site}）`);
  }

  /* ---------- ② publish-config.js ---------- */
  let conf = fs.readFileSync(CONF, 'utf8');
  if (!/siteBase:\s*'[^']*'/.test(conf)) {
    console.error('publish-config.js の siteBase が見つかりません');
    process.exit(1);
  }
  conf = conf.replace(/siteBase:\s*'[^']*'/, `siteBase: '${pagesBase}'`);
  fs.writeFileSync(CONF, conf);
  console.log(`publish-config.js: siteBase を ${pagesBase} にしました`);

  /* ---------- ③ functions/.env ---------- */
  let env = fs.readFileSync(ENV, 'utf8');
  const api = (conf.match(/endpoint:\s*'(https?:\/\/[^/']+)/) || [])[1] || '';
  if (!api) { console.error('publish-config.js から受け口のアドレスが読めません'); process.exit(1); }
  env = `${env.split('\n').filter((l) => !/^\s*#?\s*HP_(SITE_BASE|API_ORIGIN)=/.test(l))
    .join('\n').replace(/\n+$/, '')}\n`;
  env += `HP_SITE_BASE=${pagesBase}\nHP_API_ORIGIN=${api}\n`;
  fs.writeFileSync(ENV, env);
  console.log(`functions/.env: HP_SITE_BASE=${pagesBase} / HP_API_ORIGIN=${api}`);

  /* ---------- 置き場のフォルダ ---------- */
  const dir = path.join(REPO, EMPTY);
  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    console.error(`${EMPTY}/index.html がありません`);
    process.exit(1);
  }
  console.log('揃いました。このまま出せます');
}

main();
