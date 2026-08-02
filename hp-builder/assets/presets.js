/* ================================================================
   部分ごとに選んで組むための「型」

   1つの型 = ブロック種別 ＋ 初期値からの差分。
   同じ features でも、アイコン3列と ( 01 ) 形式では別の型として並べる。
   テンプレートが「1ページまるごと」なのに対して、こちらは「1段ずつ」。

   見本は BLOCKS[type].render() で実物を描くので、
   ここに書いた差分がそのまま見た目に出る。
   ================================================================ */

/* ---------------- ヒーロー（1段目） ---------------- */
const HERO_PRESETS = [
  { key: 'center', type: 'hero', label: '中央ぞろえ',
    about: 'いちばん素直な型。文章が主役のとき。',
    props: { layout: 'center' } },

  { key: 'left', type: 'hero', label: '左ぞろえ',
    about: '読み出しが速い。文章が長めのときに。',
    props: { layout: 'left' } },

  { key: 'split', type: 'hero', label: '左右に画像',
    about: '文章と写真を同じ重さで見せる。',
    props: { layout: 'split' } },

  { key: 'cover', type: 'hero', label: '写真いっぱい',
    about: '写真の力で見せる。文字は写真の上に重なる。',
    props: { layout: 'cover' } },

  { key: 'cover-glass', type: 'hero', label: '写真＋すりガラス',
    about: 'ポインタに追いてガラスの円が動く。指の環境では自動で止まる。',
    props: { layout: 'cover', deco: 'glass', decoStrength: 70 } },

  { key: 'center-clouds', type: 'hero', label: 'ふわふわ雲',
    about: 'やわらかい色のかたまりがゆっくり漂う。',
    props: { layout: 'center', deco: 'clouds', decoStrength: 60 } },

  { key: 'center-aurora', type: 'hero', label: 'オーロラ',
    about: '背後で光の帯がゆっくり流れる。暗い配色と相性がいい。',
    props: { layout: 'center', deco: 'aurora', decoStrength: 65 } },

  { key: 'center-dust', type: 'hero', label: '光の粒',
    about: '細かい粒がゆっくり昇る。静かに動かしたいとき。',
    props: { layout: 'center', deco: 'dust', decoStrength: 55 } },

  { key: 'cover-cursor', type: 'hero', label: '写真＋追従する丸',
    about: 'ポインタを追う丸の中だけ、文字が反転して見える。',
    props: { layout: 'cover', deco: 'cursor', decoStrength: 60, decoLabel: 'SCROLL' } },

  { key: 'scroll-zoomout', type: 'hero', label: 'スクロールで写真が縮む',
    about: '全画面の写真が、スクロールにつれて枠の中に収まっていく。',
    props: { layout: 'cover', scroll: 'zoomout', scrollLen: 200 } },

  { key: 'scroll-parallax', type: 'hero', label: '写真と文字がずれて流れる',
    about: '写真がゆっくり、文字が速く動いて奥行きが出る。',
    props: { layout: 'cover', scroll: 'parallax', scrollLen: 200 } },

  { key: 'scroll-curtain', type: 'hero', label: '幕が上下に開く',
    about: 'スクロールに合わせて上下の幕が開き、写真が現れる。',
    props: { layout: 'cover', scroll: 'curtain', scrollLen: 200 } },

  { key: 'scroll-maskzoom', type: 'hero', label: '文字の中から写真が広がる',
    about: '文字の内側から写真が広がって全画面になる。いちばん派手。',
    props: { layout: 'cover', scroll: 'maskzoom', scrollLen: 240 } },

  { key: 'collage', type: 'collage', label: 'コラージュ（縦書き）',
    about: '敷き詰めた写真に、斜めの写真と縦書きの帯を重ねる。',
    props: {} },
];

/* ---------------- 2段目から下 ---------------- */
const SECTION_PRESETS = [
  /* --- 基本 --- */
  { key: 'features-icon', type: 'features', label: '特徴（アイコン3列）',
    about: 'サービスの強みを3つ並べる、いちばん使う型。',
    props: { style: 'icon', cols: 'c3' } },

  { key: 'features-num', type: 'features', label: '特徴（番号つき・手順）',
    about: '順番に意味があるとき。ご利用の流れなどに。',
    props: { style: 'num', cols: 'c3' } },

  { key: 'features-paren', type: 'features', label: '特徴（( 01 ) 形式・2列）',
    about: '番号を控えめに置く型。落ち着いて見える。',
    props: { style: 'paren', cols: 'c2' } },

  { key: 'features-image', type: 'features', label: '特徴（画像つき）',
    about: '写真で見せたいとき。3つの事例紹介などに。',
    props: { style: 'image', cols: 'c3' } },

  { key: 'about-left', type: 'about', label: '紹介（画像が左）',
    about: '写真1枚と文章を並べる。会社紹介や店舗紹介に。',
    props: { reverse: false } },

  { key: 'about-right', type: 'about', label: '紹介（画像が右）',
    about: '同じ型の左右ちがい。続けて使うと交互になって流れが出る。',
    props: { reverse: true } },

  { key: 'gallery', type: 'gallery', label: 'ギャラリー', about: '写真を並べて見せる。', props: {} },
  { key: 'menu', type: 'menu', label: 'お品書き（価格表）',
    about: '品名と値段を並べる。飲食店やサロンに。', props: {} },
  { key: 'floors', type: 'floors', label: 'フロアガイド',
    about: '階ごとの案内。複合施設や商業ビルに。', props: {} },
  { key: 'news', type: 'news', label: 'お知らせ・イベント',
    about: '日付つきの一覧。更新して使う欄。', props: {} },
  { key: 'pricing', type: 'pricing', label: '料金プラン',
    about: '3つ並べて真ん中を目立たせる型。', props: { cols: 'c3' } },
  { key: 'faq', type: 'faq', label: 'よくある質問',
    about: '押すと開く。問い合わせを減らしたいとき。', props: {} },
  { key: 'cta', type: 'cta', label: 'CTA（行動を促す帯）',
    about: '色を敷いて、次にしてほしいことを1つだけ置く。', props: { bg: 'primary' } },
  { key: 'contact', type: 'contact', label: 'お問い合わせ',
    about: '入力欄と送信ボタン。送信先は編集画面で設定する。', props: {} },
  { key: 'rich', type: 'rich', label: '自由テキスト',
    about: '決まった型に収まらない文章を置く欄。', props: {} },
  { key: 'slotstats', type: 'slotstats', label: '数字カウンター',
    about: '画面に入ると数字が回って止まる。実績を出すとき。', props: { cols: 'c3' } },

  /* --- スクロール連動 --- */
  { key: 'hscroll', type: 'hscroll', label: '横に流れるギャラリー',
    about: '縦に読むと横に流れる。作品や事例を並べるとき。', props: {} },
  { key: 'stackcards', type: 'stackcards', label: '積み重なるカード',
    about: 'カードが手前に重なっていく。話を順に見せるとき。', props: {} },
  { key: 'timeline', type: 'timeline', label: 'タイムライン',
    about: '線が伸びながら項目が現れる。沿革や流れに。', props: {} },
  { key: 'clipreveal', type: 'clipreveal', label: '円形マスクで切り替え',
    about: '円が広がって次の画面に入れ替わる。', props: {} },
  { key: 'slides', type: 'slides', label: 'スライドページ',
    about: '1画面ずつめくる。資料のように見せるとき。', props: {} },

  /* --- 3D・図解 --- */
  { key: 'product3d', type: 'product3d', label: '3D製品ビュー',
    about: 'スクロールで製品がまわる。物を売るとき。', props: {} },
  { key: 'exploded', type: 'exploded', label: '分解図が組み上がる',
    about: 'ばらけた層がスクロールで重なって1つになる。', props: {} },
  { key: 'carousel3d', type: 'carousel3d', label: '3Dカルーセル',
    about: '円をえがいて並んだ面がまわる。', props: {} },
  { key: 'svgdraw', type: 'svgdraw', label: '線が引かれるグラフ',
    about: '折れ線がその場で描かれる。数字の変化を見せるとき。', props: {} },

  /* --- 演出 --- */
  { key: 'marquee', type: 'marquee', label: '流れる文字',
    about: '大きな文字が横に流れ続ける帯。区切りに置く。',
    props: { bg: 'primary' } },
  { key: 'shift', type: 'shift', label: '全画面メッセージ',
    about: '画面いっぱいに1行だけ置いて、間を作る。', props: {} },
  { key: 'collage-mid', type: 'collage', label: 'コラージュ',
    about: '写真を敷き詰めた帯。途中に挟んでも効く。', props: {} },
];
