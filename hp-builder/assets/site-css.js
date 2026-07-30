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
.sec.bg-primary{background:var(--c-primary);color:#fff}
.sec.bg-dark{background:var(--c-dark);color:#fff}
.sec.bg-primary .sec-sub,.sec.bg-dark .sec-sub{color:rgba(255,255,255,.75)}
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
  background:var(--c-primary);color:#fff;font-weight:700;font-size:15px;
  border:1.5px solid transparent;cursor:pointer;
  transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease;
  box-shadow:0 6px 20px -8px var(--c-primary)
}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px -10px var(--c-primary)}
.btn.ghost{background:transparent;color:inherit;border-color:currentColor;box-shadow:none;opacity:.9}
.btn.ghost:hover{opacity:1;box-shadow:none}
.btn.accent{background:var(--c-accent);box-shadow:0 6px 20px -8px var(--c-accent)}
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
  border-radius:50%;background:var(--c-primary);color:#fff;font-weight:800;margin-bottom:16px
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
  background:var(--c-primary);color:#fff;font-size:12px;font-weight:700;
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
.ftr{background:var(--c-dark);color:rgba(255,255,255,.72);padding:56px 0 32px;font-size:14px}
.ftr-in{display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between}
.ftr .logo{color:#fff;font-size:17px}
.ftr-nav{display:flex;flex-wrap:wrap;gap:22px}
.ftr-nav a{transition:color .15s}
.ftr-nav a:hover{color:#fff}
.copy{margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,.12);font-size:12.5px;opacity:.7}

/* ---------- テンプレート別の味付け ---------- */
.sec-title,.hero-title,.logo,.plan h3,.card h3{font-family:var(--font-head)}
.tpl-shop .card{text-align:center}
.tpl-studio .hero-title{letter-spacing:-.02em}
.tpl-studio .card{background:transparent}
.tpl-studio .nav a{color:rgba(255,255,255,.7)}
.tpl-studio .hdr{border-bottom-color:rgba(255,255,255,.12)}

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
`;

/* 書き出したHTMLでも動く最小限のJS（ハンバーガーメニュー） */
const SITE_JS = `
(function(){
  var t=document.querySelector('.hdr-toggle'),n=document.querySelector('.hdr .nav');
  if(t&&n){t.onclick=function(){n.classList.toggle('open')};}
  document.querySelectorAll('.nav a').forEach(function(a){
    a.addEventListener('click',function(){ if(n) n.classList.remove('open'); });
  });
})();
`;
