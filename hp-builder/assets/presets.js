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

  { key: 'listing', type: 'listing', group: 'カード', label: 'Listing ×2',
    about: '写真・条件・ボタンをひと組で並べる。たくさんの中から1つ選んでもらうものに。',
    props: { cols: 'c2' } },

  { key: 'listing-3', type: 'listing', group: 'カード', label: 'Listing ×3',
    about: '同じ形を3列で。1つあたりを小さく、数を多く見せたいとき。',
    props: { cols: 'c3', btnStyle: 'link' } },

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

  { key: 'schedule', type: 'schedule', group: '一覧', label: 'Week Table',
    about: '縦が時間帯、横が曜日の表。丸と休みで示す。診療時間・営業時間に。',
    props: {} },

  { key: 'schedule-class', type: 'schedule', group: '一覧', label: 'Week Table (Text)',
    about: '同じ表の桝目に、文字を入れる形。教室・スタジオのコマ表に。',
    props: {
      eyebrow: 'SCHEDULE', title: 'レッスン表', corner: '時間',
      note: '※初回は開始15分前にお越しください。祝日は休講です。',
      rows: [
        { label: '10:00 – 11:00', cells: 'ベーシック | - | ベーシック | - | ベーシック | キッズ | -' },
        { label: '14:00 – 15:00', cells: '- | ストレッチ | - | ストレッチ | - | 親子 | 体験' },
        { label: '19:00 – 20:30', cells: 'アドバンス | HIPHOP | アドバンス | HIPHOP | 自由練習 | - | -' },
      ],
    } },

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

/* ================================================================
   「何が要るか」で選ぶ一覧

   型の一覧（SECTION_PRESETS）は「かたち」で並べてある。
   かたちで選べるのは、何を載せるか決まっている人だけ。
   はじめての人はその前段で止まる——「うちに何が要るのか」が分からない。

   そこで先に、使い道でチェックしてもらう。チェックした時点で
   ページは組み上がり、そのあと1つずつ「かたち」を選び直してもらう。
   かたちが1つしかないものは、選ばせずに置くだけにする。

   picks の先頭が、チェックした瞬間に置かれる形。
   ================================================================ */
const NEEDS = [
  { key: 'about', label: 'お店・会社の紹介', about: '写真と文章で、どんなところかを伝える',
    on: true, picks: ['about-left', 'about-right', 'rich'] },

  { key: 'features', label: '強み・特徴', about: '伝えたいことを3つくらいに分けて並べる',
    on: true, picks: ['features-icon', 'features-num', 'features-paren', 'features-image'] },

  { key: 'photos', label: '写真を見せる', about: '店内・商品・作品などを並べる',
    on: true, picks: ['gallery', 'hscroll', 'collage-mid', 'clipreveal'] },

  { key: 'menu', label: 'メニュー・料金', about: '品名と値段、またはプランの比較',
    on: false, picks: ['menu', 'pricing'] },

  { key: 'equip', label: '設備・こだわり', about: 'Wi-Fi・駐車場・禁煙など、絵と短い言葉で',
    on: false, picks: ['icons'] },

  { key: 'works', label: '導入実績・取引先', about: '数が多いものを横に流す',
    on: false, picks: ['strip', 'strip-card'] },

  { key: 'numbers', label: '数字で見せる', about: '実績の数字や、推移のグラフ',
    on: false, picks: ['slotstats', 'svgdraw', 'svgbar'] },

  { key: 'flow', label: '流れ・沿革・フロア', about: '順番に意味があるものを縦に並べる',
    on: false, picks: ['timeline', 'floors'] },

  { key: 'lineup', label: '一覧から選んでもらう',
    about: '写真と条件を並べて、1つずつ詳しいほうへ送る',
    on: false, picks: ['listing', 'listing-3'] },

  { key: 'hours', label: '営業時間・スケジュール',
    about: '曜日ごとの予定を表で見せる',
    on: false, picks: ['schedule', 'schedule-class'] },

  { key: 'news', label: 'お知らせ', about: '日付つきの一覧',
    on: false, picks: ['news'] },

  { key: 'video', label: '動画', about: 'YouTube・Vimeo・動画ファイルのURLを貼る',
    on: false, picks: ['video'] },

  { key: 'faq', label: 'よくある質問', about: '押すと答えが開く一覧',
    on: false, picks: ['faq'] },

  { key: 'cta', label: '最後のひと押し', about: '予約・電話など、してほしいことを1つ',
    on: true, picks: ['cta', 'marquee', 'shift'] },

  { key: 'contact', label: 'お問い合わせ', about: '連絡先と、入力フォーム',
    on: true, picks: ['contact'] },
];
