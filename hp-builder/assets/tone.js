/* ================================================================
   薄いところの色を、決めた色から作る

   配色の欄に色が8つ並んでいると、手が止まる。
   「メインカラー」「文字色」は分かるが、「背景色（薄いエリア）」
   「うすい文字」「線の色」「濃いエリア」が何に効くのかは、
   実際に使う場所を知らないと決められない。

   そこで、決めるのは4つだけにする。

     決める     メイン / アクセント / 背景 / 文字
     ついてくる 薄いエリア / うすい文字 / 線 / 濃いエリア

   ついてくる4つは、決めた色から作る。薄いエリアは地に、線は地と文字の
   あいだに、濃いエリアは文字の色に。どれも「地から少しずらす」だけなので、
   人が決めるより計算のほうが確かで、配色を変えても崩れない。

   うすい文字だけは混ぜ具合では決めない。地に寄せすぎると読めなくなるので、
   contrast 4.5 を切る手前で止める（読めない灰色は、薄いのではなく壊れている）。
   ================================================================ */

const rgbOf = (h) => {
  const n = parseInt(String(h).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hexOf = (r, g, b) => `#${[r, g, b]
  .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

/* a を b のほうへ t（0〜1）だけ寄せる */
function mixHex(a, b, t) {
  const A = rgbOf(a), B = rgbOf(b);
  return hexOf(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

/* 決めた色（bg / text / primary）から、ついてくる4色を作る */
function toneFromBase(t) {
  const L = relLum(t.bg);
  const onDark = L < 0.35;

  /* 色みは主役の色から少しだけ借りる。鮮やかな色をそのまま混ぜると
     薄いエリアまで色付いて見えるので、鮮やかなほど混ぜる量を減らす */
  const [, sat] = RGB2HSL(...rgbOf(t.primary));
  const tint = Math.max(0.01, 0.055 * (1 - sat));

  /* うすい文字は「混ぜ具合」ではなく「読めるか」で決める。
     地にいちばん寄せたところから戻して、4.5 を満たす最初の色を採る */
  const fade = (from, to) => {
    for (let k = 0.5; k >= 0; k -= 0.02) {
      const c = mixHex(from, to, k);
      if (contrast(c, t.bg) >= 4.5) return c;
    }
    return from;
  };

  if (onDark) {
    /* 暗い地では、薄いエリアは「地より明るい」ほうを指す。
       寄せ先は文字色ではなく白。文字色が白に近いと寄せすぎる */
    return {
      surface: mixHex(mixHex(t.bg, '#ffffff', 0.055), t.primary, tint * 0.5),
      border: mixHex(mixHex(t.bg, '#ffffff', 0.145), t.primary, tint * 0.5),
      muted: fade(t.text, t.bg),
      dark: mixHex(t.bg, '#000000', 0.28),
    };
  }

  /* 明るい地。地がすでに白でない（灰や生成り）なら、白へ寄せたほうが
     面として浮いて見える。真っ白なときは寄せ先が無いので、文字色へ。 */
  const toWhite = L > 0.86 && L < 0.97;
  const surf = toWhite ? mixHex(t.bg, '#ffffff', 0.9) : mixHex(t.bg, t.text, 0.05);
  return {
    surface: mixHex(surf, t.primary, tint),
    border: mixHex(mixHex(t.bg, t.text, 0.16), t.primary, tint),
    muted: fade(t.text, t.bg),
    dark: t.text,
  };
}

/* ついてくる4色の名前と、どこに出るか。編集画面で見せるために持つ */
const TONE_KEYS = [
  ['surface', '薄いエリア', 'ひとつ置きの帯、カードの地'],
  ['muted', 'うすい文字', '日付、補足、小さな注記'],
  ['border', '線', '区切り線、カードのふち、入力欄'],
  ['dark', '濃いエリア', 'フッター、締めの帯'],
];
