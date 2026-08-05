/* ブロックの定義。
   1ブロック = { label, icon, fields(編集フォームの項目), defaults(初期値), render(HTML生成) }
   fields を書けば編集フォームは自動で作られる。ブロックを増やしたい時はここに足すだけ。 */

/* ---------- 小さなヘルパ ---------- */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const attr = (name, v) => (v ? ` ${name}="${esc(v)}"` : '');

/* 中身から決まる短い名前。SVGのグラデーションに付ける。
   同じページに図が2つあっても混ざらないようにするためで、
   同じ中身なら同じ名前になる（書き出すたびに変わると差分が出る）。 */
function hashId(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/* ---------- リンク先 ----------
   リンク先は「page:<ページID>」の形でも持てる。
   住所（ファイル名）ではなくIDで持つのは、あとでページの名前を変えても
   リンクが切れないようにするため。ここで実際のアドレスに直す。

   プレビューの中では、押しても別ファイルへ飛べない（srcdoc なので
   隣のファイルが無い）。代わりに data-gopage を付けておき、
   編集画面がそれを見て編集中のページを切り替える。
   書き出すときは exportBody() が data-gopage を落とす。 */
function linkAttr(v) {
  const raw = String(v || '');
  const m = raw.match(/^page:(.+)$/);
  if (!m) return ` href="${esc(raw || '#')}"`;
  const r = typeof pageRef === 'function' ? pageRef(m[1]) : null;
  if (!r) return ' href="#"';                       // 消されたページ
  return ` href="${esc(r.href)}" data-gopage="${esc(m[1])}"`;
}

/* 画像URLがあれば <img>、無ければ何も出さない（ロゴ・背景用） */
const img = (src, alt) => (src ? `<img src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy">` : '');
/* 画像を置く枠。未設定なら「IMAGE」のプレースホルダを出す */
const media = (src, alt) => (src ? img(src, alt) : '<span class="ph" aria-hidden="true"></span>');

/* セクションの外枠 */
function sec(type, p, inner, extraClass = '') {
  const cls = ['sec', `sec-${type}`, p.bg ? `bg-${p.bg}` : '',
    p.shape ? `shp-${p.shape}` : '', ...plateCls(p), extraClass].filter(Boolean).join(' ');
  return `<section class="${cls}"${attr('id', p.anchor)}${maskVar(p)}>\n  <div class="wrap">\n${inner}\n  </div>\n</section>`;
}

/* CSS変数をまとめて1つの style 属性にする。
   属性を2つ書くと後ろが捨てられるので、必ずここを通す。 */
const styleVars = (...pairs) => {
  const on = pairs.filter((v) => v);
  return on.length ? ` style="${on.join(';')}"` : '';
};

/* 自分で用意した形を、CSS変数としてブロックに渡す。
   画像そのものを持つので長くなるが、外から読み込むものは増えない。 */
const maskVal = (p) => (p.shape === 'own' && p.shapeMask
  ? `--shape:url('${esc(p.shapeMask)}')` : '');
const maskVar = (p) => styleVars(maskVal(p));

/* 土台のクラス。色と、どちらへずらすか */
const plateCls = (p) => (p.plate
  ? ['plt', `plt-${p.plate}`, p.plateShift ? `pltf-${p.plateShift}` : ''].filter(Boolean)
  : []);

/* ---------------- 動画の埋め込み ----------------
   動画そのものは持たず、URLから置き場所だけを作る。
   YouTube と Vimeo は先方の再生器を借り、動画ファイルは自前で再生する。 */
const isFileVideo = (u) => /\.(mp4|webm|ogv|mov)(\?|$)/i.test(String(u || ''));

function videoSrc(url) {
  const u = String(url || '').trim();
  if (!u) return null;
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${m[1]}` };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { kind: 'embed', src: `https://player.vimeo.com/video/${m[1]}` };
  if (isFileVideo(u)) return { kind: 'file', src: u };
  return null;
}

function videoTag(p) {
  const v = videoSrc(p.url);
  if (!v) {
    return '      <span class="ph vid-ph" aria-hidden="true"></span>';
  }
  if (v.kind === 'embed') {
    return `      <iframe src="${esc(v.src)}" title="${esc(p.title || '動画')}" loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
  }
  /* 自動再生は、音が出ない・その場で再生する、の2つが揃わないと
     端末側に止められる。両方まとめて付ける。 */
  const auto = p.auto ? ' autoplay muted loop playsinline' : ' controls playsinline';
  return `      <video src="${esc(v.src)}"${p.poster ? ` poster="${esc(p.poster)}"` : ''}${auto}
        preload="metadata"></video>`;
}

/* 見出しブロック（アイキャッチ・タイトル・サブ） */
function head(p, align = 'center') {
  if (!p.eyebrow && !p.title && !p.text) return '';
  return `    <div class="sec-head${align === 'left' ? ' left' : ''}">
${p.eyebrow ? `      <span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${esc(p.eyebrow)}</span>\n` : ''}${p.title ? `      <h2 class="sec-title"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>\n` : ''}${p.text ? `      <p class="sec-sub"${el(p, 'text', 'ta', '説明文', 'text')}>${nl2br(p.text)}</p>\n` : ''}    </div>`;
}

/* ボタン群 */
/* ボタンの型。見た目・大きさ・矢印を、それぞれ別に選べる */
const BTN_STYLES = [
  ['primary', 'Solid'],
  ['accent', 'Accent'],
  ['ghost', 'Outline'],
  ['pill', 'Pill'],
  ['square', 'Square'],
  ['dark', 'Dark'],
  ['solidlight', 'Light'],
  ['link', 'Underline'],
  ['hard', 'Hard Shadow'],
];

function buttons(list, extraClass = '') {
  if (!list || !list.length) return '';
  const items = list
    .filter((b) => b.label)
    .map((b) => {
      const cls = ['btn',
        b.style && b.style !== 'primary' ? b.style : '',
        b.size || '',
        b.arrow ? 'arrow' : ''].filter(Boolean).join(' ');
      return `      <a class="${cls}"${linkAttr(b.href)}>${esc(b.label)}</a>`;
    })
    .join('\n');
  return items ? `    <div class="btn-row ${extraClass}">\n${items}\n    </div>` : '';
}

/* 文字アニメーションの一覧（サイト側CSSの ta-* と対応） */
const TEXT_ANIMS = [
  ['none', 'None'],
  ['fadeup', 'Fade Up'],
  ['maskline', 'Mask Line'],
  ['blur', 'Blur'],
  ['flip3d', 'Flip 3D'],
  ['drop', 'Drop'],
  ['bounce', 'Bounce'],
  ['slidealt', 'Slide Alt'],
  ['scatter', 'Scatter'],
  ['neon', 'Neon'],
  ['fillgrad', 'Gradient'],
  ['wipeleft', 'Wipe from Left'],
  ['wipeup', 'Wipe from Bottom'],
  ['wipedown', 'Wipe from Top'],
  ['scramble', 'Scramble'],
  ['type', 'Typewriter'],
];
const TEXT_ANIMS_WITH_DEFAULT = [['', '全体設定に従う']].concat(TEXT_ANIMS);

/* 画像・要素アニメーションの一覧（サイト側CSSの ia-* と対応） */
const IMAGE_ANIMS = [
  ['none', 'None'],
  ['zoomin', 'Zoom In'],
  ['zoomout', 'Zoom Out'],
  ['slideleft', 'Slide L'],
  ['slideright', 'Slide R'],
  ['slideup', 'Slide Up'],
  ['wipe', 'Wipe'],
  ['circle', 'Circle'],
  ['blurin', 'Blur In'],
  ['tilt3d', 'Tilt 3D'],
  ['flipup', 'Flip Up'],
  ['kenburns', 'Ken Burns'],
  ['float', 'Float'],
];

/* ============================================================
   ヒーローの装飾レイヤー
   写真や背景色の上に重ねる「金のかかったサイト」の質感担当。
   文字を守る暗幕（.hero.cover::before）より下に敷くので、
   どれを選んでも見出しが読めなくなることはない。
   ============================================================ */
/* スクロールに連動するヒーローの型。
   区間を長くとって中身を貼り付け（sticky）、進み具合 0→1 で動かす。 */
const HERO_SCROLLS = [
  ['none', 'None'],
  ['zoomout', 'Zoom Out'],
  ['parallax', 'Parallax'],
  ['curtain', 'Curtain'],
  ['maskzoom', 'Mask Zoom'],
];

/* ヘッダーのバーの型。
   既定の line は、これを足す前の見た目そのもの（地の色＋下の線、
   固定しているときは半透明のすりガラス）。前に作ったページの見え方を
   変えないため、既定はここから動かさない。 */
const HDR_BARS = [
  ['line', 'Line'],
  ['solid', 'Solid'],
  ['glass', 'Glass'],
  ['clear', 'Clear'],
  ['over', 'Overlay'],
  ['float', 'Floating'],
];

const HERO_DECOS = [
  ['none', 'None'],
  ['clouds', 'Clouds'],
  ['glass', 'Glass'],
  ['aurora', 'Aurora'],
  ['dust', 'Dust'],
  ['spot', 'Spotlight'],
  ['depth', 'Depth'],
  ['silk', 'Silk'],
  ['cursor', 'Cursor'],
  ['dots', 'Dots'],
  ['blur', 'Blur'],
  ['grain', 'Grain'],
];

/* ---------------- 溶け落ちる縁（メルト） ----------------
   ヒーローの下の縁を、直線ではなく「上から流れ落ちた」形にする。

   描いているのは、下の段の地の色（--c-bg）を、ヒーローの下から
   すくい上げた形。だから色を持たない——currentColor だけで、
   どの配色でも下の段と必ず同じ色になる。ヒーロー側に色や写真が
   あってはじめて見える（白い地に白を注いでも何も起きない）。

   viewBox は 1200×120 に固定。枠のほうを同じ比（aspect-ratio）にして、
   伸ばさずに出す。横だけ伸ばすと、しずくが平たいタブに化ける
   （最初そうなっていて、まったく溶けに見えなかった）。
   深さを変えたいときは、CSS で下を軸に縦へ伸ばす。 */
const HERO_MELTS = [
  ['none', 'None'],
  ['flow', 'Flow'],
  ['slope', 'Slope'],
  ['swell', 'Swell'],
  ['drip', 'Drip'],
  ['bubble', 'Bubble'],
  ['own', 'Own Shape'],
];

/* 溶け方は「縁の通り道」で持つ。パスを直に書くと、深さも位置も
   あとから直せない（最初に手で書いたものは垂れが浅すぎた）。

   縁は [x, y] の点の並び。点と点は水平の制御点でつなぐので、
   角が立たず、ひと続きの流れになる。y が大きいほど下へ食い込む。

   しずくを足したい形だけ drops を持つ。しずく = [中心x, 首の半幅, 深さ]。
   数を増やすほど「垂れ」ではなく「ぎざぎざ」に見えるので、少なく、
   間を空けて置く。 */
const MELT_SHAPES = {
  /* 流れ：長い1本のゆるやかな曲がり。いちばん素直で、どの配色にも合う */
  flow: { edge: [[0, 66], [300, 84], [620, 52], [900, 70], [1200, 44]] },

  /* 片流れ：左が深く、右へ向かって上がっていく。写真を右に置くときに */
  slope: { edge: [[0, 92], [340, 74], [700, 44], [1200, 20]] },

  /* うねり：真ん中が大きくふくらむ。文字を真ん中に置くときに */
  swell: { edge: [[0, 34], [260, 52], [600, 96], [940, 54], [1200, 30]] },

  /* しずく：ゆるい縁から、3つだけ大きく垂れる */
  drip: { edge: [[0, 40], [420, 56], [820, 38], [1200, 50]],
    drops: [[250, 46, 52], [660, 58, 40], [1010, 40, 62]] },

  /* 玉：浅い縁の下に、切れた玉だけが残る。[中心x, 中心y, 半径] */
  bubble: { edge: [[0, 44], [380, 62], [760, 46], [1200, 58]],
    balls: [[210, 92, 15], [520, 104, 10], [880, 96, 13], [1108, 88, 8]] },
};

const H = 120;                       /* viewBox の高さ。下はここで閉じる */
const n1 = (v) => Math.round(v * 10) / 10;
/* 点と点を、水平の制御点でつなぐ。角が立たず、ひと続きの流れになる */
const ease = (x0, y0, x1, y1) => {
  const m = (x1 - x0) * 0.5;
  return `C${n1(x0 + m)},${n1(y0)} ${n1(x1 - m)},${n1(y1)} ${n1(x1)},${n1(y1)}`;
};
/* しずく1つ。首から下り、少し腹をふくらませて、丸い先で止まり、また上がる。
   先の制御点を外へ開くと底が平らな「タブ」になる。内へ寄せて丸く止める。 */
const dropArc = (cx, w, base, d) =>
  `C${n1(cx - w * 1.16)},${n1(base + d * 0.44)} ${n1(cx - w * 0.6)},${n1(base + d)} ${n1(cx)},${n1(base + d)}`
  + `C${n1(cx + w * 0.6)},${n1(base + d)} ${n1(cx + w * 1.16)},${n1(base + d * 0.44)} ${n1(cx + w)},${n1(base)}`;
/* 切れて残った玉。円ひとつを、閉じた部分パスとして足す（evenodd で穴になる） */
const ball = (cx, cy, r) => `M${n1(cx - r)},${n1(cy)}`
  + `a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;

/* 縁の高さを、その x のところで読む（しずくの首を縁の上に置くため） */
function edgeAt(edge, x) {
  for (let i = 1; i < edge.length; i += 1) {
    if (x <= edge[i][0]) {
      const [x0, y0] = edge[i - 1], [x1, y1] = edge[i];
      const t = (x - x0) / (x1 - x0 || 1);
      return y0 + (y1 - y0) * (t * t * (3 - 2 * t));   // つなぎ方と同じ曲がり
    }
  }
  return edge[edge.length - 1][1];
}

function meltPath(key) {
  const sp = MELT_SHAPES[key];
  if (!sp) return '';
  const edge = sp.edge;
  const drops = (sp.drops || []).slice().sort((u, v) => u[0] - v[0]);
  let d = `M0,${H} L0,${n1(edge[0][1])}`;
  let x = 0, y = edge[0][1];
  /* 縁をたどりながら、しずくの首に来たら垂らして、また縁に戻る */
  const walkTo = (tx) => {
    for (let i = 1; i < edge.length; i += 1) {
      if (edge[i][0] <= tx && edge[i][0] > x) {
        d += ease(x, y, edge[i][0], edge[i][1]);
        [x, y] = edge[i];
      }
    }
    if (tx > x) { const ty = edgeAt(edge, tx); d += ease(x, y, tx, ty); x = tx; y = ty; }
  };
  drops.forEach(([cx, w, dep]) => {
    walkTo(cx - w);
    d += dropArc(cx, w, y, dep);
    x = cx + w;
  });
  walkTo(1200);
  d += ` L1200,${H} Z`;
  (sp.balls || []).forEach(([cx, cy, r]) => { d += ball(cx, cy, r); });
  return d;
}

/* 使う形だけ、その場で組み立てる */
const MELT_PATHS = Object.fromEntries(Object.keys(MELT_SHAPES).map((k) => [k, meltPath(k)]));

/* ================================================================
   ヒーローの型（3つ）

   ヒーローはページの質をいちばん左右する。だから細かく組ませるのではなく、
   出来上がった形から選んでもらう。ここはその中身。
   ================================================================ */

/* ---------- 動画＋色の帯（ribbon） ----------
   後ろに動画か写真、その上に薄い色の膜、さらに1本の帯を縦に通す。
   帯は画面の外まで伸ばしてあるので、下の段まで続いて見える。

   帯そのものは「上から下へ、ゆるく身をよじった1本」。
   まっすぐ下ろすと定規の線になり、曲げすぎるとリボンに見える。 */
const RIBBON_PATH = 'M330,0 C440,160 210,300 275,470 C340,640 165,770 232,930'
  + ' C300,1090 150,1190 216,1320 L560,1320 C494,1190 644,1090 576,930'
  + ' C509,770 684,640 619,470 C554,300 784,160 674,0 Z';

function ribbonLayer(p) {
  const lab = p.scrollLabel === undefined ? 'Scroll' : p.scrollLabel;
  return `  <div class="rib" aria-hidden="true"><svg viewBox="0 0 1000 1320"`
    + ' preserveAspectRatio="none" focusable="false">'
    + `<path d="${RIBBON_PATH}"/></svg></div>\n`
    + (lab ? `  <span class="hsign" aria-hidden="true">( ${esc(lab)} )</span>\n` : '');
}

/* ---------- ロゴ抜き（mark） ----------
   地の色をひと面ぶん敷き、その上にロゴの形で穴を開ける。
   穴の下は動くグラデーション。色が形の中だけをゆっくり流れる。

   持ち込みが無いあいだは、この形を使う。丸と柱を組んだだけの、
   どの業種にも寄らないしるし。 */
const MARK_FALLBACK = 'M300,44 L332,98 L332,398 L268,398 L268,98 Z'
  + ' M88.5,329.2A212,212 0 0,1 234.5,142.4L256.7,210.9A140,140 0 0,0 160.3,334.2Z'
  + ' M511.5,329.2A212,212 0 0,0 365.5,142.4L343.3,210.9A140,140 0 0,1 439.7,334.2Z';

/* 組み込みの形も、持ち込みと同じ「抜き型の画像」に揃える。
   同じ道具で扱えるほうが、あとで形を増やすのが楽になる。 */
const MARK_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 440">`
  + `<path fill="#000" d="${MARK_FALLBACK}"/></svg>`)}`;

function markLayer() {
  return '  <div class="mrk" aria-hidden="true"></div>\n';
}

/* ---------- 線のかたち（lineart） ----------
   細い線を何十本もずらして重ねると、面ではなく「気配」になる。
   白い地に置いても品が落ちない数少ない飾り。

   3種類とも、1本の道を少しずつずらして引くだけ。ずらしかたが違う。 */
function lineArt(kind) {
  const n = 44;
  const line = (i) => {
    const t = i / (n - 1);
    if (kind === 'fan') {
      /* 重なる面：斜めの直線を、端をずらしながら扇のように倒す */
      const x0 = 120 + t * 520, y0 = 40 + t * 90;
      const x1 = 640 + t * 420, y1 = 700 - t * 250;
      return `M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)}`
        + ` L${(x1 - 180).toFixed(1)},${(y1 + 150).toFixed(1)}`;
    }
    if (kind === 'ring') {
      /* 同心の輪：中心をわずかにずらしながら、だんだん大きくする */
      const r = 60 + t * 330, cx = 540 + t * 60, cy = 360 - t * 30;
      return `M${(cx - r).toFixed(1)},${cy.toFixed(1)}`
        + ` a${r.toFixed(1)},${(r * 0.86).toFixed(1)} 0 1,0 ${(r * 2).toFixed(1)},0`
        + ` a${r.toFixed(1)},${(r * 0.86).toFixed(1)} 0 1,0 ${(-r * 2).toFixed(1)},0`;
    }
    /* 流れる線：ゆるい波を、上下にずらしながら少しずつ形を変える */
    const y = 120 + t * 460, a = 60 + t * 26;
    return `M-40,${(y + a * 0.4).toFixed(1)}`
      + ` C240,${(y - a).toFixed(1)} 420,${(y + a * 1.2).toFixed(1)} 700,${(y - a * 0.2).toFixed(1)}`
      + ` C920,${(y - a * 1.1).toFixed(1)} 1000,${(y + a * 0.5).toFixed(1)} 1140,${(y - a * 0.3).toFixed(1)}`;
  };
  return Array.from({ length: n }, (_, i) => `<path d="${line(i)}"/>`).join('');
}

const LINE_ARTS = Object.fromEntries(['flow', 'fan', 'ring'].map((k) => [k, lineArt(k)]));

function lineArtLayer(p) {
  const k = LINE_ARTS[p.art] ? p.art : 'flow';
  const lab = p.scrollLabel === undefined ? 'Scroll' : p.scrollLabel;
  return `  <div class="lart lart-${esc(k)}" aria-hidden="true"><svg viewBox="0 0 1100 720"`
    + ` preserveAspectRatio="xMidYMid slice" focusable="false">${LINE_ARTS[k]}</svg></div>\n`
    + (lab ? `  <span class="hsign hsign-low" aria-hidden="true">${esc(lab)}</span>\n` : '');
}

/* ---------- まるく切り抜いた写真が浮かぶ（orbit） ----------
   大きさのちがう丸を、ばらばらの高さに置いてゆっくり漂わせる。
   置き場所は5つ決め打ち。うち2つは画面の端から出しておく。
   はみ出させないと「並べた」ように見えて、浮いている感じが出ない。

   後ろの点線は等高線のつもり。丸のうしろに一枚あるだけで、
   丸が「空にある」のか「紙に貼ってある」のかが決まる。 */
const ORB_MAX = 5;
const ORB_LINES = `    <svg class="orb-map" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice"
      aria-hidden="true" focusable="false">`
  + [0, 1, 2, 3, 4, 5].map((i) =>
    `<ellipse cx="620" cy="392" rx="${300 + i * 118}" ry="${190 + i * 76}" transform="rotate(-14 620 392)"/>`
  ).join('')
  + `</svg>`;

function orbitLayer(p) {
  const list = (p.orbs || []).slice(0, ORB_MAX);
  if (!list.length) return '';
  const orbs = list.map((o, i) => {
    const src = (o && o.src) || '';
    return `    <div class="orb orb-${i + 1}${src ? '' : ' ph'}"`
      + `${el(p, `orb${i}`, 'ia', `まるい写真 ${i + 1}`)}`
      + `${imgSlot(`orbs.${i}.src`, p)}`
      + `${styleVars(src ? `--orb:url('${esc(src)}')` : '')}></div>`;
  }).join('\n');
  return `  <div class="orbs">\n${ORB_LINES}\n${orbs}\n  </div>\n`;
}

/* ---------- ペンキのひと刷け ----------
   きれいな楕円だと「絵の具」に見えない。縁を荒らして、穂先を細らせて、
   まわりに毛の筋を数本飛ばす。ぶれの数は種から作るので、読み込み直しても
   同じ形になる（毎回変わると、編集画面と書き出したページで別物になる）。 */
const jitter = (seed) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* 枠は 560×200 に決め打ち。刷けの中心線もこの中に収める。
   枠が余ると SVG の伸縮に負けて形が崩れるので、余白を作らない。 */
const PK_W = 560, PK_H = 200, PK_MID = PK_H / 2;
const pkCenter = (t, seed) => PK_MID + Math.sin(t * 2.2 + seed) * 12;
/* 穂先は細く、腹はふくらみ、終わりぎわでまた細る */
const pkProf = (t) => Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 0.62);

function brushPath(seed, w) {
  const N = 34, top = [], bot = [];
  for (let i = 0; i <= N; i += 1) {
    const t = i / N;
    const prof = pkProf(t);
    const x = t * PK_W;
    const yc = pkCenter(t, seed);
    const half = w * prof;
    /* ぶれは控えめに。縁の荒れは、このあとフィルタでまとめて付ける */
    top.push([x, yc - half * (0.9 + 0.14 * jitter(seed + i * 3.7))]);
    bot.push([x, yc + half * (0.9 + 0.14 * jitter(seed + i * 5.3 + 40))]);
  }
  return `M${top.map(([x, y]) => `${n1(x)},${n1(y)}`).join(' L')}`
    + ` L${bot.reverse().map(([x, y]) => `${n1(x)},${n1(y)}`).join(' L')} Z`;
}

/* 毛の筋。刷けの中を通る「絵の具の乗っていない筋」と、
   穂先から飛び出す細い線。線として引く（塗ると閉じていない形が三角に潰れる）。 */
function bristles(seed, w) {
  const line = (cls, a, b, off, sw) => {
    const pts = [];
    for (let i = 0; i <= 10; i += 1) {
      const t = a + (b - a) * (i / 10);
      pts.push(`${n1(t * PK_W)},${n1(pkCenter(t, seed) + off * pkProf(t))}`);
    }
    return `<path class="${cls}" d="M${pts.join(' L')}" stroke-width="${n1(sw)}"/>`;
  };
  /* 中を通る筋（＝かすれ）。地の色で描いて、絵の具を抜く */
  const gaps = [0, 1, 2, 3, 4].map((k) => {
    const off = (jitter(seed + k * 9.1) - 0.5) * 1.7 * w;
    const a = 0.06 + jitter(seed + k * 4.3) * 0.22;
    return line('pk-gap', a, a + 0.3 + jitter(seed + k * 7.7) * 0.5, off,
      1.4 + jitter(seed + k * 2.7) * 3.6);
  }).join('');
  /* 外へ飛ぶ筋。これが無いと、ただの帯に見える */
  const hairs = [0, 1, 2].map((k) => {
    const off = (jitter(seed + k * 5.5 + 11) - 0.5) * 2.8 * w;
    const a = 0.12 + jitter(seed + k * 3.1) * 0.3;
    return line('pk-h', a, a + 0.2 + jitter(seed + k * 6.1) * 0.34, off,
      1.2 + jitter(seed + k * 8.3) * 1.8);
  }).join('');
  return gaps + hairs;
}

/* 縁の荒れは、形を描き足すのではなく、描いたものをノイズでずらして作る。
   点を増やして荒らそうとすると「破れた紙」になり、刷けにならない。
   横に低く・縦に高い周波数のノイズが、いちばん毛先らしくずれる。 */
const pkFilter = (id, seed) => `<filter id="${id}" x="-14%" y="-34%" width="128%" height="168%"`
  + ` color-interpolation-filters="sRGB">`
  + `<feTurbulence type="fractalNoise" baseFrequency="0.011 0.085" numOctaves="3"`
  + ` seed="${seed}" result="n"/>`
  + `<feDisplacementMap in="SourceGraphic" in2="n" scale="26"`
  + ` xChannelSelector="R" yChannelSelector="G"/></filter>`;

/* 刷けは1本ずつ、別の枠に入れて置く。1枚の枠に押し込んで引き伸ばすと、
   縦横の比が崩れて、刷けではなく破れた紙になる（実際そうなった）。
   width/height を属性でも書く。CSS の height:auto だけに任せると、
   親の高さに引っぱられて縦に伸びる。 */
const brushSVG = (cls, sd, w, seed) => {
  const id = `pkr${seed}`;
  return `<svg class="pk ${cls}" width="${PK_W}" height="${PK_H}"`
    + ` viewBox="0 0 ${PK_W} ${PK_H}" focusable="false">`
    + `<defs>${pkFilter(id, seed)}</defs>`
    + `<g filter="url(#${id})"><path class="pk-b" d="${brushPath(sd, w)}"/>`
    + `${bristles(sd, w)}</g></svg>`;
};

/* 後ろに敷く3本と、写真の手前に1本。手前の1本があると、
   写真が「背景の上に置いた四角」ではなく、絵の中の1枚になる。 */
const BRUSHES = [[0.7, 52], [2.3, 40], [4.9, 30]]
  .map(([sd, w], i) => brushSVG(`pk-${i + 1}`, sd, w, i + 1));
const BRUSH_FRONT = brushSVG('pk-f', 3.6, 26, 4);

/* 刷けは写真にも差し替えられる。本物のインクを撮ったものを置きたいときのため。
   背景の付いた写真でも、編集画面の「背景を抜く」で白地を抜ける。
   4本ぶん。0〜2 が後ろ、3 が写真の手前に来る1本。 */
const INK_MAX = 4;
const inkAt = (p, i, cls) => {
  const src = ((p.inks || [])[i] || {}).src || '';
  if (!src) return '';
  return `<div class="pk ${cls} pk-ink"${el(p, `ink${i}`, 'ia', `インク ${i + 1}`)}`
    + `${imgSlot(`inks.${i}.src`, p)}><img src="${esc(src)}" alt=""></div>`;
};

const paintLayer = (p) => `  <div class="paint" aria-hidden="true">${
  BRUSHES.map((svg, i) => inkAt(p, i, `pk-${i + 1}`) || svg).join('')}</div>\n`;
const paintFront = (p) => `      <div class="paint-f" aria-hidden="true">${
  inkAt(p, 3, 'pk-f') || BRUSH_FRONT}</div>`;

/* ---------- 写真がくるくる入れ替わる（reel） ----------
   輪の上に写真を置いて、時計回りに送る。前に来た1枚だけがはっきり見え、
   ほかは奥で小さく・ぼやけて・薄くなる。

   輪に沿って動かすのは rotate → translate → rotate の3段。
   位置を直接ずらすと直線で移動してしまい、「回った」ように見えない。
   角度を足していくので、一周しても戻らない（戻すと逆回りが見える）。 */
const REEL_MAX = 5;
const reelDepth = (a) => {
  const t = (1 - Math.cos((a * Math.PI) / 180)) / 2;   /* 0=手前 1=奥 */
  return { t, k: n1(1 - 0.46 * t), b: n1(6 * t), o: n1(1 - 0.58 * t), z: Math.round(100 - t * 90) };
};

function reelCards(p) {
  const list = (p.shots || []).slice(0, REEL_MAX);
  const n = Math.max(list.length, 1);
  const slots = list.map((o, i) => {
    const a = i * (360 / n);
    const d = reelDepth(a);
    const tilt = [-3.2, 2.6, -2.2, 3.4, -1.6][i % 5];
    return `        <div class="rl-slot" data-i="${i}"`
      + ` style="--a:${n1(a)}deg;--k:${d.k};--b:${d.b}px;--o:${d.o};--z:${d.z}">
          <div class="rl-card" style="--tilt:${tilt}deg"`
      + `${el(p, `shot${i}`, 'ia', `写真 ${i + 1}`)}${imgSlot(`shots.${i}.src`, p)}>${
  media((o && o.src) || '', '')}</div>
        </div>`;
  }).join('\n');
  /* 輪をひと回り小さくつぶす箱。円のままだと、奥の2枚が手前の写真の
     真上に来てしまい、左右へ逃げない。つぶす向きは縦だけ。 */
  return `      <div class="rl-ring">\n${slots}\n      </div>`;
}

/* ---------- 1商品を立てる（showcase） ----------
   写真を合成せず、線と色だけで「商品ポスター」を組む。
   要るのは4つだけ——斜めに差す光、枝の影、載せる台、まんなかの品名。

   枝は線で描く。写真だと差し替えのたびに雰囲気が変わるが、線なら
   配色に付いてくるし、どの端末でも同じ形で出る。 */
const BRANCH = [
  /* [パス, 太さ] 元は太く、先へ行くほど細くする。
     この差が枝らしさのほとんどなので、CSS 側で stroke-width を書かない */
  ['M0,176 C88,158 152,146 216,136 C302,123 384,110 456,98 C524,87 586,78 646,72', 7],
  ['M96,161 C122,126 140,102 134,62', 4.4],
  ['M134,62 C130,44 126,34 118,22', 2.4],
  ['M96,161 C128,150 156,144 190,140', 3.2],
  ['M216,136 C246,110 266,90 304,70', 4.2],
  ['M304,70 C318,60 330,54 346,50', 2.2],
  ['M216,136 C232,164 246,186 238,214', 3.4],
  ['M238,214 C234,228 228,238 218,248', 1.8],
  ['M330,118 C360,100 384,90 420,84', 3],
  ['M420,84 C436,80 448,78 462,78', 1.7],
  ['M456,98 C476,120 490,136 486,160', 2.8],
  ['M540,84 C566,68 588,60 616,56', 2.2],
  ['M616,56 C628,50 636,48 648,47', 1.5],
];
const branchArt = () => BRANCH.map(([d, w]) =>
  `<path d="${d}" stroke-width="${w}"/>`).join('');

/* 写真を入れる前に置いておく、線で描いた瓶。
   空の枠を出すと「入れ忘れ」に見えて、組みかたが伝わらない。 */
const SHW_BOTTLE = `<svg class="shw-draw" viewBox="0 0 200 300" aria-hidden="true" focusable="false">
  <rect x="82" y="10" width="36" height="34" rx="3"/>
  <rect x="88" y="44" width="24" height="16"/>
  <rect x="46" y="60" width="108" height="222" rx="6"/>
  <line x1="70" y1="150" x2="130" y2="150"/>
  <line x1="78" y1="176" x2="122" y2="176"/>
</svg>`;

const showcaseLayer = (p) => `  <div class="shw-set" aria-hidden="true">
    <i class="shw-wall"></i>
    <i class="shw-beam"></i>
${p.branchImg
    /* 写真があればそちらを使う。同じ絵をもう1枚ずらして暗く敷き、壁の影にする */
    ? `    <div class="shw-photo"><img src="${esc(p.branchImg)}" alt=""></div>`
    : `    <svg class="shw-branch" viewBox="0 0 700 268" preserveAspectRatio="xMinYMin slice" focusable="false">
      <g class="shw-cast" transform="translate(26,34)">${branchArt()}</g>
      <g>${branchArt()}</g>
    </svg>`}
  </div>\n`;

/* 丸い印と、帯のラベル。パッケージの「砂糖不使用」「送料無料」のような、
   ひと目で伝わる短い言葉を置く。円のまわりを回る文字は SVG の textPath。
   id はページの中で重ならないよう、中身から作る（hashId）。 */
function heroMarks(p) {
  if (!p.badge && !p.tag) return '';
  let out = '';
  if (p.badge) {
    const lines = String(p.badge).split('\n').filter((x) => x.trim());
    const ring = p.badgeRing ? String(p.badgeRing) : '';
    const id = `br${hashId(`${ring}|${lines.join('')}`)}`;
    /* 行数で字の大きさを変える。1行だけのときに小さいままだと間が抜ける */
    const size = lines.length > 2 ? 15 : 19;
    out += `      <span class="hero-badge"${el(p, 'badge', 'ia', '丸い印')}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle class="hb-ring" cx="60" cy="60" r="49"/>
          ${ring ? /* 上半分の弧。まるごと1周させると、下に回った字が
                        さかさまになる（実際そうなった）。上だけを通す */
    `<path id="${id}" fill="none" d="M17,60 A43,43 0 0 1 103,60"/>
          <text class="hb-arc"><textPath href="#${id}" startOffset="50%">${esc(ring)}</textPath></text>` : ''}
        </svg>
        <b${ed('badge', '丸い印')}>${lines.map((l) => `<i style="font-size:${size}px">${esc(l)}</i>`).join('')}</b>
      </span>\n`;
  }
  if (p.tag) {
    out += `      <span class="hero-tag"${ed('tag', '帯のラベル')}>${esc(p.tag)}</span>\n`;
  }
  return `      <div class="hero-marks">\n${out}      </div>\n`;
}

/* ヒーローの下に敷く1枚。色は持たず、CSS の currentColor に任せる。
   持ち込んだ形（own）のときは、パスではなく画像で抜く。
   自分で描いた縁を使いたい人は、ここから入れられる。 */
function meltLayer(p) {
  const k = p.melt && p.melt !== 'none' ? p.melt : '';
  if (!k) return '';
  if (k === 'own') {
    return p.meltMask
      ? `  <div class="melt melt-own" aria-hidden="true"></div>\n` : '';
  }
  if (!MELT_PATHS[k]) return '';
  return `  <div class="melt melt-${esc(k)}" aria-hidden="true"><svg viewBox="0 0 1200 120"`
    + ' preserveAspectRatio="none" focusable="false">'
    + `<path fill-rule="evenodd" d="${MELT_PATHS[k]}"/></svg></div>\n`;
}

/* 雲・オーロラの配置。実行時に乱数を使うと再読み込みのたびに絵が変わって
   落ち着かないので、値は決め打ちで持つ。
   [左%, 上%, 大きさvw, 横ゆれpx, 縦ゆれpx, 伸縮, 秒, 開始ずらし秒, 濃さ, 視差の強さ] */
const CLOUD_BLOBS = [
  [10, 18, 36, 62, -30, 1.14, 34, 0, 0.5, 26],
  [70, 10, 28, -74, 36, 1.1, 43, -8, 0.42, 17],
  [44, 58, 42, 46, -42, 1.18, 51, -19, 0.36, 34],
  [85, 54, 24, -52, -28, 1.12, 39, -27, 0.34, 12],
  [20, 76, 32, 70, 24, 1.08, 47, -13, 0.28, 22],
];
const AURORA_BLOBS = [
  [14, 20, 46, 90, -46, 1.2, 28, 0, 0.5, 30, 'var(--c-primary)'],
  [64, 8, 52, -96, 52, 1.24, 36, -11, 0.42, 20, 'var(--c-accent)'],
  [40, 62, 58, 62, -58, 1.16, 44, -22, 0.34, 38, 'var(--c-primary)'],
];

/* にじむ光。3つだけを大きく置いて、強くぼかす。
   数を増やすとぼけが混ざって、ただの色ムラになる。 */
const BLUR_BLOBS = [
  [12, 18, 58, 120, -70, 1.24, 34, 0, 0.62, 30, 'var(--c-primary)'],
  [66, 6, 50, -140, 84, 1.2, 42, -12, 0.5, 22, 'var(--c-accent)'],
  [40, 62, 62, 96, -96, 1.28, 50, -26, 0.44, 38, 'var(--c-primary)'],
];

/* 外側の <i> がポインタ視差、内側の <b> がゆっくりした漂い。
   ひとつの要素に両方の transform は書けないので、2枚に分けている。 */
function blobs(list, withColor) {
  return list.map(([x, y, w, dx, dy, ds, dur, delay, op, pk, color]) =>
    `    <i style="left:${x}%;top:${y}%;width:${w}vw;--pk:${pk}"><b style="--dx:${dx}px;--dy:${dy}px;`
    + `--ds:${ds};animation-duration:${dur}s;animation-delay:${delay}s;opacity:${op}`
    + `${withColor ? `;--col:${color}` : ''}"></b></i>`).join('\n');
}

/* 「文字の中から写真が広がる」型の覆い。
   写真を文字で塗る（background-clip:text）やり方は、拡大すると
   写真が引き伸ばされて粗くなる。そこで写真は等倍のまま置いておき、
   その上に「文字の形だけ穴が開いた板」をかぶせて、穴のほうを広げる。
   穴の形は SVG なので、何倍に広げても輪郭がぼやけない。 */
function maskZoomLayer(p) {
  const raw = String(p.title || '').split('\n')[0].trim() || 'HELLO';
  const t = raw.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  /* 長い見出しでも枠からはみ出さないよう、文字数で大きさを決める */
  const size = Math.max(120, Math.min(420, Math.round(3400 / Math.max(2, raw.length))));
  /* CSS の mask は、画像を渡すと「明るさ」ではなく「不透明度」で見る。
     黒い文字を置いただけでは穴にならないので、SVG の中で先に抜いておく。 */
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4000 4000">`
    + `<defs><mask id="h"><rect width="4000" height="4000" fill="#fff"/>`
    + `<text x="2000" y="2000" fill="#000" text-anchor="middle" dominant-baseline="central" `
    + `font-family="sans-serif" font-weight="900" font-size="${size}">${t}</text></mask></defs>`
    + `<rect width="4000" height="4000" fill="#000" mask="url(%23h)"/></svg>`;
  return `  <div class="mzo" aria-hidden="true" style="--mzsvg:url(&quot;data:image/svg+xml,`
    + `${encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22').replace(/%2523/g, '%23')}&quot;)"></div>\n`;
}

/* 装飾レイヤーのHTML。強さは --deco-k（0〜1.5）で全体にかかる */
function decoLayer(p) {
  const kind = p.deco || 'none';
  if (kind === 'none' && !p.grain) return '';
  const k = ((p.decoStrength ?? 60) / 60).toFixed(2);
  let inner = '';
  if (kind === 'clouds') inner = blobs(CLOUD_BLOBS, false);
  else if (kind === 'aurora') inner = blobs(AURORA_BLOBS, true);
  else if (kind === 'glass') inner = '    <i class="gl gl1"></i>\n    <i class="gl gl2"></i>';
  else if (kind === 'spot') inner = '    <i class="sp"></i>';
  else if (kind === 'cursor') inner = `    <i class="cur"><b>${esc(p.decoLabel || 'SCROLL')}</b></i>`;
  else if (kind === 'dust') inner = '    <canvas class="du"></canvas>';
  /* 網点。要素はいらない。地に敷いた点の並びを、片側だけ濃く残す */
  else if (kind === 'dots') inner = '    <i class="dt"></i>';
  /* にじむ光。雲より数を減らして、そのぶん大きく強くぼかす */
  else if (kind === 'blur') inner = blobs(BLUR_BLOBS, true);
  else if (kind === 'grain') inner = '    <u class="grain"></u>';
  else if (kind === 'silk') {
    inner = [0, 1, 2, 3, 4].map((i) =>
      `    <i class="sk" style="--n:${i};animation-duration:${20 + i * 5}s;animation-delay:${-i * 4}s"></i>`).join('\n');
  }
  const grain = p.grain ? `${inner ? '\n' : ''}    <u class="grain"></u>` : '';
  return `  <div class="deco"${kind === 'none' ? '' : ` data-deco="${esc(kind)}"`}`
    + ` style="--deco-k:${k}" aria-hidden="true">\n${inner}${grain}\n  </div>\n`;
}

/* 要素にアニメーション用の目印を付ける。
   role  : props.anims のキー
   kind  : 'ta'（文字）/ 'ia'（画像・要素）
   label : 編集画面に表示する名前
   ※ 遅延は style ではなく data-delay で渡す（既存の style 属性とぶつからないように） */
function el(p, role, kind, label, prop) {
  const cfg = (p.anims || {})[role] || {};
  let out = ` data-el="${esc(role)}" data-elname="${esc(label)}" data-elkind="${kind}" data-${kind}`;
  if (prop) out += ` data-prop="${esc(prop)}"`;   // ダブルクリックで直接編集できる
  if (cfg.a) out += ` data-anim="${esc(cfg.a)}"`;
  if (cfg.d) out += ` data-delay="${parseInt(cfg.d, 10) || 0}"`;
  /* style は1つにまとめる。2つ書くと、あとの1つは丸ごと捨てられる */
  const st = [];
  /* 文字の塗り。data-txf は書き出しでも残す（見た目そのものなので） */
  const fill = (p.fills || {})[role];
  if (fill) {
    out += ` data-txf="${esc(fill)}"`;
    if (fill === 'own') {
      const im = (p.fillImgs || {})[role];
      if (im) st.push(`--txf:url('${esc(im)}')`);
    }
  }
  /* 置き場所の微調整。ずらす量は「ヒーローの幅の何％」で持つので、
     画面が小さくなっても同じ割合で付いてくる。
     transform ではなく translate に書く——transform は動きの演出が
     使っているので、ここで書くと消し合う。 */
  const mv = (p.place || {})[role];
  if (mv && (Number(mv.x) || Number(mv.y))) {
    out += ' data-mv';
    st.push(`--ox:${n1(Number(mv.x) || 0)}`, `--oy:${n1(Number(mv.y) || 0)}`);
  }
  /* 大きさも同じく、transform とは別のプロパティ（scale）に書く。
     translate → rotate → scale の順で組み合わさるので、
     大きさを変えても、ずらした量は道連れにならない。 */
  const sc = Number((p.size || {})[role]);
  if (sc && sc !== 1) { out += ' data-sc'; st.push(`--sc:${Math.round(sc * 1000) / 1000}`); }
  if ((p.off || {})[role]) out += ' data-off';
  if (st.length) out += ` style="${st.join(';')}"`;
  return out;
}

/* ヒーローの中で1つでも動かしていたら、ヒーローを「ものさし」にする。
   ずらす量の 1cqw が、ヒーローの幅の1％になる。 */
const mvOn = (p) => (Object.keys((p && p.place) || {}).some((k) => {
  const v = p.place[k];
  return v && (Number(v.x) || Number(v.y));
}) ? ' data-mvon' : '');

/* 画像を差し替えられる枠であることを示す（タップで選択、ドロップで投入） */
/* 画像の枠。編集画面がどのプロパティの枠かを知るための目印と、
   その写真の「見せ方」（位置・大きさ）をCSS変数で持たせる。
   data-imgprop は書き出しのときに落ちるが、style は残るので、
   位置と大きさは公開したページでもそのまま効く。 */
const imgSlot = (prop, props) => {
  const f = props ? getIn(props, `${prop}Fit`) : null;
  if (!f) return ` data-imgprop="${esc(prop)}"`;
  const v = [];
  if (f.x != null && f.x !== 50) v.push(`--ix:${+f.x}%`);
  if (f.y != null && f.y !== 50) v.push(`--iy:${+f.y}%`);
  if (f.z != null && f.z !== 100) v.push(`--iz:${(+f.z / 100).toFixed(3)}`);
  return ` data-imgprop="${esc(prop)}"${v.length ? ` style="${v.join(';')}"` : ''}`;
};

/* "items.0.src" のような道順で取り出す */
const getIn = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

/* ダブルクリック編集だけを付ける（段落が複数あるなど、文字アニメを付けない場所用） */
function ed(prop, label) {
  return ` data-prop="${esc(prop)}" data-elname="${esc(label)}"`;
}

/* よく使う共通フィールド */
const FIELD = {
  bg: {
    key: 'bg', label: '背景色', type: 'select',
    options: [['', '標準'], ['surface', '薄いグレー'], ['primary', 'メインカラー'], ['dark', 'ダーク']],
  },
  /* 写真の形。写真そのものは変えず、見せ方だけを切り替える。
     いつでも「四角のまま」に戻せる。 */
  shape: {
    key: 'shape', label: '写真の形', type: 'select', gallery: 'shape',
    options: [
      ['', 'Square'], ['round', 'Rounded'], ['circle', 'Circle'],
      ['egg', 'Egg'], ['diamond', 'Diamond'], ['arch', 'Arch'],
      ['leaf', 'Leaf'], ['hex', 'Hexagon'], ['slant', 'Slant'],
      ['notch', 'Notch'], ['step', 'Step'], ['ticket', 'Ticket'],
      ['cross', 'Cross'], ['sparkle', 'Sparkle'],
      ['slats', 'Slats'], ['arches', 'Arches'],
      ['wave', 'Wave'], ['blob', 'Blob'],
      ['dots', 'Dots'], ['bars', 'Bars'], ['wavebar', 'Wave Bars'],
      ['own', 'Custom'],
    ],
    hint: 'Custom は、形の画像を読み込むとその形どおりに抜きます',
  },
  /* 自分で用意した形。持っているのはマスクの画像そのもの（データURL）。
     選び方は「型」ではなく「持ち込み」なので、選択肢とは別に持つ。 */
  shapeMask: { key: 'shapeMask', label: '形の画像', type: 'mask',
    showIf: (p) => p.shape === 'own' },

  /* 土台。写真の下に色の面を敷き、写真をひと回り小さく載せる。
     面のかたちは「写真の形」と同じものを使うので、22種そのまま選べる。 */
  plate: {
    key: 'plate', label: '写真の土台', type: 'select',
    options: [
      ['', 'なし'], ['dark', '濃い地'], ['primary', 'メインカラー'],
      ['accent', 'アクセント'], ['surface', '薄いグレー'], ['white', '白'],
    ],
    hint: '写真の下に色の面を敷いて、写真をひと回り小さく載せます',
  },
  plateShift: {
    key: 'plateShift', label: '土台の見せ方', type: 'select',
    options: [
      ['', '写真のまわりに均等'], ['br', '右下にずらす'], ['bl', '左下にずらす'],
      ['tr', '右上にずらす'], ['tl', '左上にずらす'],
    ],
    showIf: (p) => !!p.plate,
  },
  /* 見出しへの飛び先。置いた時点で自動で付き、リンク先の一覧にも出るので、
     人が打つ欄は置かない（#id という書き方を見せないため） */
  anchor: { key: 'anchor', label: '', type: 'hidden' },
  eyebrow: { key: 'eyebrow', label: '小見出し', type: 'text' },
  title: { key: 'title', label: '見出し', type: 'textarea', rows: 2 },
  text: { key: 'text', label: '説明文', type: 'textarea' },
  cols: {
    key: 'cols', label: '横に並べる数', type: 'select',
    options: [['c2', '2列'], ['c3', '3列'], ['c4', '4列']],
  },
  btnItem: [
    { key: 'label', label: 'ボタン文字', type: 'text' },
    { key: 'href', label: 'リンク先', type: 'link' },
    { key: 'style', label: '見た目', type: 'select', options: BTN_STYLES },
    { key: 'size', label: '大きさ', type: 'select',
      options: [['', 'ふつう'], ['lg', '大きい'], ['sm', '小さい'], ['full', '横いっぱい']] },
    { key: 'arrow', label: '矢印をつける', type: 'toggle' },
  ],
};

/* ============================================================
   コラージュ・ヒーロー
   写真を敷き詰めた背景に、斜めに切り出した写真と、
   縦書きの白い帯を重ねる型。報道・イベント・採用の顔に効く。

   手前の写真の置き場所は決め打ちで持つ。実行時に乱数で散らすと
   読み込むたびに絵が変わって落ち着かないため。
   [左%, 上%, 幅%, 傾き°, 重なり順, 出るまでの待ちms] */
const COLLAGE_SLOTS = [
  [3, 4, 34, -38, 3, 120],
  [56, -2, 26, 42, 2, 260],
  [37, 40, 32, -42, 3, 400],
  [74, 46, 22, 38, 2, 540],
  [13, 60, 20, 44, 1, 680],
];

/* 枠を θ 傾けて中身を戻すと、四隅が内側に食い込んで余白が出る。
   |sinθ|+|cosθ| 倍にしておけば、どの角度でも隙間なく埋まる。 */
function coverScale(deg) {
  const r = (deg * Math.PI) / 180;
  return (Math.abs(Math.sin(r)) + Math.abs(Math.cos(r))).toFixed(3);
}

/* 縦書きは font に頼らない。
   writing-mode に任せると、縦書き用の字送り（vmtx）を持たないフォントで
   漢字の送りがゼロになり、字が重なって潰れる（実測で確認）。
   1文字ずつ積むことで、どのフォントでも同じ見た目になる。 */
const V_ROTATE = 'ー〜～（）「」『』【】〔〕〈〉《》＜＞()[]{}<>=+－-—…';
const V_CORNER = '、。，．';

function vChar(ch) {
  if (ch === ' ' || ch === '\u3000') return '      <i class="cbc sp"></i>';
  const cls = V_ROTATE.includes(ch) ? ' rot' : (V_CORNER.includes(ch) ? ' cor' : '');
  return `      <i class="cbc${cls}">${esc(ch)}</i>`;
}

/* 1行＝1列。日本語の縦書きは右から読むので、
   最初の行がいちばん右に来るように並べる（CSS 側で row-reverse）。 */
function bands(text, side) {
  const cols = String(text || '').split('\n').map((t) => t.trim()).filter(Boolean);
  if (!cols.length) return '';
  return `    <div class="cband cband-${side}">
${cols.map((t, i) => `      <span class="cb" style="--i:${i}">
${[...t].map(vChar).join('\n')}
      </span>`).join('\n')}
    </div>`;
}

/* ============================================================
   ブロック本体
   ============================================================ */
const BLOCKS = {
  /* ---------------- ヘッダー ---------------- */
  header: {
    label: 'Header',
    icon: '▤',
    unique: true, // 1ページに1つだけ
    fields: [
      { key: 'bar', label: 'バーの型', type: 'select', options: HDR_BARS, gallery: 'hdr',
        hint: 'ベタ塗りはメインカラーで塗って、文字を白にします' },
      { key: 'logo', label: 'サイト名 / ロゴ文字', type: 'text' },
      { key: 'logoImage', label: 'ロゴ画像', type: 'image' },
      /* 重ねる型は、ヒーローの上に置くために流れから外している。
         固定と両立しないので、効かない設定は出さない。 */
      { key: 'sticky', label: 'スクロールしても上に固定', type: 'toggle',
        showIf: (p) => p.bar !== 'over' },
      { key: 'nav', label: 'メニュー', type: 'list', addLabel: 'メニューを追加',
        titleKey: 'label',
        item: [
          { key: 'label', label: '表示名', type: 'text' },
          { key: 'href', label: 'リンク先', type: 'link' },
        ] },
      { key: 'cta', label: 'ボタンの文字', type: 'text' },
      { key: 'ctaHref', label: 'ボタンのリンク先', type: 'link' },
    ],
    defaults: {
      bar: 'line', logo: 'YOUR LOGO', logoImage: '', sticky: true,
      nav: [
        { label: 'サービス', href: '#features' },
        { label: '私たちについて', href: '#about' },
        { label: '料金', href: '#pricing' },
        { label: 'お問い合わせ', href: '#contact' },
      ],
      cta: 'お問い合わせ', ctaHref: '#contact',
    },
    render: (p) => `<header class="hdr bar-${esc(p.bar || 'line')}${p.sticky ? ' sticky' : ''}">
  <div class="wrap hdr-in">
    <a class="logo" href="#top"${ed('logo', 'サイト名')}>${p.logoImage ? img(p.logoImage, p.logo) : ''}${esc(p.logo)}</a>
    <nav class="nav">${(p.nav || []).filter((n) => n.label).map((n) => `<a${linkAttr(n.href)}>${esc(n.label)}</a>`).join('')}</nav>
    ${p.cta ? `<a class="btn sm"${linkAttr(p.ctaHref)}>${esc(p.cta)}</a>` : ''}
    <button class="hdr-toggle" aria-label="メニュー">☰</button>
  </div>
</header>`,
  },

  /* ---------------- ヒーロー ---------------- */
  hero: {
    label: 'Hero',
    icon: '★',
    fields: [
      { key: 'layout', label: 'レイアウト', type: 'select',
        options: [['center', '中央ぞろえ'], ['left', '左ぞろえ'], ['split', '左右に画像'],
          ['pack', '商品パッケージ'], ['cover', '背景画像いっぱい'],
          ['ribbon', '動画＋色の帯'], ['mark', 'ロゴ抜き'], ['lineart', '線のかたち'],
          ['orbit', 'まるい写真が浮かぶ'], ['poster', '大きな名前＋1枚の写真'],
          ['showcase', '1商品を立てる（光と台）'],
          ['reel', '写真がくるくる入れ替わる']] },
      FIELD.eyebrow,
      { key: 'title', label: 'キャッチコピー', type: 'textarea', rows: 2 },
      { key: 'text', label: '説明文', type: 'textarea' },
      { key: 'image', label: '写真', type: 'image',
        showIf: (p) => !['orbit', 'reel'].includes(p.layout) },
      /* 「まるい写真が浮かぶ」は写真が主役なので、1枚ではなく並びで持つ。
         置き場所が5つしかないので、6枚目からは出ない */
      { key: 'orbs', label: 'まるい写真（5枚まで）', type: 'list', addLabel: '写真を追加',
        showIf: (p) => p.layout === 'orbit',
        item: [{ key: 'src', label: '写真', type: 'image' }] },
      { key: 'video', label: '背景の動画', type: 'text',
        showIf: (p) => p.layout === 'cover',
        hint: '入れると写真のかわりに動画が流れます。音は出ません' },
      /* 丸い印と、帯のラベル。商品の「砂糖不使用」「送料無料」のような、
         ひと目で伝えたい短い言葉を置く場所。どちらも空なら出ない。 */
      /* 品名のまん中に挟む小さな語。「BLEU / DE / CHANEL」の DE にあたる */
      { key: 'mid', label: '品名のあいだの語', type: 'text',
        showIf: (p) => p.layout === 'showcase',
        hint: '「BLEU / DE / CHANEL」の DE にあたるところ。空なら出しません' },
      { key: 'notes', label: 'いちばん下の3つ', type: 'text',
        showIf: (p) => p.layout === 'showcase',
        hint: '縦棒で区切ります。例：LIMITED 300 | ATELIER | EAU DE PARFUM' },
      /* 枝は線でも描けるが、写真を入れたほうが速いし、そのほうが強い */
      { key: 'branchImg', label: '上に垂らす枝の写真', type: 'image',
        showIf: (p) => p.layout === 'showcase',
        hint: '背景を抜いた枝や植物の写真。入れなければ、線で描いたものが出ます' },
      { key: 'shelfImg', label: '棚の写真', type: 'image',
        showIf: (p) => p.layout === 'showcase',
        hint: '棚板を正面から撮ったもの。入れなければ、描いた板が出ます' },
      /* くるくる回す写真。5枚まで */
      { key: 'shots', label: '回す写真（5枚まで）', type: 'list', addLabel: '写真を追加',
        showIf: (p) => p.layout === 'reel',
        item: [{ key: 'src', label: '写真', type: 'image' }] },
      /* 刷けの写真。入れた本数だけ、描いた刷けと置き換わる */
      { key: 'inks', label: 'インクの写真（4本まで）', type: 'list', addLabel: 'インクを追加',
        showIf: (p) => p.layout === 'reel', max: INK_MAX,
        hint: '4本目は写真の手前に来ます。白地の写真は「背景を抜く」で抜けます',
        item: [{ key: 'src', label: 'インク', type: 'image' }] },
      { key: 'badge', label: '丸い印の文字', type: 'textarea', rows: 2,
        showIf: (p) => !['showcase', 'reel'].includes(p.layout),
        hint: '改行すると2行になります。「砂糖\n不使用」など' },
      { key: 'badgeRing', label: '丸のまわりの文字', type: 'text', adv: true,
        showIf: (p) => !!p.badge, hint: '円にそって回ります。空なら線だけ' },
      { key: 'tag', label: '帯のラベル', type: 'text',
        showIf: (p) => !['showcase', 'reel'].includes(p.layout),
        hint: '「こだわりの素材」「送料無料」など、ひとこと' },
      /* 型ごとにしか使わない欄。その型を選んだときだけ出す */
      { key: 'markMask', label: 'ロゴ・マークの画像', type: 'mask',
        showIf: (p) => p.layout === 'mark',
        hint: '白地に黒で描いた形を読み込むと、そこだけ色が透けて動きます' },
      { key: 'side', label: '右の縦書き（欧文）', type: 'text',
        showIf: (p) => p.layout === 'poster',
        hint: '写真の右わきに縦で立ちます。空にすると出しません' },
      { key: 'art', label: '線のかたち', type: 'select',
        options: [['flow', '流れる線'], ['fan', '重なる面'], ['ring', '同心の輪']],
        showIf: (p) => p.layout === 'lineart' },
      { key: 'scrollLabel', label: 'いちばん下の合図', type: 'text', adv: true,
        showIf: (p) => ['ribbon', 'lineart', 'mark'].includes(p.layout),
        hint: '空にすると出しません' },
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      /* ここから下は「演出」。ヒーローは型から選んでもらうのが本筋なので、
         型を選んだあとに直したい人だけが開けばいい。前に出すと、
         決めることが増えて最初の1枚にたどり着けない。 */
      { key: 'scroll', label: 'スクロール連動', type: 'select', options: HERO_SCROLLS, gallery: 'scroll',
        adv: true, hint: '選ぶとヒーローが画面に貼り付き、スクロールの進み具合で動きます' },
      { key: 'deco', label: '装飾の動き', type: 'select', options: HERO_DECOS, gallery: 'deco',
        adv: true, hint: 'ポインタ追従は指の環境では自動で止まります' },
      { key: 'decoLabel', label: '丸の中の文字', type: 'text', showIf: (p) => p.deco === 'cursor' },
      { key: 'melt', label: '下の縁の形', type: 'select', options: HERO_MELTS, gallery: 'melt',
        adv: true, hint: 'ヒーローに色か写真があるときに見えます（下の段の地の色で流し込みます）' },
      { key: 'meltMask', label: '縁の画像', type: 'mask', showIf: (p) => p.melt === 'own',
        hint: '白地に黒で縁の形を描いた画像を読み込むと、そのとおりに流し込みます' },
      Object.assign({}, FIELD.shape, { adv: true }),
      Object.assign({}, FIELD.shapeMask, { adv: true }),
      FIELD.plate,
      FIELD.plateShift,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      layout: 'center', video: '', eyebrow: 'WELCOME',
      title: 'ここにいちばん伝えたい\nキャッチコピーを',
      text: 'サービスの魅力を1〜2行で。訪れた人が「自分に関係ある」と感じる言葉を置きましょう。',
      image: '', overlay: 55, bg: '', anchor: 'top',
      deco: 'none', decoStrength: 60, grain: false, decoLabel: 'SCROLL',
      melt: 'none', meltMask: '', meltDepth: 100,
      badge: '', badgeRing: '', tag: '',
      markMask: '', art: 'flow', scrollLabel: 'Scroll', side: 'PORTFOLIO',
      mid: 'DE', notes: 'LIMITED 300 | ATELIER | EAU DE PARFUM',
      branchImg: '', shelfImg: '', inks: [],
      shots: [{ src: '' }, { src: '' }, { src: '' }],
      orbs: [{ src: '' }, { src: '' }, { src: '' }, { src: '' }],
      scroll: 'none', scrollLen: 200,
      buttons: [
        { label: '無料で相談する', href: '#contact', style: 'primary' },
        { label: 'くわしく見る', href: '#features', style: 'ghost' },
      ],
    },
    render: (p) => {
      /* 「動画＋色の帯」は背景いっぱいの型の一種。写真や動画の出しかたは
         cover とそっくり同じでいいので、そこだけ同じ扱いにする。 */
      const ribbon = p.layout === 'ribbon';
      const cover = p.layout === 'cover' || ribbon;
      const needsPointer = ['glass', 'spot', 'depth', 'clouds', 'aurora', 'cursor'].includes(p.deco);
      const cls = ['hero', ribbon ? 'cover center ribbon' : (cover ? 'cover center' : p.layout),
        p.bg ? `bg-${p.bg}` : '',
        /* 形は、写真を枠に入れている型（左右ならび）でだけ効かせる。
           背景いっぱいの写真を切り抜いても、画面の角が欠けるだけになる。 */
        !cover && p.shape ? `shp-${p.shape}` : '',
        ...(cover ? [] : plateCls(p)),
        p.melt && p.melt !== 'none' && (MELT_PATHS[p.melt] || (p.melt === 'own' && p.meltMask))
          ? 'has-melt' : '',
        p.deco && p.deco !== 'none' ? `has-deco dk-${p.deco}` : ''].filter(Boolean).join(' ');
      const marks = heroMarks(p);
      const body = `      ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${nl2br(p.eyebrow)}</span>` : ''}
      ${p.title ? `<h1 class="hero-title"${el(p, 'title', 'ta', 'キャッチコピー', 'title')}>${nl2br(p.title)}</h1>` : ''}
      ${p.text ? `<p class="hero-text"${el(p, 'text', 'ta', '説明文', 'text')}>${nl2br(p.text)}</p>` : ''}
${marks}${buttons(p.buttons)}`;
      /* 写真いっぱいの型。枠の目印を付けて、押せば選び直せるようにする
         （位置と大きさの調整もここから届く） */
      /* 背景に動画があればそちらを流す。無ければ写真。
         自動再生は「音が出ない・その場で再生する」が揃わないと端末に止められる。 */
      const bgMedia = isFileVideo(p.video)
        ? `<video src="${esc(p.video)}" autoplay muted loop playsinline preload="metadata"${
          p.image ? ` poster="${esc(p.image)}"` : ''}></video>`
        : img(p.image, '');
      const bg = cover
        ? `  <div class="hero-bg" style="--hero-overlay:rgba(15,23,42,${(p.overlay ?? 55) / 100})"`
          + `${imgSlot('image', p)} data-elname="背景の写真">${bgMedia}</div>\n`
        : '';
      /* 中央ぞろえ・左ぞろえでも、写真を入れたら文章の下に置く。
         入れても何も起きないと、入れた本人には壊れて見える（実際に指摘された）。 */
      const wide = !cover
        && !['split', 'pack', 'orbit', 'poster', 'showcase', 'reel'].includes(p.layout) && p.image
        ? `\n      <div class="hero-media hero-wide"${el(p, 'image', 'ia', '画像')}`
          + `${imgSlot('image', p)}>${media(p.image, p.title)}</div>`
        : '';
      /* 「商品パッケージ」は左右ならびの一種。品名をうんと大きく見せたいので、
         組みかたは split と同じにして、大きさだけ CSS で変える。 */
      /* 「動画＋色の帯」だけは2枚組み。上の1画面で見出し、続けて同じ背景の
         まま文章を置く。下の段まで背景が続いて見えるのが、この型の要。 */
      const inner = ribbon
        ? `    <div class="hero-in">
      <div class="rib-1">${p.eyebrow ? `\n        <span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${nl2br(p.eyebrow)}</span>` : ''}
        ${p.title ? `<h1 class="hero-title"${el(p, 'title', 'ta', 'キャッチコピー', 'title')}>${nl2br(p.title)}</h1>` : ''}
      </div>
      <div class="rib-2">
        ${p.text ? `<p class="hero-text"${el(p, 'text', 'ta', '説明文', 'text')}>${nl2br(p.text)}</p>` : ''}
${heroMarks(p)}${buttons(p.buttons)}
      </div>
    </div>`
        : p.layout === 'reel'
          /* 写真を主役にして、文字はその上に置く。左上に枚数、右上に見出し、
             左下に説明とボタン。写真の四隅を空けるのではなく、重ねる。 */
          ? `    <div class="hero-in">
      <div class="rl-stage" data-reel>
${reelCards(p)}
      </div>
${paintFront(p)}
      <div class="rl-top">
        <div class="rl-meta">
          <span class="rl-count"><b>1</b> / ${(p.shots || []).slice(0, REEL_MAX).length || 1}</span>
          ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${nl2br(p.eyebrow)}</span>` : ''}
        </div>
        ${p.title ? `<h1 class="hero-title"${el(p, 'title', 'ta', 'キャッチコピー', 'title')}>${nl2br(p.title)}</h1>` : ''}
      </div>
      <div class="rl-foot">
        ${p.text ? `<p class="hero-text"${el(p, 'text', 'ta', '説明文', 'text')}>${nl2br(p.text)}</p>` : ''}
${buttons(p.buttons)}
      </div>
    </div>`
        : p.layout === 'showcase'
          /* 品名は3段。大きな2語のあいだに、小さな語をはさむ。
             行が1つしかないときは、小さな語を上に置く。 */
          ? (() => {
            const lines = String(p.title || '').split('\n').filter((x) => x.trim());
            const mid = p.mid ? `<span class="shw-mid">${esc(p.mid)}</span>` : '';
            const lock = lines.length > 1
              ? `<span>${esc(lines[0])}</span>${mid}<span>${esc(lines.slice(1).join(' '))}</span>`
              : `${mid}<span>${esc(lines[0] || '')}</span>`;
            const notes = String(p.notes || '').split('|').map((x) => x.trim()).filter(Boolean);
            return `    <div class="hero-in">
      <div class="shw-stand">
        <div class="shw-item"${el(p, 'image', 'ia', '商品の写真')}${imgSlot('image', p)}>${
  p.image ? media(p.image, p.title) : SHW_BOTTLE}</div>
        ${p.shelfImg
    /* 棚も写真に差し替えられる。押せば選べるように、線の台にも枠の印を付ける */
    ? `<div class="shw-shelf shw-shelf-img"${el(p, 'shelf', 'ia', '棚')}${imgSlot('shelfImg', p)}><img src="${esc(p.shelfImg)}" alt=""></div>`
    : `<i class="shw-shelf"${el(p, 'shelf', 'ia', '棚')}${imgSlot('shelfImg', p)}></i>`}
      </div>
      ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${nl2br(p.eyebrow)}</span>` : ''}
      ${p.title ? `<h1 class="hero-title shw-name"${el(p, 'title', 'ta', '品名', 'title')}>${lock}</h1>` : ''}
      ${p.text ? `<p class="hero-text"${el(p, 'text', 'ta', '説明文', 'text')}>${nl2br(p.text)}</p>` : ''}
${buttons(p.buttons)}
      ${notes.length ? `<div class="shw-notes"${el(p, 'notes', 'ta', 'いちばん下の3つ', 'notes')}>${
  notes.slice(0, 3).map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    </div>`;
          })()
        : p.layout === 'poster'
          /* 大きな名前を先に置き、写真をその下へ食い込ませる。
             名前は写真より外へはみ出したままにする（＝紙の上に残す）。 */
          ? `    <div class="hero-in">
      ${p.title ? `<h1 class="hero-title"${el(p, 'title', 'ta', 'キャッチコピー', 'title')}>${nl2br(p.title)}</h1>` : ''}
      <div class="pst-stage">
        <div class="pst-pic"${el(p, 'image', 'ia', '写真')}${imgSlot('image', p)}>${media(p.image, p.title)}</div>
${p.side ? `        <span class="pst-side"${el(p, 'side', 'ta', '右の縦書き', 'side')}>${esc(p.side)}</span>\n` : ''}      </div>
      ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${nl2br(p.eyebrow)}</span>` : ''}
      ${p.text ? `<p class="hero-text"${el(p, 'text', 'ta', '説明文', 'text')}>${nl2br(p.text)}</p>` : ''}
${heroMarks(p)}${buttons(p.buttons)}
    </div>`
          : (p.layout === 'split' || p.layout === 'pack')
          ? `    <div class="hero-in">
      <div>\n${body}\n      </div>
      <div class="hero-media"${el(p, 'image', 'ia', '画像')}${imgSlot('image', p)}>${media(p.image, p.title)}</div>
    </div>`
          : `    <div class="hero-in">\n${body}${wide}\n    </div>`;
      /* スクロール連動のときは、長い区間の中に中身を貼り付ける（sticky）。
         区間の進み具合を --p（0〜1）としてCSSに渡し、動きはCSS側で書く。 */
      const sc = p.scroll && p.scroll !== 'none' ? p.scroll : '';
      /* 型ごとの飾りは、背景と中身のあいだに敷く */
      const artLayer = ribbon ? ribbonLayer(p)
        : p.layout === 'mark' ? markLayer(p)
          : p.layout === 'lineart' ? lineArtLayer(p)
            : p.layout === 'orbit' ? orbitLayer(p)
              : p.layout === 'showcase' ? showcaseLayer(p)
                : p.layout === 'reel' ? paintLayer(p) : '';
      const guts = `${bg}${artLayer}${decoLayer(p)}  <div class="wrap">
${inner}
  </div>
${meltLayer(p)}`;
      const meltOn = p.melt && p.melt !== 'none';
      const meltVal = meltOn && (p.meltDepth ?? 100) !== 100
        ? `--melt-d:${(Math.max(50, Math.min(180, p.meltDepth ?? 100)) / 100).toFixed(2)}` : '';
      const meltImg = meltOn && p.melt === 'own' && p.meltMask
        ? `--melt-shape:url('${esc(p.meltMask)}')` : '';
      /* style 属性の中なので、囲むのは必ず一重引用符。二重だと属性がそこで
         切れて、指定ごと落ちる（実際に落ちた） */
      const markImg = p.layout === 'mark'
        ? `--mark:url('${p.markMask ? esc(p.markMask) : MARK_SVG}')` : '';
      if (!sc) {
        return `<section class="${cls}"${attr('id', p.anchor)}`
          + `${styleVars(maskVal(p), meltVal, meltImg, markImg)}${needsPointer ? ' data-hpt' : ''}`
          + `${mvOn(p)}>
${guts}
</section>`;
      }
      const maskLayer = sc === 'maskzoom' ? maskZoomLayer(p) : '';
      return `<section class="${cls} hsc hsc-${esc(sc)}"${attr('id', p.anchor)}${needsPointer ? ' data-hpt' : ''}`
        + `${mvOn(p)} data-heroscroll${styleVars(maskVal(p), meltVal, meltImg, markImg,
          `--pin:${Math.max(120, Math.min(320, p.scrollLen ?? 200))}vh`)}>
  <div class="hsc-in">
${maskLayer}${guts}
  </div>
</section>`;
    },
  },

  /* ---------------- 特徴・サービス ---------------- */
  features: {
    label: 'Features',
    icon: '◆',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text, FIELD.cols,
      { key: 'style', label: 'カードの形式', type: 'select',
        options: [['icon', 'アイコン'], ['num', '番号（手順）'], ['paren', '( 01 ) 形式の番号'], ['image', '画像']] },
      { key: 'items', label: '項目', type: 'list', addLabel: '項目を追加', titleKey: 'title',
        item: [
          { key: 'icon', label: 'アイコン', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
          { key: 'title', label: 'タイトル', type: 'text' },
          { key: 'text', label: '説明', type: 'textarea' },
        ] },
      FIELD.shape,
      FIELD.shapeMask,
      FIELD.plate,
      FIELD.plateShift,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FEATURES', title: '選ばれている3つの理由',
      text: '強みを短い言葉で並べると伝わりやすくなります。',
      cols: 'c3', style: 'icon', bg: 'surface', anchor: 'features',
      items: [
        { icon: '⚡', title: 'とにかく速い', text: 'ご相談から最短3日で公開。スピードが必要な場面でもお任せください。' },
        { icon: '🎯', title: '目的に合わせて', text: '集客・採用・ブランディング。ゴールから逆算して設計します。' },
        { icon: '🤝', title: '公開後も伴走', text: '作って終わりにしません。運用のご相談もいつでもどうぞ。' },
      ],
    },
    render: (p) => sec('features', p,
      `${head(p)}
    <div class="grid ${p.cols || 'c3'}">
${(p.items || []).map((it, i) => `      <div class="card"${el(p, `card${i}`, 'ia', `カード${i + 1}`)}>
        ${p.style === 'image' ? `<div class="hero-media" style="aspect-ratio:16/10;margin-bottom:18px" data-elname="カード画像"${imgSlot(`items.${i}.image`, p)}>${media(it.image, it.title)}</div>` : ''}
        ${p.style === 'num' ? `<span class="num">${i + 1}</span>`
          : p.style === 'paren' ? `<span class="pnum">( ${String(i + 1).padStart(2, '0')} )</span>`
          : p.style === 'image' ? '' : `<span class="ic">${esc(it.icon || '◆')}</span>`}
        ${it.title ? `<h3${el(p, `card${i}.title`, 'ta', 'カード見出し', `items.${i}.title`)}>${esc(it.title)}</h3>` : ''}
        ${it.text ? `<p${el(p, `card${i}.text`, 'ta', 'カード説明', `items.${i}.text`)}>${nl2br(it.text)}</p>` : ''}
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- 紹介（画像＋文章） ---------------- */
  about: {
    label: 'About',
    icon: '▧',
    fields: [
      FIELD.eyebrow, FIELD.title,
      { key: 'body', label: '本文', type: 'textarea', rows: 7 },
      { key: 'image', label: '画像URL', type: 'image' },
      { key: 'reverse', label: '画像を右側にする', type: 'toggle' },
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      FIELD.shape,
      FIELD.shapeMask,
      FIELD.plate,
      FIELD.plateShift,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'ABOUT', title: '私たちについて',
      body: 'ここに会社やお店のストーリーを書きます。\n\nどんな想いで始めたのか、どんな人に届けたいのか。事実だけでなく背景を書くと、読み手との距離がぐっと縮まります。',
      image: '', reverse: false, bg: '', anchor: 'about',
      buttons: [{ label: 'もっと読む', href: '#', style: 'ghost' }],
    },
    render: (p) => sec('about', p,
      `    <div class="about-in${p.reverse ? ' rev' : ''}">
      <div class="about-media"${el(p, 'image', 'ia', '画像')}${imgSlot('image', p)}>${media(p.image, p.title)}</div>
      <div class="about-body">
        ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${esc(p.eyebrow)}</span>` : ''}
        ${p.title ? `<h2 class="sec-title"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>` : ''}
        <div${ed('body', '本文')}>${(p.body || '').split(/\n{2,}/).filter(Boolean).map((t) => `<p>${nl2br(t)}</p>`).join('\n          ')}</div>
${buttons(p.buttons)}
      </div>
    </div>`),
  },

  /* ---------------- ギャラリー ---------------- */
  gallery: {
    label: 'Gallery',
    icon: '▦',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '画像', type: 'list', addLabel: '画像を追加', titleKey: 'alt',
        item: [
          { key: 'src', label: '画像URL', type: 'image' },
          { key: 'alt', label: '写真の説明', type: 'text' },
        ] },
      FIELD.shape,
      FIELD.shapeMask,
      FIELD.plate,
      FIELD.plateShift,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'GALLERY', title: 'ギャラリー', text: '',
      bg: '', anchor: 'gallery',
      items: [{ src: '', alt: '写真1' }, { src: '', alt: '写真2' }, { src: '', alt: '写真3' },
        { src: '', alt: '写真4' }, { src: '', alt: '写真5' }, { src: '', alt: '写真6' }],
    },
    render: (p) => sec('gallery', p,
      `${head(p)}
    <div class="gal">
${(p.items || []).map((it, i) => `      <figure${el(p, `img${i}`, 'ia', `画像${i + 1}`)}${imgSlot(`items.${i}.src`, p)}>${media(it.src, it.alt)}</figure>`).join('\n')}
    </div>`),
  },

  /* ---------------- 料金 ---------------- */
  pricing: {
    label: 'Pricing',
    icon: '¥',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text, FIELD.cols,
      { key: 'items', label: 'プラン', type: 'list', addLabel: 'プランを追加', titleKey: 'name',
        item: [
          { key: 'name', label: 'プラン名', type: 'text' },
          { key: 'price', label: '価格', type: 'text' },
          { key: 'unit', label: '単位', type: 'text' },
          { key: 'features', label: '含まれる内容', type: 'textarea' },
          { key: 'btn', label: 'ボタン文字', type: 'text' },
          { key: 'href', label: 'ボタンのリンク先', type: 'link' },
          { key: 'featured', label: 'おすすめとして目立たせる', type: 'toggle' },
          { key: 'tag', label: 'おすすめラベル', type: 'text' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'PRICING', title: '料金プラン', text: 'わかりやすい料金体系でご案内しています。',
      cols: 'c3', bg: 'surface', anchor: 'pricing',
      items: [
        { name: 'ライト', price: '¥50,000', unit: '〜', features: '1ページ構成\nスマホ対応\nお問い合わせフォーム', btn: '相談する', href: '#contact', featured: false, tag: '' },
        { name: 'スタンダード', price: '¥150,000', unit: '〜', features: '5ページまで\nスマホ対応\n写真撮影つき\n公開後1ヶ月サポート', btn: '相談する', href: '#contact', featured: true, tag: '人気' },
        { name: 'プレミアム', price: '要相談', unit: '', features: 'ページ数無制限\nオリジナルデザイン\nロゴ制作\n運用サポート', btn: '相談する', href: '#contact', featured: false, tag: '' },
      ],
    },
    render: (p) => sec('pricing', p,
      `${head(p)}
    <div class="grid ${p.cols || 'c3'}">
${(p.items || []).map((it, i) => `      <div class="plan${it.featured ? ' feat' : ''}"${el(p, `plan${i}`, 'ia', `プラン${i + 1}`)}>
        ${it.featured && it.tag ? `<span class="tag">${esc(it.tag)}</span>` : ''}
        <h3${el(p, `plan${i}.name`, 'ta', 'プラン名', `items.${i}.name`)}>${esc(it.name)}</h3>
        <div class="price">${esc(it.price)}${it.unit ? `<span>${esc(it.unit)}</span>` : ''}</div>
        <ul>${(it.features || '').split('\n').filter(Boolean).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        ${it.btn ? `<a class="btn${it.featured ? '' : ' ghost'}"${linkAttr(it.href)}>${esc(it.btn)}</a>` : ''}
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- よくある質問 ---------------- */
  faq: {
    label: 'FAQ',
    icon: '?',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '質問', type: 'list', addLabel: '質問を追加', titleKey: 'q',
        item: [
          { key: 'q', label: '質問', type: 'text' },
          { key: 'a', label: '答え', type: 'textarea' },
          { key: 'open', label: '最初から開いておく', type: 'toggle' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FAQ', title: 'よくあるご質問', text: '', bg: '', anchor: 'faq',
      items: [
        { q: '制作にはどのくらいかかりますか？', a: '内容によりますが、1ページ構成であれば最短3日、5ページ程度で2〜3週間が目安です。', open: true },
        { q: '写真がないのですが大丈夫ですか？', a: 'はい。フリー素材のご提案や、撮影の手配も承っています。', open: false },
        { q: '公開後に自分で更新できますか？', a: '更新しやすい形でお渡しします。操作方法もレクチャーいたします。', open: false },
      ],
    },
    render: (p) => sec('faq', p,
      `${head(p)}
    <div class="faq">
${(p.items || []).map((it, i) => `      <details${it.open ? ' open' : ''}>
        <summary${ed(`items.${i}.q`, '質問')}>${esc(it.q)}</summary>
        <div class="a"${ed(`items.${i}.a`, '答え')}>${nl2br(it.a)}</div>
      </details>`).join('\n')}
    </div>`),
  },

  /* ---------------- CTA帯 ---------------- */
  cta: {
    label: 'CTA',
    icon: '➤',
    fields: [
      FIELD.title, FIELD.text,
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: 'まずは気軽にご相談ください',
      text: '相談は無料です。ざっくりしたイメージだけでも大丈夫です。',
      bg: 'primary', anchor: '',
      buttons: [{ label: '無料で相談する', href: '#contact', style: 'ghost' }],
    },
    render: (p) => sec('cta', p,
      `    <div class="cta-in">
      ${p.title ? `<h2 class="sec-title"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>` : ''}
      ${p.text ? `<p${el(p, 'text', 'ta', '本文', 'text')}>${nl2br(p.text)}</p>` : ''}
${buttons(p.buttons, 'center')}
    </div>`),
  },

  /* ---------------- お問い合わせ ---------------- */
  contact: {
    label: 'Contact',
    icon: '✉',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'tel', label: '電話番号', type: 'text' },
      { key: 'email', label: 'メールアドレス', type: 'text' },
      { key: 'address', label: '住所', type: 'text' },
      { key: 'hours', label: '営業時間', type: 'text' },
      { key: 'form', label: '入力フォームを表示', type: 'toggle' },
      { key: 'formTo', label: '送られた内容の届け先', type: 'select', showIf: (p) => p.form,
        options: [
          ['here', 'このツールで受け取る'],
          ['url', 'ほかのサービスに送る'],
          ['', '見た目だけ（送信しない）'],
        ],
        hint: '「このツールで受け取る」は、公開したあとに使えます。届いた内容は編集画面から読めます' },
      { key: 'action', label: '送信先のURL', type: 'text', hint: 'Googleフォーム等のURL',
        showIf: (p) => p.form && p.formTo === 'url' },
      { key: 'submit', label: '送信ボタンの文字', type: 'text', showIf: (p) => p.form },
      { key: 'thanks', label: '送ったあとに出す言葉', type: 'text', showIf: (p) => p.form && p.formTo === 'here' },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'CONTACT', title: 'お問い合わせ',
      text: 'お気軽にご連絡ください。2営業日以内にご返信します。',
      tel: '03-0000-0000', email: 'hello@example.com',
      address: '東京都〇〇区〇〇 1-2-3', hours: '平日 10:00 - 18:00',
      form: true, formTo: 'here', action: '', submit: '送信する',
      thanks: 'お問い合わせありがとうございます。2営業日以内にご返信します。',
      bg: 'surface', anchor: 'contact',
    },
    render: (p) => {
      const info = [['TEL', p.tel], ['EMAIL', p.email], ['ADDRESS', p.address], ['HOURS', p.hours]]
        .filter(([, v]) => v)
        .map(([k, v]) => `        <div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('\n');
      /* 届け先の指定。「このツールで受け取る」ときだけ data-form が付き、
         書き出したページのJSがそこへ送る。それ以外は今までどおり。 */
      const to = p.formTo === 'url' ? `${attr('action', p.action)}${p.action ? ' method="post"' : ''}`
        : (typeof formAttrs === 'function' ? formAttrs(p) : '');
      const form = p.form ? `      <form class="form"${to}>
        <label>お名前<input type="text" name="name" required></label>
        <label>メールアドレス<input type="email" name="email" required></label>
        <label>お問い合わせ内容<textarea name="message" required></textarea></label>
        <p class="fm-hp" aria-hidden="true"><label>この欄は空のままにしてください<input type="text" name="company" tabindex="-1" autocomplete="off"></label></p>
        <button class="btn" type="submit">${esc(p.submit || '送信する')}</button>
        <p class="fm-msg" role="status"></p>
      </form>` : '';
      const only1 = !info || !form ? ' only1' : '';
      return sec('contact', p,
        `${head(p)}
    <div class="contact-in${only1}">
${info ? `      <dl class="info">\n${info}\n      </dl>` : ''}
${form}
    </div>`);
    },
  },

  /* ---------------- アイコンの一覧 ----------------
     設備・条件・こだわりを、絵と短い言葉で並べる。
     文章で書くと読まれないが、絵なら一目で分かる。 */
  icons: {
    label: 'Icons',
    icon: '⬡',
    tag: '基本',
    about: '設備や条件を、絵と短い言葉で並べます。Wi-Fi・駐車場・禁煙など。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'cols', label: '横に並べる数', type: 'select',
        options: [['c2', '2列'], ['c3', '3列'], ['c4', '4列']] },
      { key: 'size', label: '絵の大きさ', type: 'select',
        options: [['s', '小さめ'], ['m', 'ふつう'], ['l', '大きめ']] },
      { key: 'items', label: '中身', type: 'list', addLabel: '1つ追加', titleKey: 'label',
        item: [
          { key: 'icon', label: '絵', type: 'icon' },
          { key: 'label', label: '言葉', type: 'textarea', rows: 2 },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FACILITIES', title: '設備・備品', text: '',
      cols: 'c3', size: 'm',
      items: [
        { icon: 'screen', label: '大画面の\nスクリーン' },
        { icon: 'speaker', label: '迫力のある\nスピーカー' },
        { icon: 'wifi', label: 'Free Wi-Fi' },
        { icon: 'drink', label: '飲食\n持ち込み可' },
        { icon: 'nosmoke', label: '全面禁煙' },
        { icon: 'shoes', label: '土足OK' },
      ],
      bg: '', anchor: 'facilities',
    },
    render: (p) => sec('icons', p, `${head(p)}
    <div class="icos ${esc(p.cols || 'c3')} ico-${esc(p.size || 'm')}">
${(p.items || []).map((it, i) => `      <div class="ico"${el(p, `ico${i}`, 'ia', `絵${i + 1}`)}>
        <span class="ico-i">${iconSVG(it.icon)}</span>
        <b${ed(`items.${i}.label`, '言葉')}>${nl2br(esc(it.label))}</b>
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- 写真が流れ続ける ----------------
     導入実績・取引先・受賞歴のように「並べて見せたいが、数が多くて
     縦に積むと長い」ものを、途切れずに横へ流す。
     流れる文字（marquee）と同じで、同じ並びを2組出して片方が抜けた
     瞬間にもう片方が続く形にしている。 */
  strip: {
    label: 'Photo Strip',
    icon: '⇢',
    tag: '写真',
    about: '写真が右から左へ流れ続けます。導入実績・取引先・受賞歴など、数の多いものに。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'style', label: '見せ方', type: 'select',
        options: [['plain', '写真だけ'], ['card', 'カード（写真の下に文章）']] },
      { key: 'size', label: '大きさ', type: 'select',
        options: [['s', '小さめ'], ['m', 'ふつう'], ['l', '大きめ']] },
      { key: 'ratio', label: '縦横比', type: 'select',
        options: [['4x3', '横長（4:3）'], ['1x1', '正方形'], ['16x9', '横長（16:9）'], ['3x4', '縦長（3:4）']] },
      { key: 'dir', label: '向き', type: 'select', options: [['l', '右から左へ'], ['r', '左から右へ']] },
      { key: 'items', label: '中身', type: 'list', addLabel: '1つ追加', titleKey: 'title',
        item: [
          { key: 'image', label: '写真', type: 'image' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'text', label: '説明', type: 'text' },
          { key: 'href', label: 'リンク先', type: 'link' },
        ] },
      FIELD.shape, FIELD.shapeMask, FIELD.plate, FIELD.plateShift,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'CLIENTS', title: '導入実績', text: '',
      style: 'plain', size: 'm', ratio: '4x3', speed: 34, dir: 'l',
      items: [
        { image: '', title: '株式会社サンプル', text: '2024年〜', href: '' },
        { image: '', title: 'サンプル商事', text: '2023年〜', href: '' },
        { image: '', title: 'サンプル製作所', text: '2023年〜', href: '' },
        { image: '', title: 'サンプルホールディングス', text: '2022年〜', href: '' },
        { image: '', title: 'サンプル工業', text: '2022年〜', href: '' },
        { image: '', title: 'サンプル建設', text: '2021年〜', href: '' },
      ],
      shape: '', shapeMask: '', plate: '', plateShift: '',
      bg: '', anchor: 'clients',
    },
    render: (p) => {
      const card = p.style === 'card';
      const one = (p.items || []).map((it, i) => {
        const pic = `<div class="strp-pic"${imgSlot(`items.${i}.image`, p)} data-elname="写真${i + 1}">${
          media(it.image, it.title)}</div>`;
        const body = card
          ? `${pic}<b${ed(`items.${i}.title`, '見出し')}>${esc(it.title)}</b>${
            it.text ? `<small${ed(`items.${i}.text`, '説明')}>${esc(it.text)}</small>` : ''}`
          : pic;
        return it.href
          ? `<a class="strp-it"${linkAttr(it.href)}>${body}</a>`
          : `<div class="strp-it">${body}</div>`;
      }).join('');
      /* 2組目は同じ絵の続きなので、読み上げには渡さない */
      const track = `<div class="strp-run">${one}</div>`
        + `<div class="strp-run" aria-hidden="true">${one}</div>`;
      return sec('strip', p, `${head(p)}
    <div class="strp strp-${esc(p.size || 'm')} strp-r${esc(p.ratio || '4x3')}${
        card ? ' strp-card' : ''}${p.dir === 'r' ? ' strp-rev' : ''}"
      style="--strp-spd:${Math.max(10, Math.min(90, +p.speed || 34))}s">
      <div class="strp-in">${track}</div>
    </div>`);
    },
  },

  /* ---------------- 動画 ----------------
     動画そのものは持たない。1ファイルに収める作りなので、数十MBの
     動画を抱え込むと保存も公開もできなくなる。
     YouTube・Vimeo・動画ファイルのURLを受け取って、置き場所だけを作る。 */
  video: {
    label: 'Video',
    icon: '▶',
    tag: '写真',
    about: 'YouTube・Vimeo・動画ファイルのURLを貼ると、そのまま置けます。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'url', label: '動画のURL', type: 'text',
        hint: 'YouTube・Vimeo のページのURL、または .mp4 のURL' },
      { key: 'poster', label: '再生前に出す絵', type: 'image',
        showIf: (p) => isFileVideo(p.url) },
      { key: 'ratio', label: '画面の形', type: 'select',
        options: [['16x9', '横長（16:9）'], ['4x3', '横長（4:3）'], ['1x1', '正方形'], ['9x16', '縦長（スマホ動画）']] },
      { key: 'auto', label: '自動で再生する（音は出ません）', type: 'toggle',
        hint: '動画ファイルのときだけ効きます' },
      FIELD.shape, FIELD.shapeMask, FIELD.plate, FIELD.plateShift,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'MOVIE', title: '動画で見る', text: '',
      url: '', poster: '', ratio: '16x9', auto: false,
      shape: '', shapeMask: '', plate: '', plateShift: '', bg: '', anchor: 'movie',
    },
    render: (p) => sec('video', p, `${head(p)}
    <div class="vid vid-${esc(p.ratio || '16x9')}"${el(p, 'video', 'ia', '動画')}>
${videoTag(p)}
    </div>`),
  },

  /* ---------------- 自由テキスト ---------------- */
  rich: {
    label: 'Text',
    icon: '¶',
    fields: [
      FIELD.title,
      { key: 'body', label: '本文', type: 'textarea', hint: '空の行で、段落が分かれます', rows: 10 },
      { key: 'align', label: '配置', type: 'select', options: [['center', '中央寄せ'], ['left', '左寄せ']] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: '見出し', align: 'center', bg: '', anchor: '',
      body: 'ここに自由に文章を書けます。\n\n空行で区切ると段落になります。お知らせやポリシー、長めの説明文などにどうぞ。',
    },
    render: (p) => sec('rich', p,
      `    <div class="rich${p.align === 'left' ? ' left' : ''}">
      ${p.title ? `<h2 class="sec-title ${p.align === 'left' ? 'ta-l' : 'ta-c'}"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>` : ''}
      <div${ed('body', '本文')}>${(p.body || '').split(/\n{2,}/).filter(Boolean).map((t) => `<p>${nl2br(t)}</p>`).join('\n        ')}</div>
    </div>`),
  },

  /* ---------------- お知らせ・イベント ---------------- */
  news: {
    label: 'News',
    icon: '📰',
    about: '日付とカテゴリを添えた一覧。新着情報、イベント、実績の告知に。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: 'お知らせ', type: 'list', addLabel: 'お知らせを追加', titleKey: 'title',
        item: [
          { key: 'date', label: '日付', type: 'text' },
          { key: 'cat', label: 'カテゴリ', type: 'text' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'href', label: 'リンク先', type: 'link' },
        ] },
      { key: 'more', label: 'もっと見る', type: 'text' },
      { key: 'moreHref', label: 'ボタンのリンク先', type: 'link' },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'NEWS', title: 'お知らせ', text: '',
      more: '一覧を見る', moreHref: '#', bg: '', anchor: 'news',
      items: [
        { date: '2026.07.28', cat: 'お知らせ', title: '夏季休業のご案内', href: '#' },
        { date: '2026.07.11', cat: 'イベント', title: '夏のワークショップを開催します', href: '#' },
        { date: '2026.06.30', cat: '実績', title: '新しい施工事例を追加しました', href: '#' },
      ],
    },
    render: (p) => sec('news', p,
      `${head(p, 'left')}
    <ul class="nws">
${(p.items || []).map((it, i) => `      <li class="nws-i"${el(p, `row${i}`, 'ia', `お知らせ${i + 1}`)}>
        <a${linkAttr(it.href)}>
          <time>${esc(it.date)}</time>
          ${it.cat ? `<span class="nws-c">${esc(it.cat)}</span>` : ''}
          <b${ed(`items.${i}.title`, '見出し')}>${esc(it.title)}</b>
        </a>
      </li>`).join('\n')}
    </ul>
${p.more ? `    <div class="btn-row"><a class="btn ghost"${linkAttr(p.moreHref)}>${esc(p.more)}</a></div>` : ''}`),
  },

  /* ---------------- フロアガイド ---------------- */
  floors: {
    label: 'Floors',
    icon: '▤',
    about: '階ごとに何があるかを並べます。商業施設・ビル・複合施設に。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: 'フロア', type: 'list', addLabel: 'フロアを追加', titleKey: 'name',
        item: [
          { key: 'floor', label: '階の表示', type: 'text', hint: '1F / B1 / RF など' },
          { key: 'name', label: '名前', type: 'text' },
          { key: 'text', label: '説明', type: 'textarea' },
          { key: 'image', label: '画像', type: 'image' },
        ] },
      FIELD.shape,
      FIELD.shapeMask,
      FIELD.plate,
      FIELD.plateShift,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FLOOR GUIDE', title: 'フロアガイド', text: '', bg: '', anchor: 'floors',
      items: [
        { floor: '1F', name: 'カフェ＆ショップ', image: '',
          text: '海を眺めながら過ごせる、開けたフロアです。テイクアウトもできます。' },
        { floor: '2F', name: 'レストラン', image: '',
          text: '地元の食材を使ったコース料理を、テラス席でも。' },
        { floor: '3F', name: 'イベントスペース', image: '',
          text: '展示・マルシェ・ワークショップに。貸し出しもしています。' },
      ],
    },
    render: (p) => sec('floors', p,
      `${head(p, 'left')}
    <div class="flr">
${(p.items || []).map((it, i) => `      <div class="flr-i"${el(p, `fl${i}`, 'ia', `フロア${i + 1}`)}>
        <div class="flr-pic"${imgSlot(`items.${i}.image`, p)}>${media(it.image, it.name)}</div>
        <div class="flr-b">
          <span class="flr-n"${ed(`items.${i}.floor`, '階')}>${esc(it.floor)}</span>
          <h3${el(p, `fl${i}.name`, 'ta', 'フロア名', `items.${i}.name`)}>${esc(it.name)}</h3>
          <p${ed(`items.${i}.text`, '説明')}>${nl2br(it.text)}</p>
        </div>
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- 流れる文字（マーキー） ---------------- */
  marquee: {
    label: 'Marquee',
    icon: '⟶',
    tag: '演出',
    about: '同じ言葉が横に流れ続けます。区切りのしるしや、CONTACT の手前に置く帯として。',
    fields: [
      { key: 'text', label: '流す言葉', type: 'text' },
      { key: 'sep', label: '区切り記号', type: 'text', hint: '空にすると言葉だけが並びます' },
      { key: 'dir', label: '向き', type: 'select', options: [['l', '左へ'], ['r', '右へ']] },
      { key: 'outline', label: '中を抜いた文字にする', type: 'toggle' },
      { key: 'href', label: 'リンク先', type: 'link' },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      text: 'CONTACT', sep: '✳', speed: 22, dir: 'l', size: 96,
      outline: false, href: '', bg: 'primary', anchor: '',
    },
    /* 途切れずに流すため、同じ並びを2組出して片方が抜けた瞬間にもう片方が続く。
       中身は装飾なので、読み上げには1組だけ渡す。 */
    render: (p) => {
      const one = Array.from({ length: 6 }, () =>
        `<span class="mq-w">${esc(p.text)}</span>${p.sep ? `<span class="mq-s">${esc(p.sep)}</span>` : ''}`).join('');
      const inner = `<div class="mq-run">${one}</div><div class="mq-run" aria-hidden="true">${one}</div>`;
      const body = p.href
        ? `<a class="mq-in"${linkAttr(p.href)}>${inner}</a>`
        : `<div class="mq-in">${inner}</div>`;
      const cls = ['sec', 'sec-marquee', p.bg ? `bg-${p.bg}` : '', p.outline ? 'mq-line' : '',
        p.dir === 'r' ? 'mq-r' : ''].filter(Boolean).join(' ');
      return `<section class="${cls}"${attr('id', p.anchor)}`
        + ` style="--mq-dur:${Math.max(4, p.speed || 22)}s;--mq-size:${Math.max(20, p.size || 96)}px">
${body}
</section>`;
    },
  },

  /* ---------------- コラージュ・ヒーロー ---------------- */
  collage: {
    label: 'Collage',
    icon: '◈',
    tag: '演出',
    about: '写真を敷き詰めた背景に、斜めの写真と縦書きの白い帯を重ねます。イベント・採用・特集の顔に。',
    fields: [
      { key: 'bandR', label: '縦書きの帯（右）', type: 'textarea', rows: 3,
        hint: '1行で1列。日本語の縦書きなので、最初の行がいちばん右に来ます' },
      { key: 'bandL', label: '縦書きの帯（左）', type: 'textarea', rows: 3 },
      { key: 'photos', label: '写真', type: 'list', addLabel: '写真を追加', titleKey: 'alt',
        item: [
          { key: 'src', label: '画像', type: 'image' },
          { key: 'alt', label: '写真の説明', type: 'text' },
        ] },
      { key: 'gray', label: '背景の色を抜く', type: 'toggle' },
      { key: 'tall', label: '高さ', type: 'select',
        options: [['s', '低め'], ['m', 'ふつう'], ['l', '画面いっぱい']] },
      FIELD.anchor,
    ],
    defaults: {
      bandR: '社会を良くしたい、\nその挑戦を加速する',
      bandL: '社会課題へ挑む\nピッチコンテスト',
      front: 3, dark: 62, gray: true, float: true, tall: 'l', anchor: 'top',
      photos: [
        { src: '', alt: '写真1' }, { src: '', alt: '写真2' }, { src: '', alt: '写真3' },
        { src: '', alt: '写真4' }, { src: '', alt: '写真5' }, { src: '', alt: '写真6' },
      ],
    },
    render: (p) => {
      const pics = (p.photos || []).filter((x) => x && x.src);
      const nFront = Math.max(2, Math.min(5, p.front || 3));
      /* 同じ画像を何十枚も <img> で書くと、data URI がその数だけ複製されて
         書き出したHTMLが何MBにも膨らむ。URIはCSS変数として1回だけ置き、
         タイルは変数を参照するだけにする。 */
      /* style 属性の中なので、URL を囲む引用符はそのまま書けない */
      const vars = pics.map((it, i) => `--cp${i}:url(&quot;${esc(it.src)}&quot;)`).join(';');
      const n = pics.length;
      /* 画面が広いほど列が増えるので、余らせるくらい多めに敷いて溢れは隠す */
      const wall = Array.from({ length: 72 }, (_, i) =>
        `      <span class="cw"${n ? ` style="background-image:var(--cp${i % n})"` : ''}></span>`).join('\n');
      const front = COLLAGE_SLOTS.slice(0, nFront).map(([x, y, w, rot, z, d], i) => {
        const it = pics[i % Math.max(1, n)] || { src: '', alt: '' };
        return `      <figure class="cpic" style="left:${x}%;top:${y}%;--w:${w}%;--rot:${rot}deg;`
          + `--cov:${coverScale(rot)};z-index:${z};--d:${d}ms"${el(p, `pic${i}`, 'ia', `手前の写真${i + 1}`)}`
          + `${imgSlot(`photos.${i}.src`, p)}><span class="cpic-in">${media(it.src, it.alt)}</span></figure>`;
      }).join('\n');
      const cls = ['sec', 'sec-collage', `cg-${p.tall || 'l'}`, p.gray ? 'cg-gray' : '',
        p.float ? 'cg-float' : ''].filter(Boolean).join(' ');
      return `<section class="${cls}"${attr('id', p.anchor)} data-collage`
        + ` style="--cdark:${(p.dark ?? 62) / 100}${vars ? ';' + vars : ''}">
  <div class="cwall">
${wall}
  </div>
  <div class="cfront">
${front}
  </div>
${bands(p.bandR, 'r')}
${bands(p.bandL, 'l')}
</section>`;
    },
  },

  /* ---------------- お品書き（価格表） ---------------- */
  menu: {
    label: 'Menu',
    icon: '≡',
    about: 'カテゴリごとに品名と価格を並べます。カフェ・飲食店・サロンのメニューに。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'cols', label: '横に並べる数', type: 'select', options: [['c1', '1列'], ['c2', '2列']] },
      { key: 'groups', label: 'カテゴリ', type: 'list', addLabel: 'カテゴリを追加', titleKey: 'name',
        item: [
          { key: 'name', label: 'カテゴリ名', type: 'text' },
          { key: 'note', label: '右肩の注記', type: 'text', hint: 'HOT / ICED など。空でも構いません' },
          { key: 'items', label: '品目', type: 'textarea', rows: 6,
            hint: '1行に1品。「品名 | よみ | 価格」のように縦棒で区切ります' },
        ] },
      { key: 'note', label: '最後の注記', type: 'text' },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'MENU', title: 'お品書き', text: '', cols: 'c2',
      note: '価格はすべて税込です。', bg: '', anchor: 'menu',
      groups: [
        { name: 'COFFEE', note: 'HOT / ICED',
          items: 'ドリップコーヒー | Drip Coffee | 550\nカフェラテ | Café Latte | 600\nカプチーノ | Cappuccino | 600' },
        { name: 'FOOD', note: '',
          items: 'キッシュプレート | サラダ・スープ付 | 1,200\nサンドイッチプレート | サラダ・スープ付 | 1,100' },
      ],
    },
    /* 「品名 | よみ | 価格」の行を、名前・よみ・価格に分ける。
       縦棒が足りない書き方（「品名 価格」だけ等）でも壊れないように、
       最後の1つを価格、最初を品名、あいだをよみとして扱う。 */
    render: (p) => {
      const rows = (txt) => String(txt || '').split('\n').map((l) => l.trim()).filter(Boolean)
        .map((line) => {
          const c = line.split('|').map((s) => s.trim());
          const price = c.length > 1 ? c.pop() : '';
          return { name: c.shift() || '', sub: c.join(' '), price };
        });
      const groups = (p.groups || []).filter((g) => g.name || g.items).map((g, i) => `      <div class="mg"${el(p, `g${i}`, 'ia', `カテゴリ${i + 1}`)}>
        <div class="mg-h">
          <span class="mg-n"${ed(`groups.${i}.name`, 'カテゴリ名')}>${esc(g.name)}</span>
          <span class="mg-rule" aria-hidden="true"></span>
          ${g.note ? `<span class="mg-note">${esc(g.note)}</span>` : ''}
        </div>
        <dl class="mg-l">
${rows(g.items).map((it) => `          <div class="mi">
            <dt><b>${esc(it.name)}</b>${it.sub ? `<i>${esc(it.sub)}</i>` : ''}</dt>
            <dd>${esc(it.price)}</dd>
          </div>`).join('\n')}
        </dl>
      </div>`).join('\n');
      return sec('menu', p,
        `${head(p)}
    <div class="menu-cols ${p.cols === 'c1' ? 'c1' : 'c2'}">
${groups}
    </div>
${p.note ? `    <p class="menu-note"${ed('note', '注記')}>${esc(p.note)}</p>` : ''}`);
    },
  },

  /* ---------------- 一覧カード（写真・条件・ボタン） ----------------
     たくさんの中から1つ選んでもらうための形。見る側のすることは、
     何を扱っていても同じになる——写真を見て、条件を読んで、
     詳しいほうへ進む。だからカード1枚の並びは動かさず、
     写真・見出し・大きな数字・条件・補足・ボタンの順で固定する。

     数字（価格や月額）だけ大きく出すのは、いちばん先に見るのがそこだから。
     見出しに全部を書くと、どれも同じ長さの行になって見分けが付かない。 */
  listing: {
    label: 'Listing',
    icon: '▥',
    about: '写真・条件・ボタンをひと組にして並べます。たくさんの中から1つ選んでもらうものに。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'cols', label: '横に並べる数', type: 'select',
        options: [['c2', '2列'], ['c3', '3列'], ['c4', '4列']] },
      { key: 'items', label: '並べるもの', type: 'list', addLabel: '1つ追加', titleKey: 'title',
        item: [
          { key: 'image', label: '写真', type: 'image' },
          { key: 'badge', label: '写真の上の印', type: 'text',
            hint: '「NEW」「価格更新」など。空でも構いません' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'price', label: '大きく出す数字', type: 'text',
            hint: '価格や月額など。空でも構いません' },
          { key: 'meta', label: '場所・条件', type: 'text' },
          { key: 'note', label: '補足', type: 'text' },
          { key: 'href', label: 'ボタンのリンク先', type: 'link' },
        ] },
      { key: 'btn', label: 'ボタンの文字', type: 'text' },
      { key: 'btnStyle', label: 'ボタンの見た目', type: 'select', options: BTN_STYLES },
      { key: 'more', label: 'もっと見る', type: 'text' },
      { key: 'moreHref', label: 'そのリンク先', type: 'link' },
      FIELD.shape, FIELD.shapeMask,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'LINEUP', title: 'いま出ているもの', text: '', cols: 'c2',
      btn: '詳細を見る', btnStyle: 'ghost', more: '', moreHref: '#',
      bg: '', anchor: 'listing',
      items: [
        { image: '', badge: 'NEW', title: '68.5m² / 2LDK', price: '9,990万円',
          meta: '港区赤坂 / 赤坂駅 徒歩6分', note: 'ペット飼育可', href: '#' },
        { image: '', badge: '', title: '63.3m² / 2LDK', price: '11,990万円',
          meta: '目黒区東山 / 池尻大橋駅 徒歩9分', note: 'ペット飼育不可', href: '#' },
        { image: '', badge: '', title: '84.2m² / 3LDK', price: '7,580万円',
          meta: '川崎市宮前区土橋 / 宮前平駅 徒歩5分', note: '駐車場あり', href: '#' },
        { image: '', badge: '', title: '41.6m² / 1LDK', price: '5,380万円',
          meta: '世田谷区下馬 / 三軒茶屋駅 徒歩14分', note: '南向き・角部屋', href: '#' },
      ],
    },
    render: (p) => {
      const btnCls = ['btn', p.btnStyle && p.btnStyle !== 'primary' ? p.btnStyle : '', 'lst-btn']
        .filter(Boolean).join(' ');
      return sec('listing', p,
        `${head(p)}
    <div class="lst ${['c2', 'c3', 'c4'].includes(p.cols) ? p.cols : 'c2'}">
${(p.items || []).map((it, i) => `      <article class="lst-i"${el(p, `it${i}`, 'ia', `${i + 1}つめ`)}>
        <div class="lst-fig">
          <div class="lst-pic"${imgSlot(`items.${i}.image`, p)}>${media(it.image, it.title)}</div>
${it.badge ? `          <span class="lst-badge"${ed(`items.${i}.badge`, '印')}>${esc(it.badge)}</span>\n` : ''}        </div>
        <div class="lst-b">
          <b class="lst-t"${ed(`items.${i}.title`, '見出し')}>${esc(it.title)}</b>
${it.price ? `          <span class="lst-p"${ed(`items.${i}.price`, '数字')}>${esc(it.price)}</span>\n` : ''}${it.meta ? `          <span class="lst-m"${ed(`items.${i}.meta`, '場所・条件')}>${esc(it.meta)}</span>\n` : ''}${it.note ? `          <span class="lst-n"${ed(`items.${i}.note`, '補足')}>${esc(it.note)}</span>\n` : ''}        </div>
${p.btn ? `        <a class="${btnCls}"${linkAttr(it.href)}>${esc(p.btn)}</a>\n` : ''}      </article>`).join('\n')}
    </div>
${p.more ? `    <div class="btn-row lst-more"><a class="btn ghost"${linkAttr(p.moreHref)}>${esc(p.more)}</a></div>` : ''}`);
    },
  },

  /* ---------------- 予定の表（曜日 × 時間帯） ----------------
     歯科の診療時間、飲食店の営業時間、教室のコマ表。どれも
     「縦が時間帯、横が曜日、交点にその日どうなのか」という同じ形をしている。

     交点に入るものだけが業種で変わる（●、休、クラス名、時刻）。
     だから桝目の中身は決め打ちにせず、書いたとおりに出す。
     ただし ● と — だけは記号として描く。文字で打つと大きさが揃わない。 */
  schedule: {
    label: 'Schedule',
    icon: '⊞',
    about: '曜日ごとの予定を表にします。診療時間、営業時間、教室のコマ表に。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'corner', label: '左上のことば', type: 'text' },
      { key: 'days', label: '横に並べる見出し', type: 'text',
        hint: '縦棒で区切ります。例：月 | 火 | 水 | 木 | 金 | 土 | 日祝' },
      { key: 'rows', label: '行', type: 'list', addLabel: '行を追加', titleKey: 'label',
        item: [
          { key: 'label', label: '左端のことば', type: 'text', hint: '時間帯やコマ名' },
          { key: 'cells', label: '桝目', type: 'text',
            hint: '縦棒で区切ります。「○」で丸、「-」で線。ほかは書いたとおりに出ます' },
        ] },
      { key: 'note', label: '表の下の注記', type: 'textarea' },
      { key: 'card', label: '白い土台に載せる', type: 'toggle' },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'HOURS', title: '診療時間', text: '', card: true,
      corner: '診療時間', days: '月 | 火 | 水 | 木 | 金 | 土 | 日祝',
      note: '※土曜は 9:00 – 17:00 の通し診療です。休診日：日曜・祝日・木曜午後。',
      /* 白い板を白い地に置くと縁が消える。既定では地を薄く敷いておく */
      bg: 'surface', anchor: 'schedule',
      rows: [
        { label: '9:00 – 13:00', cells: '○ | ○ | ○ | ○ | ○ | ○ | 休' },
        { label: '14:30 – 19:00', cells: '○ | ○ | ○ | 休 | ○ | - | 休' },
      ],
    },
    /* 桝目1つを描く。○ は丸、- は線、それ以外は書いた文字のまま。
       全角と半角のどちらで打たれても同じに扱う（打ち分けさせない）。 */
    render: (p) => {
      const cut = (s) => String(s || '').split('|').map((x) => x.trim());
      const days = cut(p.days).filter(Boolean);
      const cell = (v) => {
        if (/^[○◯〇●oO]$/.test(v)) return '<i class="sch-o" aria-label="あり"></i>';
        if (/^[-–—ー]$/.test(v)) return '<i class="sch-x" aria-label="なし"></i>';
        return esc(v);
      };
      const rows = (p.rows || []).map((r, i) => {
        const cs = cut(r.cells);
        /* 曜日より桝目が少なくても、表が崩れないように空欄で埋める */
        const tds = days.map((_, j) => `<td>${cell(cs[j] || '')}</td>`).join('');
        return `        <tr${el(p, `row${i}`, 'ia', `${i + 1}行目`)}>
          <th scope="row"${ed(`rows.${i}.label`, '左端のことば')}>${esc(r.label)}</th>
          ${tds}
        </tr>`;
      }).join('\n');
      return sec('schedule', p,
        `${head(p)}
    <div class="sch${p.card ? ' sch-card' : ''}">
      <div class="sch-scroll">
        <table class="sch-t">
          <thead>
            <tr><th scope="col" class="sch-corner"${ed('corner', '左上のことば')}>${esc(p.corner)}</th>
${days.map((d) => `              <th scope="col">${esc(d)}</th>`).join('\n')}
            </tr>
          </thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
${p.note ? `      <p class="sch-note"${ed('note', '注記')}>${nl2br(p.note)}</p>` : ''}
    </div>`);
    },
  },

  /* ---------------- フッター ---------------- */
  footer: {
    label: 'Footer',
    icon: '▁',
    unique: true,
    fields: [
      { key: 'style', label: 'フッターの型', type: 'select', gallery: 'ftr',
        options: [
          ['bar', 'Bar'], ['center', 'Centered'], ['big', 'Large'],
          ['light', 'Light'], ['cta', 'CTA'], ['minimal', 'Minimal'],
        ] },
      { key: 'text', label: 'ひとこと・住所など', type: 'textarea', rows: 2,
        showIf: (p) => ['big', 'cta'].includes(p.style) },
      { key: 'cta', label: 'ボタン文字', type: 'text', showIf: (p) => p.style === 'cta' },
      { key: 'ctaHref', label: 'ボタンのリンク先', type: 'link', showIf: (p) => p.style === 'cta' },
      { key: 'logo', label: 'サイト名', type: 'text' },
      { key: 'links', label: 'リンク', type: 'list', addLabel: 'リンクを追加', titleKey: 'label',
        item: [
          { key: 'label', label: '表示名', type: 'text' },
          { key: 'href', label: 'リンク先', type: 'link' },
        ] },
      { key: 'copy', label: 'コピーライト', type: 'text' },
    ],
    defaults: {
      style: 'bar', text: '', cta: '', ctaHref: '#contact',
      logo: 'YOUR LOGO',
      links: [
        { label: 'プライバシーポリシー', href: '#' },
        { label: '特定商取引法に基づく表記', href: '#' },
        { label: 'お問い合わせ', href: '#contact' },
      ],
      copy: '© 2026 Your Company. All rights reserved.',
    },
    /* 型ごとに中身の並びを変える。bar（既定）は、この型を足す前の
       書き出しとまったく同じ形にしてある（前に作ったページを変えないため）。 */
    render: (p) => {
      const st = p.style || 'bar';
      const logo = `<span class="logo"${ed('logo', 'サイト名')}>${esc(p.logo)}</span>`;
      const links = (p.links || []).filter((l) => l.label)
        .map((l) => `<a${linkAttr(l.href)}>${esc(l.label)}</a>`).join('');
      const nav = `<nav class="ftr-nav">${links}</nav>`;
      const copy = p.copy ? `<div class="copy"${ed('copy', 'コピーライト')}>${esc(p.copy)}</div>` : '';
      const note = p.text ? `<p class="ftr-note"${ed('text', 'ひとこと')}>${nl2br(p.text)}</p>` : '';
      const btn = p.cta ? `<a class="btn"${linkAttr(p.ctaHref)}${ed('cta', 'ボタン文字')}>${esc(p.cta)}</a>` : '';

      let inner;
      if (st === 'minimal') {
        inner = `    <div class="ftr-in">${logo}</div>\n    ${copy}`;
      } else if (st === 'big') {
        inner = `    <div class="ftr-cols">
      <div class="ftr-lead">${logo}${note}</div>
      ${nav}
    </div>
    ${copy}`;
      } else if (st === 'cta') {
        inner = `    <div class="ftr-push">${note}${btn}</div>
    <div class="ftr-in">${logo}${nav}</div>
    ${copy}`;
      } else {
        /* bar / center / light は並びが同じで、見た目だけが違う */
        inner = `    <div class="ftr-in">
      ${logo}
      ${nav}
    </div>
    ${copy}`;
      }
      return `<footer class="ftr ftr-${esc(st)}">
  <div class="wrap">
${inner}
  </div>
</footer>`;
    },
  },
  /* ================================================================
     ここから下は「スクロールに連動する」特別なブロック
     ================================================================ */

  /* ---------------- 3D製品ビュー ---------------- */
  product3d: {
    label: 'Product 3D',
    icon: '◉',
    tag: '3D',
    about: 'スクロールに合わせて立体が360°回転します。画像は不要で、形と色だけで作られます。',
    tall: true,
    fields: [
      { key: 'title', label: '見出し', type: 'text' },
      { key: 'text', label: '補足', type: 'text' },
      { key: 'shape', label: '形', type: 'select',
        options: [['slab', '板（スマホ・タブレット風）'], ['box', '箱（パッケージ風）'], ['tall', '縦長（ボトル・缶風）']] },
      { key: 'body', label: '本体の色', type: 'color' },
      { key: 'face', label: '正面の色', type: 'color' },
      { key: 'items', label: '途中で出す説明', type: 'list', addLabel: '説明を追加', titleKey: 'value',
        item: [
          { key: 'value', label: '数値・見出し', type: 'text' },
          { key: 'label', label: '説明', type: 'text' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: 'スクロールで、360°。', text: 'あらゆる角度から確かめてください。',
      shape: 'slab', turns: 1, height: 400, body: '#8a93a3', face: '#2563eb',
      bg: 'dark', anchor: 'product',
      items: [
        { value: '0.38 kg', label: 'アルミ削り出し筐体', at: 15 },
        { value: '6.7 inch', label: '有機ELディスプレイ', at: 42 },
        { value: '72 h', label: '連続駆動バッテリー', at: 68 },
      ],
    },
    render: (p) => `<section class="pinsec${p.bg ? ` bg-${p.bg}` : ''}" data-p3d
  data-shape="${esc(p.shape || 'slab')}" data-turns="${+p.turns || 1}"
  data-body="${esc(p.body)}" data-face="${esc(p.face)}"
  style="height:${+p.height || 400}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="p3d-deg">000°</div>
    <canvas class="p3d"></canvas>
    <div class="p3d-spec">
${(p.items || []).map((it) => `      <div data-at="${(+it.at || 0) / 100}"><b>${esc(it.value)}</b>${esc(it.label)}</div>`).join('\n')}
    </div>
    <div class="pin-cap">
      ${p.title ? `<b${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</b>` : ''}
      ${p.text ? `<small${ed('text', '補足')}>${esc(p.text)}</small>` : ''}
    </div>
  </div>
</section>`,
  },

  /* ---------------- 分解図 ---------------- */
  exploded: {
    label: 'Exploded',
    icon: '▤',
    tag: '3D',
    about: 'バラバラの層がスクロールで合体します。各層に画像を入れれば実物の構造説明になります。',
    tall: true,
    fields: [
      { key: 'title', label: '見出し', type: 'text' },
      { key: 'text', label: '補足', type: 'text' },
      { key: 'items', label: '層（上から順）', type: 'list', addLabel: '層を追加', titleKey: 'label',
        item: [
          { key: 'label', label: '層の名前', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
          { key: 'color', label: '色（画像がないとき）', type: 'color' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: 'バラバラの部品が、組み上がる。', text: '4つの層でできています。',
      height: 380, bg: 'dark', anchor: 'structure',
      items: [
        { label: 'DISPLAY', image: '', color: '#22d3ee' },
        { label: 'LOGIC BOARD', image: '', color: '#a78bfa' },
        { label: 'BATTERY', image: '', color: '#fb7185' },
        { label: 'CHASSIS', image: '', color: '#a3e635' },
      ],
    },
    render: (p) => `<section class="pinsec${p.bg ? ` bg-${p.bg}` : ''}" data-exploded
  style="height:${+p.height || 380}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="exp"><div class="exp-in">
${(p.items || []).map((it, i) => `      <div class="exp-l" style="background:${esc(it.color || '#64748b')}"${imgSlot(`items.${i}.image`, p)} data-elname="層${i + 1}">${it.image ? img(it.image, it.label) : ''}<span>${esc(it.label)}</span></div>`).join('\n')}
    </div></div>
    <div class="pin-cap">
      ${p.title ? `<b${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</b>` : ''}
      ${p.text ? `<small${ed('text', '補足')}>${esc(p.text)}</small>` : ''}
    </div>
  </div>
</section>`,
  },

  /* ---------------- 横に流れるギャラリー ---------------- */
  hscroll: {
    label: 'H-Scroll',
    icon: '⇥',
    tag: 'スクロール',
    about: '縦にスクロールすると、カードが横に流れていきます。実績一覧に向いています。',
    tall: true,
    fields: [
      FIELD.eyebrow, { key: 'title', label: '見出し', type: 'text' },
      { key: 'items', label: 'カード', type: 'list', addLabel: 'カードを追加', titleKey: 'title',
        item: [
          { key: 'no', label: '番号', type: 'text' },
          { key: 'title', label: 'タイトル', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
        ] },
      FIELD.shape,
      FIELD.shapeMask,
      FIELD.plate,
      FIELD.plateShift,
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'WORKS', title: '縦にスクロールすると、横に流れる。', height: 340,
      bg: '', anchor: 'works',
      items: [
        { no: '01', title: 'ブランドサイト', image: '' },
        { no: '02', title: 'プロダクト紹介', image: '' },
        { no: '03', title: '採用ページ', image: '' },
        { no: '04', title: 'イベントLP', image: '' },
        { no: '05', title: 'ポートフォリオ', image: '' },
        { no: '06', title: '店舗サイト', image: '' },
      ],
    },
    render: (p) => `<section class="pinsec${p.bg ? ` bg-${p.bg}` : ''}" data-hscroll
  style="height:${+p.height || 340}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="hs-head"><div class="wrap">
      ${p.eyebrow ? `<span class="eyebrow"${el(p, 'eyebrow', 'ta', '小見出し', 'eyebrow')}>${esc(p.eyebrow)}</span>` : ''}
      ${p.title ? `<h2 class="sec-title ta-flush"${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h2>` : ''}
    </div></div>
    <div class="hs-track">
${(p.items || []).map((it, i) => `      <div class="hs-card"${imgSlot(`items.${i}.image`, p)} data-elname="カード${i + 1}">${it.image ? img(it.image, it.title) : ''}<em>${esc(it.no)}</em><b${ed(`items.${i}.title`, 'カード名')}>${esc(it.title)}</b></div>`).join('\n')}
    </div>
  </div>
</section>`,
  },

  /* ---------------- 積み重なるカード ---------------- */
  stackcards: {
    label: 'Stack',
    icon: '▥',
    tag: 'スクロール',
    about: 'カードが重なりながら積み上がります。制作フローやサービス紹介に。',
    fields: [
      FIELD.eyebrow, FIELD.title,
      { key: 'items', label: 'カード', type: 'list', addLabel: 'カードを追加', titleKey: 'title',
        item: [
          { key: 'no', label: '番号・ラベル', type: 'text' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'text', label: '説明', type: 'textarea' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FLOW', title: '制作の流れ', bg: 'surface', anchor: 'flow',
      items: [
        { no: '01 / DISCOVER', title: 'まず、目的を言葉にする', text: '誰に何を届けたいのか。ここが曖昧なままだと、どれだけ綺麗に作っても刺さりません。' },
        { no: '02 / DESIGN', title: '迷わない導線を設計する', text: '読む順番と、押してほしいボタンを決める。装飾はそのあとです。' },
        { no: '03 / BUILD', title: '速く、軽く、実装する', text: '表示速度は離脱率に直結します。動きは目的があるところにだけ。' },
        { no: '04 / GROW', title: '公開してからが本番', text: '数字を見て、直す。作りっぱなしにしない仕組みまで用意します。' },
      ],
    },
    render: (p) => sec('stackcards', p,
      `${head(p)}
    <div class="stack" data-stack>
${(p.items || []).map((it, i) => `      <div class="stackcard">
        <span class="no"${ed(`items.${i}.no`, 'ラベル')}>${esc(it.no)}</span>
        <div>
          <h3${el(p, `card${i}.title`, 'ta', 'カード見出し', `items.${i}.title`)}>${esc(it.title)}</h3>
          <p${ed(`items.${i}.text`, 'カード説明')}>${nl2br(it.text)}</p>
        </div>
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- タイムライン ---------------- */
  timeline: {
    label: 'Timeline',
    icon: '⌇',
    tag: 'スクロール',
    about: 'スクロールに合わせて線が伸び、通過した項目が点灯します。沿革や導入ステップに。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '項目', type: 'list', addLabel: '項目を追加', titleKey: 'title',
        item: [
          { key: 'label', label: 'ラベル', type: 'text' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'text', label: '説明', type: 'textarea' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FLOW', title: 'ご依頼から公開まで', text: '', bg: '', anchor: 'steps',
      items: [
        { label: 'STEP 01', title: 'お問い合わせ', text: 'フォームからご連絡ください。2営業日以内にご返信します。' },
        { label: 'STEP 02', title: 'ヒアリング', text: 'オンラインで30分ほど。目的・期日・予算感をすり合わせます。' },
        { label: 'STEP 03', title: 'ご提案・お見積り', text: '構成案とデザインの方向性、金額をまとめてお出しします。' },
        { label: 'STEP 04', title: '制作', text: '途中経過を共有しながら進めます。修正は2回まで無料です。' },
        { label: 'STEP 05', title: '公開・運用', text: '公開後1ヶ月は無償サポート。更新方法もレクチャーします。' },
      ],
    },
    render: (p) => sec('timeline', p,
      `${head(p)}
    <div class="tl" data-timeline>
      <div class="tl-rail"></div>
${(p.items || []).map((it, i) => `      <div class="tl-item">
        <small${ed(`items.${i}.label`, 'ラベル')}>${esc(it.label)}</small>
        <b${el(p, `tl${i}.title`, 'ta', '項目見出し', `items.${i}.title`)}>${esc(it.title)}</b>
        <p${ed(`items.${i}.text`, '項目説明')}>${nl2br(it.text)}</p>
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- 円形マスクで切り替え ---------------- */
  clipreveal: {
    label: 'Clip Reveal',
    icon: '◍',
    tag: 'スクロール',
    about: 'スクロールすると円が開いて、下の世界に入れ替わります。ビフォーアフターや転換に。',
    tall: true,
    fields: [
      { key: 'titleA', label: '手前の見出し', type: 'text' },
      { key: 'textA', label: '手前の説明', type: 'text' },
      { key: 'imageA', label: '手前の画像URL', type: 'image' },
      { key: 'titleB', label: '奥の見出し', type: 'text' },
      { key: 'textB', label: '奥の説明', type: 'text' },
      { key: 'imageB', label: '奥の画像URL', type: 'image' },
      FIELD.anchor,
    ],
    defaults: {
      height: 260, anchor: 'change',
      titleA: 'これまでの当たり前を、', textA: 'そのままにしていませんか', imageA: '',
      titleB: '塗り替える。', textB: 'ここから、新しい体験がはじまります', imageB: '',
    },
    render: (p) => `<section class="pinsec" data-clip style="height:${+p.height || 260}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="clip-box">
      <div class="clip-side clip-a"${imgSlot('imageA', p)} data-elname="手前の画像">
        ${p.imageA ? img(p.imageA, p.titleA) : ''}
        <div class="in-txt">
          <h3${el(p, 'titleA', 'ta', '手前の見出し', 'titleA')}>${nl2br(p.titleA)}</h3>
          <p${ed('textA', '手前の説明')}>${esc(p.textA)}</p>
        </div>
      </div>
      <div class="clip-side clip-b"${imgSlot('imageB', p)} data-elname="奥の画像">
        ${p.imageB ? img(p.imageB, p.titleB) : ''}
        <div class="in-txt">
          <h3${ed('titleB', '奥の見出し')}>${nl2br(p.titleB)}</h3>
          <p${ed('textB', '奥の説明')}>${esc(p.textB)}</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  /* ---------------- 3Dカルーセル ---------------- */
  carousel3d: {
    label: 'Carousel',
    icon: '◎',
    tag: '3D',
    about: '円環に並んだカードがゆっくり回ります。ドラッグで手動でも回せます。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: 'カード', type: 'list', addLabel: 'カードを追加', titleKey: 'title',
        item: [
          { key: 'title', label: 'タイトル', type: 'text' },
          { key: 'sub', label: '小さい文字', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'WORKS', title: '制作実績', text: 'ドラッグすると回せます。',
      bg: 'surface', anchor: 'carousel',
      items: [
        { title: 'ブランドサイト', sub: 'PROJECT 01', image: '' },
        { title: 'ECサイト', sub: 'PROJECT 02', image: '' },
        { title: '採用ページ', sub: 'PROJECT 03', image: '' },
        { title: 'コーポレート', sub: 'PROJECT 04', image: '' },
        { title: 'イベントLP', sub: 'PROJECT 05', image: '' },
        { title: 'ポートフォリオ', sub: 'PROJECT 06', image: '' },
      ],
    },
    render: (p) => sec('carousel', p,
      `${head(p)}
    <div class="car"><div class="car-in">
${(p.items || []).map((it, i) => `      <div class="car-it"${imgSlot(`items.${i}.image`, p)} data-elname="カード${i + 1}">${it.image ? img(it.image, it.title) : ''}<b${ed(`items.${i}.title`, 'カード名')}>${esc(it.title)}</b><small>${esc(it.sub)}</small></div>`).join('\n')}
    </div></div>`),
  },

  /* ---------------- スロット式カウンター ---------------- */
  slotstats: {
    label: 'Counter',
    icon: '＃',
    tag: '数字',
    about: '桁ごとに数字が縦に回って止まります。実績数値を見せるときに。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text, FIELD.cols,
      { key: 'items', label: '数値', type: 'list', addLabel: '数値を追加', titleKey: 'value',
        item: [
          { key: 'value', label: '数値', type: 'text' },
          { key: 'label', label: '説明', type: 'text' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'NUMBERS', title: '数字で見る私たち', text: '', cols: 'c3',
      bg: 'surface', anchor: 'numbers',
      items: [
        { value: '128,400', label: '累計ダウンロード' },
        { value: '99.8%', label: '稼働率' },
        { value: '2,140', label: '導入企業' },
      ],
    },
    render: (p) => sec('slotstats', p,
      `${head(p)}
    <div class="slots grid ${p.cols || 'c3'}">
${(p.items || []).map((it, i) => `      <div><span class="slot" data-slot="${esc(it.value)}"></span><small${ed(`items.${i}.label`, '説明')}>${esc(it.label)}</small></div>`).join('\n')}
    </div>`),
  },

  /* ---------------- 折れ線・棒グラフ ----------------
     線1本と枠だけの図は、作りかけの下書きに見える。
     面（グラデーション）と目盛りを敷いて、図として成立させる。 */
  svgdraw: {
    label: 'Line Chart',
    icon: '⌁',
    tag: '図解',
    about: '折れ線の下に同じ色の薄い膜が敷かれ、うっすらとマス目が入ります。実績の推移や比較に。',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'kind', label: '見せかた', type: 'select',
        options: [['line', '折れ線'], ['bar', '棒']] },
      { key: 'items', label: '目盛り（最大8本）', type: 'list', addLabel: '1本追加', titleKey: 'label',
        item: [
          { key: 'label', label: 'ラベル', type: 'text' },
          { key: 'value', label: '高さ', type: 'range', min: 0, max: 100, suffix: '' },
          { key: 'note', label: '上に出す数値', type: 'text' },
        ] },
      { key: 'smooth', label: '線をなめらかにする', type: 'toggle', adv: true },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'GROWTH', title: '数字は伸びています', text: '導入社数の推移',
      kind: 'line', smooth: true, grid: true, bg: '', anchor: 'graph',
      items: [
        { label: '2021', value: 22, note: '' }, { label: '2022', value: 38, note: '' },
        { label: '2023', value: 55, note: '' }, { label: '2024', value: 74, note: '' },
        { label: '2025', value: 92, note: '' },
      ],
    },
    render: (p) => {
      const items = (p.items || []).slice(0, 8);
      const n = items.length || 1;
      /* 棒と折れ線を重ねる形はやめた（線と棒で色が2つ要り、図が濁る）。
         前の版で作ったページも開けるよう、その指定は折れ線に寄せる */
      const kind = p.kind === 'bar' || p.line === false ? 'bar' : 'line';
      const W = 680, H = 300, padX = 30, padT = 34, padB = 30;
      const base = H - padB, top = padT;
      const at = (v) => Math.max(0, Math.min(100, +v || 0));
      /* 棒は真ん中に、折れ線は端から端まで。
         端まで引かないと、膜の右端が縦線になって切りっぱなしに見える */
      const spread = kind === 'line' && n > 1;
      const x = (i) => (spread
        ? padX + ((W - padX * 2) * i) / (n - 1)
        : padX + ((W - padX * 2) / n) * (i + 0.5));
      const y = (v) => base - (base - top) * (at(v) / 100);
      const bw = Math.min(74, ((W - padX * 2) / n) * 0.52);
      const pts = items.map((it, i) => [x(i), y(it.value)]);
      /* 同じページに2つ置いても混ざらないよう、中身から名前を作る */
      const gid = `gr${hashId(JSON.stringify(items) + kind + (p.title || ''))}`;

      /* なめらかな線。両隣を見て制御点を置く（Catmull-Rom を3次ベジェに） */
      const curve = (q) => {
        if (q.length < 3) return q.map((v, i) => `${i ? 'L' : 'M'}${v[0].toFixed(1)} ${v[1].toFixed(1)}`).join(' ');
        let d = `M${q[0][0].toFixed(1)} ${q[0][1].toFixed(1)}`;
        for (let i = 0; i < q.length - 1; i++) {
          const p0 = q[i - 1] || q[i], p1 = q[i], p2 = q[i + 1], p3 = q[i + 2] || q[i + 1];
          const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
          const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
          d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
        }
        return d;
      };
      const straight = (q) => q.map((v, i) => `${i ? 'L' : 'M'}${v[0].toFixed(1)} ${v[1].toFixed(1)}`).join(' ');
      const linePath = pts.length ? (p.smooth === false ? straight(pts) : curve(pts)) : '';
      /* 面は線と同じ形で、両端を下ろして閉じる */
      const areaPath = pts.length
        ? `${linePath} L${pts[pts.length - 1][0].toFixed(1)} ${base} L${pts[0][0].toFixed(1)} ${base} Z` : '';

      const showLine = kind !== 'bar' && pts.length > 1;
      const showBar = kind !== 'line';
      const pct = (v, of) => `${((v / of) * 100).toFixed(2)}%`;

      const grid = p.grid === false ? '' : [0, 25, 50, 75, 100].map((v) =>
        `        <line class="gl" x1="${padX}" y1="${y(v).toFixed(1)}" x2="${W - padX}" y2="${y(v).toFixed(1)}"/>`).join('\n');

      /* 数値もラベルも、目盛りと同じ x で置く。図とずれないように */
      const notes = items.some((it) => it.note)
        ? `        <div class="draw-note">${items.map((it, i) => (it.note
          ? `<span style="left:${pct(x(i), W)};top:${pct(y(it.value), H)}">${esc(it.note)}</span>` : '')).join('')}</div>`
        : '';

      return sec('svgdraw', p,
        `${head(p)}
    <div class="draw-wrap chart">
      <div class="draw-plot">
        <svg viewBox="0 0 ${W} ${H}" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="${gid}b" x1="0" y1="0" x2="0" y2="1">
              <stop class="gb0" offset="0"/><stop class="gb1" offset="1"/>
            </linearGradient>
            <linearGradient id="${gid}a" x1="0" y1="0" x2="0" y2="1">
              <stop class="ga0" offset="0"/><stop class="ga1" offset="1"/>
            </linearGradient>
          </defs>
${showLine ? `          <path class="area" d="${areaPath}" fill="url(#${gid}a)"/>` : ''}
${grid}
${showBar ? items.map((it, i) => `          <rect class="bar" x="${(x(i) - bw / 2).toFixed(1)}" y="${y(it.value).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, base - y(it.value)).toFixed(1)}" rx="7" fill="url(#${gid}b)" style="--d:${(i * 0.08).toFixed(2)}s"/>`).join('\n') : ''}
${showLine ? `          <path class="ln" d="${linePath}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" data-draw/>
${pts.map((q, i) => `          <circle class="dot" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="5.5" stroke-width="3" style="--d:${(0.5 + i * 0.07).toFixed(2)}s"/>`).join('\n')}` : ''}
          <line class="axis" x1="${padX}" y1="${base}" x2="${W - padX}" y2="${base}"/>
        </svg>
${notes}      </div>
      <div class="draw-lbl">${items.map((it, i) =>
    `<span style="left:${pct(x(i), W)}"${ed(`items.${i}.label`, 'ラベル')}>${esc(it.label)}</span>`).join('')}</div>
    </div>`);
    },
  },

  /* ---------------- スライドページ ---------------- */
  slides: {
    label: 'Slides',
    icon: '❐',
    tag: 'スクロール',
    about: 'スクロール1回で1枚めくる全画面スライド。表示のたびに図と数字が最初から再生されます。',
    tall: true,
    fields: [
      { key: 'items', label: 'スライド', type: 'list', addLabel: 'スライドを追加', titleKey: 'title',
        item: [
          { key: 'no', label: '番号', type: 'text' },
          { key: 'title', label: '見出し', type: 'text' },
          { key: 'lead', label: 'リード文', type: 'textarea' },
          { key: 'bullets', label: '箇条書き', type: 'textarea' },
          { key: 'num', label: '大きな数字', type: 'text' },
          { key: 'suffix', label: '数字の単位', type: 'text' },
          { key: 'viz', label: '左の図', type: 'select',
            options: [['bar', '棒グラフが伸びる'], ['line', '線が描かれる'], ['ring', '円が満ちる']] },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      bg: 'dark', anchor: 'slides',
      items: [
        { no: '01', title: '速さで、選ばれる。', lead: 'ご相談から公開まで、最短3日。', num: '3', suffix: '日',
          bullets: '構成案は当日中にお出しします\n修正は2回まで無料\n公開後1ヶ月は無償サポート', viz: 'bar' },
        { no: '02', title: '数字で、伸ばす。', lead: '公開したあとの改善までが仕事です。', num: '182', suffix: '%',
          bullets: '問い合わせ数の推移を毎月共有\n離脱の多い場所から直す\n施策の効果を数字で確認', viz: 'line' },
        { no: '03', title: '長く、使える。', lead: '自分たちで更新できる形でお渡しします。', num: '96', suffix: '%',
          bullets: '専門知識がいらないシンプルな構造\n更新方法をレクチャー\n1ファイルで完結', viz: 'ring' },
      ],
    },
    render: (p) => {
      const items = (p.items || []);
      const n = Math.max(1, items.length);
      /* 図は3種。どれも「線1本」で終わらせず、面と目盛りを敷く */
      const grid = (n) => [0, 1, 2, 3].map((k) =>
        `<line class="gl" x1="10" y1="${(24 + k * 48).toFixed(0)}" x2="${n}" y2="${(24 + k * 48).toFixed(0)}"/>`).join('');

      const viz = (kind, i) => {
        const gid = `sv${i}`;
        if (kind === 'line') {
          const pts = [[16, 150], [76, 120], [136, 126], [196, 80], [256, 56], [314, 22]];
          const d = pts.map((q, k) => `${k ? 'L' : 'M'}${q[0]} ${q[1]}`).join(' ');
          return `<svg viewBox="0 0 330 190" fill="none">
          <defs><linearGradient id="${gid}a" x1="0" y1="0" x2="0" y2="1">
            <stop class="ga0" offset="0"/><stop class="ga1" offset="1"/></linearGradient></defs>
          <path class="area" d="${d} L314 168 L16 168 Z" fill="url(#${gid}a)"/>
          ${grid(320)}
          <line class="axis" x1="10" y1="168" x2="320" y2="168"/>
          <path class="ln" d="${d}" stroke="var(--c-primary)" stroke-width="3.5"
                stroke-linecap="round" stroke-linejoin="round" data-draw style="--d:.15s"/>
          ${pts.map((q, k) => `<circle class="dot" cx="${q[0]}" cy="${q[1]}" r="5.5" stroke-width="3" style="--d:${(0.5 + k * 0.07).toFixed(2)}s"/>`).join('')}
        </svg>`;
        }
        if (kind === 'ring') {
          /* 細い輪はグラフに見えない。外径いっぱいの太い輪にする */
          return `<svg viewBox="0 0 220 220" fill="none" stroke-width="34">
          <defs><linearGradient id="${gid}r" x1="0" y1="0" x2="1" y2="1">
            <stop class="gb0" offset="0"/><stop class="gb1" offset="1"/></linearGradient></defs>
          <circle class="trk" cx="110" cy="110" r="86"/>
          <circle class="arc" cx="110" cy="110" r="86" stroke="url(#${gid}r)" stroke-linecap="round"
                  transform="rotate(-90 110 110)" data-draw style="--d:.1s"/>
        </svg>`;
        }
        const hs = [34, 58, 46, 78, 96];
        return `<svg viewBox="0 0 330 190" fill="none">
          <defs><linearGradient id="${gid}b" x1="0" y1="0" x2="0" y2="1">
            <stop class="gb0" offset="0"/><stop class="gb1" offset="1"/></linearGradient></defs>
          ${grid(320)}
          <line class="axis" x1="10" y1="168" x2="320" y2="168"/>
          ${hs.map((h, k) => `<rect class="bar" x="${26 + k * 60}" y="${(168 - h * 1.45).toFixed(1)}" width="38" height="${(h * 1.45).toFixed(1)}" rx="6"
              fill="url(#${gid}b)" style="--d:${(0.15 + k * 0.09).toFixed(2)}s"/>`).join('')}
        </svg>`;
      };

      const slides = items.map((it, i) => `      <div class="sl" style="--i:${i}">
        <div class="sl-viz">${viz(it.viz, i)}</div>
        <div class="sl-body">
          <span class="sl-no"${ed(`items.${i}.no`, '番号')}>${esc(it.no)}</span>
          ${it.num ? `<b class="sl-num" data-count="${esc(it.num)}"${it.suffix ? ` data-suffix="${esc(it.suffix)}"` : ''}>0</b>` : ''}
          <h3${el(p, `sl${i}.title`, 'ta', 'スライド見出し', `items.${i}.title`)}>${nl2br(it.title)}</h3>
          ${it.lead ? `<p class="sl-lead"${ed(`items.${i}.lead`, 'リード文')}>${nl2br(it.lead)}</p>` : ''}
          ${it.bullets ? `<ul>${(it.bullets || '').split('\n').filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`).join('\n');

      return `<section class="pinsec slidesec${p.bg ? ` bg-${p.bg}` : ''}" data-slides
  style="height:${n * 100}vh"${attr('id', p.anchor)}>
  <div class="pin-in">
    <div class="sl-stage">
${slides}
    </div>
    <nav class="sl-dots">${items.map((it, i) => `<button aria-label="${i + 1}枚目へ"${i === 0 ? ' class="on"' : ''}></button>`).join('')}</nav>
  </div>
</section>`;
    },
  },

  /* ---------------- 全画面メッセージ ---------------- */
  shift: {
    label: 'Statement',
    icon: '◧',
    tag: '演出',
    about: '画面いっぱいに1つの言葉だけを置きます。色を変えると空気が切り替わります。',
    fields: [
      { key: 'title', label: '見出し', type: 'textarea', rows: 2 },
      { key: 'text', label: '説明', type: 'text' },
      { key: 'bgColor', label: '背景色', type: 'color' },
      { key: 'fgColor', label: '文字色', type: 'color' },
      FIELD.anchor,
    ],
    defaults: {
      title: '白に、なる。', text: '色が変わると、空気が変わります。',
      bgColor: '#f4f1ea', fgColor: '#1a1a17', anchor: '',
    },
    render: (p) => `<section class="shift-pane" style="background:${esc(p.bgColor)};color:${esc(p.fgColor)}"${attr('id', p.anchor)}>
  <div class="wrap">
    ${p.title ? `<h3${el(p, 'title', 'ta', '見出し', 'title')}>${nl2br(p.title)}</h3>` : ''}
    ${p.text ? `<p${ed('text', '説明')}>${esc(p.text)}</p>` : ''}
  </div>
</section>`,
  },
};

/* 追加メニューに出す順番（ヘッダー・フッターは常設なので除く） */
const ADDABLE = [
  'hero', 'collage', 'features', 'icons', 'about', 'gallery', 'video', 'strip', 'menu', 'floors', 'news', 'marquee', 'pricing', 'faq', 'cta', 'contact', 'rich',
  'slides', 'product3d', 'exploded', 'hscroll', 'stackcards', 'timeline', 'clipreveal',
  'carousel3d', 'slotstats', 'svgdraw', 'shift',
];
