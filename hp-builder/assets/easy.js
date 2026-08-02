/* ================================================================
   かんたんモード

   対象は「いまホームページを持っていない人」。
   文章を書く、配色を決める、写真をどこに置くか考える——
   そのどれもさせずに、業種と店名と写真だけで1枚を組み上げる。

     業種をえらぶ  →  店名を入れる  →  写真をえらぶ  →  完成

   中身は既存のテンプレートを土台にして、店名の入った文章で上書きする。
   配色は写真から拾う。写真が無いときは土台の配色のまま。
   ================================================================ */

/* ---------------- 業種 ----------------
   tpl は土台にするテンプレート。copy はそこに被せる文章。
   {n} は店名に置き換わる。 */
const INDUSTRIES = [
  {
    key: 'cafe', label: 'カフェ・喫茶店', icon: '☕', tpl: 'shop',
    copy: (n) => ({
      hero: { eyebrow: 'CAFE', title: `${n}`, text: 'ゆっくり過ごせる時間と、ていねいに淹れた一杯を。' },
      about: { title: 'この場所のこと',
        body: `${n}は、毎日の合間にひと息つける場所です。\n\n`
          + '豆は焙煎したてのものを使い、注文を受けてから一杯ずつ淹れています。\n\n'
          + 'ひとりで過ごす時間にも、誰かと話す時間にも。どちらでも居心地よく。' },
      features: [
        { icon: '☕', title: '一杯ずつ淹れる', text: '注文を受けてから挽いて淹れます。豆は週ごとに焙煎したてのものを。' },
        { icon: '🍰', title: '手づくりの焼き菓子', text: '毎朝その日のぶんだけ焼いています。売り切れの日はご容赦ください。' },
        { icon: '🪟', title: '長居してください', text: '席の間隔をゆったり取っています。読書にも、打ち合わせにも。' },
      ],
    }),
  },
  {
    key: 'restaurant', label: 'レストラン・居酒屋', icon: '🍽', tpl: 'bistro',
    copy: (n) => ({
      hero: { eyebrow: 'RESTAURANT', title: `${n}`, text: '季節のものを、いちばんおいしい形で。' },
      about: { title: 'お店について',
        body: `${n}では、その日に入ったものを見てから献立を決めています。\n\n`
          + '産地から届いた食材をなるべく手を加えすぎずに。素材の味が主役です。\n\n'
          + 'ご予約はお電話でも承ります。お席の相談もお気軽にどうぞ。' },
      features: [
        { icon: '🥬', title: 'その日の仕入れから', text: '献立は毎日変わります。いちばんいい状態のものだけをお出しします。' },
        { icon: '🍷', title: '料理に合わせて', text: 'その日の料理に合うものをご用意しています。お好みをお聞かせください。' },
        { icon: '🕯', title: '落ち着いた席', text: '記念日にも、ひとりの夜にも。用途に合わせてご案内します。' },
      ],
    }),
  },
  {
    key: 'salon', label: '美容室・ネイル・エステ', icon: '✂', tpl: 'clinic',
    copy: (n) => ({
      hero: { eyebrow: 'SALON', title: `${n}`, text: '髪も気持ちも、軽くなって帰れる場所。' },
      about: { title: 'はじめての方へ',
        body: `${n}は、じっくりお話ししてから始めます。\n\n`
          + '「なんとなく気に入らない」の正体を一緒に探すところからです。\n\n'
          + '普段の手入れのしやすさまで考えて、無理のない形をご提案します。' },
      features: [
        { icon: '💬', title: 'まず話を聞きます', text: 'いきなり切りません。困っていることを伺ってから決めます。' },
        { icon: '🌿', title: '髪にやさしく', text: '傷みを抑えた薬剤を使っています。頭皮が弱い方もご相談ください。' },
        { icon: '🏠', title: '家でも再現できる', text: '手入れのしかたをお伝えします。翌朝から扱いやすい形に。' },
      ],
    }),
  },
  {
    key: 'clinic', label: 'クリニック・歯科・整体', icon: '🩺', tpl: 'clinic',
    copy: (n) => ({
      hero: { eyebrow: 'CLINIC', title: `${n}`, text: '気になることを、そのままにしないために。' },
      about: { title: '当院について',
        body: `${n}では、まず今の状態をわかりやすくご説明します。\n\n`
          + '何をするのか、どのくらいかかるのか。納得いただいてから進めます。\n\n'
          + '不安なことがあれば、どんな小さなことでもお聞きください。' },
      features: [
        { icon: '📋', title: 'わかる言葉で説明', text: '専門用語を使わずに、いまの状態と選べる方法をお伝えします。' },
        { icon: '🕐', title: '待たせません', text: 'ご予約の方を優先しています。お待ちいただく時間を短くしています。' },
        { icon: '🤝', title: '通いやすさ', text: '無理な回数はおすすめしません。通える範囲で計画を立てます。' },
      ],
    }),
  },
  {
    key: 'builder', label: '工務店・リフォーム・解体', icon: '🔨', tpl: 'demolition',
    copy: (n) => ({
      hero: { eyebrow: 'CONSTRUCTION', title: `${n}`, text: '見積りから引き渡しまで、同じ担当が最後まで。' },
      about: { title: '私たちのこと',
        body: `${n}は、地元で長く仕事をしてきました。\n\n`
          + '現場ごとに条件が違うので、まず見に行ってから見積りをお出しします。\n\n'
          + '近隣への説明や後片づけまで含めて、ひと通りお任せいただけます。' },
      features: [
        { icon: '📐', title: '現地を見てから', text: '写真だけでは分からないことがあります。必ず伺ってから出します。' },
        { icon: '💴', title: '追加費用を先に', text: '起こりうる追加を見積りの段階でお伝えします。後出しはしません。' },
        { icon: '🧹', title: '近隣にも配慮', text: 'ご挨拶と養生、片づけまで。終わったあとにご迷惑を残しません。' },
      ],
    }),
  },
  {
    key: 'school', label: '教室・スクール', icon: '📚', tpl: 'corporate',
    copy: (n) => ({
      hero: { eyebrow: 'SCHOOL', title: `${n}`, text: '続けられるところから、はじめましょう。' },
      about: { title: '教室について',
        body: `${n}は、ひとりひとりの進み方に合わせて教えています。\n\n`
          + '同じ内容でも、分かり方は人によって違います。そこを揃えません。\n\n'
          + 'まずは体験からどうぞ。合うかどうかを見てから決めていただけます。' },
      features: [
        { icon: '👣', title: '進み方は人それぞれ', text: '決まった速さに合わせません。分かるまで戻れます。' },
        { icon: '🎯', title: '目標から逆算', text: '何のために学ぶのかを聞いてから、道筋を立てます。' },
        { icon: '🙌', title: 'まず体験から', text: '雰囲気を見てから決められます。無理な勧誘はしません。' },
      ],
    }),
  },
  {
    key: 'shop', label: 'ショップ・小売', icon: '🛍', tpl: 'shop',
    copy: (n) => ({
      hero: { eyebrow: 'SHOP', title: `${n}`, text: '長く使えるものだけを、置いています。' },
      about: { title: 'この店のこと',
        body: `${n}は、自分たちが使ってよかったものだけを並べています。\n\n`
          + 'つくり手の顔が見えるものを中心に、少しずつ集めました。\n\n'
          + '選び方に迷ったら声をかけてください。使い方までお話しします。' },
      features: [
        { icon: '🔍', title: '選んで置いています', text: '数を増やすより、長く使えるものを。実際に試したものだけです。' },
        { icon: '🧵', title: '直して使う', text: '扱っているものは修理の相談ができます。長く付き合えるように。' },
        { icon: '🎁', title: '贈りものにも', text: '包装を承ります。相手の方に合わせて一緒に選びます。' },
      ],
    }),
  },
  {
    key: 'gym', label: 'ジム・スタジオ', icon: '🏋', tpl: 'studio',
    copy: (n) => ({
      hero: { eyebrow: 'STUDIO', title: `${n}`, text: '続けられる形を、一緒に見つける。' },
      about: { title: 'はじめての方へ',
        body: `${n}は、運動が苦手な方こそ来てほしい場所です。\n\n`
          + 'きついことを続ける必要はありません。無理のない量から始めます。\n\n'
          + '体の状態を見ながら、そのときどきで組み立て直していきます。' },
      features: [
        { icon: '🐢', title: '無理をさせません', text: '最初から追い込みません。続くことのほうが大事です。' },
        { icon: '📈', title: '記録を残す', text: '毎回の内容を残すので、変化が数字で見えます。' },
        { icon: '👤', title: '人目が気にならない', text: '広さに対して人数を絞っています。落ち着いて動けます。' },
      ],
    }),
  },
  {
    key: 'office', label: '士業・事務所', icon: '⚖', tpl: 'recruit',
    copy: (n) => ({
      hero: { eyebrow: 'OFFICE', title: `${n}`, text: 'まず、話を聞くところから。' },
      about: { title: '事務所について',
        body: `${n}は、相談しやすさを大事にしています。\n\n`
          + '何が問題なのかがはっきりしていない段階でも構いません。\n\n'
          + '費用は着手前にお見積りをお出しします。途中で増えることはありません。' },
      features: [
        { icon: '💬', title: '初回相談は無料', text: 'まず状況を伺います。依頼するかはそのあとで決めてください。' },
        { icon: '📄', title: '費用を先に出す', text: '着手前に見積りをお出しします。あとから増やしません。' },
        { icon: '🔒', title: '守秘は当然として', text: 'お聞きしたことは外に出しません。ご家族にも伝えません。' },
      ],
    }),
  },
  {
    key: 'company', label: '会社・その他', icon: '🏢', tpl: 'corporate',
    copy: (n) => ({
      hero: { eyebrow: 'ABOUT US', title: `${n}`, text: 'わたしたちがしていることを、簡単に。' },
      about: { title: '会社について',
        body: `${n}は、お客さまの困りごとから仕事を始めます。\n\n`
          + '先に答えを決めず、状況を見てから何をするかを組み立てます。\n\n'
          + 'ご相談だけでも構いません。まずはお話をお聞かせください。' },
      features: [
        { icon: '🎯', title: '目的から考える', text: '手段を先に決めません。何のためかを揃えてから進めます。' },
        { icon: '⚡', title: '早くお返しします', text: 'お問い合わせには翌営業日までにご連絡します。' },
        { icon: '🤝', title: '渡して終わりにしない', text: '納品後も相談を受け付けています。運用まで見ます。' },
      ],
    }),
  },
];

/* ---------------- 写真の差し込み先を探す ----------------
   fields を歩いて type:'image' の場所を集める。list の中も見る。
   ここで集めた順に写真を入れていくので、ヒーロー→紹介→ギャラリーの順になる。 */
function imageSlots(block) {
  const def = BLOCKS[block.type];
  if (!def) return [];
  const out = [];
  for (const f of def.fields || []) {
    /* ロゴ枠は写真を入れる場所ではない。ここに店内の写真が入ると、
       ヘッダーの社名の横に関係のない画像が並んでしまう（実際に起きた）。 */
    if (/logo/i.test(f.key)) continue;
    if (f.type === 'image') { out.push(f.key); continue; }
    if (f.type === 'list' && Array.isArray(block.props[f.key])) {
      const inner = (f.item || []).filter((x) => x.type === 'image');
      if (!inner.length) continue;
      block.props[f.key].forEach((_, i) => {
        inner.forEach((x) => out.push(`${f.key}.${i}.${x.key}`));
      });
    }
  }
  return out;
}

/* ---------------- 写真から配色をつくる ----------------
   写真に写っている色をそのまま使うと、明るすぎたり薄すぎたりして
   文字が読めなくなる。色みだけ写真から借りて、
   明るさと鮮やかさはこちらで決め直す。 */
const RGB2HSL = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h, s, l];
};

const HSL2HEX = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const t = h / 60;
  const [r, g, b] = t < 1 ? [c, x, 0] : t < 2 ? [x, c, 0] : t < 3 ? [0, c, x]
    : t < 4 ? [0, x, c] : t < 5 ? [x, 0, c] : [c, 0, x];
  const hx = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${hx(r)}${hx(g)}${hx(b)}`;
};

const relLum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
};
const contrast = (a, b) => {
  const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* 写真の主役の色みを1つ返す。見つからなければ null */
async function hueFromPhotos(dataURLs) {
  const bins = new Array(24).fill(0);
  for (const src of dataURLs.slice(0, 6)) {
    const im = new Image();
    try {
      await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = src; });
    } catch { continue; }
    const cv = document.createElement('canvas');
    cv.width = 48; cv.height = 48;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(im, 0, 0, 48, 48);
    const d = cx.getImageData(0, 0, 48, 48).data;
    for (let i = 0; i < d.length; i += 4) {
      const [h, s, l] = RGB2HSL(d[i], d[i + 1], d[i + 2]);
      /* 白飛び・黒つぶれ・灰色は、色みを持っていないので数えない */
      if (l < 0.12 || l > 0.92 || s < 0.18) continue;
      bins[Math.floor(h / 15) % 24] += s;      // 鮮やかな画素ほど重く数える
    }
  }
  const top = bins.indexOf(Math.max(...bins));
  return Math.max(...bins) > 0 ? top * 15 + 7.5 : null;
}

/* 土台の配色の、色みだけ写真に合わせて差し替える。
   背景と文字はそのままなので、読めなくなることがない。 */
const AA = 4.5;   // 小さい文字でも読める境目（WCAG AA）

async function paletteFromPhotos(baseTheme, dataURLs) {
  const h = await hueFromPhotos(dataURLs);
  if (h === null) return baseTheme;
  const t = JSON.parse(JSON.stringify(baseTheme));

  /* 明るさをどちらへ動かすかは、背景で決まる。
     暗い背景で色を暗くしていくと、かえって読めなくなる
     （bistro と demolition が実際にそうなった）。 */
  const onDark = relLum(t.bg) < 0.35;
  const step = onDark ? 0.02 : -0.02;
  let l = onDark ? 0.56 : 0.46;
  let primary = HSL2HEX(h, 0.58, l);
  for (let i = 0; i < 40 && contrast(primary, t.bg) < AA; i++) {
    const next = l + step;
    if (next < 0.14 || next > 0.94) break;
    l = next;
    primary = HSL2HEX(h, 0.58, l);
  }

  /* それでも届かない色みなら、土台の配色のままにしておく。
     読めない色を出すくらいなら、写真に寄せないほうがいい。 */
  if (contrast(primary, t.bg) < AA) return baseTheme;

  t.primary = primary;
  t.accent = HSL2HEX((h + 20) % 360, 0.5,
    onDark ? Math.min(0.86, l + 0.12) : Math.min(0.72, l + 0.2));
  return t;
}

/* ---------------- 1枚を組み上げる ---------------- */
function buildEasyState(industryKey, name, photos) {
  const ind = INDUSTRIES.find((i) => i.key === industryKey) || INDUSTRIES[0];
  const st = buildState(ind.tpl);
  const c = ind.copy(name || 'お店の名前');

  st.template = ind.tpl;
  st.meta.title = name || 'My Website';
  st.meta.description = c.hero.text;

  for (const b of st.blocks) {
    if (b.type === 'header' || b.type === 'footer') {
      b.props.logo = name || b.props.logo;
    }
    if (b.type === 'hero') {
      Object.assign(b.props, c.hero);
      if (photos.length) b.props.layout = 'cover';   // 写真があるなら顔にする
    }
    if (b.type === 'about') {
      b.props.title = c.about.title;
      b.props.body = c.about.body;
    }
    if (b.type === 'features' && Array.isArray(b.props.items) && !b._done) {
      b.props.items = JSON.parse(JSON.stringify(c.features));
      b._done = true;    // 同じテンプレートに features が2つある場合、上の1つだけ差し替える
    }
  }
  st.blocks.forEach((b) => { delete b._done; });
  return st;
}

/* 集めた写真を、上のブロックから順に入れていく。
   足りなくなったら、そこから先は元のまま（プレースホルダ）。 */
function fillPhotos(st, photos) {
  if (!photos.length) return 0;
  let i = 0;
  for (const b of st.blocks) {
    for (const slot of imageSlots(b)) {
      if (i >= photos.length) return i;
      setPath(b.props, slot, photos[i++]);
    }
  }
  return i;
}
