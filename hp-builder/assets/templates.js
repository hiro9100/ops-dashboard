/* テンプレート定義。
   blocks には各ブロックの「初期値からの上書き分」だけを書く。
   （BLOCKS[type].defaults にマージされる） */

const FONTS = [
  ['gothic', 'ゴシック（標準）', '"Helvetica Neue",Arial,"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif'],
  ['mincho', '明朝（上品・和風）', '"Hiragino Mincho ProN","Yu Mincho",YuMincho,"Noto Serif JP",serif'],
  ['round', '丸ゴシック（やわらかい）', '"Hiragino Maru Gothic ProN","Quicksand",  "Hiragino Sans",Meiryo,sans-serif'],
  ['mono', '等幅（かっこいい）', '"SF Mono",Menlo,Consolas,"Hiragino Sans",monospace'],
];

const fontStack = (key) => (FONTS.find((f) => f[0] === key) || FONTS[0])[2];

const TEMPLATES = {
  /* ============ 1. コーポレート ============ */
  corporate: {
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
};
