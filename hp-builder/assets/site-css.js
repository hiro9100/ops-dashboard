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
[data-ta].ta-fadeup.in .ch{animation:ta-fadeup var(--ta-dur) var(--ta-ease) calc(var(--i)*var(--ta-stagger)) both}

[data-ta].ta-maskline .ln{overflow:hidden;padding-bottom:.08em}
@keyframes ta-maskline{from{transform:translateY(110%)}to{transform:none}}
[data-ta].ta-maskline.in .ch{animation:ta-maskline var(--ta-dur) var(--ta-ease) calc(var(--i)*var(--ta-stagger)) both}

@keyframes ta-blur{from{opacity:0;filter:blur(18px);transform:scale(1.18)}to{opacity:1;filter:blur(0);transform:none}}
[data-ta].ta-blur.in .ch{animation:ta-blur var(--ta-dur) var(--ta-ease) calc(var(--i)*var(--ta-stagger)) both}

[data-ta].ta-flip3d .ln{perspective:700px}
@keyframes ta-flip3d{from{opacity:0;transform:rotateX(-95deg)}to{opacity:1;transform:none}}
[data-ta].ta-flip3d.in .ch{transform-origin:50% 100%;
  animation:ta-flip3d var(--ta-dur) var(--ta-ease) calc(var(--i)*var(--ta-stagger)) both}

@keyframes ta-drop{from{opacity:0;transform:translateY(-.9em) rotate(-26deg)}to{opacity:1;transform:none}}
[data-ta].ta-drop.in .ch{animation:ta-drop var(--ta-dur) var(--ta-ease) calc(var(--i)*var(--ta-stagger)) both}

@keyframes ta-bounce{
  0%{opacity:0;transform:translateY(-1.3em) scale(.55)}
  55%{opacity:1;transform:translateY(.14em) scale(1.08)}
  75%{transform:translateY(-.06em) scale(.97)}
  100%{opacity:1;transform:none}}
[data-ta].ta-bounce.in .ch{animation:ta-bounce var(--ta-dur) var(--ta-ease) calc(var(--i)*var(--ta-stagger)) both}

@keyframes ta-slidealt{from{opacity:0;transform:translateX(var(--dir,-.8em))}to{opacity:1;transform:none}}
[data-ta].ta-slidealt.in .ch{animation:ta-slidealt var(--ta-dur) var(--ta-ease) calc(var(--i)*var(--ta-stagger)) both}

@keyframes ta-scatter{
  from{opacity:0;transform:translate(var(--x,0),var(--y,0)) rotate(var(--r,0deg)) scale(.35)}
  to{opacity:1;transform:none}}
[data-ta].ta-scatter.in .ch{animation:ta-scatter var(--ta-dur) var(--ta-ease) calc(var(--i)*var(--ta-stagger)) both}

@keyframes ta-neon{
  0%{opacity:.15;text-shadow:none}
  12%{opacity:1;text-shadow:0 0 6px var(--c-primary),0 0 18px var(--c-primary)}
  16%{opacity:.25;text-shadow:none}
  22%{opacity:1;text-shadow:0 0 6px var(--c-primary),0 0 18px var(--c-primary)}
  28%{opacity:.4;text-shadow:none}
  36%,100%{opacity:1;text-shadow:0 0 8px var(--c-primary),0 0 26px var(--c-primary),0 0 48px var(--c-primary)}}
[data-ta].ta-neon.in .ch{animation:ta-neon var(--ta-dur) linear calc(var(--i)*var(--ta-stagger)) both}

[data-ta].ta-fillgrad{
  background:linear-gradient(100deg,var(--c-primary),var(--c-accent)) 0 0/0% 100% no-repeat,
             linear-gradient(var(--c-muted),var(--c-muted));
  -webkit-background-clip:text;background-clip:text;
  color:transparent;-webkit-text-fill-color:transparent}
@keyframes ta-fillgrad{from{background-size:0% 100%,100% 100%}to{background-size:100% 100%,100% 100%}}
[data-ta].ta-fillgrad.in{animation:ta-fillgrad var(--ta-dur) var(--ta-ease) both}

/* スクランブル・タイプライターはJSで動かす */
[data-ta].ta-type .ch{visibility:hidden}
[data-ta].ta-type .ch.show{visibility:visible}
.ta-cursor{display:inline-block;width:.06em;height:1em;background:currentColor;
  vertical-align:-.12em;margin-left:.04em;animation:ta-blink .9s steps(1) infinite}
@keyframes ta-blink{0%,49%{opacity:1}50%,100%{opacity:0}}

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

  if(body.getAttribute('data-reveal') === '1' && !reduce){
    [].slice.call(d.querySelectorAll('.sec, .hero')).forEach(function(s){ s.classList.add('rv'); });
  }

  /* ---------- 画面に入ったら再生 ---------- */
  var watch = [].slice.call(d.querySelectorAll('[data-ta]:not(.in), .rv'));
  if(!('IntersectionObserver' in window) || reduce){
    watch.forEach(function(el){ el.classList.add('in'); });
  }else{
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        if(el.classList.contains('ta-scramble')) runScramble(el);
        if(el.classList.contains('ta-type'))     runType(el);
        io.unobserve(el);
      });
    }, {threshold:.15, rootMargin:'0px 0px -6% 0px'});
    watch.forEach(function(el){ io.observe(el); });
  }
})();
`;
