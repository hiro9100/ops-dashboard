/* テンプレート定義。
   blocks には各ブロックの「初期値からの上書き分」だけを書く。
   （BLOCKS[type].defaults にマージされる） */

/* 書体は、端末に入っているものだけを使う。読み込む書体を足すと
   ネットのつながらないところで崩れるし、書き出したHTMLも重くなる。

   並べる順は「先に欧文の顔、そのあと必ず日本語の顔」。逆にすると、
   Impact のような欧文だけの書体を選んでも、日本語がその手前で
   拾われて何も変わらない。

   4つめは「見出し専用」の印。極太や高コントラストの書体は、
   本文の大きさにすると読めない。本文の欄には出さない。 */
const FONTS = [
  ['gothic', 'ゴシック（標準）', '"Helvetica Neue",Arial,"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif'],
  ['mincho', '明朝（上品・和風）', '"Hiragino Mincho ProN","Yu Mincho",YuMincho,"Noto Serif JP",serif'],
  ['round', '丸ゴシック（やわらかい）', '"Hiragino Maru Gothic ProN","Quicksand",  "Hiragino Sans",Meiryo,sans-serif'],
  ['mono', '等幅（かっこいい）', '"SF Mono",Menlo,Consolas,"Hiragino Sans",monospace'],

  ['geo', '幾何学サンセリフ（すっきり）',
    'Futura,"Futura PT","Century Gothic","Avenir Next",Avenir,"Hiragino Maru Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif'],
  ['humanist', '上品なサンセリフ',
    'Optima,"Gill Sans","Gill Sans MT","Trebuchet MS","Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif'],
  ['serifen', '欧文セリフ（落ち着き）',
    'Georgia,"Times New Roman",Times,"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif'],
  ['slab', 'スラブセリフ（角のある）',
    'Rockwell,"Rockwell Nova","Bookman Old Style",Georgia,"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif'],
  ['ud', '教科書体（読みやすい）',
    '"UD デジタル教科書体 NK-R","Klee One","Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif'],
  ['pop', 'ポップ体（にぎやか）',
    '"HGP創英角ポップ体","Chalkboard SE","Comic Sans MS","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif'],

  /* ここから下は見出し専用 */
  ['impact', 'インパクト（極太・見出し）',
    'Impact,Haettenschweiler,Anton,"Arial Black","Hiragino Kaku Gothic StdN W8","Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif', true],
  ['black', '極太ゴシック（見出し）',
    '"Arial Black","Helvetica Neue",Helvetica,"Hiragino Kaku Gothic StdN W8","Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif', true],
  ['condensed', '細長ゴシック（見出し）',
    '"Arial Narrow",Haettenschweiler,Oswald,"Roboto Condensed","Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif', true],
  ['didone', 'モード誌のセリフ（見出し）',
    'Didot,"Bodoni 72","Bodoni MT","Playfair Display",Georgia,"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif', true],
];

const fontStack = (key) => (FONTS.find((f) => f[0] === key) || FONTS[0])[2];
/* 本文に出してよいものだけ */
const BODY_FONTS = FONTS.filter((f) => !f[3]);

/* ============================================================
   配色パレット
   構成はそのままに、色だけ差し替えるためのもの。
   角の丸み・幅・フォントは今の設定を引き継ぐ。
   ============================================================ */
const PALETTES = [
  { name: '白と黒に赤', desc: '硬派なコーポレート・採用',
    c: { primary:'#e0001b', accent:'#111111', bg:'#ffffff', surface:'#f4f4f4',
         text:'#111111', muted:'#6b6b6b', border:'#d8d8d8', dark:'#111111' } },

  { name: 'トマトと深緑', desc: '暗い青緑にテラコッタ。食・工房',
    c: { primary:'#c94324', accent:'#d0683e', bg:'#1b2d33', surface:'#254447',
         text:'#f2ebe4', muted:'#a3b1ae', border:'#43574b', dark:'#122127' } },

  { name: '水中の青', desc: '深い青。展示・写真・静かなブランド',
    c: { primary:'#486f76', accent:'#244b6d', bg:'#092e3e', surface:'#122931',
         text:'#e6eef0', muted:'#8fa6ac', border:'#1e3d48', dark:'#061f2a' } },

  { name: '濃紺と黄', desc: '製品・イベント。強い訴求',
    c: { primary:'#ffd400', accent:'#4f7cff', bg:'#0b1020', surface:'#141b30',
         text:'#eef2ff', muted:'#93a0c4', border:'#25304e', dark:'#05070f' } },

  { name: '生成りと墨', desc: '和・工芸・ブランド',
    c: { primary:'#a8412c', accent:'#8a7f6d', bg:'#faf7f2', surface:'#f2ece2',
         text:'#1c1a17', muted:'#6d6459', border:'#e0d7c8', dark:'#1c1a17' } },

  { name: '青と橙', desc: '会社・士業。清潔で読みやすい',
    c: { primary:'#2563eb', accent:'#f59e0b', bg:'#ffffff', surface:'#f5f8fc',
         text:'#0f172a', muted:'#64748b', border:'#e3e9f0', dark:'#0f172a' } },

  { name: 'コーヒーとミルク', desc: 'カフェ・小さなお店',
    c: { primary:'#b4693b', accent:'#5c7a5c', bg:'#fffdfa', surface:'#f7f0e6',
         text:'#3a2f26', muted:'#7d6d5f', border:'#e8ddcf', dark:'#3a2f26' } },

  { name: '黒とシアン', desc: 'クリエイター・テック',
    c: { primary:'#22d3ee', accent:'#f472b6', bg:'#0b0f14', surface:'#12181f',
         text:'#e8edf2', muted:'#93a1b1', border:'#212b36', dark:'#05080b' } },

  { name: '墨と金', desc: '和モダン・高級感',
    c: { primary:'#c9a227', accent:'#e8d9a8', bg:'#0d0d0f', surface:'#16161a',
         text:'#f2efe6', muted:'#9a978d', border:'#2a2a30', dark:'#08080a' } },

  { name: '淡い緑', desc: 'クリニック・サロン。安心感',
    c: { primary:'#2f9e8f', accent:'#88ccbf', bg:'#ffffff', surface:'#f1f8f6',
         text:'#22352f', muted:'#6c817a', border:'#dcece7', dark:'#22352f' } },

  { name: '白と藍', desc: '和・涼やか。旅館・工芸',
    c: { primary:'#1f3f6e', accent:'#7c9cc4', bg:'#fbfbfa', surface:'#eef1f5',
         text:'#16223a', muted:'#5f6d84', border:'#dde3ea', dark:'#16223a' } },

  { name: '灰とライム', desc: 'SaaS・スタートアップ',
    c: { primary:'#84cc16', accent:'#3f6212', bg:'#fafaf9', surface:'#f2f2f0',
         text:'#1c1c1a', muted:'#6b6b66', border:'#e2e2de', dark:'#1c1c1a' } },

  { name: '桜とクリーム', desc: 'サロン・スクール。やわらかい',
    c: { primary:'#d4708a', accent:'#e8b4a0', bg:'#fffbf9', surface:'#fdf1ee',
         text:'#3b2a2e', muted:'#8a7175', border:'#f2ddd8', dark:'#3b2a2e' } },

  { name: '深紫と藤', desc: '美容・ナイト・音楽',
    c: { primary:'#a78bfa', accent:'#f0abfc', bg:'#12101c', surface:'#1c182b',
         text:'#eee9f7', muted:'#9d95b5', border:'#2e2842', dark:'#0a0812' } },
];

const TEMPLATES = {
  /* ============ 採用・コーポレート（白黒＋赤） ============ */
  recruit: {
    name: '採用・コーポレート',
    desc: '白と黒に赤のアクセント。罫線と余白でつくる、硬派で読ませる構え。',
    swatch: ['#e0001b', '#111111', '#ffffff'],
    style: 'mono',
    theme: {
      primary: '#e0001b', accent: '#111111', bg: '#ffffff', surface: '#f4f4f4',
      text: '#111111', muted: '#6b6b6b', border: '#d8d8d8', dark: '#111111',
      radius: 0, max: 1180, font: 'gothic', fontHead: 'gothic',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'NEXT WORKS', cta: 'エントリー', ctaHref: '#contact',
        nav: [
          { label: '私たちについて', href: '#about' },
          { label: '仕事を知る', href: '#features' },
          { label: '数字で見る', href: '#numbers' },
          { label: '選考の流れ', href: '#steps' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'left', eyebrow: 'RECRUIT 2027',
        title: 'その仕事は、\nだれかの日常になる。',
        text: '目立たなくていい。使われ続けるものを、つくる。私たちはそういう会社です。',
        bg: '', anchor: 'top',
        buttons: [{ label: 'エントリーする', href: '#contact', style: 'primary' },
                  { label: '仕事を知る', href: '#features', style: 'ghost' }],
      } },
      { type: 'about', props: {
        eyebrow: 'ABOUT US', title: '「あたりまえ」を\nつくる仕事',
        body: '私たちがつくるものは、店頭で目を引くタイプの製品ではありません。\n\nけれど、毎日どこかで誰かが手に取っています。派手ではないけれど確実に必要とされるもの。そこに手を抜かないことが、この会社のいちばんの誇りです。',
        reverse: true, bg: '', anchor: 'about',
        buttons: [{ label: '会社概要を見る', href: '#', style: 'ghost' }],
      } },
      { type: 'features', props: {
        eyebrow: 'OUR WORK', title: '3つの仕事',
        text: '職種はちがっても、向いている方向は同じです。',
        cols: 'c3', style: 'num', bg: 'surface', anchor: 'features',
        items: [
          { icon: '', title: '企画・開発', text: '使う人の手元を想像するところから始めます。試作と検証をくり返す、地道な仕事です。' },
          { icon: '', title: '営業・提案', text: '売り込むのではなく、課題を一緒に見つけます。長い付き合いになるお客様がほとんどです。' },
          { icon: '', title: '生産・品質', text: '同じものを、同じ品質で。あたりまえを守り続けることがいちばん難しい領域です。' },
        ],
      } },
      { type: 'slotstats', props: {
        eyebrow: 'NUMBERS', title: '数字で見る私たち', text: '', cols: 'c4',
        bg: '', anchor: 'numbers',
        items: [
          { value: '1,240', label: '従業員数' },
          { value: '68', label: '平均年齢に対する若手比率 %' },
          { value: '19.4', label: '平均勤続年数' },
          { value: '92', label: '有給取得率 %' },
        ],
      } },
      { type: 'gallery', props: {
        eyebrow: 'PEOPLE', title: 'はたらく人たち', text: '', bg: 'surface', anchor: 'people',
      } },
      { type: 'timeline', props: {
        eyebrow: 'PROCESS', title: '選考の流れ', text: '',
        bg: '', anchor: 'steps',
        items: [
          { label: 'STEP 01', title: 'エントリー', text: 'フォームからご応募ください。締切は各回の1週間前です。' },
          { label: 'STEP 02', title: '説明会・職場見学', text: 'オンラインと対面の両方をご用意しています。' },
          { label: 'STEP 03', title: '一次面接', text: '現場の社員が担当します。仕事の話を中心にお聞きします。' },
          { label: 'STEP 04', title: '最終面接', text: '役員面接です。逆質問の時間を長めに取っています。' },
          { label: 'STEP 05', title: '内定', text: '内定後も、配属先の社員と話す機会をご用意します。' },
        ],
      } },
      { type: 'faq', props: {
        eyebrow: 'FAQ', title: 'よくある質問', text: '', bg: 'surface', anchor: 'faq',
        items: [
          { q: '文系でも応募できますか？', a: 'できます。企画・営業職は文理を問いません。開発職も、入社後の研修で基礎から学べます。', open: true },
          { q: '配属はどう決まりますか？', a: '本人の希望と適性を見て決めます。内定後の面談で希望を伺い、できる限り反映しています。', open: false },
          { q: '転勤はありますか？', a: '職種によります。生産系は工場所在地が中心、営業系は数年単位の異動があります。', open: false },
        ],
      } },
      { type: 'cta', props: {
        title: 'まずは、話を聞きにきてください。',
        text: '応募を決めていなくてかまいません。説明会だけの参加も歓迎です。',
        bg: 'dark', anchor: '',
        buttons: [{ label: 'エントリーする', href: '#contact', style: 'primary' }],
      } },
      { type: 'contact', props: {
        eyebrow: 'CONTACT', title: 'お問い合わせ',
        text: '採用に関するご質問はこちらから。3営業日以内にご返信します。',
        tel: '03-0000-0000', email: 'recruit@example.com',
        address: '東京都〇〇区〇〇 1-2-3', hours: '平日 9:30 - 18:00',
        form: true, submit: '送信する', bg: '', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: 'NEXT WORKS', copy: '© 2026 NEXT WORKS Inc.',
        links: [{ label: '会社概要', href: '#' }, { label: 'プライバシーポリシー', href: '#' },
                { label: '採用に関するお問い合わせ', href: '#contact' }],
      } },
    ],
  },

  /* ============ ビストロ・レストラン ============ */
  bistro: {
    name: 'ビストロ・レストラン',
    desc: '暗い青緑にテラコッタ。余白と明朝で、料理の写真を静かに見せる。',
    swatch: ['#C94324', '#D0683E', '#1B2D33'],
    style: 'edit',
    theme: {
      primary: '#c94324', accent: '#d0683e', bg: '#1b2d33', surface: '#254447',
      text: '#f2ebe4', muted: '#a3b1ae', border: '#43574b', dark: '#122127',
      radius: 0, max: 1080, font: 'gothic', fontHead: 'mincho',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'TERRA', cta: 'ご予約', ctaHref: '#contact',
        nav: [
          { label: 'お品書き', href: '#menu' },
          { label: '店内', href: '#gallery' },
          { label: '私たちについて', href: '#about' },
          { label: 'ご予約', href: '#contact' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'cover', eyebrow: 'BISTRO TERRA', overlay: 42,
        title: '火と、土と、\n季節のもの。',
        text: '薪窯でゆっくり火を入れた料理を、少しずつ。',
        bg: '', anchor: 'top',
        buttons: [{ label: '席を予約する', href: '#contact', style: 'primary' },
                  { label: 'お品書きを見る', href: '#menu', style: 'ghost' }],
      } },
      { type: 'rich', props: {
        title: '', align: 'center', bg: '', anchor: '',
        body: '毎朝、市場でその日いちばんのものを選びます。\n\nだから献立は決まっていません。届いたものを見てから、火の入れ方を決める。そういう店です。',
      } },
      { type: 'features', props: {
        eyebrow: 'MENU', title: 'お品書き', text: '週替わりでご用意しています。',
        cols: 'c3', style: 'image', bg: 'surface', anchor: 'menu',
        items: [
          { image: '', title: '前菜の盛り合わせ', text: '¥1,800 / 季節の野菜を6〜8種。その日の畑の様子で変わります。' },
          { image: '', title: '薪窯の一皿', text: '¥3,400 / 魚か肉をお選びください。付け合わせはおまかせで。' },
          { image: '', title: 'コース', text: '¥6,800 / 前菜から甘いものまで。2名様から承ります。' },
        ],
      } },
      { type: 'gallery', props: {
        eyebrow: 'GALLERY', title: '店内と、料理', text: '', bg: '', anchor: 'gallery',
      } },
      { type: 'about', props: {
        eyebrow: 'ABOUT', title: '十席だけの\n理由',
        body: 'ひとりで火を見ながら作れるのは、これくらいが限界でした。\n\n手が届く範囲でやると決めてから、料理はよくなったと思います。予約が取りにくいのは申し訳ないのですが、この形は変えないつもりです。',
        reverse: true, bg: 'surface', anchor: 'about',
        buttons: [],
      } },
      { type: 'contact', props: {
        eyebrow: 'RESERVATION', title: 'ご予約・アクセス',
        text: '2日前までにご予約ください。当日席の空きはお電話でご確認いただけます。',
        tel: '03-0000-0000', email: 'hello@example.com',
        address: '東京都〇〇区〇〇 1-8-3', hours: '18:00 - 23:00（日・月 定休）',
        form: true, submit: '予約を申し込む', bg: '', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: 'TERRA', copy: '© 2026 BISTRO TERRA',
        links: [{ label: 'お品書き', href: '#menu' }, { label: 'ご予約', href: '#contact' },
                { label: 'Instagram', href: '#' }],
      } },
    ],
  },

  /* ============ 展示・ギャラリー ============ */
  exhibit: {
    name: '展示・ギャラリー',
    desc: '水中のような深い青。細い罫線と静けさで、作品と会期を伝える。',
    swatch: ['#486F76', '#244B6D', '#092E3E'],
    style: 'mono',
    theme: {
      primary: '#486f76', accent: '#244b6d', bg: '#092e3e', surface: '#122931',
      text: '#e6eef0', muted: '#8fa6ac', border: '#1e3d48', dark: '#061f2a',
      radius: 0, max: 1180, font: 'gothic', fontHead: 'mincho',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'SHIZUKA', cta: 'チケット', ctaHref: '#contact',
        nav: [
          { label: '展示について', href: '#about' },
          { label: '作品', href: '#works' },
          { label: '会期', href: '#steps' },
          { label: 'アクセス', href: '#contact' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'left', eyebrow: 'EXHIBITION 2026',
        title: '沈むひかり、\nのこる音。',
        text: '水の中でだけ起きる出来事を、42点の写真と3つの映像でたどります。',
        bg: '', anchor: 'top',
        buttons: [{ label: 'チケットを買う', href: '#contact', style: 'primary' },
                  { label: '作品を見る', href: '#works', style: 'ghost' }],
      } },
      { type: 'about', props: {
        eyebrow: 'ABOUT', title: '見えないものを、\n見にいく',
        body: '深さ40メートルでは、赤はもう色として届きません。\n\nそこに残るのは青と、わずかな緑だけ。本展はその限られた色域だけで撮られた作品を集めました。目が慣れるまで、少し時間をかけてご覧ください。',
        reverse: false, bg: 'surface', anchor: 'about',
        buttons: [{ label: '作家について', href: '#', style: 'ghost' }],
      } },
      { type: 'hscroll', props: {
        eyebrow: 'WORKS', title: '出展作品', height: 340, bg: '', anchor: 'works',
        items: [
          { no: '01', title: '群れ / 2024', image: '' },
          { no: '02', title: '層 / 2024', image: '' },
          { no: '03', title: '沈黙 / 2025', image: '' },
          { no: '04', title: '呼吸 / 2025', image: '' },
          { no: '05', title: '境界 / 2025', image: '' },
          { no: '06', title: 'のこる音 / 2026', image: '' },
        ],
      } },
      { type: 'slotstats', props: {
        eyebrow: 'NUMBERS', title: '本展について', text: '', cols: 'c3',
        bg: 'surface', anchor: 'numbers',
        items: [
          { value: '42', label: '出展点数' },
          { value: '3', label: '映像作品' },
          { value: '86', label: '会期日数' },
        ],
      } },
      { type: 'timeline', props: {
        eyebrow: 'SCHEDULE', title: '会期とイベント', text: '',
        bg: '', anchor: 'steps',
        items: [
          { label: '04.12 SAT', title: '開幕', text: '11:00 開場。初日のみ作家在廊予定です。' },
          { label: '04.26 SAT', title: 'アーティストトーク', text: '14:00 - 15:30 / 定員40名・要予約' },
          { label: '05.17 SAT', title: '夜間開館', text: '20:00まで開館します。照明を落とした状態でご覧いただけます。' },
          { label: '07.06 SUN', title: '閉幕', text: '17:00 閉場。最終日は混み合います。' },
        ],
      } },
      { type: 'contact', props: {
        eyebrow: 'ACCESS', title: 'アクセス・チケット',
        text: '当日券は会場受付でも購入いただけます。',
        tel: '03-0000-0000', email: 'info@example.com',
        address: '東京都〇〇区〇〇 4-2-1 〇〇美術館 B1', hours: '11:00 - 18:00（火曜休館）',
        form: true, submit: '問い合わせる', bg: 'surface', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: 'SHIZUKA', copy: '© 2026 SHIZUKA Exhibition',
        links: [{ label: '展示について', href: '#about' }, { label: 'アクセス', href: '#contact' },
                { label: '主催者情報', href: '#' }],
      } },
    ],
  },

  /* ============ スライド資料（1スクロール＝1枚） ============ */
  deck: {
    name: 'スライド資料',
    desc: 'スクロール1回で1枚めくる全画面スライド。ダーク×ゴールドで、提案資料のように読ませる。',
    swatch: ['#c9a227', '#e8d9a8', '#0d0d0f'],
    style: '',
    theme: {
      primary: '#c9a227', accent: '#e8d9a8', bg: '#0d0d0f', surface: '#16161a',
      text: '#f2efe6', muted: '#9a978d', border: '#2a2a30', dark: '#08080a',
      radius: 2, max: 1200, font: 'gothic', fontHead: 'mincho',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'AURUM', cta: 'お問い合わせ', ctaHref: '#contact',
        nav: [
          { label: '選ばれる理由', href: '#slides' },
          { label: '実績', href: '#numbers' },
          { label: 'お問い合わせ', href: '#contact' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'center', eyebrow: 'WHY US',
        title: '選ばれるには、\n理由があります。',
        text: 'スクロールしてご覧ください。1回のスクロールで1枚ずつ進みます。',
        bg: 'dark', anchor: 'top',
        buttons: [{ label: '理由を見る', href: '#slides', style: 'primary' }],
      } },
      { type: 'slides', props: {
        bg: 'dark', anchor: 'slides',
        items: [
          { no: '01', title: '速さで、選ばれる。', lead: 'ご相談から公開まで、最短3日。',
            num: '3', suffix: '日', viz: 'bar',
            bullets: '構成案は当日中にお出しします\n修正は2回まで無料\n公開後1ヶ月は無償サポート' },
          { no: '02', title: '数字で、伸ばす。', lead: '公開したあとの改善までが仕事です。',
            num: '182', suffix: '%', viz: 'line',
            bullets: '問い合わせ数の推移を毎月共有\n離脱の多い場所から直す\n施策の効果を数字で確認' },
          { no: '03', title: '長く、使える。', lead: 'ご自身で更新できる形でお渡しします。',
            num: '96', suffix: '%', viz: 'ring',
            bullets: '専門知識がいらないシンプルな構造\n更新方法をレクチャー\n1ファイルで完結' },
        ],
      } },
      { type: 'slotstats', props: {
        eyebrow: 'RESULTS', title: '実績', text: '', cols: 'c3',
        bg: '', anchor: 'numbers',
        items: [
          { value: '480', label: '制作実績' },
          { value: '98%', label: '継続率' },
          { value: '12', label: '受賞歴' },
        ],
      } },
      { type: 'cta', props: {
        title: 'まずは、ご相談ください。', text: '30分のオンライン面談から始めましょう。',
        bg: 'primary', anchor: '',
        buttons: [{ label: '相談する', href: '#contact', style: 'ghost' }],
      } },
      { type: 'contact', props: {
        eyebrow: 'CONTACT', title: 'お問い合わせ',
        text: '2営業日以内にご返信します。',
        tel: '03-0000-0000', email: 'hello@example.com', address: '', hours: '平日 10:00 - 19:00',
        form: true, submit: '送信する', bg: '', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: 'AURUM', copy: '© 2026 AURUM',
        links: [{ label: '会社概要', href: '#' }, { label: 'プライバシーポリシー', href: '#' }],
      } },
    ],
  },

  /* ============ クリニック・サロン ============ */
  clinic: {
    name: 'クリニック・サロン',
    desc: '淡い緑と丸み。やわらかく、安心感のある医療・美容向け。',
    swatch: ['#2f9e8f', '#8fd3c7', '#f2f8f7'],
    style: 'soft',
    theme: {
      primary: '#2f9e8f', accent: '#88ccbf', bg: '#ffffff', surface: '#f1f8f6',
      text: '#22352f', muted: '#6c817a', border: '#dcece7', dark: '#22352f',
      radius: 22, max: 1060, font: 'round', fontHead: 'round',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'みどり内科クリニック', cta: 'ご予約', ctaHref: '#contact',
        nav: [
          { label: '診療案内', href: '#features' },
          { label: '院長紹介', href: '#about' },
          { label: '受診の流れ', href: '#steps' },
          { label: 'アクセス', href: '#contact' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'split', eyebrow: 'MIDORI CLINIC',
        title: 'かかりつけに、\nなれるように。',
        text: '小さな不調こそ、気軽に相談してください。土曜も18時まで診療しています。',
        bg: '', anchor: 'top',
        buttons: [{ label: 'WEBで予約する', href: '#contact', style: 'primary' },
                  { label: '診療案内を見る', href: '#features', style: 'ghost' }],
      } },
      { type: 'features', props: {
        eyebrow: 'MEDICAL', title: '診療案内', text: '内科全般に対応しています。',
        cols: 'c3', style: 'icon', bg: 'surface', anchor: 'features',
        items: [
          { icon: '🩺', title: '一般内科', text: '風邪・発熱・腹痛など、日常のからだの不調全般をみています。' },
          { icon: '💊', title: '生活習慣病', text: '高血圧・糖尿病・脂質異常症。長く付き合う病気だからこそ、無理のない方法を一緒に。' },
          { icon: '🧪', title: '各種健診', text: '特定健診・企業健診に対応。結果はその場でご説明します。' },
        ],
      } },
      { type: 'about', props: {
        eyebrow: 'DOCTOR', title: '院長ごあいさつ',
        body: '大学病院で15年、消化器内科を担当してきました。\n\n病院では診きれなかった「病気になる前」の相談にのりたくて、この場所を開きました。どんな些細なことでも、遠慮なくお話しください。',
        reverse: false, bg: '', anchor: 'about',
        buttons: [],
      } },
      { type: 'timeline', props: {
        eyebrow: 'FLOW', title: '受診の流れ', text: '初めての方も迷わないように。',
        bg: 'surface', anchor: 'steps',
        items: [
          { label: 'STEP 01', title: 'ご予約', text: 'WEBまたはお電話で。当日枠もご用意しています。' },
          { label: 'STEP 02', title: '受付・問診', text: '保険証をご提示ください。問診票は待ち時間に記入いただけます。' },
          { label: 'STEP 03', title: '診察', text: '症状を伺い、必要に応じて検査を行います。' },
          { label: 'STEP 04', title: 'お会計・お薬', text: '院外処方です。近隣の薬局をご案内します。' },
        ],
      } },
      { type: 'faq', props: {
        eyebrow: 'FAQ', title: 'よくあるご質問', text: '', bg: '', anchor: 'faq',
        items: [
          { q: '予約なしでも受診できますか？', a: '可能です。ただし待ち時間が長くなることがあるため、WEB予約をおすすめしています。', open: true },
          { q: '駐車場はありますか？', a: '建物裏に5台分ございます。満車の場合は近隣のコインパーキングをご利用ください。', open: false },
          { q: '子どもも診てもらえますか？', a: '中学生以上を目安に対応しています。小さなお子様は小児科へのご紹介も可能です。', open: false },
        ],
      } },
      { type: 'contact', props: {
        eyebrow: 'ACCESS', title: 'アクセス・ご予約',
        text: '〇〇駅から徒歩5分。土曜も診療しています。',
        tel: '03-0000-0000', email: 'info@example.com',
        address: '東京都〇〇区〇〇 2-4-6', hours: '平日 9:00-18:00 / 土 9:00-18:00（日祝休）',
        form: true, submit: '予約を申し込む', bg: 'surface', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: 'みどり内科クリニック', copy: '© 2026 みどり内科クリニック',
        links: [{ label: '診療案内', href: '#features' }, { label: 'プライバシーポリシー', href: '#' },
                { label: 'アクセス', href: '#contact' }],
      } },
    ],
  },

  /* ============ 製品LP ============ */
  product: {
    name: '製品LP',
    desc: '濃紺に黄色。太い文字と3Dで、1つの製品を強く見せる。',
    swatch: ['#ffd400', '#4f7cff', '#0b1020'],
    style: 'bold',
    theme: {
      primary: '#ffd400', accent: '#4f7cff', bg: '#0b1020', surface: '#141b30',
      text: '#eef2ff', muted: '#93a0c4', border: '#25304e', dark: '#05070f',
      radius: 6, max: 1180, font: 'gothic', fontHead: 'gothic',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'ORBIT One', cta: '購入する', ctaHref: '#pricing',
        nav: [
          { label: '製品を見る', href: '#product' },
          { label: '構造', href: '#structure' },
          { label: 'スペック', href: '#features' },
          { label: '価格', href: '#pricing' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'center', eyebrow: 'NEW',
        title: '軽い。強い。\nずっと使える。',
        text: '削り出しの一体構造。72時間駆動。毎日持ち歩くことを前提に設計しました。',
        bg: 'dark', anchor: 'top',
        buttons: [{ label: '購入する', href: '#pricing', style: 'primary' },
                  { label: '360°で見る', href: '#product', style: 'ghost' }],
      } },
      { type: 'product3d', props: {
        title: 'スクロールで、360°。', text: 'あらゆる角度から確かめてください。',
        shape: 'slab', turns: 1, height: 400, body: '#8f9bbf', face: '#ffd400',
        bg: 'dark', anchor: 'product',
      } },
      { type: 'exploded', props: {
        title: '4つの層で、できている。', text: '素材からすべて自社で設計しました。',
        height: 380, bg: '', anchor: 'structure',
        items: [
          { label: 'DISPLAY', image: '', color: '#ffd400' },
          { label: 'LOGIC BOARD', image: '', color: '#4f7cff' },
          { label: 'BATTERY', image: '', color: '#ff6b8a' },
          { label: 'CHASSIS', image: '', color: '#8f9bbf' },
        ],
      } },
      { type: 'features', props: {
        eyebrow: 'SPEC', title: '主なスペック', text: '',
        cols: 'c4', style: 'icon', bg: 'surface', anchor: 'features',
        items: [
          { icon: '⚡', title: '72時間駆動', text: '一度の充電で3日間。出張でも充電器を持ち歩く必要がありません。' },
          { icon: '🪶', title: '380g', text: 'アルミ削り出しの一体構造。軽さと剛性を両立しました。' },
          { icon: '🛡', title: 'IP68', text: '雨の日も、砂ぼこりの現場でも。安心して外に持ち出せます。' },
          { icon: '🔧', title: '自分で直せる', text: 'バッテリーは工具なしで交換可能。長く使うための設計です。' },
        ],
      } },
      { type: 'slotstats', props: {
        eyebrow: 'NUMBERS', title: '選ばれています', text: '', cols: 'c3',
        bg: '', anchor: 'numbers',
        items: [
          { value: '128,400', label: '累計出荷台数' },
          { value: '4.8', label: 'ユーザー評価' },
          { value: '99.2%', label: '継続利用率' },
        ],
      } },
      { type: 'pricing', props: {
        eyebrow: 'PRICE', title: '価格', text: '送料無料・30日間の返品保証つき。',
        cols: 'c3', bg: 'surface', anchor: 'pricing',
        items: [
          { name: 'Standard', price: '¥49,800', unit: '', features: '本体\n充電ケーブル\n1年保証', btn: '購入する', href: '#', featured: false, tag: '' },
          { name: 'Pro', price: '¥69,800', unit: '', features: '本体\n充電ケーブル\n予備バッテリー\n専用ケース\n3年保証', btn: '購入する', href: '#', featured: true, tag: '人気' },
          { name: 'Business', price: '要相談', unit: '', features: '10台以上のまとめ買い\n請求書払い\n専任サポート', btn: '相談する', href: '#', featured: false, tag: '' },
        ],
      } },
      { type: 'cta', props: {
        title: '30日間、返品無料。', text: 'まず手に取ってから決めてください。',
        bg: 'primary', anchor: '',
        buttons: [{ label: '購入する', href: '#pricing', style: 'ghost' }],
      } },
      { type: 'footer', props: {
        logo: 'ORBIT One', copy: '© 2026 ORBIT Inc.',
        links: [{ label: '特定商取引法に基づく表記', href: '#' }, { label: 'サポート', href: '#' },
                { label: 'プライバシーポリシー', href: '#' }],
      } },
    ],
  },

  /* ============ 商品・パッケージ（淡い色＋曲がった縁） ============
     売っているのが「1つの商品」のとき。棚に並んだパッケージの表側を、
     そのままページの頭にする。品名を大きく、まわりに短い言葉を少しだけ。
     地の色をひと面ぶん敷いて、下の縁をゆるく曲げて白へ渡す。 */
  goods: {
    name: '商品・パッケージ',
    desc: '淡い色の面と曲がった縁。品名を大きく見せる、食品・日用品のページ。',
    swatch: ['#7fb5dd', '#6b4f3a', '#ffffff'],
    style: 'soft',
    theme: {
      primary: '#4f8fc0', accent: '#6b4f3a', bg: '#ffffff', surface: '#a8cfe8',
      text: '#1d2a33', muted: '#5f7484', border: '#dbe6ee', dark: '#1d2a33',
      radius: 18, max: 1180, font: 'round', fontHead: 'round',
    },
    blocks: [
      { type: 'header', props: {
        bar: 'clear', logo: 'NEW TASTE Cafe', cta: '買えるお店', ctaHref: '#shops',
        nav: [
          { label: 'この商品について', href: '#about' },
          { label: 'おいしさの理由', href: '#features' },
          { label: 'ラインナップ', href: '#lineup' },
          { label: 'よくある質問', href: '#faq' },
        ],
      } },
      /* パッケージの表側。品名・よみ・丸い印・帯のラベル、右に商品の写真。
         下の縁はゆるい曲がりで白へ渡す（メルト）。 */
      { type: 'hero', props: {
        layout: 'pack', bg: 'surface', melt: 'flow', anchor: 'top',
        eyebrow: 'CAFFÈ LATTE',
        title: 'ミルクのおいしさ、\nそのままに。',
        text: 'カフェラテ ノンスイート／200ml',
        badge: '砂糖\n不使用', badgeRing: 'NON SWEET',
        tag: 'こだわりのオリジナルブレンド使用',
        buttons: [{ label: '買えるお店をさがす', href: '#shops', style: 'primary' }],
      } },
      { type: 'about', props: {
        eyebrow: 'ABOUT', title: '甘さを足さずに、\nコクだけ残しました。',
        body: '砂糖を入れないと、コーヒーの苦みだけが立ってしまう。そこでミルクの配合を何度も変えて、甘みを足さずにまろやかさが出る一点を探しました。\n\n毎日飲むものだから、飽きないことをいちばん大事にしています。',
        reverse: true, bg: '', anchor: 'about',
      } },
      { type: 'icons', props: {
        eyebrow: 'POINT', title: 'この商品のこと', text: '', cols: 'c4', size: 'm',
        bg: '', anchor: 'point',
        items: [
          { icon: 'ban', label: '砂糖不使用' },
          { icon: 'drink', label: '生乳50%以上' },
          { icon: 'plant', label: '香料無添加' },
          { icon: 'check', label: '紙の容器' },
        ],
      } },
      { type: 'features', props: {
        eyebrow: 'REASON', title: 'おいしさの理由', text: '3つのことだけ、こだわっています。',
        cols: 'c3', style: 'num', bg: 'surface', anchor: 'features',
        items: [
          { icon: '', title: '豆は浅煎りと深煎りを半々', text: '苦みだけが立たないように、2種類をあとから合わせています。香りは浅煎り、コクは深煎りが受け持ちます。' },
          { icon: '', title: '生乳の配合は50%以上', text: '甘みを足さないぶん、ミルクのまろやかさで飲みやすさを出しました。' },
          { icon: '', title: '香料も甘味料も入れない', text: '素材の味だけで組み立てています。だから毎日飲んでも飽きません。' },
        ],
      } },
      { type: 'svgdraw', props: {
        eyebrow: 'TASTE', title: '味わいのバランス', text: '同じシリーズと比べてみました。',
        kind: 'bar', bg: '', anchor: 'taste',
        items: [
          { label: '香り', value: 82, note: '82' },
          { label: 'コク', value: 74, note: '74' },
          { label: '苦み', value: 45, note: '45' },
          { label: '甘さ', value: 12, note: '0' },
        ],
      } },
      { type: 'listing', props: {
        eyebrow: 'LINEUP', title: 'シリーズのラインナップ', text: '',
        cols: 'c3', btn: 'くわしく見る', btnStyle: 'ghost',
        bg: '', anchor: 'lineup',
        items: [
          { image: '', badge: 'NEW', title: 'カフェラテ ノンスイート', price: '希望小売価格 168円',
            meta: '200ml / 乳飲料', note: '砂糖不使用', href: '#' },
          { image: '', badge: '', title: 'カフェラテ', price: '希望小売価格 168円',
            meta: '200ml / 乳飲料', note: 'いちばん定番', href: '#' },
          { image: '', badge: '', title: 'フルーツスムージー', price: '希望小売価格 198円',
            meta: '180ml / 果汁入り飲料', note: '果肉30g入り', href: '#' },
        ],
      } },
      { type: 'menu', props: {
        eyebrow: 'NUTRITION', title: '栄養成分表示', text: '1本（200ml）あたり',
        cols: 'c2', note: '※ 表示値は目安です。', bg: 'surface', anchor: 'nutrition',
        groups: [
          { name: '成分', note: '',
            items: 'エネルギー | | 96kcal\nたんぱく質 | | 6.4g\n脂質 | | 5.2g\n炭水化物 | | 6.1g' },
          { name: 'そのほか', note: '',
            items: '食塩相当量 | | 0.2g\nカルシウム | | 210mg\n原材料 | | 生乳、コーヒー\nアレルギー | | 乳成分' },
        ],
      } },
      { type: 'faq', props: {
        eyebrow: 'FAQ', title: 'よくある質問', text: '', bg: '', anchor: 'faq',
        items: [
          { q: '砂糖不使用なのに甘く感じるのはなぜですか', a: '乳に含まれる糖の甘みです。砂糖・甘味料はいっさい加えていません。' },
          { q: '開けたあとはどのくらい持ちますか', a: '開封後は保存がききません。その日のうちにお飲みください。' },
          { q: '温めて飲めますか', a: '紙容器のままは温められません。カップに移してからお願いします。' },
          { q: 'どこで買えますか', a: '全国のコンビニエンスストア・スーパーで取り扱っています。下の欄からお近くの店をさがせます。' },
        ],
      } },
      { type: 'cta', props: {
        title: 'まず1本、試してみてください。', text: '全国のコンビニ・スーパーで買えます。',
        bg: 'primary', anchor: 'shops',
        buttons: [{ label: '買えるお店をさがす', href: '#', style: 'ghost' }],
      } },
      { type: 'footer', props: {
        style: 'big', logo: 'NEW TASTE Cafe',
        text: 'おいしさを、毎日のものに。\n株式会社ニューテイスト',
        copy: '© 2026 NEW TASTE Inc.',
        links: [{ label: '商品一覧', href: '#lineup' }, { label: 'お問い合わせ', href: '#' },
                { label: 'プライバシーポリシー', href: '#' }],
      } },
    ],
  },

  /* ============ エディトリアル ============ */
  editorial: {
    name: 'エディトリアル',
    desc: '生成りに墨と朱。明朝と余白でつくる、雑誌のような静かな面。',
    swatch: ['#a8412c', '#1c1a17', '#faf7f2'],
    style: 'edit',
    theme: {
      primary: '#a8412c', accent: '#8a7f6d', bg: '#faf7f2', surface: '#f2ece2',
      text: '#1c1a17', muted: '#6d6459', border: '#e0d7c8', dark: '#1c1a17',
      radius: 0, max: 960, font: 'mincho', fontHead: 'mincho',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'KOTOHOGI', cta: '', ctaHref: '',
        nav: [
          { label: 'ものがたり', href: '#about' },
          { label: 'つくるもの', href: '#gallery' },
          { label: 'つかいかた', href: '#features' },
          { label: 'お問い合わせ', href: '#contact' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'center', eyebrow: 'SINCE 1948',
        title: '手のなかに、\n静けさを。',
        text: '奈良の工房から、日々の道具をつくっています。',
        bg: '', anchor: 'top',
        buttons: [{ label: 'つくるものを見る', href: '#gallery', style: 'ghost' }],
      } },
      { type: 'rich', props: {
        title: '', align: 'center', bg: '', anchor: '',
        body: '使い込むほどに色が変わり、手になじんでいく。\n\nそういう道具だけを、少しずつつくっています。年に数回しか窯を焚かないので、数は多くありません。けれど、ひとつひとつに手が届いています。',
      } },
      { type: 'gallery', props: {
        eyebrow: 'WORKS', title: 'つくるもの', text: '', bg: 'surface', anchor: 'gallery',
      } },
      { type: 'about', props: {
        eyebrow: 'STORY', title: '三代、\n同じ土を掘っている',
        body: '初代がこの土地を選んだのは、土がよかったからだと聞いています。\n\n七十年以上たった今も、同じ場所から土を掘り、同じ窯で焼いています。変えていないというより、変える理由が見つからないまま来ました。',
        reverse: true, bg: '', anchor: 'about',
        buttons: [{ label: '工房について', href: '#', style: 'ghost' }],
      } },
      { type: 'features', props: {
        eyebrow: 'CARE', title: 'つかいかた', text: '長くお使いいただくために。',
        cols: 'c3', style: 'num', bg: 'surface', anchor: 'features',
        items: [
          { icon: '', title: 'はじめに', text: 'お使いになる前に、ぬるま湯に30分ほど浸けてください。汚れが染みにくくなります。' },
          { icon: '', title: 'ふだんは', text: '中性洗剤とやわらかいスポンジで。研磨剤の入ったものは避けてください。' },
          { icon: '', title: 'しまうときは', text: 'しっかり乾かしてから。湿ったまま重ねると、においの原因になります。' },
        ],
      } },
      { type: 'contact', props: {
        eyebrow: 'CONTACT', title: 'お問い合わせ',
        text: '在庫や納期のご相談も承ります。',
        tel: '', email: 'hello@example.com',
        address: '奈良県〇〇市〇〇 3-1', hours: '工房見学は要予約',
        form: true, submit: '送信する', bg: '', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: 'KOTOHOGI', copy: '© 2026 KOTOHOGI',
        links: [{ label: '工房について', href: '#about' }, { label: 'お取り扱い店', href: '#' },
                { label: 'お問い合わせ', href: '#contact' }],
      } },
    ],
  },

  /* ============ 1. コーポレート ============ */
  corporate: {
    style: '',
    name: 'コーポレート',
    desc: '会社・士業・BtoBサービス向け。清潔感のある青ベース。',
    swatch: ['#2563eb', '#f59e0b', '#f8fafc'],
    theme: {
      primary: '#2563eb', accent: '#f59e0b', bg: '#ffffff', surface: '#f5f8fc',
      text: '#0f172a', muted: '#64748b', border: '#e3e9f0', dark: '#0f172a',
      radius: 12, max: 1120, font: 'gothic', fontHead: 'gothic',
    },
    blocks: [
      { type: 'header', props: { logo: 'ACME Inc.' } },
      { type: 'hero', props: {
        layout: 'split', eyebrow: 'WEB SOLUTION',
        title: 'ビジネスの成長を、\nテクノロジーで支える。',
        text: '創業から10年、500社以上の課題解決に伴走してきました。まずはお気軽にご相談ください。',
      } },
      { type: 'features', props: {} },
      { type: 'about', props: {} },
      { type: 'pricing', props: {} },
      { type: 'faq', props: {} },
      { type: 'cta', props: {} },
      { type: 'contact', props: {} },
      { type: 'footer', props: { logo: 'ACME Inc.', copy: '© 2026 ACME Inc. All rights reserved.' } },
    ],
  },

  /* ============ 2. ショップ / カフェ ============ */
  shop: {
    style: 'soft',
    name: 'ショップ・カフェ',
    desc: '飲食店やサロン、小さなお店向け。あたたかい色と明朝見出し。',
    swatch: ['#b4693b', '#5c7a5c', '#faf6f0'],
    theme: {
      primary: '#b4693b', accent: '#5c7a5c', bg: '#fffdfa', surface: '#f7f0e6',
      text: '#3a2f26', muted: '#7d6d5f', border: '#e8ddcf', dark: '#3a2f26',
      radius: 20, max: 1080, font: 'gothic', fontHead: 'mincho',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'cafe hinata', sticky: true, cta: 'ご予約',
        nav: [
          { label: 'メニュー', href: '#features' },
          { label: 'お店について', href: '#about' },
          { label: '店内の様子', href: '#gallery' },
          { label: 'アクセス', href: '#contact' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'cover', eyebrow: 'SINCE 2018', overlay: 45,
        title: '陽だまりのような、\n一杯を。',
        text: '自家焙煎の豆と、焼きたてのお菓子。ゆっくり流れる時間をどうぞ。',
        buttons: [{ label: '席を予約する', href: '#contact', style: 'primary' }, { label: 'メニューを見る', href: '#features', style: 'ghost' }],
      } },
      { type: 'features', props: {
        eyebrow: 'MENU', title: 'おすすめ', text: '季節ごとに内容が変わります。',
        style: 'image', cols: 'c3', bg: '',
        items: [
          { image: '', title: '自家焙煎ブレンド', text: '¥550 / 深煎りと浅煎りの2種類をご用意しています。' },
          { image: '', title: '本日のケーキ', text: '¥600 / 毎朝店内で焼き上げる、素朴な味わい。' },
          { image: '', title: 'ランチプレート', text: '¥1,200 / 地元の野菜をたっぷり使った日替わりです。' },
        ],
      } },
      { type: 'about', props: {
        eyebrow: 'ABOUT', title: '小さな町の、小さな喫茶店',
        body: '2018年、古い民家を少しずつ手直しして始めました。\n\n派手さはありませんが、常連さんも一見さんも、同じようにくつろげる場所でありたいと思っています。',
        bg: 'surface',
      } },
      { type: 'gallery', props: { eyebrow: 'GALLERY', title: '店内の様子' } },
      { type: 'contact', props: {
        eyebrow: 'ACCESS', title: 'アクセス・ご予約',
        text: '駐車場は3台分ございます。ご予約はお電話でも承ります。',
        hours: '9:00 - 18:00（水曜定休）', form: true, submit: '予約を申し込む',
      } },
      { type: 'footer', props: { logo: 'cafe hinata', copy: '© 2026 cafe hinata' } },
    ],
  },

  /* ============ 3. ポートフォリオ ============ */
  studio: {
    style: '',
    name: 'ポートフォリオ',
    desc: 'クリエイター・フリーランス向け。黒背景で作品が映える。',
    swatch: ['#e2e8f0', '#22d3ee', '#0b0f14'],
    theme: {
      primary: '#22d3ee', accent: '#f472b6', bg: '#0b0f14', surface: '#12181f',
      text: '#e8edf2', muted: '#93a1b1', border: '#212b36', dark: '#05080b',
      radius: 6, max: 1180, font: 'mono', fontHead: 'mono',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'TARO.', cta: 'Contact',
        nav: [
          { label: 'Works', href: '#gallery' },
          { label: 'About', href: '#about' },
          { label: 'Service', href: '#features' },
          { label: 'Contact', href: '#contact' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'left', eyebrow: 'DESIGNER / DEVELOPER',
        title: 'つくることで、\n伝わる形にする。',
        text: 'グラフィック、Web、映像。ジャンルを横断して「伝わる」を設計しています。',
        buttons: [{ label: 'View Works', href: '#gallery', style: 'primary' }, { label: 'About me', href: '#about', style: 'ghost' }],
      } },
      { type: 'gallery', props: { eyebrow: 'WORKS', title: '制作実績', bg: 'surface' } },
      { type: 'about', props: {
        eyebrow: 'ABOUT', title: 'Taro Yamada',
        body: '1995年生まれ。制作会社を経て2022年に独立しました。\n\n手を動かす前に、まず「誰に何を届けたいのか」を一緒に言葉にするところから始めます。',
        reverse: true, buttons: [{ label: '経歴を見る', href: '#', style: 'ghost' }],
      } },
      { type: 'features', props: {
        eyebrow: 'SERVICE', title: 'できること', text: '', cols: 'c3', style: 'num', bg: 'surface',
        items: [
          { icon: '', title: 'ブランディング', text: 'ロゴ、名刺、パッケージまで一貫して設計します。' },
          { icon: '', title: 'Webサイト制作', text: 'デザインから実装まで、一人で完結できます。' },
          { icon: '', title: '映像・モーション', text: 'SNS用の短尺から、会社紹介まで対応します。' },
        ],
      } },
      { type: 'cta', props: { title: '一緒につくりませんか', text: '小さなご相談でも歓迎です。', bg: 'dark' } },
      { type: 'contact', props: {
        eyebrow: 'CONTACT', title: 'お問い合わせ', text: '3営業日以内にご返信します。',
        tel: '', address: '', hours: '', email: 'hello@taro.design', bg: '',
      } },
      { type: 'footer', props: { logo: 'TARO.', copy: '© 2026 Taro Yamada' } },
    ],
  },

  /* ============ 11. クリエイター・映像制作 ============ */
  creator: {
    style: 'bold',
    name: 'クリエイター・映像制作',
    desc: 'SNS動画・クリエイター事務所・制作会社。黒地に鮮やかな差し色で、数字と実績を前に出す。',
    swatch: ['#ff2e63', '#00d9c0', '#0b0b10'],
    theme: {
      primary: '#ff2e63', accent: '#00d9c0', bg: '#0b0b10', surface: '#15151d',
      text: '#f4f4f7', muted: '#9a9aab', border: '#2a2a36', dark: '#07070b',
      radius: 6, max: 1180, font: 'gothic', fontHead: 'gothic',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'STUDIO NAME', sticky: true, cta: 'ご相談はこちら', ctaHref: '#contact',
        nav: [
          { label: 'できること', href: '#features' },
          { label: '実績', href: '#works' },
          { label: '私たちについて', href: '#about' },
          { label: 'お問い合わせ', href: '#contact' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'cover', eyebrow: 'CREATORS FIRST', overlay: 62, anchor: 'top',
        deco: 'aurora', decoStrength: 70, grain: true,
        scroll: 'zoomout', scrollLen: 190,
        title: 'つくる人が、\n真ん中にいる。',
        text: '企画から撮影・編集・運用まで。数字で伸ばす動画を、チームでつくります。',
        buttons: [
          { label: '実績を見る', href: '#works', style: 'primary' },
          { label: 'ご相談はこちら', href: '#contact', style: 'ghost' },
        ],
        anims: { title: { a: 'maskline' }, text: { a: 'fadeup', d: 260 } },
      } },
      { type: 'slotstats', props: {
        eyebrow: 'NUMBERS', title: '数字で見る私たち',
        text: '数字は入れ替えて使ってください。桁ごとに回って止まります。',
        cols: 'c3', bg: 'surface', anchor: 'numbers',
        items: [
          { value: '41億', label: '累計再生回数' },
          { value: '2,000', label: '制作した動画' },
          { value: '120', label: '担当クリエイター' },
        ],
      } },
      { type: 'features', props: {
        eyebrow: 'WHAT WE DO', title: 'できること',
        text: '企画だけ、編集だけ、といった部分的なご依頼も承ります。',
        cols: 'c3', style: 'num', bg: '', anchor: 'features',
        items: [
          { title: '企画・構成', text: '伸びる型を知っているから、最初の3秒から逆算して組み立てます。' },
          { title: '撮影・編集', text: '縦型に最適化した画作り。テロップ・音・間まで、細かく詰めます。' },
          { title: '運用・分析', text: '出して終わりにしません。数字を見て、次の一本に反映します。' },
        ],
      } },
      { type: 'hscroll', props: {
        eyebrow: 'WORKS', title: '手がけた仕事', height: 360, bg: 'surface', anchor: 'works',
        items: [
          { no: '01', title: 'コスメブランドの立ち上げ', image: '' },
          { no: '02', title: '飲食チェーンの新メニュー', image: '' },
          { no: '03', title: 'アプリのダウンロード獲得', image: '' },
          { no: '04', title: '採用のための会社紹介', image: '' },
          { no: '05', title: 'イベントの当日レポート', image: '' },
        ],
      } },
      { type: 'about', props: {
        eyebrow: 'ABOUT', title: 'つくる人の\n価値を上げる。',
        image: '', reverse: false, bg: '', anchor: 'about',
        body: 'クリエイターが本業として続けられる環境をつくることが、私たちの仕事です。\n\n'
          + '案件の獲得、契約、権利の扱い、税務の相談まで。'
          + '作ることに集中できるよう、まわりのことを引き受けます。\n\n'
          + '一緒に働く仲間も探しています。経験より、面白がれるかどうかを見ています。',
        buttons: [{ label: '採用について', href: '#contact', style: 'ghost' }],
        anims: { image: { a: 'tilt3d' } },
      } },
      { type: 'timeline', props: {
        eyebrow: 'FLOW', title: 'ご依頼から公開まで', text: '', bg: 'surface', anchor: 'steps',
        items: [
          { label: 'STEP 01', title: 'ご相談', text: 'やりたいこと、おおよその予算、期日をお聞かせください。' },
          { label: 'STEP 02', title: 'ご提案', text: '構成案と概算をお出しします。ここまで無料です。' },
          { label: 'STEP 03', title: '撮影・編集', text: '素材をお預かりする形でも、こちらで撮る形でも承ります。' },
          { label: 'STEP 04', title: '公開・運用', text: '数字を見ながら、次の一本を一緒に決めていきます。' },
        ],
      } },
      { type: 'cta', props: {
        title: 'まずは1本、試してみませんか',
        text: '相談だけでも構いません。今の課題をお聞かせください。',
        bg: 'primary', anchor: '',
        buttons: [{ label: 'ご相談はこちら', href: '#contact', style: 'ghost' }],
      } },
      { type: 'contact', props: {
        eyebrow: 'CONTACT', title: 'お問い合わせ',
        text: '2営業日以内にご返信します。',
        tel: '03-0000-0000', email: 'hello@example.com',
        address: '東京都渋谷区〇〇 1-2-3', hours: '平日 10:00 - 19:00',
        form: true, action: '', submit: '送信する', bg: '', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: 'STUDIO NAME',
        links: [
          { label: '実績', href: '#works' },
          { label: '私たちについて', href: '#about' },
          { label: 'お問い合わせ', href: '#contact' },
        ],
        copy: '© 2026 Studio Name',
      } },
    ],
  },

  /* ============ 12. SNS動画・クリエイティブ会社 ============ */
  agency: {
    style: 'bold',
    rules: true,
    name: 'SNS動画・クリエイティブ',
    desc: '縦型動画・広告制作・代理店。淡いグレーに黒と蛍光グリーン。縦の罫線と流れる文字。',
    swatch: ['#00f04b', '#000000', '#f4f4f4'],
    theme: {
      primary: '#00f04b', accent: '#000000', bg: '#f4f4f4', surface: '#ffffff',
      text: '#000000', muted: '#7a7a7a', border: '#d9d9d9', dark: '#000000',
      radius: 6, max: 1240, font: 'gothic', fontHead: 'gothic',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'STUDIO', sticky: true, cta: 'お問い合わせ', ctaHref: '#contact',
        nav: [
          { label: '実績', href: '#works' },
          { label: 'できること', href: '#features' },
          { label: '会社について', href: '#about' },
          { label: '採用', href: '#recruit' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'cover', eyebrow: '', overlay: 58, anchor: 'top',
        deco: 'cursor', decoStrength: 60, decoLabel: 'SCROLL', grain: false,
        scroll: 'parallax', scrollLen: 180,
        title: 'SNS×縦型動画を起点に、\n認知とブランドを伸ばす。',
        text: '企画・制作・運用まで一気通貫。数字で語れるクリエイティブを。',
        buttons: [
          { label: '実績を見る', href: '#works', style: 'primary' },
          { label: 'ご相談はこちら', href: '#contact', style: 'ghost' },
        ],
        anims: { title: { a: 'maskline' }, text: { a: 'fadeup', d: 300 } },
      } },
      { type: 'slotstats', props: {
        eyebrow: 'NUMBERS', title: '', text: '', cols: 'c3', bg: '', anchor: 'numbers',
        items: [
          { value: '41億', label: '累計再生回数' },
          { value: '2,000', label: '制作した動画' },
          { value: '150', label: 'ご一緒した企業' },
        ],
      } },
      { type: 'hscroll', props: {
        eyebrow: 'PROJECTS', title: '手がけた仕事', height: 380, bg: 'surface', anchor: 'works',
        items: [
          { no: '01', title: '飲料ブランドの縦型IP', image: '' },
          { no: '02', title: '航空会社の公式アカウント', image: '' },
          { no: '03', title: '製薬会社の公式アカウント', image: '' },
          { no: '04', title: 'サンプリング施策との連動', image: '' },
          { no: '05', title: 'ショートドラマの企画・制作', image: '' },
        ],
      } },
      { type: 'features', props: {
        eyebrow: 'WHAT WE DO', title: 'できること',
        text: '媒体ごとの型を持っているので、同じ素材でも出し分けができます。',
        cols: 'c3', style: 'num', bg: '', anchor: 'features',
        items: [
          { title: '各SNS媒体', text: '縦型に最適化した企画と編集。媒体ごとの伸び方の違いから逆算します。' },
          { title: 'コマース', text: '見て終わりにしない導線設計。売上まで見て次の一本を決めます。' },
          { title: '屋外広告・イベント', text: '同じ企画を街とイベントまで伸ばし、ひとつの素材で面を取ります。' },
        ],
      } },
      { type: 'marquee', props: {
        text: 'CREATORS FIRST', sep: '✳', speed: 24, dir: 'l', size: 104,
        outline: false, href: '', bg: 'primary', anchor: '',
      } },
      { type: 'about', props: {
        eyebrow: 'ABOUT', title: 'つくる人が、\n真ん中にいる。',
        image: '', reverse: false, bg: 'surface', anchor: 'about',
        body: 'クリエイターが本業として続けられる環境をつくることが、私たちの仕事です。\n\n'
          + '案件の獲得から契約、権利の扱いまで。作ることに集中できるよう、まわりを引き受けます。\n\n'
          + '数字を見ながら、次に何をつくるかを一緒に決めていきます。',
        buttons: [{ label: '会社について', href: '#about', style: 'ghost' }],
        anims: { image: { a: 'wipe' } },
      } },
      { type: 'timeline', props: {
        eyebrow: 'FLOW', title: 'ご依頼から公開まで', text: '', bg: '', anchor: 'steps',
        items: [
          { label: 'STEP 01', title: 'ご相談', text: 'やりたいこと、おおよその予算、期日をお聞かせください。' },
          { label: 'STEP 02', title: 'ご提案', text: '企画案と概算をお出しします。ここまで無料です。' },
          { label: 'STEP 03', title: '制作', text: '撮影から編集まで。途中で方向を変えることもできます。' },
          { label: 'STEP 04', title: '公開・運用', text: '数字を見ながら、次の一本を一緒に決めます。' },
        ],
      } },
      { type: 'marquee', props: {
        text: 'RECRUIT', sep: '/', speed: 30, dir: 'r', size: 116,
        outline: true, href: '#recruit', bg: '', anchor: 'recruit',
      } },
      { type: 'contact', props: {
        eyebrow: 'CONTACT', title: 'お問い合わせ',
        text: '2営業日以内にご返信します。採用のご相談もこちらから。',
        tel: '03-0000-0000', email: 'hello@example.com',
        address: '東京都渋谷区〇〇 1-2-3', hours: '平日 10:00 - 19:00',
        form: true, action: '', submit: '送信する', bg: 'surface', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: 'STUDIO',
        links: [
          { label: '実績', href: '#works' },
          { label: '会社について', href: '#about' },
          { label: '採用', href: '#recruit' },
        ],
        copy: '© 2026 Studio',
      } },
    ],
  },

  /* ============ 13. 解体・建設・職人 ============ */
  demolition: {
    style: 'bold',
    name: '解体・建設・職人',
    desc: '解体・土木・設備。濃い緑から黒に蛍光グリーン。数字と工事の種類を前に出す。',
    swatch: ['#00e01e', '#15421b', '#09170c'],
    theme: {
      primary: '#00e01e', accent: '#15421b', bg: '#09170c', surface: '#131f16',
      text: '#ffffff', muted: '#a9b6ac', border: '#26362a', dark: '#080908',
      radius: 4, max: 1180, font: 'gothic', fontHead: 'gothic',
    },
    blocks: [
      { type: 'header', props: {
        logo: '株式会社〇〇', sticky: true, cta: '無料見積り', ctaHref: '#contact',
        nav: [
          { label: '対応できる工事', href: '#features' },
          { label: '品質へのこだわり', href: '#about' },
          { label: '施工実績', href: '#works' },
          { label: '対応エリア', href: '#area' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'cover', eyebrow: '', overlay: 60, anchor: 'top',
        deco: 'dust', decoStrength: 45, grain: true, scroll: 'parallax', scrollLen: 175,
        title: '解体業界の、\n未来をつくる。',
        text: '近隣への配慮、産廃の適正処理、工期の厳守。当たり前を、当たり前にやりきります。',
        buttons: [
          { label: '無料で見積る', href: '#contact', style: 'primary' },
          { label: '施工実績を見る', href: '#works', style: 'ghost' },
        ],
        anims: { title: { a: 'maskline' }, text: { a: 'fadeup', d: 280 } },
      } },
      { type: 'slotstats', props: {
        eyebrow: 'NUMBERS', title: '数字で見る私たち', text: '', cols: 'c3',
        bg: 'surface', anchor: 'numbers',
        items: [
          { value: '1,200', label: '年間施工件数' },
          { value: '4.8', label: 'クチコミ評価' },
          { value: '138%', label: '売上高 平均成長率' },
        ],
      } },
      { type: 'features', props: {
        eyebrow: 'SERVICE', title: '対応できる工事',
        text: '住宅1棟から工場・プラントまで。一部だけの解体も承ります。',
        cols: 'c3', style: 'num', bg: '', anchor: 'features',
        items: [
          { title: '建物解体工事', text: '木造・鉄骨・RC。近隣への説明から届出まで一式でお引き受けします。' },
          { title: '一部解体・内装解体', text: '使いながらの改修にも対応。営業を止めずに進める段取りを組みます。' },
          { title: '外構・撤去工事', text: 'ブロック塀、カーポート、残置物。小さな工事だけでも構いません。' },
        ],
      } },
      { type: 'about', props: {
        eyebrow: 'QUALITY', title: 'だから選ばれる、\n私たちの解体工事。',
        image: '', reverse: false, bg: 'surface', anchor: 'about',
        body: '解体は、壊すことより「そのあと」が大事だと考えています。\n\n'
          + '近隣へのご挨拶、粉じんと騒音の抑え方、産業廃棄物の分別と行き先の記録。'
          + 'ここを丁寧にやるかどうかで、工事の印象はまるごと変わります。\n\n'
          + '写真つきの日報を毎日お送りし、いま何がどこまで進んでいるかを共有します。',
        buttons: [{ label: '施工実績を見る', href: '#works', style: 'ghost' }],
        anims: { image: { a: 'wipe' } },
      } },
      { type: 'hscroll', props: {
        eyebrow: 'WORKS', title: '施工実績', height: 360, bg: '', anchor: 'works',
        items: [
          { no: '01', title: '木造2階建て 住宅解体', image: '' },
          { no: '02', title: '鉄骨造 倉庫解体', image: '' },
          { no: '03', title: 'テナント内装解体', image: '' },
          { no: '04', title: 'RC造 マンション解体', image: '' },
          { no: '05', title: '外構・ブロック塀撤去', image: '' },
        ],
      } },
      { type: 'news', props: {
        eyebrow: 'NEWS', title: 'お知らせ', text: '',
        more: '一覧を見る', moreHref: '#', bg: 'surface', anchor: 'news',
        items: [
          { date: '2026.07.28', cat: 'お知らせ', title: '夏季休業のご案内', href: '#' },
          { date: '2026.07.10', cat: '実績', title: '大型倉庫の解体工事が完了しました', href: '#' },
          { date: '2026.06.22', cat: '採用', title: '重機オペレーターを募集しています', href: '#' },
        ],
      } },
      { type: 'features', props: {
        eyebrow: 'AREA', title: '対応エリア',
        text: '記載のない地域もご相談ください。近隣であれば伺います。',
        cols: 'c2', style: 'icon', bg: '', anchor: 'area',
        items: [
          { icon: '📍', title: '本社', text: '〇〇県〇〇市〇〇 1-2-3\n東海エリア全域' },
          { icon: '📍', title: '東京営業所', text: '東京都〇〇区〇〇 4-5-6\n関東エリア全域' },
        ],
      } },
      { type: 'cta', props: {
        title: 'お見積りは無料です',
        text: '図面がなくても構いません。写真と住所だけでも概算をお出しします。',
        bg: 'primary', anchor: '',
        buttons: [{ label: '無料で見積る', href: '#contact', style: 'ghost' }],
      } },
      { type: 'contact', props: {
        eyebrow: 'CONTACT', title: 'お問い合わせ',
        text: 'お電話でも承ります。現地調査は無料です。',
        tel: '0120-000-000', email: 'info@example.com',
        address: '〇〇県〇〇市〇〇 1-2-3', hours: '平日 8:00 - 18:00',
        form: true, action: '', submit: '送信する', bg: 'surface', anchor: 'contact',
      } },
      { type: 'footer', props: {
        logo: '株式会社〇〇',
        links: [
          { label: '対応できる工事', href: '#features' },
          { label: '施工実績', href: '#works' },
          { label: 'お問い合わせ', href: '#contact' },
        ],
        copy: '© 2026 〇〇',
      } },
    ],
  },

  /* ============ 14. 複合施設・商業施設 ============ */
  facility: {
    style: 'edit',
    name: '複合施設・商業施設',
    desc: '商業施設・公共施設・ビル。温かい黒に白と金。12カラムの広い余白とフロアガイド。',
    swatch: ['#a9865f', '#242322', '#ffffff'],
    theme: {
      primary: '#a9865f', accent: '#242322', bg: '#ffffff', surface: '#f6f4f1',
      text: '#242322', muted: '#7c7873', border: '#e3dfda', dark: '#242322',
      radius: 2, max: 1320, font: 'gothic', fontHead: 'gothic',
    },
    blocks: [
      { type: 'header', props: {
        logo: 'FACILITY NAME', sticky: true, cta: 'アクセス', ctaHref: '#access',
        nav: [
          { label: 'フロアガイド', href: '#floors' },
          { label: 'イベント', href: '#news' },
          { label: '施設について', href: '#about' },
          { label: 'アクセス', href: '#access' },
        ],
      } },
      { type: 'hero', props: {
        layout: 'cover', eyebrow: '', overlay: 40, anchor: 'top',
        deco: 'silk', decoStrength: 45, grain: false, scroll: 'zoomout', scrollLen: 200,
        title: '海と、木と、風と。',
        text: '港を望む公園に生まれた、カフェとレストラン、そしてイベントの場所。',
        buttons: [
          { label: 'フロアガイド', href: '#floors', style: 'primary' },
          { label: 'アクセス', href: '#access', style: 'ghost' },
        ],
        anims: { title: { a: 'maskline' }, text: { a: 'fadeup', d: 300 } },
      } },
      { type: 'news', props: {
        eyebrow: 'INFORMATION', title: 'お知らせ・イベント', text: '',
        more: '一覧を見る', moreHref: '#', bg: '', anchor: 'news',
        items: [
          { date: '2026.08.10', cat: 'イベント', title: '夏の大盆踊り大会を開催します', href: '#' },
          { date: '2026.08.01', cat: 'イベント', title: '公園ランニングイベント 参加者募集', href: '#' },
          { date: '2026.07.20', cat: 'お知らせ', title: '営業時間変更のお知らせ', href: '#' },
        ],
      } },
      { type: 'floors', props: {
        eyebrow: 'FLOOR GUIDE', title: 'フロアガイド',
        text: '各フロアのご案内です。ベビーカー・車いすでもすべての階に上がれます。',
        bg: 'surface', anchor: 'floors',
        items: [
          { floor: '1F', name: 'カフェ＆ショップ', image: '',
            text: '海を眺めながら過ごせる、開けたフロアです。テイクアウトもできます。' },
          { floor: '2F', name: 'レストラン', image: '',
            text: '地元の食材を使ったコース料理を、テラス席でも。' },
          { floor: '3F', name: 'イベントスペース', image: '',
            text: '展示・マルシェ・ワークショップに。貸し出しも承っています。' },
        ],
      } },
      { type: 'about', props: {
        eyebrow: 'ABOUT', title: '港から、\n街が変わる。',
        image: '', reverse: true, bg: '', anchor: 'about',
        body: 'かつて木材を扱っていた埠頭に、木を使った新しい建物が建ちました。\n\n'
          + '海に向かって開いた広いデッキ、風が抜ける吹き抜け。'
          + '買い物のためだけでなく、ただ座って過ごすためにも来てほしい場所です。\n\n'
          + '週末はマルシェやイベントを開いています。ぜひのぞいてみてください。',
        buttons: [{ label: 'イベントを見る', href: '#news', style: 'ghost' }],
        anims: { image: { a: 'wipe' } },
      } },
      { type: 'gallery', props: {
        eyebrow: 'GALLERY', title: '施設の様子', text: '', bg: 'surface', anchor: 'gallery',
        items: [
          { src: '', alt: 'デッキ' }, { src: '', alt: '吹き抜け' }, { src: '', alt: 'カフェ' },
          { src: '', alt: 'テラス' }, { src: '', alt: '夕景' }, { src: '', alt: 'イベント' },
        ],
      } },
      { type: 'contact', props: {
        eyebrow: 'ACCESS', title: 'アクセス',
        text: '駐車場は台数に限りがあります。公共交通機関でのご来場にご協力ください。',
        tel: '045-000-0000', email: 'info@example.com',
        address: '神奈川県横浜市〇〇区〇〇 1-2-3',
        hours: '11:00 - 21:00（店舗により異なります）',
        form: false, action: '', submit: '送信する', bg: '', anchor: 'access',
      } },
      { type: 'footer', props: {
        logo: 'FACILITY NAME',
        links: [
          { label: 'フロアガイド', href: '#floors' },
          { label: 'イベント', href: '#news' },
          { label: 'アクセス', href: '#access' },
        ],
        copy: '© 2026 Facility Name',
      } },
    ],
  },
};
