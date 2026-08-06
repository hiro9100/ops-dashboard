/* ================================================================
   業種ごとの、仮の絵

   写真を1枚も持っていない人が、いちばん最初につまずくのがここ。
   空の枠に「IMAGE」と出ているページは、作りかけにしか見えず、
   そこで手が止まる。だから写真を入れなくても、はじめから
   それらしい絵が入っている状態にする。

   顔（ヒーロー）を選ぶときも、枠が空のままだと、その型が自分の店に
   合うのかが掴めない。

   本物の写真は持たない。1枚でもファイルに焼き込むと重くなるうえ、
   どこかで見た写真が並ぶことになる。

   代わりに「ピントを外した写真」を描く。
   輪郭のある絵（カウンター、椅子、皿……）を線で描こうとすると、
   縮めたときに必ず絵記号に見える。ぼかしてしまえば、残るのは
   色・明るさ・光の位置だけになり、それは実写と見分けがつかない。
   小さく置いても、ヒーローいっぱいに敷いても成立する。

   1枚1〜2KB。読み込むものは増えない（file:// でも同じ絵が出る）。

   あくまで仮なので、編集画面では「あとで自分の写真に差し替える」と
   分かるようにしておく（sampleArt で作った絵かどうかは、
   データURLの中の目印 hp-sample で見分けられる）。
   ================================================================ */

/* 業種ごとの光の設計。
     bg    地の色（上／下）。時間帯と、その場所の明るさ
     glow  灯りの色。ここが「その店らしさ」のほとんどを決める
     lamps 灯りの位置と大きさ [x, y, 半径, 濃さ]（1200×800 の中で）
     tint  奥ゆきを作る、空気の色
     dark  まわりの落ち込み。暗い店ほど強く
     c     配色を寄せるときに使う3色（地・中間・締め） */
const ART = {
  /* 暗い店内に、カウンターの上だけ温かい灯り */
  restaurant: { bg: ['#2a1c12', '#0d0908'], glow: '#ffb765', tint: '#3a2415', dark: .62,
    lamps: [[250, 300, 300, .5], [560, 250, 210, .38], [880, 340, 260, .3], [420, 640, 420, .22]],
    c: ['#f0e7dc', '#c9a06a', '#3a2415'] },
  /* 窓から入る昼の光。木と紙の色 */
  cafe: { bg: ['#f3e7d6', '#c8ab8b'], glow: '#fff4de', tint: '#e5cba8', dark: .3,
    lamps: [[880, 200, 420, .75], [300, 420, 300, .3], [620, 700, 380, .18]],
    c: ['#efe4d6', '#d6bfa4', '#6b4f3a'] },
  /* やわらかい白。鏡と照明の反射 */
  salon: { bg: ['#f6ecea', '#d3b9ba'], glow: '#ffffff', tint: '#e9d3d2', dark: .26,
    lamps: [[300, 240, 340, .6], [820, 380, 300, .45], [560, 720, 420, .2]],
    c: ['#f2e7e6', '#dcc3c4', '#7a5b60'] },
  /* 明るく均一。窓の白 */
  clinic: { bg: ['#f2f7fa', '#c4d8e2'], glow: '#ffffff', tint: '#dceaf1', dark: .2,
    lamps: [[760, 220, 460, .7], [260, 520, 340, .3]],
    c: ['#e6eef2', '#bcd3de', '#3f5f70'] },
  /* 現場の光。粉じんの中に差す、強い側光 */
  builder: { bg: ['#4a443d', '#161311'], glow: '#ffd9a0', tint: '#57493a', dark: .58,
    lamps: [[940, 180, 380, .55], [420, 420, 300, .26], [180, 700, 340, .2]],
    c: ['#e7e5e2', '#c0b8ae', '#4a453f'] },
  /* 教室の窓。午後の白い光 */
  school: { bg: ['#f0ead9', '#bdbfa2'], glow: '#fffdf2', tint: '#ded8bd', dark: .26,
    lamps: [[840, 240, 420, .62], [320, 500, 320, .28]],
    c: ['#eeeade', '#cfd3bb', '#4f5a44'] },
  /* 什器のスポット。落ち着いた地に、点の灯り */
  shop: { bg: ['#e8e4de', '#a09788'], glow: '#fff1d8', tint: '#d6cec0', dark: .34,
    lamps: [[300, 220, 260, .55], [640, 300, 220, .45], [960, 240, 240, .4], [520, 680, 400, .2]],
    c: ['#eeecea', '#cfc9c2', '#4b463f'] },
  /* 暗い床に、冷たいふちの光 */
  gym: { bg: ['#2b3238', '#0c0f12'], glow: '#bfe3ff', tint: '#1e2a33', dark: .6,
    lamps: [[220, 260, 320, .4], [900, 420, 360, .34], [560, 760, 460, .2]],
    c: ['#dfe3e6', '#a8b2ba', '#2f3940'] },
  /* ブラインドごしの朝。冷たい灰 */
  office: { bg: ['#eef1f5', '#aab3c0'], glow: '#ffffff', tint: '#d5dbe4', dark: .28,
    lamps: [[880, 200, 420, .6], [280, 460, 300, .26]],
    c: ['#e7eaee', '#b9c1cd', '#39424f'] },
  /* 曇りの日のガラス。いちばん無難な地 */
  company: { bg: ['#eef0f3', '#b0b8c3'], glow: '#ffffff', tint: '#d3d9e1', dark: .28,
    lamps: [[760, 240, 420, .55], [320, 520, 340, .26]],
    c: ['#e9ecef', '#c2cad3', '#3d4753'] },
};

/* 同じ業種でも、並べたときに同じ絵にならないように少しずらす。
   出す数は決まっているので、乱数ではなく番号から作る
   （毎回変わると、編集画面と書き出したページで別物になる）。 */
const artShift = (i, n) => ((i * 47 + n * 71) % 100) - 50;

/* 灯り1つ。ふちへ向けてすっと消さないと、ただの円に見える */
const artLamp = (id, c, o) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/>`
  + `<stop offset=".45" stop-color="${c}" stop-opacity="${(o * 0.42).toFixed(2)}"/>`
  + `<stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;

/* 業種キー（と、同じ業種の中での通し番号）から仮の絵を1枚作る。
   返すのは data URL なので、そのまま img の src に入る。 */
function sampleArt(key, i = 0) {
  const a = ART[key] || ART.company;
  const p = `s${i}`;
  const lamps = a.lamps.map((l, n) => ({
    x: Math.round(l[0] + artShift(i, n) * 1.6),
    y: Math.round(l[1] + artShift(i, n + 3)),
    r: Math.round(l[2] + artShift(i, n + 5) * 0.8),
    o: l[3],
  }));

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">'
    + '<title>hp-sample</title><defs>'
    + `<linearGradient id="${p}b" x1="0" y1="0" x2=".3" y2="1">`
    + `<stop offset="0" stop-color="${a.bg[0]}"/><stop offset="1" stop-color="${a.bg[1]}"/></linearGradient>`
    + lamps.map((l, n) => artLamp(`${p}l${n}`, a.glow, l.o)).join('')
    + `<radialGradient id="${p}v" cx=".5" cy=".46" r=".78">`
    + '<stop offset=".45" stop-color="#000" stop-opacity="0"/>'
    + `<stop offset="1" stop-color="#000" stop-opacity="${a.dark}"/></radialGradient>`
    /* ぼかしはここでまとめてかける。1つ1つを柔らかく描くより、
       描いてから一度に外したほうが、写真の被写界深度に近くなる */
    + `<filter id="${p}f" x="-14%" y="-14%" width="128%" height="128%">`
    + '<feGaussianBlur stdDeviation="34"/></filter>'
    + '</defs>'
    + `<rect width="1200" height="800" fill="url(#${p}b)"/>`
    + `<g filter="url(#${p}f)">`
    + `<ellipse cx="${600 + artShift(i, 1)}" cy="${520 + artShift(i, 2)}" rx="760" ry="300"`
    + ` fill="${a.tint}" opacity=".55"/>`
    + lamps.map((l, n) => `<ellipse cx="${l.x}" cy="${l.y}" rx="${l.r}"`
      + ` ry="${Math.round(l.r * 0.82)}" fill="url(#${p}l${n})"/>`).join('')
    + '</g>'
    + `<rect width="1200" height="800" fill="url(#${p}v)"/>`
    + '</svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* この絵が仮のものかどうか。
   「まだ自分の写真に替えていませんよ」と言うために使う。 */
const isSampleArt = (v) => typeof v === 'string' && v.startsWith('data:image/svg+xml') && v.includes('hp-sample');

/* 業種から配色を寄せる。
   写真を1枚も入れていないときに使う。仮の絵と同じ色みにしておくと、
   絵と文字と地の色がちぐはぐにならない。

   ただし読めなくなるくらいなら寄せない。土台の色のままのほうがましで、
   色みだけ業種に寄せて、明るさと濃さは元の配色から動かさない。 */
function themeFromIndustry(base, key) {
  const a = ART[key];
  if (!a) return base;
  const t = Object.assign({}, base);
  const [, mid, deep] = a.c;
  if (typeof contrast === 'function' && contrast(deep, t.bg) < 4.5) return base;
  t.primary = deep;
  t.accent = mid;
  return t;
}
