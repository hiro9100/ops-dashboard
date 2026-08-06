/* ================================================================
   もらった写真を、配れる形に落とす

     node tools/photo-to-jpg.js <入れるファイル> <出す名前> [横幅]

   例:
     node tools/photo-to-jpg.js ~/gym.png art/gym-1.jpg
     node tools/photo-to-jpg.js ~/gym.png art/gym-1.jpg 1600

   PNG のままだと写真1枚で2〜3MBある。業種3枚で8MB、10業種で80MB。
   選んだ業種のぶんしか読まないとはいえ、1枚8MBは待たされる。
   JPEG に落とすと同じ見た目で 1/15 くらいになる。

   この機械には画像を扱う道具が入っていない（PIL も ImageMagick も無い）。
   代わりに、すでに入っている Chromium に描かせて落とす。
   これは編集画面が、人の上げた写真に対して通しているのと同じ道
   （canvas → toDataURL('image/jpeg')）なので、出来上がりも揃う。

   横幅は既定 1600px。ヒーローは画面いっぱいに伸びるので、
   これより小さいと甘くなる。元より大きくはしない（水増ししても
   細かいところは戻らないので、ただ重くなるだけ）。
   ================================================================ */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const [, , src, dst, wArg] = process.argv;
if (!src || !dst) {
  console.error('使い方: node tools/photo-to-jpg.js <入れるファイル> <出す名前> [横幅]');
  process.exit(1);
}
const MAXW = parseInt(wArg, 10) || 1600;
const QUALITY = 0.82;          // これ以上上げても、目で見て変わらないわりに重くなる

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif' };

(async () => {
  if (!fs.existsSync(src)) { console.error(`${src} が見つかりません`); process.exit(1); }
  const raw = fs.readFileSync(src);
  const type = MIME[path.extname(src).toLowerCase()];
  if (!type) { console.error(`${path.extname(src)} は読めません`); process.exit(1); }

  const b = await chromium.launch();
  const p = await (await b.newContext()).newPage();
  const out = await p.evaluate(async ([data, maxw, q]) => {
    const im = new Image();
    await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = data; });
    const scale = Math.min(1, maxw / im.width);      // 元より大きくはしない
    const cv = document.createElement('canvas');
    cv.width = Math.round(im.width * scale);
    cv.height = Math.round(im.height * scale);
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    return { url: cv.toDataURL('image/jpeg', q), w: cv.width, h: cv.height,
      fromW: im.width, fromH: im.height };
  }, [`data:${type};base64,${raw.toString('base64')}`, MAXW, QUALITY]);
  await b.close();

  const buf = Buffer.from(out.url.split(',')[1], 'base64');
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, buf);

  const kb = (n) => `${Math.round(n / 1024)}KB`;
  console.log(`${path.basename(dst)}  ${out.fromW}×${out.fromH} ${kb(raw.length)}`
    + `  →  ${out.w}×${out.h} ${kb(buf.length)}`
    + `  (${Math.round((1 - buf.length / raw.length) * 100)}% 減)`);
})();
