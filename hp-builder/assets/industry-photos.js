/* ================================================================
   業種ごとの、実際の写真

   顔（ヒーロー）を選ぶとき、写真枠が空だと、その型が自分の店に
   合うのかが掴めない。かといって描いた絵では、写真の型の良し悪しは
   判断できない。だから実写を出す。

   ただし本体には焼き込まない。
   1枚 200KB として10業種ぶんで2MB。ツールは1枚のHTMLで、開く前に
   全部読み込むので、そのぶんまるまる起動が遅くなる。

   代わりに、置いてある場所から必要になったときだけ読む。

     ・顔の一覧      … URL のまま出す（この画面は書き出されない）
     ・選んだあと    … 裏で1枚ずつ取り込んで、写真と同じように埋め込む
     ・取りに行けない … 描いた絵（sampleArt）のまま。file:// でも壊れない

   書き出したページに URL は残らない。取り込みが終わっていれば実写が、
   終わっていなければ描いた絵が、どちらも中に入った状態で出る。
   外のサーバーに頼るページにはしない。
   ================================================================ */

/* 置き場所。公開の入れ物と同じところに置く。
   file:// から開いた場合もここを見に行く（通信できなければ描いた絵に戻る）。
   読み込み順に左右されないよう、その場で調べる（PUBLISH はこのあとに来る）。 */
const photoBase = () => ((typeof PUBLISH === 'object' && PUBLISH.siteBase)
  ? PUBLISH.siteBase.replace(/\/s\/$/, '/art/')
  : '');

/* 業種 → 置いてある写真。順番に使う。
   1業種に何枚あってもよい（足りなければ先頭から繰り返す）。

   ここには「art/ に実物が在る業種」だけを書く。
   無い業種の名前を書いてしまうと、取りに行って空振りし、そのあと
   在る業種まで描いた絵に落ちる（1度の失敗で以降あきらめる作りなので）。
   在る業種だけ書いておけば、無い業種は最初から取りに行かない。

   写真を足したら、ここに1行足す。art/README.md にも書いてある。
   在るものとの食い違いは verify-indart.js が見ている。 */
const INDUSTRY_PHOTOS = {
  cafe: ['cafe-1.jpg', 'cafe-2.jpg', 'cafe-3.jpg'],
};

/* その業種の i 枚目の URL。
   写真の無い業種、置き場所が決まっていないときは空（＝描いた絵のまま）。
   他の業種の写真は借りない。カフェの写真がジムに出たら、かえって困る。 */
function industryPhoto(key, i = 0) {
  const list = INDUSTRY_PHOTOS[key];
  const base = photoBase();
  if (!base || !list || !list.length) return '';
  return base + list[i % list.length];
}

/* 取りに行けるかどうかは、実際に読んでみるまで分からない。
   1度でも失敗したら、そのあとは試さない（毎回待たされるほうが困る）。 */
let photoReach = null;      // null=まだ / true=読める / false=読めない
const photoCache = new Map();

/* 写真1枚を、アップロードした写真とまったく同じ形（data URL）にして返す。
   ここを通しておけば、書き出したページは1枚で完結したままになる。 */
async function fetchIndustryPhoto(url) {
  if (!url || photoReach === false) return '';
  if (photoCache.has(url)) return photoCache.get(url);
  try {
    const r = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!r.ok) throw new Error(String(r.status));
    const blob = await r.blob();
    if (!/^image\//.test(blob.type)) throw new Error('not an image');
    const out = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
    photoReach = true;
    photoCache.set(url, out);
    return out;
  } catch (e) {
    photoReach = false;    // 以降は描いた絵で通す
    return '';
  }
}

/* この写真が「まだ自分のものに替えていない」ものかどうか。
   描いた絵（hp-sample）と同じ扱いにしたいので、取り込んだものにも印を持たせる。
   data URL そのものには印を書けないので、入れた場所を覚えておく。 */
const borrowedPhotos = new Set();
const isBorrowedPhoto = (v) => typeof v === 'string' && borrowedPhotos.has(v);
