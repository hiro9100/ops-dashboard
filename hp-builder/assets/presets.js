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
  { key: 'center', type: 'hero', label: '中央ぞろえ',
    about: 'いちばん素直な形。文章が主役のとき。',
    props: { layout: 'center' } },

  { key: 'left', type: 'hero', label: '左ぞろえ',
    about: '読み出しが速い。文章が長めのときに。',
    props: { layout: 'left' } },

  { key: 'split', type: 'hero', label: '文章 左 ／ 写真 右',
    about: '文章と写真を同じ重さで見せる。',
    props: { layout: 'split' } },

  { key: 'cover', type: 'hero', label: '写真いっぱい・文字を重ねる',
    about: '写真の力で見せる。文字は写真の上に乗る。',
    props: { layout: 'cover' } },

  { key: 'cover-glass', type: 'hero', label: '写真いっぱい＋すりガラスの円',
    about: 'ポインタに追いてガラスの円が動く。指の環境では自動で止まる。',
    props: { layout: 'cover', deco: 'glass', decoStrength: 70 } },

  { key: 'center-clouds', type: 'hero', label: '中央ぞろえ＋ふわふわ雲',
    about: 'やわらかい色のかたまりがゆっくり漂う。',
    props: { layout: 'center', deco: 'clouds', decoStrength: 60 } },

  { key: 'center-aurora', type: 'hero', label: '中央ぞろえ＋オーロラ',
    about: '背後で光の帯がゆっくり流れる。暗い配色と相性がいい。',
    props: { layout: 'center', deco: 'aurora', decoStrength: 65 } },

  { key: 'center-dust', type: 'hero', label: '中央ぞろえ＋光の粒',
    about: '細かい粒がゆっくり昇る。静かに動かしたいとき。',
    props: { layout: 'center', deco: 'dust', decoStrength: 55 } },

  { key: 'cover-cursor', type: 'hero', label: '写真いっぱい＋追従する丸',
    about: 'ポインタを追う丸の中だけ、文字が反転して見える。',
    props: { layout: 'cover', deco: 'cursor', decoStrength: 60, decoLabel: 'SCROLL' } },

  { key: 'scroll-zoomout', type: 'hero', label: '写真いっぱい → 縮んで枠に収まる',
    about: '全画面の写真が、スクロールにつれて枠の中に収まっていく。',
    props: { layout: 'cover', scroll: 'zoomout', scrollLen: 200 } },

  { key: 'scroll-parallax', type: 'hero', label: '写真と文字がずれて流れる',
    about: '写真がゆっくり、文字が速く動いて奥行きが出る。',
    props: { layout: 'cover', scroll: 'parallax', scrollLen: 200 } },

  { key: 'scroll-curtain', type: 'hero', label: '上下の幕が開いて写真が出る',
    about: 'スクロールに合わせて幕が開く。',
    props: { layout: 'cover', scroll: 'curtain', scrollLen: 200 } },

  { key: 'scroll-maskzoom', type: 'hero', label: '文字の中から写真が広がる',
    about: '文字の内側から写真が広がって全画面になる。いちばん派手。',
    props: { layout: 'cover', scroll: 'maskzoom', scrollLen: 240 } },

  { key: 'collage', type: 'collage', label: '写真を敷き詰める＋縦書きの帯',
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
  { key: 'about-left', type: 'about', group: '写真', label: '写真 左 ／ 文章 右',
    about: '写真1枚に説明を添える。店や会社の紹介に。',
    props: { reverse: false } },

  { key: 'about-right', type: 'about', group: '写真', label: '写真 右 ／ 文章 左',
    about: '左右ちがい。上と続けて使うと交互になって流れが出る。',
    props: { reverse: true } },

  { key: 'gallery', type: 'gallery', group: '写真', label: '写真を格子に並べる',
    about: '同じ大きさの枠に敷き詰める。ギャラリー。', props: {} },

  { key: 'hscroll', type: 'hscroll', group: '写真', label: '写真を横一列（横に流れる）',
    about: '縦に読むと横に流れる。作品や事例を並べるとき。', props: {} },

  { key: 'collage-mid', type: 'collage', group: '写真', label: '写真を敷き詰めた帯',
    about: '大小の写真を隙間なく敷く。途中に挟んでも効く。', props: {} },

  { key: 'video', type: 'video', group: '写真', label: '動画を1つ置く',
    about: 'YouTube・Vimeo・動画ファイルのURLを貼るだけ。形も土台も写真と同じように使える。',
    props: {} },

  { key: 'clipreveal', type: 'clipreveal', group: '写真', label: '写真が円で切り替わる',
    about: '円が広がって次の写真に入れ替わる。', props: {} },

  /* ============ 横に並べる（カード） ============ */
  { key: 'features-icon', type: 'features', group: 'カード', label: 'カード3つ（絵柄つき）',
    about: 'いちばん使う形。伝えたいことを3つに分ける。',
    props: { style: 'icon', cols: 'c3' } },

  { key: 'features-num', type: 'features', group: 'カード', label: 'カード3つ（1・2・3）',
    about: '番号が大きく出る。順番に意味があるとき。',
    props: { style: 'num', cols: 'c3' } },

  { key: 'features-paren', type: 'features', group: 'カード', label: 'カード2つ（( 01 ) つき）',
    about: '番号を控えめに置く形。落ち着いて見える。',
    props: { style: 'paren', cols: 'c2' } },

  { key: 'features-image', type: 'features', group: 'カード', label: 'カード3つ（写真つき）',
    about: '上に写真、下に説明。事例や商品を並べるとき。',
    props: { style: 'image', cols: 'c3' } },

  { key: 'pricing', type: 'pricing', group: 'カード', label: 'カード3つ（値段つき・中央を強調）',
    about: '真ん中だけ目立たせる形。', props: { cols: 'c3' } },

  { key: 'stackcards', type: 'stackcards', group: 'カード', label: 'カードが重なっていく',
    about: 'スクロールで手前に積み上がる。順に見せたいとき。', props: {} },

  { key: 'carousel3d', type: 'carousel3d', group: 'カード', label: 'カードが円をえがいてまわる',
    about: '奥行きのある並び。写真が多いとき。', props: {} },

  /* ============ 縦に並べる（一覧） ============ */
  { key: 'menu', type: 'menu', group: '一覧', label: '名前と値段の一覧',
    about: '左に品名、右に値段。お品書き・メニュー表に。', props: {} },

  { key: 'news', type: 'news', group: '一覧', label: '日付つきの一覧',
    about: '日付と見出しが縦に並ぶ。お知らせや予定に。', props: {} },

  { key: 'faq', type: 'faq', group: '一覧', label: '押すと開く一覧',
    about: '見出しだけ並べて、押すと答えが出る。長い説明をたたむとき。', props: {} },

  { key: 'floors', type: 'floors', group: '一覧', label: '段ごとの一覧（フロア案内）',
    about: '階数と内容を縦に並べる。', props: {} },

  { key: 'timeline', type: 'timeline', group: '一覧', label: '縦線でつながる一覧',
    about: '線が伸びながら項目が現れる。沿革や流れに。', props: {} },

  { key: 'slotstats', type: 'slotstats', group: '一覧', label: '大きな数字を3つ',
    about: '画面に入ると数字が回って止まる。実績を出すとき。',
    props: { cols: 'c3' } },

  { key: 'svgdraw', type: 'svgdraw', group: '一覧', label: '折れ線グラフ',
    about: '線がその場で描かれる。数字の変化を見せるとき。', props: {} },

  /* ============ 文章・帯 ============ */
  { key: 'rich', type: 'rich', group: '文章', label: '文章だけ',
    about: '決まった形に収まらない文章を置く欄。', props: {} },

  { key: 'shift', type: 'shift', group: '文章', label: '画面いっぱいに1行',
    about: '大きな文字を1行だけ置いて、間を作る。', props: {} },

  { key: 'marquee', type: 'marquee', group: '文章', label: '横に流れる大きな文字',
    about: '文字が横に流れ続ける帯。区切りに置く。',
    props: { bg: 'primary' } },

  { key: 'cta', type: 'cta', group: '文章', label: '色を敷いた帯＋ボタン',
    about: '次にしてほしいことを1つだけ置く。予約や電話に。',
    props: { bg: 'primary' } },

  /* ============ その他 ============ */
  { key: 'contact', type: 'contact', group: 'その他', label: '入力フォーム',
    about: '名前・連絡先・本文と送信ボタン。送信先はあとで設定する。', props: {} },

  { key: 'slides', type: 'slides', group: 'その他', label: '1画面ずつめくる',
    about: '資料のように、1枚ずつ切り替わる。', props: {} },

  { key: 'product3d', type: 'product3d', group: 'その他', label: '立体の品物がまわる',
    about: 'スクロールで向きが変わる。物を売るとき。', props: {} },

  { key: 'exploded', type: 'exploded', group: 'その他', label: 'ばらけた層が組み上がる',
    about: '重なって1つになる図。中身や工程を見せるとき。', props: {} },
];

/* ---------------- いちばん下（フッター） ----------------
   ヒーロー・ブロックとは別の型として持つ。1ページに1つしか無く、
   選ぶと差し替えではなく、いまのフッターの見た目だけが変わる。 */
const FOOTER_PRESETS = [
  { key: 'ftr-bar', type: 'footer', label: '1行（左に名前・右にリンク）',
    about: 'いちばん素直な形。どのページにも合う。',
    props: { style: 'bar' } },

  { key: 'ftr-center', type: 'footer', label: '中央ぞろえ',
    about: '名前・リンク・年を縦に真ん中で。静かに終わる。',
    props: { style: 'center' } },

  { key: 'ftr-big', type: 'footer', label: '大きめ（ひとこと＋リンク）',
    about: '左にお店の一言、右にリンクを縦に並べる。住所や営業時間もここに。',
    props: { style: 'big', text: '月〜金 10:00–19:00／土 10:00–17:00\n東京都〇〇区〇〇 1-2-3' } },

  { key: 'ftr-light', type: 'footer', label: '明るい地',
    about: '濃い地ではなく、薄い地に線を1本。全体を軽く見せたいとき。',
    props: { style: 'light' } },

  { key: 'ftr-cta', type: 'footer', label: '最後にひと押し',
    about: '最後にもう一度、してほしいことを置く。予約や問い合わせに。',
    props: { style: 'cta', text: 'ご相談はいつでもどうぞ。', cta: 'お問い合わせ', ctaHref: '#contact' } },

  { key: 'ftr-minimal', type: 'footer', label: 'ひとことだけ',
    about: '名前と年だけの細い帯。中身で見せたいとき。',
    props: { style: 'minimal' } },
];
