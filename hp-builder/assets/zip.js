/* ================================================================
   ZIPを作る

   ページが2枚以上になると、書き出しはファイル1つでは済まない。
   ブラウザから複数のファイルを続けて保存させようとすると、
   2つ目以降が「まとめてダウンロード」の確認で止まる端末が多い。
   1つの箱にまとめて渡すのがいちばん確実で、Netlify などの
   「ここにドロップ」もZIPをそのまま受ける。

   圧縮はしない（stored）。HTMLは写真がデータURLで入っていて、
   そのほとんどは既に圧縮済みの絵なので、縮めても効きが薄いわりに
   実装が重くなる。ここでは「まとめる」ことだけをする。

   外から読み込むものは無し。仕様どおりのバイト列を自分で組む。
   ================================================================ */

/* CRC-32。ZIPは中身の壊れを見るためにこれを持つ */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* files: [{name, text}] → Blob */
function makeZip(files) {
  const enc = new TextEncoder();
  const parts = [];        // 本体（ローカルヘッダ＋中身）
  const dir = [];          // 目次
  let offset = 0;

  /* 日時は「1980-01-01 00:00」で固定する。作った時刻を入れると、
     同じ中身でも毎回ちがうバイト列になり、変わったかどうか見分けにくい */
  const time = 0;
  const date = 33;         // (1980-1980)<<9 | 1<<5 | 1

  for (const f of files) {
    const name = enc.encode(f.name);
    const body = enc.encode(f.text);
    const crc = crc32(body);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);   // ローカルヘッダの印
    lv.setUint16(4, 20, true);           // 展開に要るバージョン
    lv.setUint16(6, 0x0800, true);       // ファイル名はUTF-8
    lv.setUint16(8, 0, true);            // 圧縮なし
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, body.length, true);
    lv.setUint32(22, body.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);

    const ent = new Uint8Array(46 + name.length);
    const ev = new DataView(ent.buffer);
    ev.setUint32(0, 0x02014b50, true);   // 目次の印
    ev.setUint16(4, 20, true);
    ev.setUint16(6, 20, true);
    ev.setUint16(8, 0x0800, true);
    ev.setUint16(10, 0, true);
    ev.setUint16(12, time, true);
    ev.setUint16(14, date, true);
    ev.setUint32(16, crc, true);
    ev.setUint32(20, body.length, true);
    ev.setUint32(24, body.length, true);
    ev.setUint16(28, name.length, true);
    ev.setUint32(42, offset, true);      // 本体のどこにあるか
    ent.set(name, 46);

    parts.push(local, body);
    dir.push(ent);
    offset += local.length + body.length;
  }

  const dirSize = dir.reduce((n, e) => n + e.length, 0);
  const end = new Uint8Array(22);
  const nv = new DataView(end.buffer);
  nv.setUint32(0, 0x06054b50, true);     // 終わりの印
  nv.setUint16(8, files.length, true);
  nv.setUint16(10, files.length, true);
  nv.setUint32(12, dirSize, true);
  nv.setUint32(16, offset, true);

  return new Blob([...parts, ...dir, end], { type: 'application/zip' });
}
