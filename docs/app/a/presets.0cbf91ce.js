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

  { key: 'split', type: 'hero', label: '左右ならび',
    about: '文章と写真を同じ重さで見せる。',
    props: { layout: 'split' } },

  { key: 'cover', type: 'hero', label: '写真いっぱい',
    about: '写真の力で見せる。文字は写真の上に乗る。',
    props: { layout: 'cover' } },

  { key: 'cover-glass', type: 'hero', label: '写真いっぱい＋ガラス玉',
    about: 'ポインタに追いてガラスの円が動く。指の環境では自動で止まる。',
    props: { layout: 'cover', deco: 'glass', decoStrength: 70 } },

  { key: 'center-clouds', type: 'hero', label: '中央＋ただよう色',
    about: 'やわらかい色のかたまりがゆっくり漂う。',
    props: { layout: 'center', deco: 'clouds', decoStrength: 60 } },

  { key: 'center-aurora', type: 'hero', label: '中央＋光の帯',
    about: '背後で光の帯がゆっくり流れる。暗い配色と相性がいい。',
    props: { layout: 'center', deco: 'aurora', decoStrength: 65 } },

  { key: 'center-dust', type: 'hero', label: '中央＋光の粒',
    about: '細かい粒がゆっくり昇る。静かに動かしたいとき。',
    props: { layout: 'center', deco: 'dust', decoStrength: 55 } },

  { key: 'cover-cursor', type: 'hero', label: '写真いっぱい＋追う丸',
    about: 'ポインタを追う丸の中だけ、文字が反転して見える。',
    props: { layout: 'cover', deco: 'cursor', decoStrength: 60, decoLabel: 'SCROLL' } },

  { key: 'scroll-zoomout', type: 'hero', label: 'スクロール：引いていく',
    about: '全画面の写真が、スクロールにつれて枠の中に収まっていく。',
    props: { layout: 'cover', scroll: 'zoomout', scrollLen: 200 } },

  { key: 'scroll-parallax', type: 'hero', label: 'スクロール：奥行き',
    about: '写真がゆっくり、文字が速く動いて奥行きが出る。',
    props: { layout: 'cover', scroll: 'parallax', scrollLen: 200 } },

  { key: 'scroll-curtain', type: 'hero', label: 'スクロール：幕が開く',
    about: 'スクロールに合わせて幕が開く。',
    props: { layout: 'cover', scroll: 'curtain', scrollLen: 200 } },

  { key: 'scroll-maskzoom', type: 'hero', label: 'スクロール：文字から広がる',
    about: '文字の内側から写真が広がって全画面になる。いちばん派手。',
    props: { layout: 'cover', scroll: 'maskzoom', scrollLen: 240 } },

  /* ---- 写真を、四角ではない形に抜く型。
         抜き型そのものは前からあったが、「写真の形」を開いて選ばないと
         出てこなかった。顔の一覧に並べておかないと、あることに気づけない。
         形が効くのは写真を枠に入れる並び（cover では効かない）。 ---- */
  { key: 'shape-dots', type: 'hero', label: '形：丸つなぎ',
    about: '丸がつながった格子で写真を抜く。やわらかい印象。カフェや教室に。',
    props: { layout: 'split', shape: 'dots', shapeBg: 'blur', bgBlur: 80 } },

  { key: 'shape-bars', type: 'hero', label: '形：ななめ帯',
    about: '斜めの帯で写真を抜く。勢いが出る。ジムや工務店に。',
    props: { layout: 'split', shape: 'bars', shapeBg: 'blur', bgBlur: 80 } },

  { key: 'shape-wavebar', type: 'hero', label: '形：波の棒',
    about: '縦の棒が波打つ形で写真を抜く。音や律動を思わせる。',
    props: { layout: 'split', shape: 'wavebar', shapeBg: 'blur', bgBlur: 80 } },

  /* ---- 単色の土台に、同じ色のシェイプを1つ。写真を使わず、影だけで
         立体感を出す。ミニマルで質感のある顔。写真がまだ無い人にも強い。 ---- */
  { key: 'emboss-tile', type: 'hero', label: '単色：浮くタイル',
    about: '単色の土台に、同じ色の角丸タイルを1枚。くっきりした影で、そこだけ浮き上がって見える。写真いらずで質感が出る。',
    props: { layout: 'emboss', bg: 'surface', embShape: 'squircle' } },

  { key: 'emboss-circle', type: 'hero', label: '単色：浮く円',
    about: '濃い単色の土台に、同じ色の円をひとつ。短い一言を、まん中で強く見せたいときに。',
    props: { layout: 'emboss', bg: 'dark', embShape: 'circle' } },

  { key: 'collage', type: 'collage', label: 'コラージュ',
    about: '敷き詰めた写真に、斜めの写真と縦書きの帯を重ねる。',
    props: {} },

  /* 下の縁を、まっすぐ切らずに流し込む型。縁だけが違うと5枚とも
     同じ絵に見えるので、地の色と並べかたもそれぞれ変えてある。 */
  { key: 'melt-flow', type: 'hero', label: '曲線：ゆるやか',
    about: '色の面が、ゆるやかな1本の曲がりで下と分かれる。いちばん素直。',
    props: { layout: 'center', bg: 'primary', melt: 'flow' } },

  { key: 'melt-slope', type: 'hero', label: '曲線：斜め上がり',
    about: '左が深く、右へ上がっていく縁。写真を右に置くときに。',
    props: { layout: 'split', bg: 'surface', melt: 'slope' } },

  { key: 'melt-swell', type: 'hero', label: '曲線：ふくらみ',
    about: '真ん中が大きくふくらむ縁。文字を真ん中に置くときに。',
    props: { layout: 'center', bg: 'dark', melt: 'swell' } },

  { key: 'melt-drip', type: 'hero', label: '曲線：したたり',
    about: 'ゆるい縁から、3つだけ大きく垂れる。',
    props: { layout: 'left', bg: 'primary', melt: 'drip' } },

  { key: 'melt-photo', type: 'hero', label: '曲線：写真を切る',
    about: '写真いっぱいの下を、曲がった縁で切り取る。',
    props: { layout: 'cover', melt: 'flow', overlay: 45 } },

  /* ---- 動画・色の面・線。ヒーローはページの質を左右するので、
         組ませるのではなく、出来上がった形から選んでもらう ---- */
  { key: 'ribbon', type: 'hero', label: '縦帯＋動画',
    about: '後ろに動画か写真、薄い色の膜、縦に通る1本の帯。帯は下の段まで続いて見える。',
    props: {
      layout: 'ribbon', overlay: 58, scrollLabel: 'Scroll',
      eyebrow: '', title: 'Making\nGood Taste',
      text: 'ここに、いちばん伝えたいことを数行で。\n改行したところで行が変わります。',
      buttons: [{ label: 'About us', href: '#about', style: 'pill', arrow: true }],
    } },

  { key: 'mark', type: 'hero', label: 'ロゴ抜き',
    about: '地の色をロゴの形に抜いて、その中だけ色がゆっくり流れる。自分のロゴを読み込める。',
    props: {
      layout: 'mark', bg: '', scrollLabel: '',
      eyebrow: 'BOUNDLESS EFFORT, TIMELESS RESULTS.',
      title: 'ここに、\nいちばん強い\nひとこと。',
      text: '創業から85年。地元に根ざした仕事を、これからも。',
      buttons: [],
    } },

  { key: 'lineart', type: 'hero', label: '線の背景',
    about: '細い線を何十本も重ねた気配だけの背景。白い地に、大きな文字を静かに置く。',
    props: {
      layout: 'lineart', art: 'flow', scrollLabel: 'Scroll Down',
      eyebrow: 'Nurturing your future\nwith thoughtful solutions.',
      title: 'あなたの未来を育む、\n一手を考えぬく。',
      text: 'お客さま、さらには世の中全体の課題と向き合い、\nあたりまえの社会を創造する。',
      buttons: [],
    } },

  { key: 'lineart-fan', type: 'hero', label: '線の背景（扇）',
    about: '同じ線の背景で、重なる面のかたち。角のある業種に。',
    props: {
      layout: 'lineart', art: 'fan', scrollLabel: 'Scroll Down',
      eyebrow: '', title: 'ここに、\n静かで強い一文を。',
      text: '線は地の文字色から作るので、配色を変えても浮きません。',
      buttons: [],
    } },

  /* まるく切り抜いた写真が、大きさ違いで漂う型。
     大きな見出しが丸の上を横切って、そこだけ色が変わって見える。 */
  { key: 'orbit', type: 'hero', label: '浮かぶ丸',
    about: 'まるく抜いた写真が、大きさを変えて浮かぶ。大きな見出しが上を横切る。',
    props: {
      layout: 'orbit', bg: '', eyebrow: 'BILLBOARD',
      title: 'ぜんぶそろって、\nひとつの舞台。',
      text: 'その場に立つ人も、支える人も、見に来た人も。\n役がちがうだけで、みんな同じ舞台の上にいます。',
      orbs: [{ src: '' }, { src: '' }, { src: '' }, { src: '' }],
      buttons: [{ label: 'About', href: '#about', style: 'ghost' }],
    } },

  { key: 'orbit-5', type: 'hero', label: '浮かぶ丸（5つ）',
    about: '丸を5つに増やした形。写真が多い業種、にぎやかに見せたいときに。',
    props: {
      layout: 'orbit', bg: 'surface', eyebrow: 'GALLERY',
      title: 'まるい景色',
      text: '写真を5枚まで置けます。大きさと場所は、こちらで決めます。',
      orbs: [{ src: '' }, { src: '' }, { src: '' }, { src: '' }, { src: '' }],
      buttons: [],
    } },

  /* 大きな名前を先に置き、写真をその下へ食い込ませる型。
     名前は写真の外へはみ出したまま残る。 */
  { key: 'poster', type: 'hero', label: 'ポスター',
    about: '名前を大きく置き、ひとまわり内側の写真をその下へ食い込ませる。右わきに縦の欧文。',
    props: {
      layout: 'poster', bg: '', eyebrow: 'TROMBONE / ARRANGER',
      title: '池本 重孝',
      side: 'Ikemoto Shigetaka',
      text: '舞台の上と、その手前と。音のあるところに、だいたい居ます。',
      buttons: [{ label: 'About', href: '#about', style: 'ghost' }],
    } },

  { key: 'poster-shop', type: 'hero', label: 'ポスター（店）',
    about: '同じ組みかたで、店名を大きく。写真は縦長でも横長でも収まる。',
    props: {
      layout: 'poster', bg: 'surface', eyebrow: '', deco: 'grain',
      title: '朝と、\nパンと。',
      side: 'Since 1994',
      text: '毎朝5時に窯を入れます。焼き上がりから並べるので、\n昼すぎには棚が空になることもあります。',
      buttons: [{ label: 'お品書き', href: '#menu', style: 'primary' }],
    } },

  /* 1つの商品だけを立てる型。写真を合成せず、線と色だけで
     光・枝・台を組む。香水・ボトル・器・道具など、形のあるもの向け。 */
  { key: 'showcase', type: 'hero', label: '商品を立てる',
    about: '斜めに差す光、枝の影、載せる台。1つの商品だけを、静かに立てる。',
    props: {
      layout: 'showcase', bg: '', eyebrow: '',
      title: 'BLEU\nATELIER', mid: 'DE',
      text: '香りを決めるのは、最後のひと匙です。\n配合を変えず、同じ手で、同じ量を。',
      notes: 'LIMITED 300 | ATELIER | EAU DE PARFUM',
      buttons: [],
    } },

  { key: 'showcase-buy', type: 'hero', label: '商品を立てる（購入）',
    about: '同じ組みかたで、買うボタンを1つだけ添える。単品の通販ページに。',
    props: {
      layout: 'showcase', bg: '', eyebrow: 'NEW ARRIVAL',
      title: '結（ゆい）', mid: '',
      text: '一日ひとつだけ、窯から出します。',
      notes: '数量限定 | 灯り工房 | 手吹きガラス',
      buttons: [{ label: '買う', href: '#buy', style: 'primary' }],
    } },

  /* 輪の上に写真を置いて、時計回りに送る型。手前の1枚だけがはっきり見え、
     ほかは奥で小さく・ぼやけて・薄くなる。後ろにペンキのひと刷け。 */
  { key: 'reel', type: 'hero', label: '回る写真',
    about: '写真が時計回りに入れ替わる。手前の1枚だけがはっきり、ほかは奥でぼやける。後ろにペンキのひと刷け。',
    props: {
      layout: 'reel', bg: '', eyebrow: 'RECRUIT | NEW GRADUATE',
      title: '感動に、\n挑め。',
      text: '正解のない仕事ばかりです。だからこそ、\nはじめての人にも同じだけ出番があります。',
      shots: [{ src: '' }, { src: '' }, { src: '' }],
      buttons: [{ label: 'エントリー', href: '#entry', style: 'primary' }],
    } },

  { key: 'duo', type: 'hero', label: '写真2枚＋中央文字',
    about: '写真2枚を左右に並べ、その境目に文字を置く。二人・二面・前と後を並べて見せたいときに。',
    props: {
      layout: 'duo', bg: '', eyebrow: '',
      title: '自分を信じて\n成果を出す',
      text: '答えだけを教える塾ではありません。挑戦を続ける自信を育てる。\n迷いも不安も力に変え、次の一歩を自分の意志で踏み出すために。',
      image: '', image2: '',
      buttons: [],
    } },

  { key: 'duo-cta', type: 'hero', label: '写真2枚＋ボタン',
    about: '同じ組みかたに、押してほしいボタンを1つ。二人で受ける店、二部門ある会社に。',
    props: {
      layout: 'duo', bg: '', eyebrow: 'SINCE 1998',
      title: 'ふたりで、\nつくっています。',
      text: 'ひとつずつ手をかけて、同じ味を、同じ手ざわりで。',
      image: '', image2: '',
      buttons: [{ label: 'ご予約はこちら', href: '#contact', style: 'primary' }],
    } },

  { key: 'reel-5', type: 'hero', label: '回る写真（5枚）',
    about: '同じ組みかたで5枚。人が多い会社、作品が多い工房に。',
    props: {
      layout: 'reel', bg: '', eyebrow: 'OUR WORK',
      title: '手が、\nぜんぶ憶えている。',
      text: '同じものを、同じ手で、何度でも。',
      shots: [{ src: '' }, { src: '' }, { src: '' }, { src: '' }, { src: '' }],
      buttons: [],
    } },

  /* パッケージの表側を、そのままページの頭にした型。
     大きな品名、まわりの短い言葉、丸い印、帯のラベル。 */
  { key: 'goods-pack', type: 'hero', label: 'パッケージ',
    about: '商品の顔をそのまま1枚に。品名を大きく、丸い印と帯のラベルを添える。',
    props: {
      layout: 'pack', bg: 'surface', melt: 'flow',
      eyebrow: 'NEW', title: '商品の名前を\n大きく',
      text: 'よみがな・シリーズ名など',
      badge: '砂糖\n不使用', badgeRing: 'NON SWEET', tag: 'こだわりの素材',
      buttons: [{ label: '買えるお店', href: '#shops', style: 'primary' }],
    } },
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
  { key: 'about-left', type: 'about', group: '写真', label: '写真左・文章右',
    about: '写真1枚に説明を添える。店や会社の紹介に。',
    props: { reverse: false } },

  { key: 'about-right', type: 'about', group: '写真', label: '写真右・文章左',
    about: '左右ちがい。上と続けて使うと交互になって流れが出る。',
    props: { reverse: true } },

  { key: 'gallery', type: 'gallery', group: '写真', label: '写真を格子に',
    about: '同じ大きさの枠に敷き詰める。ギャラリー。', props: {} },

  { key: 'hscroll', type: 'hscroll', group: '写真', label: '横に流れる',
    about: '縦に読むと横に流れる。作品や事例を並べるとき。', props: {} },

  { key: 'collage-mid', type: 'collage', group: '写真', label: 'コラージュの帯',
    about: '大小の写真を隙間なく敷く。途中に挟んでも効く。', props: {} },

  { key: 'video', type: 'video', group: '写真', label: '動画',
    about: 'YouTube・Vimeo・動画ファイルのURLを貼るだけ。形も土台も写真と同じように使える。',
    props: {} },

  { key: 'strip', type: 'strip', group: '写真', label: '写真の帯',
    about: '数が多いものを途切れず流す。導入実績・取引先・受賞歴に。写真だけ／カードを選べる。',
    props: {} },

  { key: 'strip-card', type: 'strip', group: '写真', label: '写真の帯（カード）',
    about: '流れる1枚ずつに見出しと説明が付く形。',
    props: { style: 'card', size: 'l' } },

  { key: 'clipreveal', type: 'clipreveal', group: '写真', label: '円で切り替え',
    about: '円が広がって次の写真に入れ替わる。', props: {} },

  /* ============ 横に並べる（カード） ============ */
  { key: 'features-icon', type: 'features', group: 'カード', label: 'カード3つ（アイコン）',
    about: 'いちばん使う形。伝えたいことを3つに分ける。',
    props: { style: 'icon', cols: 'c3' } },

  { key: 'features-num', type: 'features', group: 'カード', label: 'カード3つ（番号）',
    about: '番号が大きく出る。順番に意味があるとき。',
    props: { style: 'num', cols: 'c3' } },

  { key: 'features-paren', type: 'features', group: 'カード', label: 'カード2つ（01）',
    about: '番号を控えめに置く形。落ち着いて見える。',
    props: { style: 'paren', cols: 'c2' } },

  { key: 'features-image', type: 'features', group: 'カード', label: 'カード3つ（写真）',
    about: '上に写真、下に説明。事例や商品を並べるとき。',
    props: { style: 'image', cols: 'c3' } },

  { key: 'icons', type: 'icons', group: 'カード', label: 'アイコンを格子に',
    about: '設備や条件を、絵と短い言葉で並べる。Wi-Fi・駐車場・禁煙など。',
    props: {} },

  { key: 'pricing', type: 'pricing', group: 'カード', label: '料金3つ',
    about: '真ん中だけ目立たせる形。', props: { cols: 'c3' } },

  { key: 'stackcards', type: 'stackcards', group: 'カード', label: '重なるカード',
    about: 'スクロールで手前に積み上がる。順に見せたいとき。', props: {} },

  { key: 'carousel3d', type: 'carousel3d', group: 'カード', label: '回転カルーセル',
    about: '奥行きのある並び。写真が多いとき。', props: {} },

  { key: 'listing', type: 'listing', group: 'カード', label: 'Listing ×2',
    about: '写真・条件・ボタンをひと組で並べる。たくさんの中から1つ選んでもらうものに。',
    props: { cols: 'c2' } },

  { key: 'listing-3', type: 'listing', group: 'カード', label: 'Listing ×3',
    about: '同じ形を3列で。1つあたりを小さく、数を多く見せたいとき。',
    props: { cols: 'c3', btnStyle: 'link' } },

  /* ============ 縦に並べる（一覧） ============ */
  { key: 'menu', type: 'menu', group: '一覧', label: '料金の一覧',
    about: '左に品名、右に値段。お品書き・メニュー表に。', props: {} },

  { key: 'news', type: 'news', group: '一覧', label: '日付つき一覧',
    about: '日付と見出しが縦に並ぶ。お知らせや予定に。', props: {} },

  { key: 'faq', type: 'faq', group: '一覧', label: '押すと開く一覧',
    about: '見出しだけ並べて、押すと答えが出る。長い説明をたたむとき。', props: {} },

  { key: 'floors', type: 'floors', group: '一覧', label: 'フロア案内',
    about: '階数と内容を縦に並べる。', props: {} },

  { key: 'timeline', type: 'timeline', group: '一覧', label: '沿革・流れ',
    about: '線が伸びながら項目が現れる。沿革や流れに。', props: {} },

  { key: 'schedule', type: 'schedule', group: '一覧', label: '週の表',
    about: '縦が時間帯、横が曜日の表。丸と休みで示す。診療時間・営業時間に。',
    props: {} },

  { key: 'schedule-class', type: 'schedule', group: '一覧', label: '週の表（文字）',
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

  { key: 'slotstats', type: 'slotstats', group: '一覧', label: '大きな数字',
    about: '画面に入ると数字が回って止まる。実績を出すとき。',
    props: { cols: 'c3' } },

  { key: 'svgdraw', type: 'svgdraw', group: '一覧', label: '折れ線グラフ',
    about: '線が引かれ、下に同じ色の薄い膜が敷かれる。数字の変化を見せるとき。', props: {} },

  { key: 'svgbar', type: 'svgdraw', group: '一覧', label: '棒グラフ',
    about: '棒が下から立ち上がる。年ごとの比較や内訳に。',
    props: { kind: 'bar', eyebrow: 'RESULT', title: '数字で見る', text: '' } },

  /* ============ 文章・帯 ============ */
  { key: 'rich', type: 'rich', group: '文章', label: '文章',
    about: '決まった形に収まらない文章を置く欄。', props: {} },

  { key: 'shift', type: 'shift', group: '文章', label: '大きな一文',
    about: '大きな文字を1行だけ置いて、間を作る。', props: {} },

  { key: 'marquee', type: 'marquee', group: '文章', label: '流れる文字',
    about: '文字が横に流れ続ける帯。区切りに置く。',
    props: { bg: 'primary' } },

  { key: 'cta', type: 'cta', group: '文章', label: 'ひと押しの帯',
    about: '次にしてほしいことを1つだけ置く。予約や電話に。',
    props: { bg: 'primary' } },

  /* ============ その他 ============ */
  { key: 'contact', type: 'contact', group: 'その他', label: '入力フォーム',
    about: '名前・連絡先・本文と送信ボタン。送信先はあとで設定する。', props: {} },

  { key: 'slides', type: 'slides', group: 'その他', label: 'スライド',
    about: '資料のように、1枚ずつ切り替わる。', props: {} },

  { key: 'product3d', type: 'product3d', group: 'その他', label: '商品を回す',
    about: 'スクロールで向きが変わる。物を売るとき。', props: {} },

  { key: 'exploded', type: 'exploded', group: 'その他', label: '分解して見せる',
    about: '重なって1つになる図。中身や工程を見せるとき。', props: {} },
];

/* ---------------- いちばん下（フッター） ----------------
   ヒーロー・ブロックとは別の型として持つ。1ページに1つしか無く、
   選ぶと差し替えではなく、いまのフッターの見た目だけが変わる。 */
const FOOTER_PRESETS = [
  { key: 'ftr-bar', type: 'footer', label: '横一列',
    about: 'いちばん素直な形。どのページにも合う。',
    props: { style: 'bar' } },

  { key: 'ftr-center', type: 'footer', label: '中央ぞろえ',
    about: '名前・リンク・年を縦に真ん中で。静かに終わる。',
    props: { style: 'center' } },

  { key: 'ftr-big', type: 'footer', label: '大きめ',
    about: '左にお店の一言、右にリンクを縦に並べる。住所や営業時間もここに。',
    props: { style: 'big', text: '月〜金 10:00–19:00／土 10:00–17:00\n東京都〇〇区〇〇 1-2-3' } },

  { key: 'ftr-light', type: 'footer', label: '白地',
    about: '濃い地ではなく、薄い地に線を1本。全体を軽く見せたいとき。',
    props: { style: 'light' } },

  { key: 'ftr-cta', type: 'footer', label: 'ひと押し付き',
    about: '最後にもう一度、してほしいことを置く。予約や問い合わせに。',
    props: { style: 'cta', text: 'ご相談はいつでもどうぞ。', cta: 'お問い合わせ', ctaHref: '#contact' } },

  { key: 'ftr-minimal', type: 'footer', label: '最小',
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
