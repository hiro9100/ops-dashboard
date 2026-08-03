/* ================================================================
   業種ごとの、仮の絵

   写真を1枚も持っていない人が、いちばん最初につまずくのがここ。
   空の枠に「IMAGE」と出ているページは、作りかけにしか見えず、
   そこで手が止まる。だから写真を入れなくても、はじめから
   それらしい絵が入っている状態にする。

   本物の写真は持たない。1枚でもファイルに焼き込むと重くなるうえ、
   どこかで見た写真が並ぶことになる。代わりに、業種ごとの色と形で
   その場で描く。1枚1KB前後で、拡大しても崩れない。

   あくまで仮なので、編集画面では「あとで自分の写真に差し替える」と
   分かるようにしておく（sampleArt で作った絵かどうかは、
   データURLの中の目印 hp-sample で見分けられる）。
   ================================================================ */

/* 業種ごとの色と形。
   色は3つ（地・中間・締め）。どれも彩度を抑えて、上に文字を置いても
   読める明るさにしてある。motif は絵の「らしさ」を作る形。 */
const ART = {
  cafe:       { c: ['#efe4d6', '#d6bfa4', '#6b4f3a'], motif: 'circles' },
  restaurant: { c: ['#e8e6dd', '#b9bda6', '#3f4a3a'], motif: 'arcs' },
  salon:      { c: ['#f2e7e6', '#dcc3c4', '#7a5b60'], motif: 'waves' },
  clinic:     { c: ['#e6eef2', '#bcd3de', '#3f5f70'], motif: 'grid' },
  builder:    { c: ['#e7e5e2', '#c0b8ae', '#4a453f'], motif: 'beams' },
  school:     { c: ['#eeeade', '#cfd3bb', '#4f5a44'], motif: 'dots' },
  shop:       { c: ['#eeecea', '#cfc9c2', '#4b463f'], motif: 'blocks' },
  gym:        { c: ['#dfe3e6', '#a8b2ba', '#2f3940'], motif: 'beams' },
  office:     { c: ['#e7eaee', '#b9c1cd', '#39424f'], motif: 'grid' },
  company:    { c: ['#e9ecef', '#c2cad3', '#3d4753'], motif: 'waves' },
};

/* 形ごとの中身。i を変えると少しずつ違う絵になるので、
   同じページに並べても同じ絵の繰り返しにならない。 */
function artMotif(kind, c, i) {
  const o = (n) => (i * 37 + n * 53) % 100;   // 並びをずらすための、決まった数
  const M = {
    circles: () => `
      <circle cx="${240 + o(1) * 3}" cy="${300 + o(2)}" r="${150 + o(3)}" fill="${c[1]}" opacity=".55"/>
      <circle cx="${820 - o(4) * 2}" cy="${520 - o(5)}" r="${190 + o(6)}" fill="${c[2]}" opacity=".18"/>
      <circle cx="${560 + o(7)}" cy="${230 + o(8)}" r="90" fill="${c[2]}" opacity=".12"/>`,
    arcs: () => `
      <path d="M0 ${560 + o(1)} Q 300 ${340 + o(2)} 600 ${520 + o(3)} T 1200 ${420 + o(4)} V800 H0Z" fill="${c[1]}" opacity=".6"/>
      <path d="M0 ${680 + o(5)} Q 360 ${500 + o(6)} 720 ${660 + o(7)} T 1200 ${600}V800 H0Z" fill="${c[2]}" opacity=".22"/>`,
    waves: () => `
      <path d="M0 ${420 + o(1)} C 250 ${300 + o(2)} 420 ${560 + o(3)} 700 ${430 + o(4)} S 1050 ${300 + o(5)} 1200 ${380}V800 H0Z" fill="${c[1]}" opacity=".55"/>
      <path d="M0 ${600 + o(6)} C 300 ${500 + o(7)} 500 ${700} 800 ${590 + o(8)} S 1100 ${520} 1200 ${560}V800 H0Z" fill="${c[2]}" opacity=".2"/>`,
    grid: () => `
      <g stroke="${c[2]}" stroke-width="1.5" opacity=".22">
        ${[0, 1, 2, 3, 4, 5].map((n) => `<path d="M${140 + n * 180 + o(n) * 0.4} 0V800"/>`).join('')}
        ${[0, 1, 2, 3].map((n) => `<path d="M0 ${150 + n * 180}H1200"/>`).join('')}
      </g>
      <rect x="${120 + o(1) * 4}" y="${180 + o(2) * 2}" width="360" height="360" fill="${c[1]}" opacity=".6"/>`,
    beams: () => `
      <g fill="${c[1]}" opacity=".6">
        ${[0, 1, 2, 3].map((n) => {
    const x = -200 + n * 320 + o(n) * 2;
    return `<path d="M${x} 800 L${x + 210} 0 h140 L${x + 350} 800Z"/>`;
  }).join('')}
      </g>
      <path d="M0 ${600 + o(3)}H1200V800H0Z" fill="${c[2]}" opacity=".18"/>`,
    dots: () => `<g fill="${c[2]}" opacity=".22">
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((n) => {
    const x = 110 + (n % 4) * 300 + o(n);
    const y = 220 + Math.floor(n / 4) * 300 + o(n + 3);
    return `<circle cx="${x}" cy="${y}" r="${46 + (n % 3) * 22}"/>`;
  }).join('')}</g>
      <circle cx="${900 - o(2) * 2}" cy="${260 + o(1)}" r="${170}" fill="${c[1]}" opacity=".6"/>`,
    blocks: () => `
      <rect x="${90 + o(1) * 3}" y="${140 + o(2)}" width="420" height="300" fill="${c[1]}" opacity=".65"/>
      <rect x="${560 + o(3) * 2}" y="${330 + o(4)}" width="520" height="360" fill="${c[2]}" opacity=".18"/>
      <rect x="${230 + o(5)}" y="${500 + o(6)}" width="260" height="220" fill="${c[2]}" opacity=".14"/>`,
  };
  return (M[kind] || M.waves)();
}

/* 業種キー（と、同じ業種の中での通し番号）から仮の絵を1枚作る。
   返すのは data URL なので、そのまま img の src に入る。 */
function sampleArt(key, i = 0) {
  const a = ART[key] || ART.company;
  const c = a.c;
  const g = `sa${i}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
<title>hp-sample</title>
<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs>
<rect width="1200" height="800" fill="url(#${g})"/>
${artMotif(a.motif, c, i)}
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n\s*/g, ''))}`;
}

/* この絵が仮のものかどうか。
   「まだ自分の写真に替えていませんよ」と言うために使う。 */
const isSampleArt = (v) => typeof v === 'string' && v.startsWith('data:image/svg+xml') && v.includes('hp-sample');

/* 業種から配色を寄せる。
   写真を1枚も入れていないときに使う。仮の絵と同じ色みにしておくと、
   絵と文字と地の色がちぐはぐにならない。

   ただし読めなくなるくらいなら寄せない。土台の色のままのほうがましで、
   これは写真から色を作るとき（paletteFromPhotos）と同じ考えかた。 */
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
