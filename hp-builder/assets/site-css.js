/* 生成されるサイトに適用されるCSS。プレビューと書き出しHTMLの両方で使う。
   file:// でも動くように fetch せず JS 文字列として持つ。 */
const SITE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  font-family:var(--font);
  font-size:16px;
  line-height:1.9;
  color:var(--c-text);
  background:var(--c-bg);
  -webkit-font-smoothing:antialiased;
  word-break:break-word;
}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
p{margin:0 0 1em}
p:last-child{margin-bottom:0}

.wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 24px}

/* 画像がまだ設定されていない場所の目印 */
.ph{width:100%;height:100%;display:grid;place-items:center}
.ph::before{content:"IMAGE";font-size:11px;font-weight:800;letter-spacing:.22em;opacity:.4}
.hero-media > .ph::before,.about-media > .ph::before{color:#fff;opacity:.8}

/* ---------- セクション共通 ---------- */
.sec{padding:clamp(56px,8vw,96px) 0;position:relative}
.sec.bg-surface{background:var(--c-surface)}
.sec.bg-primary{background:var(--c-primary);color:var(--c-on-primary,#fff)}
.sec.bg-dark{background:var(--c-dark);color:var(--c-on-dark,#fff)}
.sec.bg-primary .sec-sub{color:color-mix(in srgb,var(--c-on-primary,#fff) 72%,transparent)}
.sec.bg-dark .sec-sub{color:color-mix(in srgb,var(--c-on-dark,#fff) 72%,transparent)}
.sec.bg-primary .card,.sec.bg-dark .card{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18)}

.sec-head{max-width:760px;margin:0 auto clamp(32px,5vw,56px);text-align:center}
.sec-head.left{text-align:left;margin-left:0}
.eyebrow{
  display:inline-block;margin:0 0 12px;font-size:12px;font-weight:700;
  letter-spacing:.18em;text-transform:uppercase;color:var(--c-primary)
}
.bg-primary .eyebrow,.bg-dark .eyebrow{color:var(--c-accent)}
.sec-title{
  margin:0 0 14px;font-size:clamp(24px,3.6vw,36px);line-height:1.4;
  letter-spacing:.02em;font-weight:800
}
.sec-sub{margin:0;color:var(--c-muted);font-size:15px}

/* ---------- ボタン ---------- */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:14px 30px;border-radius:var(--radius);
  background:var(--c-primary);color:var(--c-on-primary,#fff);font-weight:700;font-size:15px;
  border:1.5px solid transparent;cursor:pointer;
  transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease;
  box-shadow:0 6px 20px -8px var(--c-primary)
}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px -10px var(--c-primary)}
.btn.ghost{background:transparent;color:inherit;border-color:currentColor;box-shadow:none;opacity:.9}
.btn.ghost:hover{opacity:1;box-shadow:none}
.btn.accent{background:var(--c-accent);color:var(--c-on-accent,#fff);box-shadow:0 6px 20px -8px var(--c-accent)}
.btn.sm{padding:10px 20px;font-size:14px}
.btn-row{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}
.center .btn-row,.hero.center .btn-row{justify-content:center}

/* ---------- ヘッダー ---------- */
.hdr{
  position:relative;z-index:50;background:var(--c-bg);
  border-bottom:1px solid var(--c-border)
}
.hdr.sticky{position:sticky;top:0;background:color-mix(in srgb,var(--c-bg) 86%,transparent);backdrop-filter:blur(12px)}
.hdr-in{display:flex;align-items:center;gap:24px;height:72px}
.logo{font-weight:800;font-size:19px;letter-spacing:.02em;display:flex;align-items:center;gap:10px}
.logo img{height:32px;width:auto}
.nav{display:flex;align-items:center;gap:28px;margin-left:auto}
.nav a{font-size:14px;font-weight:600;color:var(--c-muted);transition:color .15s}
.nav a:hover{color:var(--c-primary)}
.hdr .btn{margin-left:4px}
.hdr-toggle{
  display:none;margin-left:auto;width:44px;height:44px;border:1px solid var(--c-border);
  background:transparent;border-radius:10px;font-size:18px;cursor:pointer;color:inherit
}

/* ---------- ヒーロー ---------- */
.hero{position:relative;overflow:hidden;padding:clamp(64px,9vw,120px) 0}
.hero.center{text-align:center}
.hero-in{position:relative;z-index:2}
.hero-title{margin:0 0 20px;font-size:clamp(30px,5.4vw,56px);line-height:1.28;letter-spacing:.01em;font-weight:800}
.hero-text{margin:0;font-size:clamp(15px,1.6vw,18px);color:var(--c-muted);max-width:620px}
.hero.center .hero-text{margin-inline:auto}
.hero-media{
  border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3;
  background:linear-gradient(135deg,var(--c-primary),var(--c-accent));
  box-shadow:0 30px 60px -30px rgba(15,23,42,.45)
}
.hero-media img{width:100%;height:100%;object-fit:cover}
.hero.split .hero-in{display:grid;grid-template-columns:1.02fr .98fr;gap:clamp(32px,5vw,64px);align-items:center}
.hero.split .hero-title{font-size:clamp(28px,3.4vw,42px)}
.hero.cover{color:#fff}
.hero.cover .hero-text{color:rgba(255,255,255,.82)}
.hero-bg{position:absolute;inset:0;z-index:0;background:linear-gradient(135deg,var(--c-primary),var(--c-accent))}
.hero-bg img{width:100%;height:100%;object-fit:cover}
.hero-bg::after{content:"";position:absolute;inset:0;background:var(--hero-overlay,rgba(15,23,42,.55))}
.hero.center.cover .hero-in,.hero.left.cover .hero-in{padding:clamp(24px,4vw,48px) 0}

/* ---------- 特徴 / カード ---------- */
.grid{display:grid;gap:24px}
.grid.c2{grid-template-columns:repeat(2,1fr)}
.grid.c3{grid-template-columns:repeat(3,1fr)}
.grid.c4{grid-template-columns:repeat(4,1fr)}
.card{
  background:var(--c-bg);border:1px solid var(--c-border);border-radius:var(--radius);
  padding:32px 28px;transition:transform .2s ease,box-shadow .2s ease
}
.card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -24px rgba(15,23,42,.35)}
.card .ic{font-size:30px;line-height:1;margin-bottom:16px;display:block}
.card h3{margin:0 0 10px;font-size:18px;font-weight:700;line-height:1.5}
.card p{margin:0;font-size:14.5px;color:var(--c-muted)}
.card .num{
  display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;
  border-radius:50%;background:var(--c-primary);color:var(--c-on-primary,#fff);font-weight:800;margin-bottom:16px
}

/* ---------- About ---------- */
.about-in{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,64px);align-items:center}
.about-in.rev .about-media{order:2}
.about-media{border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3;background:linear-gradient(135deg,var(--c-primary),var(--c-accent))}
.about-media img{width:100%;height:100%;object-fit:cover}
.about-body .sec-title{font-size:clamp(22px,3vw,30px)}
.about-body p{color:var(--c-muted)}

/* ---------- ギャラリー ---------- */
.gal{display:grid;gap:14px;grid-template-columns:repeat(3,1fr)}
.gal figure{
  margin:0;border-radius:var(--radius);overflow:hidden;aspect-ratio:1/1;
  background:var(--c-surface);border:1px solid var(--c-border)
}
.bg-surface .gal figure{background:var(--c-bg)}
.gal img{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.gal figure:hover img{transform:scale(1.06)}

/* ---------- 料金 ---------- */
.plan{
  background:var(--c-bg);border:1px solid var(--c-border);border-radius:var(--radius);
  padding:36px 30px;display:flex;flex-direction:column
}
.plan.feat{border-color:var(--c-primary);box-shadow:0 24px 48px -28px var(--c-primary);position:relative}
.plan .tag{
  position:absolute;top:-13px;left:50%;transform:translateX(-50%);
  background:var(--c-primary);color:var(--c-on-primary,#fff);font-size:12px;font-weight:700;
  padding:5px 14px;border-radius:999px;white-space:nowrap
}
.plan h3{margin:0 0 6px;font-size:17px;font-weight:700}
.plan .price{font-size:34px;font-weight:800;letter-spacing:-.01em;line-height:1.3}
.plan .price span{font-size:14px;font-weight:600;color:var(--c-muted);margin-left:4px}
.plan ul{list-style:none;margin:22px 0;padding:0;display:grid;gap:10px}
.plan li{font-size:14.5px;color:var(--c-muted);padding-left:26px;position:relative}
.plan li::before{content:"✓";position:absolute;left:0;color:var(--c-primary);font-weight:800}
.plan .btn{margin-top:auto;width:100%}

/* ---------- FAQ ---------- */
.faq{max-width:800px;margin:0 auto;display:grid;gap:12px}
.faq details{border:1px solid var(--c-border);border-radius:var(--radius);background:var(--c-bg);overflow:hidden}
.faq summary{
  padding:20px 24px;font-weight:700;cursor:pointer;list-style:none;
  display:flex;align-items:center;gap:12px;font-size:15.5px
}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";margin-left:auto;color:var(--c-primary);font-size:20px;font-weight:800}
.faq details[open] summary::after{content:"−"}
.faq .a{padding:0 24px 22px;color:var(--c-muted);font-size:14.5px}

/* ---------- CTA帯 ---------- */
.cta-in{text-align:center;max-width:720px;margin:0 auto}
.cta-in .sec-title{margin-bottom:12px}
.cta-in p{opacity:.85}

/* ---------- お問い合わせ ---------- */
.contact-in{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,56px)}
.contact-in.only1{grid-template-columns:1fr;max-width:640px;margin:0 auto}
.info{display:grid;gap:18px;align-content:start}
.info div{display:grid;gap:2px}
.info dt{font-size:12px;font-weight:700;letter-spacing:.12em;color:var(--c-primary)}
.info dd{margin:0;font-size:16px;font-weight:600}
.form{display:grid;gap:14px}
.form label{display:grid;gap:6px;font-size:13px;font-weight:700}
.form input,.form textarea{
  font:inherit;font-size:15px;padding:13px 15px;border:1px solid var(--c-border);
  border-radius:calc(var(--radius) * .7);background:var(--c-bg);color:inherit;width:100%
}
.form textarea{min-height:130px;resize:vertical}
.form input:focus,.form textarea:focus{outline:2px solid var(--c-primary);outline-offset:1px;border-color:transparent}

/* ---------- 自由テキスト ---------- */
.rich{max-width:760px;margin:0 auto;font-size:16px}
.rich.left{margin-left:0}

/* ---------- フッター ---------- */
.ftr{background:var(--c-dark);color:color-mix(in srgb,var(--c-on-dark,#fff) 72%,transparent);
  padding:56px 0 32px;font-size:14px}
.ftr-in{display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between}
.ftr .logo{color:var(--c-on-dark,#fff);font-size:17px}
.ftr-nav{display:flex;flex-wrap:wrap;gap:22px}
.ftr-nav a{transition:color .15s}
.ftr-nav a:hover{color:var(--c-on-dark,#fff)}
.copy{margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,.12);font-size:12.5px;opacity:.7}

/* ==========================================================
   デザインの型（テンプレートごとの造形）
   配色だけでは似た顔になるので、影・角・余白・見出しの構えを変える。
   body に sty-* が付く。
   ========================================================== */

/* ---------- モノクロ＋アクセント（採用・コーポレート） ---------- */
.sty-mono .card,.sty-mono .plan,.sty-mono .faq details,.sty-mono .stackcard{box-shadow:none}
.sty-mono .card:hover{transform:none;box-shadow:none;border-color:var(--c-text)}
.sty-mono .hero-media,.sty-mono .about-media{box-shadow:none}
.sty-mono .btn{box-shadow:none;font-weight:800;letter-spacing:.06em;padding:16px 34px}
.sty-mono .btn:hover{transform:none;background:var(--c-text);border-color:var(--c-text);color:var(--c-bg)}
.sty-mono .btn.ghost:hover{background:var(--c-text);color:var(--c-bg)}
.sty-mono .hdr{border-bottom:1px solid var(--c-text)}
.sty-mono .logo{letter-spacing:.06em}
.sty-mono .eyebrow{
  letter-spacing:.3em;font-size:11px;display:flex;align-items:center;gap:12px;margin-bottom:18px}
.sty-mono .eyebrow::before{content:"";width:28px;height:2px;background:var(--c-primary);flex:none}
.sty-mono .sec-head{text-align:left;margin-left:0;max-width:none}
.sty-mono .sec-head .eyebrow{justify-content:flex-start}
.sty-mono .sec-title{font-size:clamp(26px,4.4vw,46px);line-height:1.28;letter-spacing:-.01em}
.sty-mono .hero-title{line-height:1.18;letter-spacing:-.02em}
.sty-mono .hero.center .hero-text,.sty-mono .hero.center{text-align:left}
.sty-mono .hero.center .btn-row{justify-content:flex-start}
.sty-mono .sec-sub{font-size:15.5px}
/* 見出しの脇に細い罫を引いて、紙面のような構えにする */
.sty-mono .sec{border-top:1px solid var(--c-border)}
.sty-mono .sec.bg-primary,.sty-mono .sec.bg-dark{border-top:0}
.sty-mono .card .num{border-radius:0;background:var(--c-primary)}
.sty-mono .plan.feat{box-shadow:none;border-width:2px}
.sty-mono .tl-item.on::before{box-shadow:none;border-radius:0}
.sty-mono .tl-item::before{border-radius:0}
.sty-mono .tl{margin-left:0}                      /* 見出しが左寄せなので線も左に揃える */
.sty-mono .faq{margin-left:0}

/* ---------- やわらかい（クリニック・サロン） ---------- */
.sty-soft .card,.sty-soft .plan{border:0;box-shadow:0 10px 30px -18px rgba(20,40,40,.35)}
.sty-soft .card:hover{box-shadow:0 24px 46px -22px rgba(20,40,40,.42)}
.sty-soft .btn{padding:16px 36px;border-radius:999px}
.sty-soft .hdr{border-bottom:0;box-shadow:0 2px 20px -12px rgba(20,40,40,.4)}
.sty-soft .eyebrow{letter-spacing:.2em}
.sty-soft .sec-title{font-weight:700;letter-spacing:.04em}
.sty-soft .card .ic{
  width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font-size:24px;
  background:color-mix(in srgb,var(--c-primary) 14%,transparent);margin-bottom:18px}
.sty-soft .faq details{border:0;box-shadow:0 8px 24px -18px rgba(20,40,40,.4)}
.sty-soft .hero-media,.sty-soft .about-media{box-shadow:0 26px 50px -28px rgba(20,40,40,.45)}

/* ---------- 太い（製品LP・イベント） ---------- */
.sty-bold .sec-title{font-size:clamp(28px,5.2vw,56px);font-weight:900;line-height:1.18;letter-spacing:-.02em}
.sty-bold .hero-title{font-weight:900;letter-spacing:-.03em;line-height:1.08}
.sty-bold .eyebrow{
  background:var(--c-primary);color:var(--c-dark);padding:5px 12px;border-radius:3px;
  letter-spacing:.16em;font-weight:900}
.sty-bold .btn{font-weight:900;letter-spacing:.04em;padding:17px 38px}
.sty-bold .card{border-width:2px}
.sty-bold .plan .price{font-size:42px;font-weight:900}
.sty-bold .slot{font-weight:900}
.sty-bold .sec-sub{font-size:16px}

/* ---------- 誌面のような（ブランド・エディトリアル） ---------- */
.sty-edit .sec{padding:clamp(72px,10vw,132px) 0}
.sty-edit .sec-head{margin-bottom:clamp(40px,6vw,72px)}
.sty-edit .sec-title{font-weight:400;letter-spacing:.06em;line-height:1.6}
.sty-edit .hero-title{font-weight:400;letter-spacing:.08em;line-height:1.55}
.sty-edit .eyebrow{
  letter-spacing:.4em;font-size:10.5px;font-weight:600;color:var(--c-muted)}
.sty-edit .sec-head::after{
  content:"";display:block;width:34px;height:1px;background:var(--c-primary);margin:26px auto 0}
.sty-edit .sec-head.left::after{margin-left:0}
.sty-edit .card,.sty-edit .plan,.sty-edit .faq details{
  background:transparent;                          /* 面に箱を置かず、罫線だけで区切る */
  border:0;border-top:1px solid var(--c-border);border-radius:0;box-shadow:none;padding-inline:0}
.sty-edit .card .num{background:transparent;color:var(--c-primary);border:1px solid var(--c-primary)}
.sty-edit .card:hover{transform:none;box-shadow:none}
.sty-edit .btn{
  background:transparent;color:var(--c-text);border:0;border-bottom:1px solid var(--c-text);
  border-radius:0;box-shadow:none;padding:10px 2px;letter-spacing:.18em;font-weight:600}
.sty-edit .btn:hover{transform:none;box-shadow:none;color:var(--c-primary);border-color:var(--c-primary)}
.sty-edit .btn.sm{padding:8px 2px;font-size:12.5px}
.sty-edit .hdr{border-bottom:0}
.sty-edit .logo{letter-spacing:.22em;font-weight:600;font-size:16px}
.sty-edit .nav a{letter-spacing:.14em;font-size:12.5px}
.sty-edit .gal{gap:26px}
.sty-edit .hero-media,.sty-edit .about-media{box-shadow:none;border-radius:0}

/* ---------- テンプレート別の味付け ---------- */
.sec-title,.hero-title,.logo,.plan h3,.card h3{font-family:var(--font-head)}
.tpl-shop .card{text-align:center}
.tpl-studio .hero-title{letter-spacing:-.02em}
.tpl-studio .card{background:transparent}
.tpl-studio .nav a{color:rgba(255,255,255,.7)}
.tpl-studio .hdr{border-bottom-color:rgba(255,255,255,.12)}

/* ==========================================================
   文字アニメーション
   [data-ta] が付いた見出しを、JSが1文字ずつ span に分割する。
   画面に入ると .in が付いて再生される。
   ========================================================== */
[data-ta] .ln{display:block}
[data-ta] .ch{display:inline-block;white-space:pre;will-change:transform,opacity}
[data-ta]:not(.in) .ch{opacity:0}
[data-ta].ta-none .ch{opacity:1}

@keyframes ta-fadeup{from{opacity:0;transform:translateY(.65em)}to{opacity:1;transform:none}}
[data-ta].ta-fadeup.in .ch{animation:ta-fadeup var(--ta-dur) var(--ta-ease) calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

[data-ta].ta-maskline .ln{overflow:hidden;padding-bottom:.08em}
@keyframes ta-maskline{from{transform:translateY(110%)}to{transform:none}}
[data-ta].ta-maskline.in .ch{animation:ta-maskline var(--ta-dur) var(--ta-ease) calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

@keyframes ta-blur{from{opacity:0;filter:blur(18px);transform:scale(1.18)}to{opacity:1;filter:blur(0);transform:none}}
[data-ta].ta-blur.in .ch{animation:ta-blur var(--ta-dur) var(--ta-ease) calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

[data-ta].ta-flip3d .ln{perspective:700px}
@keyframes ta-flip3d{from{opacity:0;transform:rotateX(-95deg)}to{opacity:1;transform:none}}
[data-ta].ta-flip3d.in .ch{transform-origin:50% 100%;
  animation:ta-flip3d var(--ta-dur) var(--ta-ease) calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

@keyframes ta-drop{from{opacity:0;transform:translateY(-.9em) rotate(-26deg)}to{opacity:1;transform:none}}
[data-ta].ta-drop.in .ch{animation:ta-drop var(--ta-dur) var(--ta-ease) calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

@keyframes ta-bounce{
  0%{opacity:0;transform:translateY(-1.3em) scale(.55)}
  55%{opacity:1;transform:translateY(.14em) scale(1.08)}
  75%{transform:translateY(-.06em) scale(.97)}
  100%{opacity:1;transform:none}}
[data-ta].ta-bounce.in .ch{animation:ta-bounce var(--ta-dur) var(--ta-ease) calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

@keyframes ta-slidealt{from{opacity:0;transform:translateX(var(--dir,-.8em))}to{opacity:1;transform:none}}
[data-ta].ta-slidealt.in .ch{animation:ta-slidealt var(--ta-dur) var(--ta-ease) calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

@keyframes ta-scatter{
  from{opacity:0;transform:translate(var(--x,0),var(--y,0)) rotate(var(--r,0deg)) scale(.35)}
  to{opacity:1;transform:none}}
[data-ta].ta-scatter.in .ch{animation:ta-scatter var(--ta-dur) var(--ta-ease) calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

@keyframes ta-neon{
  0%{opacity:.15;text-shadow:none}
  12%{opacity:1;text-shadow:0 0 6px var(--c-primary),0 0 18px var(--c-primary)}
  16%{opacity:.25;text-shadow:none}
  22%{opacity:1;text-shadow:0 0 6px var(--c-primary),0 0 18px var(--c-primary)}
  28%{opacity:.4;text-shadow:none}
  36%,100%{opacity:1;text-shadow:0 0 8px var(--c-primary),0 0 26px var(--c-primary),0 0 48px var(--c-primary)}}
[data-ta].ta-neon.in .ch{animation:ta-neon var(--ta-dur) linear calc(var(--ta-delay,0s) + var(--i)*var(--ta-stagger)) both}

[data-ta].ta-fillgrad{
  background:linear-gradient(100deg,var(--c-primary),var(--c-accent)) 0 0/0% 100% no-repeat,
             linear-gradient(var(--c-muted),var(--c-muted));
  -webkit-background-clip:text;background-clip:text;
  color:transparent;-webkit-text-fill-color:transparent}
@keyframes ta-fillgrad{from{background-size:0% 100%,100% 100%}to{background-size:100% 100%,100% 100%}}
[data-ta].ta-fillgrad.in{animation:ta-fillgrad var(--ta-dur) var(--ta-ease) var(--ta-delay,0s) both}

/* スクランブル・タイプライターはJSで動かす */
[data-ta].ta-type .ch{visibility:hidden}
[data-ta].ta-type .ch.show{visibility:visible}
.ta-cursor{display:inline-block;width:.06em;height:1em;background:currentColor;
  vertical-align:-.12em;margin-left:.04em;animation:ta-blink .9s steps(1) infinite}
@keyframes ta-blink{0%,49%{opacity:1}50%,100%{opacity:0}}

/* ==========================================================
   画像・要素のアニメーション
   [data-ia] が付いた要素に、JSが ia-on と ia-<種類> を付ける。
   （JSが動かない環境では何も隠さない＝そのまま表示される）
   ========================================================== */
.ia-on:not(.in){opacity:0}

@keyframes ia-zoomin{from{opacity:0;transform:scale(1.16)}to{opacity:1;transform:none}}
.ia-zoomin.in{animation:ia-zoomin var(--ta-dur) var(--ta-ease) var(--ia-delay,0s) both}

@keyframes ia-zoomout{from{opacity:0;transform:scale(.84)}to{opacity:1;transform:none}}
.ia-zoomout.in{animation:ia-zoomout var(--ta-dur) var(--ta-ease) var(--ia-delay,0s) both}

@keyframes ia-slideleft{from{opacity:0;transform:translateX(-9%)}to{opacity:1;transform:none}}
.ia-slideleft.in{animation:ia-slideleft var(--ta-dur) var(--ta-ease) var(--ia-delay,0s) both}

@keyframes ia-slideright{from{opacity:0;transform:translateX(9%)}to{opacity:1;transform:none}}
.ia-slideright.in{animation:ia-slideright var(--ta-dur) var(--ta-ease) var(--ia-delay,0s) both}

@keyframes ia-slideup{from{opacity:0;transform:translateY(11%)}to{opacity:1;transform:none}}
.ia-slideup.in{animation:ia-slideup var(--ta-dur) var(--ta-ease) var(--ia-delay,0s) both}

@keyframes ia-wipe{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
.ia-wipe{overflow:hidden}
.ia-wipe.in{opacity:1;animation:ia-wipe var(--ta-dur) cubic-bezier(.76,0,.24,1) var(--ia-delay,0s) both}

@keyframes ia-circle{from{clip-path:circle(0% at 50% 50%)}to{clip-path:circle(78% at 50% 50%)}}
.ia-circle.in{opacity:1;animation:ia-circle var(--ta-dur) cubic-bezier(.76,0,.24,1) var(--ia-delay,0s) both}

@keyframes ia-blurin{from{opacity:0;filter:blur(22px);transform:scale(1.06)}to{opacity:1;filter:blur(0);transform:none}}
.ia-blurin.in{animation:ia-blurin var(--ta-dur) var(--ta-ease) var(--ia-delay,0s) both}

@keyframes ia-tilt3d{from{opacity:0;transform:perspective(1100px) rotateY(-22deg) translateX(-4%)}
  to{opacity:1;transform:none}}
.ia-tilt3d.in{transform-origin:0% 50%;
  animation:ia-tilt3d var(--ta-dur) var(--ta-ease) var(--ia-delay,0s) both}

@keyframes ia-flipup{from{opacity:0;transform:perspective(1100px) rotateX(-52deg)}to{opacity:1;transform:none}}
.ia-flipup.in{transform-origin:50% 100%;
  animation:ia-flipup var(--ta-dur) var(--ta-ease) var(--ia-delay,0s) both}

/* ループするもの */
@keyframes ia-kenburns{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.12) translate(-1.5%,-1.5%)}}
.ia-kenburns{overflow:hidden}
.ia-kenburns.in{opacity:1}
.ia-kenburns.in > img{animation:ia-kenburns 14s ease-in-out infinite alternate}
.ia-kenburns.in:not(:has(img)){animation:ia-kenburns 14s ease-in-out infinite alternate}

@keyframes ia-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.ia-float.in{opacity:1;animation:ia-float 4.5s ease-in-out infinite}

/* ==========================================================
   スクロールに連動する特別なブロック
   ========================================================== */
.pinsec{position:relative}
.pin-in{position:sticky;top:0;height:100vh;overflow:hidden;display:grid;place-items:center}
.pin-cap{position:absolute;bottom:7vh;left:50%;transform:translateX(-50%);text-align:center;width:90%;z-index:3}
.pin-cap b{display:block;font-size:clamp(18px,2.6vw,28px);font-family:var(--font-head);line-height:1.4}
.pin-cap small{color:var(--c-muted);font-size:12.5px}
.bg-dark .pin-cap small,.bg-primary .pin-cap small{color:rgba(255,255,255,.72)}

/* ---------- 3D製品ビュー ---------- */
.p3d{width:min(74vmin,560px);height:min(74vmin,560px);display:block}
.p3d-deg{position:absolute;top:7vh;left:50%;transform:translateX(-50%);
  font-family:Menlo,monospace;font-size:12px;letter-spacing:.14em;color:var(--c-primary)}
.p3d-spec{position:absolute;inset:0;pointer-events:none}
.p3d-spec div{position:absolute;font-size:12px;color:var(--c-muted);opacity:0;transform:translateY(10px);
  transition:opacity .5s,transform .5s;max-width:34%}
.p3d-spec div.on{opacity:1;transform:none}
.p3d-spec b{display:block;color:var(--c-text);font-size:17px;font-family:Menlo,monospace}
.bg-dark .p3d-spec b,.bg-primary .p3d-spec b{color:#fff}
.p3d-spec div:nth-child(1){top:24%;left:6%}
.p3d-spec div:nth-child(2){top:46%;right:6%;text-align:right}
.p3d-spec div:nth-child(3){bottom:26%;left:8%}
@media(max-width:760px){.p3d-spec{display:none}}

/* ---------- 分解図 ---------- */
.exp{perspective:1400px;width:min(72vmin,440px);height:min(72vmin,440px);position:relative}
.exp-in{position:absolute;inset:0;transform-style:preserve-3d}
.exp-l{
  position:absolute;left:50%;top:50%;width:64%;height:44%;margin:-22% 0 0 -32%;
  border-radius:14px;border:1px solid rgba(255,255,255,.22);overflow:hidden;
  display:grid;place-items:center;font-family:Menlo,monospace;font-size:11px;
  letter-spacing:.14em;color:#fff;text-align:center;padding:6px
}
.exp-l img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
.exp-l span{position:relative;text-shadow:0 1px 6px rgba(0,0,0,.5)}

/* ---------- 横に流れるギャラリー ---------- */
.hs-head{position:absolute;top:clamp(24px,7vh,74px);left:0;width:100%;z-index:3}
/* 見出しの分だけ上に余白を取る（画面が低いとカードと重なるため） */
[data-hscroll] .pin-in{padding-top:clamp(96px,20vh,190px)}
.hs-track{display:flex;gap:20px;padding-left:6vw;will-change:transform}
.hs-card{
  flex:none;height:min(58vh,440px);width:auto;aspect-ratio:3/4;border-radius:var(--radius);
  overflow:hidden;position:relative;border:1px solid var(--c-border);background:var(--c-surface);
  display:flex;flex-direction:column;justify-content:flex-end;padding:20px
}
.hs-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hs-card em{position:absolute;top:16px;left:20px;font-style:normal;font-family:Menlo,monospace;
  font-size:11px;color:var(--c-primary);z-index:2}
.hs-card b{position:relative;z-index:2;font-size:15px}
.hs-card::after{content:"";position:absolute;inset:0;
  background:linear-gradient(transparent 45%,rgba(0,0,0,.55));opacity:0}
.hs-card:has(img)::after{opacity:1}
.hs-card:has(img) b,.hs-card:has(img) em{color:#fff}

/* ---------- 積み重なるカード ---------- */
.stack{display:grid;gap:24px}
.stackcard{
  position:sticky;height:56vh;border-radius:calc(var(--radius) * 1.6);padding:clamp(24px,4vw,44px);
  overflow:hidden;border:1px solid var(--c-border);background:var(--c-surface);
  display:flex;flex-direction:column;justify-content:space-between;
  will-change:transform;transform-origin:50% 0%
}
.stackcard .no{font-family:Menlo,monospace;font-size:12px;letter-spacing:.2em;color:var(--c-primary)}
.stackcard h3{margin:0 0 8px;font-size:clamp(20px,3vw,30px);font-family:var(--font-head)}
.stackcard p{margin:0;max-width:520px;font-size:14px;color:var(--c-muted)}
.stackcard:nth-child(1){top:11vh}.stackcard:nth-child(2){top:14vh}
.stackcard:nth-child(3){top:17vh}.stackcard:nth-child(4){top:20vh}
.stackcard:nth-child(5){top:23vh}.stackcard:nth-child(6){top:26vh}

/* ---------- タイムライン ---------- */
.tl{position:relative;padding-left:46px;max-width:760px;margin:0 auto}
.tl-rail{position:absolute;left:13px;top:6px;bottom:6px;width:2px;background:var(--c-border)}
.tl-rail::after{content:"";position:absolute;inset:0;
  background:linear-gradient(var(--c-primary),var(--c-accent));
  transform:scaleY(var(--p,0));transform-origin:50% 0}
.tl-item{position:relative;padding:0 0 46px}
.tl-item:last-child{padding-bottom:0}
.tl-item::before{content:"";position:absolute;left:-40px;top:7px;width:12px;height:12px;
  border-radius:50%;background:var(--c-bg);border:2px solid var(--c-border);transition:.35s}
.tl-item.on::before{border-color:var(--c-primary);background:var(--c-primary);
  box-shadow:0 0 0 6px color-mix(in srgb,var(--c-primary) 18%,transparent)}
.tl-item small{font-family:Menlo,monospace;font-size:11px;letter-spacing:.14em;color:var(--c-primary)}
.tl-item b{display:block;font-size:17px;margin:2px 0 4px;font-family:var(--font-head)}
.tl-item p{margin:0;color:var(--c-muted);font-size:14px}

/* ---------- 円形マスクで切り替え ---------- */
.clip-box{position:relative;height:100vh;overflow:hidden}
.clip-side{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:0 24px}
.clip-a{background:var(--c-surface)}
.clip-b{background:linear-gradient(140deg,var(--c-primary),var(--c-accent));color:#fff;
  clip-path:circle(var(--r,0%) at 50% 50%)}
.clip-side img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.clip-side .in-txt{position:relative;z-index:2}
.clip-box h3{font-size:clamp(24px,4.6vw,50px);font-weight:800;margin:0;font-family:var(--font-head)}
.clip-box p{margin:10px 0 0;font-size:14.5px;opacity:.85}

/* ---------- 3Dカルーセル ---------- */
.car{perspective:1300px;height:400px;display:grid;place-items:center;cursor:grab;touch-action:pan-y}
.car:active{cursor:grabbing}
.car-in{position:relative;width:220px;height:300px;transform-style:preserve-3d}
.car-it{
  position:absolute;inset:0;border-radius:var(--radius);overflow:hidden;
  border:1px solid var(--c-border);backface-visibility:hidden;
  background:linear-gradient(155deg,color-mix(in srgb,var(--c-primary) 22%,var(--c-bg)),var(--c-surface));
  display:flex;flex-direction:column;justify-content:flex-end;padding:20px
}
.car-it img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.car-it b{position:relative;z-index:2;font-size:15px}
.car-it small{position:relative;z-index:2;font-family:Menlo,monospace;font-size:11px;color:var(--c-muted)}
.car-it:has(img)::after{content:"";position:absolute;inset:0;
  background:linear-gradient(transparent 50%,rgba(0,0,0,.6))}
.car-it:has(img) b,.car-it:has(img) small{color:#fff}

/* ---------- スロット式カウンター ---------- */
.slots{display:grid;gap:24px;text-align:center}
.slot{display:inline-flex;font-family:Menlo,monospace;font-weight:800;
  font-size:clamp(30px,5.4vw,56px);line-height:1.1;overflow:hidden;
  background:linear-gradient(140deg,var(--c-primary),var(--c-accent));
  -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.slot .col{height:1.1em;overflow:hidden}
.slot .col u{display:block;text-decoration:none;transition:transform 1.6s cubic-bezier(.16,1,.3,1)}
.slot .fix{opacity:.6}
.slots small{display:block;color:var(--c-muted);font-size:12.5px;margin-top:6px}

/* ---------- SVG線画 ---------- */
.draw-wrap{max-width:720px;margin:0 auto}
.draw-wrap svg{width:100%;height:auto;overflow:visible}
.draw-wrap path,.draw-wrap line,.draw-wrap rect,.draw-wrap polyline,.draw-wrap circle{
  stroke-dasharray:var(--len);stroke-dashoffset:var(--len);
  transition:stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)}
.draw-wrap.in path,.draw-wrap.in line,.draw-wrap.in rect,
.draw-wrap.in polyline,.draw-wrap.in circle{stroke-dashoffset:0}
.draw-lbl{display:flex;justify-content:space-around;margin-top:14px;font-size:12px;color:var(--c-muted)}

/* ---------- 全画面メッセージ（背景色が変わる） ---------- */
.shift-pane{min-height:100vh;display:grid;place-items:center;text-align:center;padding:0 24px;
  transition:background .8s ease,color .8s ease}
.shift-pane h3{font-size:clamp(24px,4.8vw,52px);margin:0;font-weight:800;font-family:var(--font-head)}
.shift-pane p{margin:12px 0 0;opacity:.72;font-size:14.5px}

@media(max-width:640px){
  .stackcard{height:64vh}
  .tl{padding-left:38px}
  .tl-item::before{left:-32px}
  .car{height:340px}
}

/* ==========================================================
   スライドページ（1スクロール＝1枚めくり）
   ページ全体を乗っ取らず、固定セクションの中でめくる。
   最初と最後まで来たら、そのまま前後のセクションへ流れる。
   ========================================================== */
.slidesec .pin-in{display:block;padding:0}
.sl-stage{position:absolute;inset:0;transition:transform .8s cubic-bezier(.65,0,.35,1)}
.sl{
  position:absolute;left:0;right:0;height:100%;
  transform:translateY(calc(var(--i) * 100%));
  display:grid;grid-template-columns:48% 52%;align-items:center;
  gap:clamp(24px,4vw,64px);padding:0 clamp(24px,7vw,100px)
}
.sl-viz{width:100%;display:grid;place-items:center}
.sl-viz svg{width:100%;max-width:440px;height:auto;overflow:visible}
.sl-no{
  display:block;font-family:Menlo,monospace;font-size:13px;letter-spacing:.24em;
  color:var(--c-primary);margin-bottom:18px
}
.sl-body h3{margin:0 0 16px;font-size:clamp(24px,3.6vw,42px);line-height:1.35;
  font-family:var(--font-head);font-weight:800}
.sl-lead{margin:0 0 22px;color:var(--c-muted);font-size:clamp(14px,1.5vw,16.5px);max-width:34em}
.sl-body ul{list-style:none;margin:0;padding:0;display:grid;gap:11px}
.sl-body li{position:relative;padding-left:24px;font-size:14.5px}
.sl-body li::before{content:"";position:absolute;left:0;top:.62em;width:9px;height:2px;background:var(--c-primary)}
.sl-num{display:block;font-family:Menlo,monospace;font-weight:800;line-height:1.1;
  font-size:clamp(34px,5vw,64px);color:var(--c-primary);margin-bottom:14px}
.sl-num span{font-size:.5em;margin-left:.1em}

/* 右端のドットナビ */
.sl-dots{
  position:absolute;right:clamp(12px,2.6vw,32px);top:50%;transform:translateY(-50%);
  display:flex;flex-direction:column;gap:13px;z-index:6
}
.sl-dots button{
  width:9px;height:9px;padding:0;border:0;border-radius:50%;cursor:pointer;
  background:color-mix(in srgb,currentColor 30%,transparent);transition:.25s
}
.sl-dots button.on{background:var(--c-primary);transform:scale(1.55)}

/* 表示されるたびに最初から再生する */
.sl-viz [data-draw]{stroke-dasharray:var(--len);stroke-dashoffset:var(--len)}
.sl.play .sl-viz [data-draw]{stroke-dashoffset:0;
  transition:stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1) var(--d,0s)}
.sl-viz .bar{transform:scaleY(0);transform-origin:50% 100%}
.sl.play .sl-viz .bar{transform:scaleY(1);
  transition:transform .9s cubic-bezier(.2,.7,.3,1) var(--d,0s)}
.sl-body > *{opacity:0;transform:translateY(16px)}
.sl.play .sl-body > *{opacity:1;transform:none;
  transition:opacity .7s cubic-bezier(.2,.7,.3,1) var(--d,0s),
             transform .7s cubic-bezier(.2,.7,.3,1) var(--d,0s)}

/* スマホは普通の縦積みに戻す */
@media(max-width:768px){
  .slidesec{height:auto!important}
  .slidesec .pin-in{position:static;height:auto;overflow:visible}
  .sl-stage{position:static;transform:none!important;transition:none}
  .sl{position:static;transform:none!important;grid-template-columns:1fr;height:auto;
    padding:clamp(48px,10vw,72px) 24px;gap:28px}
  .sl + .sl{border-top:1px solid var(--c-border)}
  .sl-dots{display:none}
}

/* ---------- ブロックの出現 ---------- */
.rv{opacity:0;transform:translateY(34px);
  transition:opacity .85s cubic-bezier(.2,.7,.3,1),transform .85s cubic-bezier(.2,.7,.3,1)}
.rv.in{opacity:1;transform:none}

/* ---------- レスポンシブ ---------- */
@media(max-width:900px){
  .grid.c3,.grid.c4{grid-template-columns:repeat(2,1fr)}
  .hero.split .hero-in,.about-in,.contact-in{grid-template-columns:1fr}
  .about-in.rev .about-media{order:0}
  .gal{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:640px){
  .sec{padding:56px 0}
  .wrap{padding:0 20px}
  .grid.c2,.grid.c3,.grid.c4{grid-template-columns:1fr}
  .hdr-toggle{display:block}
  .nav{
    display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;
    align-items:stretch;gap:0;background:var(--c-bg);border-bottom:1px solid var(--c-border);
    padding:8px 20px 16px;margin:0
  }
  .nav.open{display:flex}
  .nav a{padding:13px 0;border-bottom:1px solid var(--c-border)}
  .hdr .btn{display:none}
  .hdr-in{height:64px}
  .btn-row .btn{width:100%}
  .ftr-in{flex-direction:column;align-items:flex-start}
}

/* ---------- 動きを減らす設定への配慮 ---------- */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;
    transition-duration:.001ms!important;scroll-behavior:auto!important}
  [data-ta] .ch{opacity:1!important;transform:none!important;filter:none!important;visibility:visible!important}
  [data-ta].ta-fillgrad{background-size:100% 100%,100% 100%!important}
  .ia-on{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}
  .rv{opacity:1!important;transform:none!important}
}
`;

/* 書き出したHTMLでも動く最小限のJS
   ① ハンバーガーメニュー ② 文字アニメーション ③ ブロックの出現 */
const SITE_JS = `
(function(){
  /* ---------- ハンバーガーメニュー ---------- */
  var t=document.querySelector('.hdr-toggle'),n=document.querySelector('.hdr .nav');
  if(t&&n){t.onclick=function(){n.classList.toggle('open')};}
  document.querySelectorAll('.nav a').forEach(function(a){
    a.addEventListener('click',function(){ if(n) n.classList.remove('open'); });
  });

  var d=document, body=d.body;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 見出しを1文字ずつに分割 ---------- */
  function lineTexts(el){
    var lines=[[]];
    [].slice.call(el.childNodes).forEach(function(nd){
      if(nd.nodeName==='BR') lines.push([]);
      else lines[lines.length-1].push(nd.textContent);
    });
    return lines.map(function(p){return p.join('')});
  }

  function split(el, anim){
    var lines = lineTexts(el), i = 0;
    el.textContent = '';
    lines.forEach(function(text){
      var ln = d.createElement('span'); ln.className = 'ln';
      if(anim === 'maskline'){
        var one = d.createElement('span'); one.className = 'ch';
        one.style.setProperty('--i', i++);
        one.textContent = text || ' ';
        ln.appendChild(one);
      } else {
        Array.from(text).forEach(function(c){
          var ch = d.createElement('span'); ch.className = 'ch';
          ch.style.setProperty('--i', i++);
          if(c === ' '){ ch.className += ' sp'; ch.innerHTML = '&nbsp;'; }
          else { ch.textContent = c; ch.setAttribute('data-c', c); }
          if(anim === 'slidealt') ch.style.setProperty('--dir', (i%2 ? '-.9em' : '.9em'));
          if(anim === 'scatter'){
            ch.style.setProperty('--x', ((Math.random()*2-1)*2.4).toFixed(2)+'em');
            ch.style.setProperty('--y', ((Math.random()*2-1)*1.8).toFixed(2)+'em');
            ch.style.setProperty('--r', ((Math.random()*2-1)*90).toFixed(0)+'deg');
          }
          ln.appendChild(ch);
        });
      }
      el.appendChild(ln);
    });
  }

  var RND='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@';
  function runScramble(el){
    var chs=[].slice.call(el.querySelectorAll('.ch'));
    var dur=parseFloat(getComputedStyle(el).getPropertyValue('--ta-dur'))*1000||900;
    var stg=parseFloat(getComputedStyle(el).getPropertyValue('--ta-stagger'))*1000||40;
    chs.forEach(function(c){ c.dataset.final=c.textContent; c.textContent=''; c.style.opacity=1; });
    var step=Math.max(1,Math.round(stg/16)), span=Math.round(dur/16), f=0;
    (function tick(){
      chs.forEach(function(c,i){
        var s=i*step;
        if(f>=s+span) c.textContent=c.dataset.final;
        else if(f>=s) c.textContent=RND[Math.floor(Math.random()*RND.length)];
      });
      if(f++ < chs.length*step+span) requestAnimationFrame(tick);
      else chs.forEach(function(c){ c.textContent=c.dataset.final; });
    })();
  }
  function runType(el){
    var chs=[].slice.call(el.querySelectorAll('.ch'));
    var stg=parseFloat(getComputedStyle(el).getPropertyValue('--ta-stagger'))*1000||40;
    var cur=d.createElement('span'); cur.className='ta-cursor';
    if(el.lastElementChild) el.lastElementChild.appendChild(cur);
    chs.forEach(function(c,i){ c.style.opacity=1;
      setTimeout(function(){ c.classList.add('show'); }, i*Math.max(20,stg)); });
  }

  /* ---------- 準備 ---------- */
  var def = body.getAttribute('data-anim') || 'none';
  var targets = [].slice.call(d.querySelectorAll('[data-ta]'));
  targets.forEach(function(el){
    var a = el.getAttribute('data-anim') || def;
    el.classList.add('ta-' + a);
    if(a === 'none' || reduce){ el.classList.add('in'); return; }
    if(a !== 'fillgrad') split(el, a);
  });

  /* 画像・要素のアニメーション */
  [].slice.call(d.querySelectorAll('[data-ia]')).forEach(function(el){
    var a = el.getAttribute('data-anim');
    if(!a || a === 'none' || reduce) return;
    el.classList.add('ia-on', 'ia-' + a);
  });

  /* 個別の「開始までの待ち」（style属性がぶつからないよう data 属性から反映する） */
  [].slice.call(d.querySelectorAll('[data-delay]')).forEach(function(el){
    var v = el.getAttribute('data-delay') + 'ms';
    el.style.setProperty(el.hasAttribute('data-ia') ? '--ia-delay' : '--ta-delay', v);
  });

  if(body.getAttribute('data-reveal') === '1' && !reduce){
    [].slice.call(d.querySelectorAll('.sec, .hero')).forEach(function(s){ s.classList.add('rv'); });
  }

  /* ==========================================================
     スクロールに連動するブロック
     ========================================================== */
  var clamp = function(v){ return Math.min(1, Math.max(0, v)); };
  function progress(el){
    var r = el.getBoundingClientRect(), t = r.height - innerHeight;
    return t <= 0 ? 0 : clamp(-r.top / t);
  }
  /* scroll は1本の rAF にまとめる（個々に addEventListener しない） */
  var onScroll = [], ticking = false;
  function scrollTick(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){ for(var i=0;i<onScroll.length;i++) onScroll[i](); ticking = false; });
  }
  function watchScroll(fn){ onScroll.push(fn); }

  var css = function(name, fb){
    var v = getComputedStyle(d.documentElement).getPropertyValue(name).trim();
    return v || fb;
  };

  /* ---------- 3D製品ビュー（Canvasに面を1枚ずつ描く） ---------- */
  [].slice.call(d.querySelectorAll('[data-p3d]')).forEach(function(sec){
    var cv = sec.querySelector('canvas'); if(!cv) return;
    var ctx = cv.getContext('2d');
    var degEl = sec.querySelector('.p3d-deg');
    var specs = [].slice.call(sec.querySelectorAll('.p3d-spec div'));
    var turns = parseFloat(sec.getAttribute('data-turns')) || 1;
    var shape = sec.getAttribute('data-shape') || 'slab';
    var dims = shape === 'box' ? [0.95,0.95,0.72] : shape === 'tall' ? [0.62,1.5,0.5] : [0.74,1.36,0.28];
    var edge = shape === 'box' ? 0.22 : 0.30;

    var SEG = 34;
    var sgn = function(t){ return (t<0?-1:1) * Math.pow(Math.abs(t), edge); };
    var verts = [], faces = [];
    for(var i=0;i<=SEG;i++){
      var v = Math.PI*i/SEG;
      for(var j=0;j<=SEG;j++){
        var u = 2*Math.PI*j/SEG;
        verts.push([sgn(Math.sin(v)*Math.cos(u))*dims[0], sgn(Math.cos(v))*dims[1], sgn(Math.sin(v)*Math.sin(u))*dims[2]]);
      }
    }
    var sub=function(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];};
    var cross=function(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];};
    var norm=function(a){var l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};
    var dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];};
    for(var i2=0;i2<SEG;i2++) for(var j2=0;j2<SEG;j2++){
      var a=i2*(SEG+1)+j2, b2=a+1, c2=a+SEG+1, d2=c2+1;
      var n = norm(cross(sub(verts[b2],verts[a]), sub(verts[c2],verts[a])));
      faces.push({ i:[a,b2,d2,c2], n:n,
        ctr:[0,1,2].map(function(k){return (verts[a][k]+verts[b2][k]+verts[c2][k]+verts[d2][k])/4;}),
        screen: n[2] > 0.86 });
    }

    function hex2rgb(h){
      h = (h||'').replace('#','');
      if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      var n = parseInt(h,16);
      return isNaN(n) ? [90,110,140] : [(n>>16)&255,(n>>8)&255,n&255];
    }
    var L1 = norm([0.45,0.75,0.85]), L2 = norm([-0.7,0.15,0.45]), CAM = 4.0;
    var W=0,H=0;
    function size(){
      var dpr = Math.min(devicePixelRatio||1, 2), r = cv.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      cv.width = W*dpr; cv.height = H*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function draw(ay, ax){
      if(!W) return;
      var body = hex2rgb(sec.getAttribute('data-body') || css('--c-muted','#64748b'));
      var face = hex2rgb(sec.getAttribute('data-face') || css('--c-primary','#2563eb'));
      ctx.clearRect(0,0,W,H);
      var cy=Math.cos(ay), sy=Math.sin(ay), cx=Math.cos(ax), sx=Math.sin(ax);
      var rot = function(p){
        var X = p[0]*cy + p[2]*sy, Z = -p[0]*sy + p[2]*cy;
        return [X, p[1]*cx - Z*sx, p[1]*sx + Z*cx];
      };
      var f = W*0.84;
      var P = verts.map(function(v){ var q=rot(v), dd=CAM-q[2];
        return [W/2 + f*q[0]/dd, H/2 - f*q[1]/dd]; });

      var sh = ctx.createRadialGradient(W/2,H*0.87,0,W/2,H*0.87,W*0.34);
      sh.addColorStop(0,'rgba(0,0,0,.18)'); sh.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = sh; ctx.beginPath();
      ctx.ellipse(W/2,H*0.87,W*0.30,H*0.045,0,0,7); ctx.fill();

      var list = [];
      for(var k=0;k<faces.length;k++){
        var fc = faces[k], n = rot(fc.n), c = rot(fc.ctr);
        var view = norm([-c[0],-c[1],CAM-c[2]]);
        if(dot(n,view) <= 0.02) continue;
        list.push({fc:fc, n:n, z:c[2], view:view});
      }
      list.sort(function(a,b){ return a.z-b.z; });
      for(var m=0;m<list.length;m++){
        var o=list[m], n2=o.n;
        var d1 = Math.max(0, dot(n2,L1)), dd2 = Math.max(0, dot(n2,L2));
        var rim = Math.pow(1 - Math.max(0, dot(n2,o.view)), 2.4);
        var base = o.fc.screen ? face : body;
        var lit = 0.28 + d1*0.85 + dd2*0.22 + rim*0.5;
        var col = 'rgb(' + Math.min(255, base[0]*lit|0) + ',' + Math.min(255, base[1]*lit|0) + ',' + Math.min(255, base[2]*lit|0) + ')';
        var idx = o.fc.i;
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(P[idx[0]][0],P[idx[0]][1]); ctx.lineTo(P[idx[1]][0],P[idx[1]][1]);
        ctx.lineTo(P[idx[2]][0],P[idx[2]][1]); ctx.lineTo(P[idx[3]][0],P[idx[3]][1]);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    var target=0, angle=0, tilt=0, tTilt=0, dirty=true, visible=false;
    watchScroll(function(){
      var p = progress(sec);
      target = p * Math.PI * 2 * turns;
      tTilt = Math.sin(p*Math.PI) * 0.3;
      if(degEl) degEl.textContent = String(Math.round((p*360*turns)%360)).padStart(3,'0') + '°';
      specs.forEach(function(el){
        var at = parseFloat(el.getAttribute('data-at')) || 0;
        el.classList.toggle('on', p > at && p < at + 0.24);
      });
      dirty = true;
    });
    if('IntersectionObserver' in window)
      new IntersectionObserver(function(es){ es.forEach(function(e){ visible = e.isIntersecting; dirty = true; }); },
        {threshold:0}).observe(sec);
    else visible = true;
    (function loop(){
      if(visible && (dirty || Math.abs(target-angle) > 0.0006)){
        angle += (target-angle) * (reduce ? 1 : 0.14);
        tilt  += (tTilt-tilt) * (reduce ? 1 : 0.14);
        draw(angle, tilt); dirty = false;
      }
      requestAnimationFrame(loop);
    })();
    size(); addEventListener('resize', function(){ size(); dirty = true; }, {passive:true});
    draw(0,0);
  });

  /* ---------- スライドページ ---------- */
  function countTo(el){
    var to = parseFloat(el.getAttribute('data-count')) || 0;
    var dec = (el.getAttribute('data-count') || '').indexOf('.') >= 0 ? 1 : 0;
    var sfx = el.getAttribute('data-suffix') || '';
    if(reduce){ el.textContent = to.toFixed(dec) + sfx; return; }
    var t0 = null, dur = 1200;
    function step(t){
      if(t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec) + sfx;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function replaySlide(sl){
    sl.classList.remove('play');
    void sl.offsetWidth;                       /* いったん巻き戻してから再生する */
    sl.classList.add('play');
    var c = sl.querySelector('[data-count]');
    if(c) countTo(c);
  }

  [].slice.call(d.querySelectorAll('[data-slides]')).forEach(function(sec){
    var stage = sec.querySelector('.sl-stage');
    var slides = [].slice.call(sec.querySelectorAll('.sl'));
    var dots = [].slice.call(sec.querySelectorAll('.sl-dots button'));
    var n = slides.length, cur = -1;
    if(!n) return;
    var isNarrow = function(){ return matchMedia('(max-width:768px)').matches; };

    /* SVGの線の長さを測る */
    [].slice.call(sec.querySelectorAll('.sl-viz [data-draw]')).forEach(function(el){
      try{ el.style.setProperty('--len', Math.ceil(el.getTotalLength())); }catch(e){}
    });

    function show(i){
      if(i === cur) return;
      cur = i;
      stage.style.transform = 'translateY(' + (-i * 100) + '%)';
      dots.forEach(function(b, k){ b.classList.toggle('on', k === i); });
      replaySlide(slides[i]);
    }
    watchScroll(function(){
      if(isNarrow()) return;
      var r = sec.getBoundingClientRect();
      if(r.bottom < 0 || r.top > innerHeight) return;
      show(Math.max(0, Math.min(n - 1, Math.round(progress(sec) * (n - 1)))));
    });
    dots.forEach(function(b, k){
      b.addEventListener('click', function(){
        var top = sec.getBoundingClientRect().top + (window.pageYOffset || d.documentElement.scrollTop);
        var span = sec.offsetHeight - innerHeight;
        scrollTo({ top: top + span * (n > 1 ? k / (n - 1) : 0), behavior: 'smooth' });
      });
    });
    /* スマホでは画面に入るたびに再生する */
    if('IntersectionObserver' in window){
      var io2 = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting && isNarrow()) replaySlide(e.target); });
      }, {threshold:.35});
      slides.forEach(function(s){ io2.observe(s); });
    }
    if(isNarrow()) slides.forEach(function(s){ s.classList.add('play'); });
  });

  /* ---------- 分解図 ---------- */
  [].slice.call(d.querySelectorAll('[data-exploded]')).forEach(function(sec){
    var inner = sec.querySelector('.exp-in'); if(!inner) return;
    var plates = [].slice.call(inner.querySelectorAll('.exp-l'));
    watchScroll(function(){
      var r = sec.getBoundingClientRect();
      if(r.bottom < -200 || r.top > innerHeight + 200) return;
      var p = progress(sec), gap = (1-p) * 150;
      plates.forEach(function(el, i){
        var k = i - (plates.length-1)/2;
        el.style.transform = 'translateZ(' + (k*(30+gap)) + 'px) translateY(' + (k*gap*0.34) + 'px)';
        el.style.opacity = 0.6 + p*0.4;
      });
      inner.style.transform = 'rotateX(' + (58 - p*46) + 'deg) rotateZ(' + (-28 + p*28) + 'deg)';
    });
  });

  /* ---------- 横に流れるギャラリー ---------- */
  [].slice.call(d.querySelectorAll('[data-hscroll]')).forEach(function(sec){
    var track = sec.querySelector('.hs-track'); if(!track) return;
    watchScroll(function(){
      var dist = track.scrollWidth - innerWidth + innerWidth*0.12;
      track.style.transform = dist <= 0 ? '' : 'translate3d(' + (-dist * progress(sec)) + 'px,0,0)';
    });
  });

  /* ---------- 積み重なるカード ---------- */
  [].slice.call(d.querySelectorAll('[data-stack]')).forEach(function(sec){
    var cards = [].slice.call(sec.querySelectorAll('.stackcard'));
    watchScroll(function(){
      cards.forEach(function(c, i){
        var next = cards[i+1];
        if(!next){ c.style.transform=''; c.style.filter=''; return; }
        /* sticky で止まった要素は自分の top が動かないので、
           次のカードがどれだけ覆ってきたかで測る */
        var passed = clamp(1 - (next.getBoundingClientRect().top - c.getBoundingClientRect().top) / c.offsetHeight);
        c.style.transform = 'scale(' + (1 - passed*0.1) + ')';
        c.style.filter = 'brightness(' + (1 - passed*0.3) + ')';
      });
    });
  });

  /* ---------- タイムライン ---------- */
  [].slice.call(d.querySelectorAll('[data-timeline]')).forEach(function(sec){
    var rail = sec.querySelector('.tl-rail');
    var items = [].slice.call(sec.querySelectorAll('.tl-item'));
    if(!rail) return;
    watchScroll(function(){
      var r = rail.getBoundingClientRect();
      rail.style.setProperty('--p', clamp((innerHeight*0.55 - r.top) / r.height));
      items.forEach(function(it){
        it.classList.toggle('on', it.getBoundingClientRect().top < innerHeight*0.62);
      });
    });
  });

  /* ---------- 円形マスク ---------- */
  [].slice.call(d.querySelectorAll('[data-clip]')).forEach(function(sec){
    var b2 = sec.querySelector('.clip-b'); if(!b2) return;
    watchScroll(function(){ b2.style.setProperty('--r', (progress(sec)*82) + '%'); });
  });

  /* ---------- 3Dカルーセル ---------- */
  [].slice.call(d.querySelectorAll('.car')).forEach(function(box){
    var inner = box.querySelector('.car-in'); if(!inner) return;
    var items = [].slice.call(inner.children), N = items.length;
    if(!N) return;
    var R = Math.round(130 / Math.tan(Math.PI / N)) || 300;
    items.forEach(function(el, i){
      el.style.transform = 'rotateY(' + (i*360/N) + 'deg) translateZ(' + R + 'px)';
    });
    var angle = 0, vel = 0.12, dragging = false, last = 0, idle = true, visible = false;
    var apply = function(){ inner.style.transform = 'rotateY(' + angle + 'deg)'; };
    box.addEventListener('pointerdown', function(e){
      dragging = true; idle = false; last = e.clientX; vel = 0;
      try{ box.setPointerCapture(e.pointerId); }catch(err){}
    });
    box.addEventListener('pointermove', function(e){
      if(!dragging) return;
      vel = (e.clientX - last) * 0.28; angle += vel; last = e.clientX; apply();
    });
    var up = function(){ dragging = false; setTimeout(function(){ idle = true; }, 1400); };
    box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
    if('IntersectionObserver' in window)
      new IntersectionObserver(function(es){ es.forEach(function(e){ visible = e.isIntersecting; }); },
        {threshold:0}).observe(box);
    else visible = true;
    (function spin(){
      if(visible && !reduce && !dragging){
        if(Math.abs(vel) > 0.02){ vel *= 0.94; angle += vel; apply(); }
        else if(idle){ angle += 0.12; apply(); }
      }
      requestAnimationFrame(spin);
    })();
    apply();
  });

  /* ---------- スロット式カウンター ---------- */
  function runSlot(el){
    if(el.dataset.done) return;
    el.dataset.done = '1';
    var text = el.getAttribute('data-slot') || '';
    var html = '';
    Array.from(text).forEach(function(c, i){
      if(!/[0-9]/.test(c)){ html += '<span class="fix">' + c + '</span>'; return; }
      var col = '';
      for(var n=0;n<=9;n++) col += n + (n<9 ? '<br>' : '');
      html += '<span class="col"><u data-d="' + c + '" style="transition-delay:' + (i*90) + 'ms">' + col + '</u></span>';
    });
    el.innerHTML = html;
    requestAnimationFrame(function(){
      [].slice.call(el.querySelectorAll('u')).forEach(function(u){
        u.style.transform = reduce ? 'translateY(' + (-(+u.dataset.d)*1.1) + 'em)'
                                   : 'translateY(' + (-(+u.dataset.d)*1.1) + 'em)';
      });
    });
  }

  /* ---------- SVG線画（線の長さを測る） ---------- */
  [].slice.call(d.querySelectorAll('.draw-wrap')).forEach(function(w){
    [].slice.call(w.querySelectorAll('path,line,rect,polyline,circle')).forEach(function(el){
      try{ el.style.setProperty('--len', Math.ceil(el.getTotalLength())); }catch(e){}
    });
  });

  if(onScroll.length){
    addEventListener('scroll', scrollTick, {passive:true});
    addEventListener('resize', scrollTick, {passive:true});
    scrollTick();
  }

  /* ---------- 画面に入ったら再生 ---------- */
  var watch = [].slice.call(d.querySelectorAll('[data-ta]:not(.in), .ia-on, .rv, .draw-wrap, [data-slot]'));
  if(!('IntersectionObserver' in window) || reduce){
    watch.forEach(function(el){ el.classList.add('in'); if(el.hasAttribute('data-slot')) runSlot(el); });
  }else{
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        if(el.classList.contains('ta-scramble')) runScramble(el);
        if(el.classList.contains('ta-type'))     runType(el);
        if(el.hasAttribute('data-slot'))         runSlot(el);
        io.unobserve(el);
      });
    }, {threshold:.15, rootMargin:'0px 0px -6% 0px'});
    watch.forEach(function(el){ io.observe(el); });
  }
})();
`;
