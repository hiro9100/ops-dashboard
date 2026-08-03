/* ================================================================
   部分ごとに選んで組むための「型」

   1つの型 = ブロック種別 ＋ 初期値からの差分。
   同じ features でも、アイコン3列と ( 01 ) 形式では別の型として並べる。
   テンプレートが「1ページまるごと」なのに対して、こちらは「1段ずつ」。

   名前は「使い道」ではなく「かたち」で付ける。
   「よくある質問」ではなく「押すと開く一覧」、
   「会社紹介」ではなく「写真 左 ／ 文章 右」。
   使い道は人によって違うが、かたちは見たままなので迷わない。
   何に使えるかは about に添える。

   見本は BLOCKS[type].render() で実物を描くので、
   ここに書いた差分がそのまま見た目に出る。
   ================================================================ */

/* ---------------- ヒーロー（1段目） ---------------- */
const HERO_PRESETS = [
  { key: 'center', type: 'hero', label: 'Center',
    about: 'いちばん素直な形。文章が主役のとき。',
    props: { layout: 'center' } },

  { key: 'left', type: 'hero', label: 'Left',
    about: '読み出しが速い。文章が長めのときに。',
    props: { layout: 'left' } },

  { key: 'split', type: 'hero', label: 'Split',
    about: '文章と写真を同じ重さで見せる。',
    props: { layout: 'split' } },

  { key: 'cover', type: 'hero', label: 'Cover',
    about: '写真の力で見せる。文字は写真の上に乗る。',
    props: { layout: 'cover' } },

  { key: 'cover-glass', type: 'hero', label: 'Cover + Glass',
    about: 'ポインタに追いてガラスの円が動く。指の環境では自動で止まる。',
    props: { layout: 'cover', deco: 'glass', decoStrength: 70 } },

  { key: 'center-clouds', type: 'hero', label: 'Center + Clouds',
    about: 'やわらかい色のかたまりがゆっくり漂う。',
    props: { layout: 'center', deco: 'clouds', decoStrength: 60 } },

  { key: 'center-aurora', type: 'hero', label: 'Center + Aurora',
    about: '背後で光の帯がゆっくり流れる。暗い配色と相性がいい。',
    props: { layout: 'center', deco: 'aurora', decoStrength: 65 } },

  { key: 'center-dust', type: 'hero', label: 'Center + Dust',
    about: '細かい粒がゆっくり昇る。静かに動かしたいとき。',
    props: { layout: 'center', deco: 'dust', decoStrength: 55 } },

  { key: 'cover-cursor', type: 'hero', label: 'Cover + Cursor',
    about: 'ポインタを追う丸の中だけ、文字が反転して見える。',
    props: { layout: 'cover', deco: 'cursor', decoStrength: 60, decoLabel: 'SCROLL' } },

  { key: 'scroll-zoomout', type: 'hero', label: 'Scroll: Zoom Out',
    about: '全画面の写真が、スクロールにつれて枠の中に収まっていく。',
    props: { layout: 'cover', scroll: 'zoomout', scrollLen: 200 } },

  { key: 'scroll-parallax', type: 'hero', label: 'Scroll: Parallax',
    about: '写真がゆっくり、文字が速く動いて奥行きが出る。',
    props: { layout: 'cover', scroll: 'parallax', scrollLen: 200 } },

  { key: 'scroll-curtain', type: 'hero', label: 'Scroll: Curtain',
    about: 'スクロールに合わせて幕が開く。',
    props: { layout: 'cover', scroll: 'curtain', scrollLen: 200 } },

  { key: 'scroll-maskzoom', type: 'hero', label: 'Scroll: Mask Zoom',
    about: '文字の内側から写真が広がって全画面になる。いちばん派手。',
    props: { layout: 'cover', scroll: 'maskzoom', scrollLen: 240 } },

  { key: 'collage', type: 'collage', label: 'Collage',
    about: '敷き詰めた写真に、斜めの写真と縦書きの帯を重ねる。',
    props: {} },
];

/* ---------------- 2段目から下 ----------------

   group は「かたち」で分ける。使い道（飲食店向け・サロン向け）では分けない。
   同じ「押すと開く一覧」を、質問にも料金の内訳にも使う人がいる。 */
const SECTION_GROUPS = [
  ['all', 'すべて'],
  ['写真', '写真'],
  ['カード', '横に並べる'],
  ['一覧', '縦に並べる'],
  ['文章', '文章・帯'],
  ['その他', 'その他'],
];

const SECTION_PRESETS = [
  /* ============ 写真 ============ */
  { key: 'about-left', type: 'about', group: '写真', label: 'Photo L / Text R',
    about: '写真1枚に説明を添える。店や会社の紹介に。',
    props: { reverse: false } },

  { key: 'about-right', type: 'about', group: '写真', label: 'Photo R / Text L',
    about: '左右ちがい。上と続けて使うと交互になって流れが出る。',
    props: { reverse: true } },

  { key: 'gallery', type: 'gallery', group: '写真', label: 'Gallery Grid',
    about: '同じ大きさの枠に敷き詰める。ギャラリー。', props: {} },

  { key: 'hscroll', type: 'hscroll', group: '写真', label: 'H-Scroll',
    about: '縦に読むと横に流れる。作品や事例を並べるとき。', props: {} },

  { key: 'collage-mid', type: 'collage', group: '写真', label: 'Collage Band',
    about: '大小の写真を隙間なく敷く。途中に挟んでも効く。', props: {} },

  { key: 'video', type: 'video', group: '写真', label: 'Video',
    about: 'YouTube・Vimeo・動画ファイルのURLを貼るだけ。形も土台も写真と同じように使える。',
    props: {} },

  { key: 'strip', type: 'strip', group: '写真', label: 'Photo Strip',
    about: '数が多いものを途切れず流す。導入実績・取引先・受賞歴に。写真だけ／カードを選べる。',
    props: {} },

  { key: 'strip-card', type: 'strip', group: '写真', label: 'Photo Strip (Cards)',
    about: '流れる1枚ずつに見出しと説明が付く形。',
    props: { style: 'card', size: 'l' } },

  { key: 'clipreveal', type: 'clipreveal', group: '写真', label: 'Clip Reveal',
    about: '円が広がって次の写真に入れ替わる。', props: {} },

  /* ============ 横に並べる（カード） ============ */
  { key: 'features-icon', type: 'features', group: 'カード', label: 'Cards ×3 (Icon)',
    about: 'いちばん使う形。伝えたいことを3つに分ける。',
    props: { style: 'icon', cols: 'c3' } },

  { key: 'features-num', type: 'features', group: 'カード', label: 'Cards ×3 (Number)',
    about: '番号が大きく出る。順番に意味があるとき。',
    props: { style: 'num', cols: 'c3' } },

  { key: 'features-paren', type: 'features', group: 'カード', label: 'Cards ×2 (01)',
    about: '番号を控えめに置く形。落ち着いて見える。',
    props: { style: 'paren', cols: 'c2' } },

  { key: 'features-image', type: 'features', group: 'カード', label: 'Cards ×3 (Photo)',
    about: '上に写真、下に説明。事例や商品を並べるとき。',
    props: { style: 'image', cols: 'c3' } },

  { key: 'icons', type: 'icons', group: 'カード', label: 'Icon Grid',
    about: '設備や条件を、絵と短い言葉で並べる。Wi-Fi・駐車場・禁煙など。',
    props: {} },

  { key: 'pricing', type: 'pricing', group: 'カード', label: 'Pricing ×3',
    about: '真ん中だけ目立たせる形。', props: { cols: 'c3' } },

  { key: 'stackcards', type: 'stackcards', group: 'カード', label: 'Stack',
    about: 'スクロールで手前に積み上がる。順に見せたいとき。', props: {} },

  { key: 'carousel3d', type: 'carousel3d', group: 'カード', label: 'Carousel',
    about: '奥行きのある並び。写真が多いとき。', props: {} },

  /* ============ 縦に並べる（一覧） ============ */
  { key: 'menu', type: 'menu', group: '一覧', label: 'Price List',
    about: '左に品名、右に値段。お品書き・メニュー表に。', props: {} },

  { key: 'news', type: 'news', group: '一覧', label: 'Dated List',
    about: '日付と見出しが縦に並ぶ。お知らせや予定に。', props: {} },

  { key: 'faq', type: 'faq', group: '一覧', label: 'Accordion',
    about: '見出しだけ並べて、押すと答えが出る。長い説明をたたむとき。', props: {} },

  { key: 'floors', type: 'floors', group: '一覧', label: 'Floors',
    about: '階数と内容を縦に並べる。', props: {} },

  { key: 'timeline', type: 'timeline', group: '一覧', label: 'Timeline',
    about: '線が伸びながら項目が現れる。沿革や流れに。', props: {} },

  { key: 'slotstats', type: 'slotstats', group: '一覧', label: 'Big Numbers',
    about: '画面に入ると数字が回って止まる。実績を出すとき。',
    props: { cols: 'c3' } },

  { key: 'svgdraw', type: 'svgdraw', group: '一覧', label: 'Line Chart',
    about: '線が引かれ、下に同じ色の薄い膜が敷かれる。数字の変化を見せるとき。', props: {} },

  { key: 'svgbar', type: 'svgdraw', group: '一覧', label: 'Bar Chart',
    about: '棒が下から立ち上がる。年ごとの比較や内訳に。',
    props: { kind: 'bar', eyebrow: 'RESULT', title: '数字で見る', text: '' } },

  /* ============ 文章・帯 ============ */
  { key: 'rich', type: 'rich', group: '文章', label: 'Text',
    about: '決まった形に収まらない文章を置く欄。', props: {} },

  { key: 'shift', type: 'shift', group: '文章', label: 'Statement',
    about: '大きな文字を1行だけ置いて、間を作る。', props: {} },

  { key: 'marquee', type: 'marquee', group: '文章', label: 'Marquee',
    about: '文字が横に流れ続ける帯。区切りに置く。',
    props: { bg: 'primary' } },

  { key: 'cta', type: 'cta', group: '文章', label: 'CTA Band',
    about: '次にしてほしいことを1つだけ置く。予約や電話に。',
    props: { bg: 'primary' } },

  /* ============ その他 ============ */
  { key: 'contact', type: 'contact', group: 'その他', label: 'Form',
    about: '名前・連絡先・本文と送信ボタン。送信先はあとで設定する。', props: {} },

  { key: 'slides', type: 'slides', group: 'その他', label: 'Slides',
    about: '資料のように、1枚ずつ切り替わる。', props: {} },

  { key: 'product3d', type: 'product3d', group: 'その他', label: 'Product 3D',
    about: 'スクロールで向きが変わる。物を売るとき。', props: {} },

  { key: 'exploded', type: 'exploded', group: 'その他', label: 'Exploded',
    about: '重なって1つになる図。中身や工程を見せるとき。', props: {} },
];

/* ---------------- いちばん下（フッター） ----------------
   ヒーロー・ブロックとは別の型として持つ。1ページに1つしか無く、
   選ぶと差し替えではなく、いまのフッターの見た目だけが変わる。 */
const FOOTER_PRESETS = [
  { key: 'ftr-bar', type: 'footer', label: 'Bar',
    about: 'いちばん素直な形。どのページにも合う。',
    props: { style: 'bar' } },

  { key: 'ftr-center', type: 'footer', label: 'Centered',
    about: '名前・リンク・年を縦に真ん中で。静かに終わる。',
    props: { style: 'center' } },

  { key: 'ftr-big', type: 'footer', label: 'Large',
    about: '左にお店の一言、右にリンクを縦に並べる。住所や営業時間もここに。',
    props: { style: 'big', text: '月〜金 10:00–19:00／土 10:00–17:00\n東京都〇〇区〇〇 1-2-3' } },

  { key: 'ftr-light', type: 'footer', label: 'Light',
    about: '濃い地ではなく、薄い地に線を1本。全体を軽く見せたいとき。',
    props: { style: 'light' } },

  { key: 'ftr-cta', type: 'footer', label: 'CTA',
    about: '最後にもう一度、してほしいことを置く。予約や問い合わせに。',
    props: { style: 'cta', text: 'ご相談はいつでもどうぞ。', cta: 'お問い合わせ', ctaHref: '#contact' } },

  { key: 'ftr-minimal', type: 'footer', label: 'Minimal',
    about: '名前と年だけの細い帯。中身で見せたいとき。',
    props: { style: 'minimal' } },
];
