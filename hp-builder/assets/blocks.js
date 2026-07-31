/* ブロックの定義。
   1ブロック = { label, icon, fields(編集フォームの項目), defaults(初期値), render(HTML生成) }
   fields を書けば編集フォームは自動で作られる。ブロックを増やしたい時はここに足すだけ。 */

/* ---------- 小さなヘルパ ---------- */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const attr = (name, v) => (v ? ` ${name}="${esc(v)}"` : '');

/* 画像URLがあれば <img>、無ければ何も出さない（ロゴ・背景用） */
const img = (src, alt) => (src ? `<img src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy">` : '');
/* 画像を置く枠。未設定なら「IMAGE」のプレースホルダを出す */
const media = (src, alt) => (src ? img(src, alt) : '<span class="ph" aria-hidden="true"></span>');

/* セクションの外枠 */
function sec(type, p, inner, extraClass = '') {
  const cls = ['sec', `sec-${type}`, p.bg ? `bg-${p.bg}` : '', extraClass].filter(Boolean).join(' ');
  return `<section class="${cls}"${attr('id', p.anchor)}>\n  <div class="wrap">\n${inner}\n  </div>\n</section>`;
}

/* 見出しブロック（アイキャッチ・タイトル・サブ） */
function head(p, align = 'center') {
  if (!p.eyebrow && !p.title && !p.text) return '';
  return `    <div class="sec-head${align === 'left' ? ' left' : ''}">
${p.eyebrow ? `      <span class="eyebrow">${esc(p.eyebrow)}</span>\n` : ''}${p.title ? `      <h2 class="sec-title" data-ta>${nl2br(p.title)}</h2>\n` : ''}${p.text ? `      <p class="sec-sub">${nl2br(p.text)}</p>\n` : ''}    </div>`;
}

/* ボタン群 */
function buttons(list, extraClass = '') {
  if (!list || !list.length) return '';
  const items = list
    .filter((b) => b.label)
    .map((b) => `      <a class="btn${b.style && b.style !== 'primary' ? ' ' + b.style : ''}" href="${esc(b.href || '#')}">${esc(b.label)}</a>`)
    .join('\n');
  return items ? `    <div class="btn-row ${extraClass}">\n${items}\n    </div>` : '';
}

/* 文字アニメーションの一覧（サイト側CSSの ta-* と対応） */
const TEXT_ANIMS = [
  ['none', 'なし'],
  ['fadeup', 'フェードアップ'],
  ['maskline', '行マスクせり上げ'],
  ['blur', 'ぼかし解除'],
  ['flip3d', '3Dフリップ'],
  ['drop', '回転して落ちる'],
  ['bounce', '弾む'],
  ['slidealt', '左右交互スライド'],
  ['scatter', '散らばりから集合'],
  ['neon', 'ネオン点灯'],
  ['fillgrad', 'グラデーションで塗る'],
  ['scramble', 'スクランブル'],
  ['type', 'タイプライター'],
];
const TEXT_ANIMS_WITH_DEFAULT = [['', '全体設定に従う']].concat(TEXT_ANIMS);

/* よく使う共通フィールド */
const FIELD = {
  bg: {
    key: 'bg', label: '背景色', type: 'select',
    options: [['', '標準'], ['surface', '薄いグレー'], ['primary', 'メインカラー'], ['dark', 'ダーク']],
  },
  anchor: { key: 'anchor', label: 'アンカーID', type: 'text', hint: 'メニューから #about のようにリンクできます' },
  eyebrow: { key: 'eyebrow', label: '小見出し', type: 'text' },
  title: { key: 'title', label: '見出し', type: 'text' },
  text: { key: 'text', label: '説明文', type: 'textarea' },
  cols: {
    key: 'cols', label: '横に並べる数', type: 'select',
    options: [['c2', '2列'], ['c3', '3列'], ['c4', '4列']],
  },
  btnItem: [
    { key: 'label', label: 'ボタン文字', type: 'text' },
    { key: 'href', label: 'リンク先', type: 'text' },
    { key: 'style', label: '見た目', type: 'select', options: [['primary', 'メイン'], ['ghost', '枠線'], ['accent', 'アクセント']] },
  ],
};

/* ============================================================
   ブロック本体
   ============================================================ */
const BLOCKS = {
  /* ---------------- ヘッダー ---------------- */
  header: {
    label: 'ヘッダー',
    icon: '▤',
    unique: true, // 1ページに1つだけ
    fields: [
      { key: 'logo', label: 'サイト名 / ロゴ文字', type: 'text' },
      { key: 'logoImage', label: 'ロゴ画像URL（任意）', type: 'image' },
      { key: 'sticky', label: 'スクロールしても上に固定', type: 'toggle' },
      { key: 'nav', label: 'メニュー', type: 'list', addLabel: 'メニューを追加',
        titleKey: 'label',
        item: [
          { key: 'label', label: '表示名', type: 'text' },
          { key: 'href', label: 'リンク先', type: 'text' },
        ] },
      { key: 'cta', label: 'ボタン文字（空でボタン無し）', type: 'text' },
      { key: 'ctaHref', label: 'ボタンのリンク先', type: 'text' },
    ],
    defaults: {
      logo: 'YOUR LOGO', logoImage: '', sticky: true,
      nav: [
        { label: 'サービス', href: '#features' },
        { label: '私たちについて', href: '#about' },
        { label: '料金', href: '#pricing' },
        { label: 'お問い合わせ', href: '#contact' },
      ],
      cta: 'お問い合わせ', ctaHref: '#contact',
    },
    render: (p) => `<header class="hdr${p.sticky ? ' sticky' : ''}">
  <div class="wrap hdr-in">
    <a class="logo" href="#">${p.logoImage ? img(p.logoImage, p.logo) : ''}${esc(p.logo)}</a>
    <nav class="nav">${(p.nav || []).filter((n) => n.label).map((n) => `<a href="${esc(n.href || '#')}">${esc(n.label)}</a>`).join('')}</nav>
    ${p.cta ? `<a class="btn sm" href="${esc(p.ctaHref || '#')}">${esc(p.cta)}</a>` : ''}
    <button class="hdr-toggle" aria-label="メニュー">☰</button>
  </div>
</header>`,
  },

  /* ---------------- ヒーロー ---------------- */
  hero: {
    label: 'ヒーロー',
    icon: '★',
    fields: [
      { key: 'layout', label: 'レイアウト', type: 'select',
        options: [['center', '中央ぞろえ'], ['left', '左ぞろえ'], ['split', '左右に画像'], ['cover', '背景画像いっぱい']] },
      FIELD.eyebrow,
      { key: 'title', label: 'キャッチコピー', type: 'text' },
      { key: 'text', label: '説明文', type: 'textarea' },
      { key: 'image', label: '画像URL', type: 'image' },
      { key: 'anim', label: 'キャッチコピーの文字アニメ', type: 'select', options: TEXT_ANIMS_WITH_DEFAULT,
        hint: '「全体設定に従う」以外を選ぶと、このブロックだけ別の動きになります' },
      { key: 'overlay', label: '背景画像の暗さ', type: 'range', min: 0, max: 90, suffix: '%',
        showIf: (p) => p.layout === 'cover' },
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      layout: 'center', eyebrow: 'WELCOME',
      title: 'ここにいちばん伝えたい\nキャッチコピーを',
      text: 'サービスの魅力を1〜2行で。訪れた人が「自分に関係ある」と感じる言葉を置きましょう。',
      image: '', anim: '', overlay: 55, bg: '', anchor: 'top',
      buttons: [
        { label: '無料で相談する', href: '#contact', style: 'primary' },
        { label: 'くわしく見る', href: '#features', style: 'ghost' },
      ],
    },
    render: (p) => {
      const cover = p.layout === 'cover';
      const cls = ['hero', cover ? 'cover center' : p.layout, p.bg ? `bg-${p.bg}` : ''].filter(Boolean).join(' ');
      const body = `      ${p.eyebrow ? `<span class="eyebrow">${esc(p.eyebrow)}</span>` : ''}
      ${p.title ? `<h1 class="hero-title" data-ta${attr('data-anim', p.anim)}>${nl2br(p.title)}</h1>` : ''}
      ${p.text ? `<p class="hero-text">${nl2br(p.text)}</p>` : ''}
${buttons(p.buttons)}`;
      const bg = cover
        ? `  <div class="hero-bg" style="--hero-overlay:rgba(15,23,42,${(p.overlay ?? 55) / 100})">${img(p.image, '')}</div>\n`
        : '';
      const inner = p.layout === 'split'
        ? `    <div class="hero-in">
      <div>\n${body}\n      </div>
      <div class="hero-media">${media(p.image, p.title)}</div>
    </div>`
        : `    <div class="hero-in">\n${body}\n    </div>`;
      return `<section class="${cls}"${attr('id', p.anchor)}>
${bg}  <div class="wrap">
${inner}
  </div>
</section>`;
    },
  },

  /* ---------------- 特徴・サービス ---------------- */
  features: {
    label: '特徴・サービス',
    icon: '◆',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text, FIELD.cols,
      { key: 'style', label: 'カードの形式', type: 'select', options: [['icon', 'アイコン'], ['num', '番号（手順）'], ['image', '画像']] },
      { key: 'items', label: '項目', type: 'list', addLabel: '項目を追加', titleKey: 'title',
        item: [
          { key: 'icon', label: 'アイコン（絵文字）', type: 'text' },
          { key: 'image', label: '画像URL', type: 'image' },
          { key: 'title', label: 'タイトル', type: 'text' },
          { key: 'text', label: '説明', type: 'textarea' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FEATURES', title: '選ばれている3つの理由',
      text: '強みを短い言葉で並べると伝わりやすくなります。',
      cols: 'c3', style: 'icon', bg: 'surface', anchor: 'features',
      items: [
        { icon: '⚡', title: 'とにかく速い', text: 'ご相談から最短3日で公開。スピードが必要な場面でもお任せください。' },
        { icon: '🎯', title: '目的に合わせて', text: '集客・採用・ブランディング。ゴールから逆算して設計します。' },
        { icon: '🤝', title: '公開後も伴走', text: '作って終わりにしません。運用のご相談もいつでもどうぞ。' },
      ],
    },
    render: (p) => sec('features', p,
      `${head(p)}
    <div class="grid ${p.cols || 'c3'}">
${(p.items || []).map((it, i) => `      <div class="card">
        ${p.style === 'image' ? `<div class="hero-media" style="aspect-ratio:16/10;margin-bottom:18px">${media(it.image, it.title)}</div>` : ''}
        ${p.style === 'num' ? `<span class="num">${i + 1}</span>` : p.style === 'image' ? '' : `<span class="ic">${esc(it.icon || '◆')}</span>`}
        ${it.title ? `<h3>${esc(it.title)}</h3>` : ''}
        ${it.text ? `<p>${nl2br(it.text)}</p>` : ''}
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- 紹介（画像＋文章） ---------------- */
  about: {
    label: '紹介（画像＋文章）',
    icon: '▧',
    fields: [
      FIELD.eyebrow, FIELD.title,
      { key: 'body', label: '本文', type: 'textarea', rows: 7 },
      { key: 'image', label: '画像URL', type: 'image' },
      { key: 'reverse', label: '画像を右側にする', type: 'toggle' },
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'ABOUT', title: '私たちについて',
      body: 'ここに会社やお店のストーリーを書きます。\n\nどんな想いで始めたのか、どんな人に届けたいのか。事実だけでなく背景を書くと、読み手との距離がぐっと縮まります。',
      image: '', reverse: false, bg: '', anchor: 'about',
      buttons: [{ label: 'もっと読む', href: '#', style: 'ghost' }],
    },
    render: (p) => sec('about', p,
      `    <div class="about-in${p.reverse ? ' rev' : ''}">
      <div class="about-media">${media(p.image, p.title)}</div>
      <div class="about-body">
        ${p.eyebrow ? `<span class="eyebrow">${esc(p.eyebrow)}</span>` : ''}
        ${p.title ? `<h2 class="sec-title" data-ta>${nl2br(p.title)}</h2>` : ''}
        ${(p.body || '').split(/\n{2,}/).filter(Boolean).map((t) => `<p>${nl2br(t)}</p>`).join('\n        ')}
${buttons(p.buttons)}
      </div>
    </div>`),
  },

  /* ---------------- ギャラリー ---------------- */
  gallery: {
    label: 'ギャラリー',
    icon: '▦',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '画像', type: 'list', addLabel: '画像を追加', titleKey: 'alt',
        item: [
          { key: 'src', label: '画像URL', type: 'image' },
          { key: 'alt', label: '説明（代替テキスト）', type: 'text' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'GALLERY', title: 'ギャラリー', text: '',
      bg: '', anchor: 'gallery',
      items: [{ src: '', alt: '写真1' }, { src: '', alt: '写真2' }, { src: '', alt: '写真3' },
        { src: '', alt: '写真4' }, { src: '', alt: '写真5' }, { src: '', alt: '写真6' }],
    },
    render: (p) => sec('gallery', p,
      `${head(p)}
    <div class="gal">
${(p.items || []).map((it) => `      <figure>${media(it.src, it.alt)}</figure>`).join('\n')}
    </div>`),
  },

  /* ---------------- 料金 ---------------- */
  pricing: {
    label: '料金プラン',
    icon: '¥',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text, FIELD.cols,
      { key: 'items', label: 'プラン', type: 'list', addLabel: 'プランを追加', titleKey: 'name',
        item: [
          { key: 'name', label: 'プラン名', type: 'text' },
          { key: 'price', label: '価格', type: 'text' },
          { key: 'unit', label: '単位（/月 など）', type: 'text' },
          { key: 'features', label: '含まれる内容（改行区切り）', type: 'textarea' },
          { key: 'btn', label: 'ボタン文字', type: 'text' },
          { key: 'href', label: 'ボタンのリンク先', type: 'text' },
          { key: 'featured', label: 'おすすめとして目立たせる', type: 'toggle' },
          { key: 'tag', label: 'おすすめラベル', type: 'text' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'PRICING', title: '料金プラン', text: 'わかりやすい料金体系でご案内しています。',
      cols: 'c3', bg: 'surface', anchor: 'pricing',
      items: [
        { name: 'ライト', price: '¥50,000', unit: '〜', features: '1ページ構成\nスマホ対応\nお問い合わせフォーム', btn: '相談する', href: '#contact', featured: false, tag: '' },
        { name: 'スタンダード', price: '¥150,000', unit: '〜', features: '5ページまで\nスマホ対応\n写真撮影つき\n公開後1ヶ月サポート', btn: '相談する', href: '#contact', featured: true, tag: '人気' },
        { name: 'プレミアム', price: '要相談', unit: '', features: 'ページ数無制限\nオリジナルデザイン\nロゴ制作\n運用サポート', btn: '相談する', href: '#contact', featured: false, tag: '' },
      ],
    },
    render: (p) => sec('pricing', p,
      `${head(p)}
    <div class="grid ${p.cols || 'c3'}">
${(p.items || []).map((it) => `      <div class="plan${it.featured ? ' feat' : ''}">
        ${it.featured && it.tag ? `<span class="tag">${esc(it.tag)}</span>` : ''}
        <h3>${esc(it.name)}</h3>
        <div class="price">${esc(it.price)}${it.unit ? `<span>${esc(it.unit)}</span>` : ''}</div>
        <ul>${(it.features || '').split('\n').filter(Boolean).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        ${it.btn ? `<a class="btn${it.featured ? '' : ' ghost'}" href="${esc(it.href || '#')}">${esc(it.btn)}</a>` : ''}
      </div>`).join('\n')}
    </div>`),
  },

  /* ---------------- よくある質問 ---------------- */
  faq: {
    label: 'よくある質問',
    icon: '?',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'items', label: '質問', type: 'list', addLabel: '質問を追加', titleKey: 'q',
        item: [
          { key: 'q', label: '質問', type: 'text' },
          { key: 'a', label: '答え', type: 'textarea' },
          { key: 'open', label: '最初から開いておく', type: 'toggle' },
        ] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'FAQ', title: 'よくあるご質問', text: '', bg: '', anchor: 'faq',
      items: [
        { q: '制作にはどのくらいかかりますか？', a: '内容によりますが、1ページ構成であれば最短3日、5ページ程度で2〜3週間が目安です。', open: true },
        { q: '写真がないのですが大丈夫ですか？', a: 'はい。フリー素材のご提案や、撮影の手配も承っています。', open: false },
        { q: '公開後に自分で更新できますか？', a: '更新しやすい形でお渡しします。操作方法もレクチャーいたします。', open: false },
      ],
    },
    render: (p) => sec('faq', p,
      `${head(p)}
    <div class="faq">
${(p.items || []).map((it) => `      <details${it.open ? ' open' : ''}>
        <summary>${esc(it.q)}</summary>
        <div class="a">${nl2br(it.a)}</div>
      </details>`).join('\n')}
    </div>`),
  },

  /* ---------------- CTA帯 ---------------- */
  cta: {
    label: 'CTA（行動を促す帯）',
    icon: '➤',
    fields: [
      FIELD.title, FIELD.text,
      { key: 'buttons', label: 'ボタン', type: 'list', addLabel: 'ボタンを追加', titleKey: 'label', item: FIELD.btnItem },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: 'まずは気軽にご相談ください',
      text: '相談は無料です。ざっくりしたイメージだけでも大丈夫です。',
      bg: 'primary', anchor: '',
      buttons: [{ label: '無料で相談する', href: '#contact', style: 'ghost' }],
    },
    render: (p) => sec('cta', p,
      `    <div class="cta-in">
      ${p.title ? `<h2 class="sec-title" data-ta>${nl2br(p.title)}</h2>` : ''}
      ${p.text ? `<p>${nl2br(p.text)}</p>` : ''}
${buttons(p.buttons, 'center')}
    </div>`),
  },

  /* ---------------- お問い合わせ ---------------- */
  contact: {
    label: 'お問い合わせ',
    icon: '✉',
    fields: [
      FIELD.eyebrow, FIELD.title, FIELD.text,
      { key: 'tel', label: '電話番号', type: 'text' },
      { key: 'email', label: 'メールアドレス', type: 'text' },
      { key: 'address', label: '住所', type: 'text' },
      { key: 'hours', label: '営業時間', type: 'text' },
      { key: 'form', label: '入力フォームを表示', type: 'toggle' },
      { key: 'action', label: 'フォームの送信先URL', type: 'text', hint: 'Googleフォーム等のURL。空なら見た目だけ', showIf: (p) => p.form },
      { key: 'submit', label: '送信ボタンの文字', type: 'text', showIf: (p) => p.form },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      eyebrow: 'CONTACT', title: 'お問い合わせ',
      text: 'お気軽にご連絡ください。2営業日以内にご返信します。',
      tel: '03-0000-0000', email: 'hello@example.com',
      address: '東京都〇〇区〇〇 1-2-3', hours: '平日 10:00 - 18:00',
      form: true, action: '', submit: '送信する', bg: 'surface', anchor: 'contact',
    },
    render: (p) => {
      const info = [['TEL', p.tel], ['EMAIL', p.email], ['ADDRESS', p.address], ['HOURS', p.hours]]
        .filter(([, v]) => v)
        .map(([k, v]) => `        <div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('\n');
      const form = p.form ? `      <form class="form"${attr('action', p.action)}${p.action ? ' method="post"' : ''}>
        <label>お名前<input type="text" name="name" required></label>
        <label>メールアドレス<input type="email" name="email" required></label>
        <label>お問い合わせ内容<textarea name="message" required></textarea></label>
        <button class="btn" type="submit">${esc(p.submit || '送信する')}</button>
      </form>` : '';
      const only1 = !info || !form ? ' only1' : '';
      return sec('contact', p,
        `${head(p)}
    <div class="contact-in${only1}">
${info ? `      <dl class="info">\n${info}\n      </dl>` : ''}
${form}
    </div>`);
    },
  },

  /* ---------------- 自由テキスト ---------------- */
  rich: {
    label: '自由テキスト',
    icon: '¶',
    fields: [
      FIELD.title,
      { key: 'body', label: '本文（空行で段落）', type: 'textarea', rows: 10 },
      { key: 'align', label: '配置', type: 'select', options: [['center', '中央寄せ'], ['left', '左寄せ']] },
      FIELD.bg, FIELD.anchor,
    ],
    defaults: {
      title: '見出し', align: 'center', bg: '', anchor: '',
      body: 'ここに自由に文章を書けます。\n\n空行で区切ると段落になります。お知らせやポリシー、長めの説明文などにどうぞ。',
    },
    render: (p) => sec('rich', p,
      `    <div class="rich${p.align === 'left' ? ' left' : ''}">
      ${p.title ? `<h2 class="sec-title" style="text-align:${p.align === 'left' ? 'left' : 'center'}">${nl2br(p.title)}</h2>` : ''}
      ${(p.body || '').split(/\n{2,}/).filter(Boolean).map((t) => `<p>${nl2br(t)}</p>`).join('\n      ')}
    </div>`),
  },

  /* ---------------- フッター ---------------- */
  footer: {
    label: 'フッター',
    icon: '▁',
    unique: true,
    fields: [
      { key: 'logo', label: 'サイト名', type: 'text' },
      { key: 'links', label: 'リンク', type: 'list', addLabel: 'リンクを追加', titleKey: 'label',
        item: [
          { key: 'label', label: '表示名', type: 'text' },
          { key: 'href', label: 'リンク先', type: 'text' },
        ] },
      { key: 'copy', label: 'コピーライト', type: 'text' },
    ],
    defaults: {
      logo: 'YOUR LOGO',
      links: [
        { label: 'プライバシーポリシー', href: '#' },
        { label: '特定商取引法に基づく表記', href: '#' },
        { label: 'お問い合わせ', href: '#contact' },
      ],
      copy: '© 2026 Your Company. All rights reserved.',
    },
    render: (p) => `<footer class="ftr">
  <div class="wrap">
    <div class="ftr-in">
      <span class="logo">${esc(p.logo)}</span>
      <nav class="ftr-nav">${(p.links || []).filter((l) => l.label).map((l) => `<a href="${esc(l.href || '#')}">${esc(l.label)}</a>`).join('')}</nav>
    </div>
    ${p.copy ? `<div class="copy">${esc(p.copy)}</div>` : ''}
  </div>
</footer>`,
  },
};

/* 追加メニューに出す順番（ヘッダー・フッターは常設なので除く） */
const ADDABLE = ['hero', 'features', 'about', 'gallery', 'pricing', 'faq', 'cta', 'contact', 'rich'];
