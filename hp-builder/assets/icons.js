/* ================================================================
   線で描いたアイコン

   設備・条件を並べる欄（Wi-Fi・駐車場・禁煙…）のために持つ。
   絵文字と違って端末で形が変わらず、色も太さもページに合わせられる。

   中身は 24×24 のパスだけ。線は currentColor なので、文字の色に従う。
   絵柄は増やしやすいよう、ここに1行ずつ足すだけの形にしてある。
   ================================================================ */
const ICONS = {
  wifi: {
    label: 'Wi-Fi',
    d: `<path d="M2.6 8.6a15 15 0 0 1 18.8 0"/><path d="M6.1 12.3a10 10 0 0 1 11.8 0"/>
        <path d="M9.4 15.9a5 5 0 0 1 5.2 0"/><circle cx="12" cy="19.3" r="1.15" fill="currentColor" stroke="none"/>`,
  },
  screen: {
    label: 'スクリーン',
    d: `<rect x="3" y="4.2" width="18" height="12" rx="1.3"/><path d="M12 16.2v3.2"/><path d="M8.4 19.4h7.2"/>`,
  },
  speaker: {
    label: 'スピーカー',
    d: `<rect x="7.6" y="3" width="8.8" height="18" rx="1.6"/><circle cx="12" cy="8" r="1.7"/>
        <circle cx="12" cy="15.2" r="2.7"/>`,
  },
  drink: {
    label: '飲みもの',
    d: `<path d="M6.6 7.4h10.8l-1 12.2a1.7 1.7 0 0 1-1.7 1.5H9.3a1.7 1.7 0 0 1-1.7-1.5z"/>
        <path d="M5.4 7.4h13.2"/><path d="M13.2 7.4 14.7 3.2"/>`,
  },
  food: {
    label: '食べもの',
    d: `<path d="M4 9.6c0-3 3.6-5.1 8-5.1s8 2.1 8 5.1"/><path d="M4 12.6h16"/>
        <path d="M4.4 15.6h15.2a4 4 0 0 1-4 4H8.4a4 4 0 0 1-4-4z"/>`,
  },
  nosmoke: {
    label: '禁煙',
    d: `<circle cx="12" cy="12" r="8.8"/><path d="M5.9 18.1 18.1 5.9"/>
        <rect x="5.4" y="13.1" width="9.8" height="2.9" rx="1.2"/><path d="M12.3 13.1v2.9"/>
        <path d="M16.2 9.4c1.1 1 1.1 2.2 0 3.2"/>`,
  },
  shoes: {
    label: '土足',
    d: `<path d="M3.6 18.7v-5.1c0-.6.5-1.1 1.1-1.1h2.5c.5 0 1-.3 1.2-.7l1.3-2.3c.2-.4.6-.6 1-.6.6 0 1.1.5 1.1 1.1v1.4c0 1.4.8 2.6 2.1 3.1l3.9 1.6c1.2.5 2 1.7 2 3 0 .6-.5 1.1-1.1 1.1H4.7a1.1 1.1 0 0 1-1.1-1.1z"/>
        <path d="M3.6 16.6h4.6"/>`,
  },
  parking: {
    label: '駐車場',
    d: `<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="3.2"/>
        <path d="M9.6 16.6V7.4h3.3a2.75 2.75 0 0 1 0 5.5H9.6"/>`,
  },
  card: {
    label: 'カード決済',
    d: `<rect x="2.6" y="5" width="18.8" height="14" rx="2.2"/><path d="M2.6 9.6h18.8"/>
        <path d="M6.2 15h4.2"/>`,
  },
  clock: {
    label: '営業時間',
    d: `<circle cx="12" cy="12" r="8.6"/><path d="M12 6.8v5.4l3.4 2"/>`,
  },
  calendar: {
    label: '予約',
    d: `<rect x="3.4" y="5" width="17.2" height="15.6" rx="2.2"/><path d="M3.4 10h17.2"/>
        <path d="M8 3v4"/><path d="M16 3v4"/>`,
  },
  paw: {
    label: 'ペット',
    d: `<circle cx="7.4" cy="9" r="1.85"/><circle cx="12" cy="6.9" r="1.95"/><circle cx="16.6" cy="9" r="1.85"/>
        <path d="M12 11.5c3 0 5 2.2 5 4.4 0 2-1.7 3.4-3.6 3-.9-.2-1.9-.2-2.8 0-1.9.4-3.6-1-3.6-3 0-2.2 2-4.4 5-4.4z"/>`,
  },
};

/* 一覧・選択肢で使う並び */
const ICON_LIST = Object.keys(ICONS).map((k) => [k, ICONS[k].label]);

/* 絵を1つ描く。線の太さは枠の大きさに合わせて少し変える */
function iconSVG(key) {
  const it = ICONS[key] || ICONS.wifi;
  return `<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${it.d}</svg>`;
}
