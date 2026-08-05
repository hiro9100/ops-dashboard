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
   1業種に何枚あってもよい（足りなければ先頭から繰り返す）。 */
const INDUSTRY_PHOTOS = {
  restaurant: ['restaurant-1.jpg', 'restaurant-2.jpg', 'restaurant-3.jpg'],
  cafe: ['cafe-1.jpg', 'cafe-2.jpg', 'cafe-3.jpg'],
  salon: ['salon-1.jpg', 'salon-2.jpg', 'salon-3.jpg'],
  clinic: ['clinic-1.jpg', 'clinic-2.jpg', 'clinic-3.jpg'],
  builder: ['builder-1.jpg', 'builder-2.jpg', 'builder-3.jpg'],
  school: ['school-1.jpg', 'school-2.jpg', 'school-3.jpg'],
  shop: ['shop-1.jpg', 'shop-2.jpg', 'shop-3.jpg'],
  gym: ['gym-1.jpg', 'gym-2.jpg', 'gym-3.jpg'],
  office: ['office-1.jpg', 'office-2.jpg', 'office-3.jpg'],
  company: ['company-1.jpg', 'company-2.jpg', 'company-3.jpg'],
};

/* その業種の i 枚目の URL。置き場所が決まっていなければ空 */
function industryPhoto(key, i = 0) {
  const list = INDUSTRY_PHOTOS[key] || INDUSTRY_PHOTOS.company;
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
