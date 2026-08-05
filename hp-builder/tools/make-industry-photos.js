/* ================================================================
   業種ごとの見本写真を作る

   顔（ヒーロー）を選ぶとき、写真枠が空だと、その型が自分の店に
   合うのかが掴めない。そこに置く実写を、ここで一度だけ作る。

   出来た写真は docs/art/ に置かれ、公開の入れ物と一緒に配られる。
   ツール本体（dist/index.html）には焼き込まない。

     node tools/make-industry-photos.js

   鍵はこの機械に置かない。すでに動いている /api/image に頼むだけで、
   鍵はサーバー（Secret Manager）にしかない。
   デプロイが済んでいることと、その日の上限（回線ごとに12枚）に
   引っかからないことだけ確かめてから走らせる。

   1度作れば、あとは差し替えたいときだけ走らせればよい。
   ================================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '..', 'docs', 'art');
const ENDPOINT = process.env.HP_IMAGE_API
  || 'https://bildy-4e45e.web.app/api/image';

/* 1業種3枚。1枚目はヒーローに来ることが多いので、いちばん強い絵にする。
   どれも「文字を入れない・実在の人物や商標を写さない」を必ず付ける
   （焼き込まれた文字は、あとから直せない）。 */
const RULES = '文字・ロゴ・透かしは入れないでください。実在の人物や商標も写さないでください。'
  + '見出しを上に重ねるので、片側に余白を広く取ってください。';

const WANT = {
  restaurant: [
    '和食居酒屋の店内。長い一枚板のカウンター、奥へ続く座席。天井の小さな灯りだけが灯り、全体は暗く落ち着いている。夜。',
    '和食居酒屋のカウンターに置かれた器と箸。手前にピントが合い、奥の店内はぼけている。温かい灯り。',
    '居酒屋の入口まわり。木の格子と暖簾、足もとの石畳。夜、灯りがともっている。',
  ],
  cafe: [
    '小さなカフェの店内。木のテーブルと椅子、大きな窓から朝のやわらかい光が入る。人は写さない。',
    'カウンターに置かれた一杯のコーヒー。湯気。奥の店内はぼけている。昼の自然光。',
    'カフェの外観。白い壁と木の扉、鉢植え。昼の明るい光。',
  ],
  salon: [
    '美容室の店内。鏡の並ぶ席と、やわらかい照明。清潔で明るい。人は写さない。',
    'セット面の一角。ドライヤーとブラシが整然と置かれている。やわらかい光。',
    '美容室の待合。低いソファと観葉植物。明るく静か。',
  ],
  clinic: [
    'クリニックの待合室。白い壁と木の椅子、大きな窓からの自然光。清潔で明るい。人は写さない。',
    '診察室の一角。整えられた机と器具。均一で影の少ない室内光。',
    'クリニックの外観。白い建物と植栽、入口の自動ドア。昼の光。',
  ],
  builder: [
    '木造住宅の建築現場。組み上がった柱と梁、差し込む強い光と舞う粉じん。人は写さない。',
    '工具と木材が置かれた作業台。手前にピントが合っている。',
    'リフォーム後の室内。無垢の床と白い壁、窓からの光。',
  ],
  school: [
    '学習塾の教室。机と椅子が整然と並び、窓から午後の白い光が入る。人は写さない。',
    '机の上のノートと鉛筆。手前にピントが合い、奥の教室はぼけている。',
    '自習室の一角。仕切りのある机と、手元の灯り。静か。',
  ],
  shop: [
    '雑貨店の店内。木の棚に商品が並び、天井のスポットが当たっている。落ち着いた明るさ。人は写さない。',
    '棚に置かれた商品の一部。手前にピントが合い、奥はぼけている。',
    'ショップの外観。ガラス張りの入口とサイン。夕方の光。',
  ],
  gym: [
    'トレーニングジムの内部。暗い床とマシンの並び、冷たいふちの光。人は写さない。',
    'ダンベルが並ぶラック。手前にピントが合っている。暗い店内。',
    'スタジオの床と鏡。広い空間、上からの光。',
  ],
  office: [
    '士業事務所の応接。落ち着いた机と椅子、ブラインドごしの朝の光。人は写さない。',
    '机の上の書類と万年筆。手前にピントが合っている。静かな室内。',
    'オフィスビルの一室。窓の外に街並み。冷たい灰色の光。',
  ],
  company: [
    '会社のエントランス。ガラスと石の壁、曇りの日のやわらかい光。人は写さない。',
    '打ち合わせスペース。長いテーブルと椅子。窓からの自然光。人は写さない。',
    'オフィスの廊下。ガラス越しに見える執務室。落ち着いた色。',
  ],
};

/* ヒーローは横長。1枚目だけ大きめの構えにする */
const SHAPE = ['wide', 'wide', 'wide'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function one(prompt, shape) {
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: `${prompt}\n${RULES}`, shape }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.images || !out.images.length) {
    throw new Error(out.error || `窓口が ${r.status} を返しました`);
  }
  const m = String(out.images[0]).match(/^data:image\/\w+;base64,(.+)$/);
  if (!m) throw new Error('絵の形が違います');
  return Buffer.from(m[1], 'base64');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const keys = process.argv.slice(2).filter((x) => WANT[x]);
  const list = keys.length ? keys : Object.keys(WANT);
  let made = 0, skipped = 0;

  for (const key of list) {
    for (let i = 0; i < WANT[key].length; i += 1) {
      const name = `${key}-${i + 1}.jpg`;
      const file = path.join(OUT, name);
      if (fs.existsSync(file)) { skipped += 1; continue; }
      process.stdout.write(`${name} … `);
      try {
        const buf = await one(WANT[key][i], SHAPE[i] || 'wide');
        fs.writeFileSync(file, buf);
        made += 1;
        console.log(`できました（${Math.round(buf.length / 1024)}KB）`);
      } catch (e) {
        console.log(`できませんでした: ${e.message}`);
        /* 上限に当たったら、その先を続けても同じなので止める */
        if (/ここまで/.test(e.message)) {
          console.log('\n今日の上限に当たりました。日を分けて、もう一度この命令を走らせてください。');
          console.log('すでに出来ているぶんは飛ばすので、続きから作られます。');
          break;
        }
      }
      await sleep(1200);   // 相手を急かさない
    }
  }
  console.log(`\n作った ${made}枚 / すでにあった ${skipped}枚`);
  if (made) {
    console.log('置き場所:', path.relative(process.cwd(), OUT));
    console.log('このあと `firebase deploy` で配られます。');
  }
})();
