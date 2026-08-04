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
/* 最後の行に1〜2文字だけ取り残されると、素人くさい見た目になる。
   日本語は単語の切れ目が無いぶん、この差が出やすい。
   短いリード文は行の長さをそろえ、長い本文は短い最終行を避ける。 */
h1,h2,h3,.hero-title,.sec-title,.hero-text,.sec-sub,.about-body p,.card p,.mi dt{
  text-wrap:balance}
/* 長文を貼られる場所は balance が効かなくなるので pretty にしておく */
.rich p,.faq .a{text-wrap:pretty}
p:last-child{margin-bottom:0}

.wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 24px}

/* 画像がまだ設定されていない場所の目印 */
.ph{width:100%;height:100%;display:grid;place-items:center}
.ph::before{content:"IMAGE";font-size:11px;font-weight:800;letter-spacing:.22em;opacity:.4}
.hero-media > .ph::before,.about-media > .ph::before{color:#fff;opacity:.8}

/* ---------- セクション共通 ---------- */
.sec{padding:clamp(56px,6.6667vw,133.3333px) 0;position:relative}
/* 地の色は、ふつうの段（.sec）だけでなくヒーローにも効かせる。
   ヒーローにも「背景色」の欄はあるのに、ここに .hero が無かったせいで
   何も起きていなかった（テンプレートの1つが bg:'dark' を当てにしている）。 */
.sec.bg-surface,.hero.bg-surface{background:var(--c-surface)}
.sec.bg-primary,.hero.bg-primary{background:var(--c-primary);color:var(--c-on-primary,#fff)}
.sec.bg-dark,.hero.bg-dark{background:var(--c-dark);color:var(--c-on-dark,#fff)}
.sec.bg-primary .sec-sub,.hero.bg-primary .hero-text{color:color-mix(in srgb,var(--c-on-primary,#fff) 72%,transparent)}
.sec.bg-dark .sec-sub,.hero.bg-dark .hero-text{color:color-mix(in srgb,var(--c-on-dark,#fff) 72%,transparent)}
@supports not (color:color-mix(in srgb,red,blue)){
  .hero.bg-primary .hero-text,.hero.bg-dark .hero-text{color:inherit;opacity:.78}
}
.sec.bg-primary .card,.sec.bg-dark .card{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18)}

.sec-head{max-width:760px;margin:0 auto clamp(32px,3.8889vw,77.7778px);text-align:center}
.sec-head.left{text-align:left;margin-left:0}
.eyebrow{
  display:inline-block;margin:0 0 12px;font-size:12px;font-weight:700;
  letter-spacing:.18em;text-transform:uppercase;color:var(--c-primary)
}
.bg-primary .eyebrow,.bg-dark .eyebrow{color:var(--c-accent)}
.sec-title{
  margin:0 0 14px;font-size:clamp(24px,2.5vw,50px);line-height:1.4;
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
.hdr.sticky{position:sticky;top:0}
/* 固定しているときは、下の中身が透けたほうが窮屈にならない。
   これは line（既定）だけの振る舞い。ほかの型は自分の地を持っている。 */
.hdr.bar-line.sticky{background:color-mix(in srgb,var(--c-bg) 86%,transparent);backdrop-filter:blur(12px)}
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
.hero{position:relative;overflow:hidden;padding:clamp(64px,8.3333vw,166.6667px) 0}
.hero.center{text-align:center}
.hero-in{position:relative;z-index:2}
.hero-title{margin:0 0 20px;font-size:clamp(30px,3.8889vw,77.7778px);line-height:1.28;letter-spacing:.01em;font-weight:800}
.hero-text{margin:0;font-size:clamp(15px,1.25vw,25px);color:var(--c-muted);max-width:620px}
.hero.center .hero-text{margin-inline:auto}
.hero-media{
  border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3;
  background:linear-gradient(135deg,var(--c-primary),var(--c-accent));
  box-shadow:0 30px 60px -30px rgba(15,23,42,.45)
}
.hero-media img{width:100%;height:100%;object-fit:cover}
/* 中央ぞろえ・左ぞろえに写真を入れたときの置き場所。
   文章の下に、横いっぱいの一枚を置く。 */
.hero-media.hero-wide{margin-top:clamp(28px,3.4vw,56px);aspect-ratio:16/7}
.hero.center .hero-media.hero-wide{margin-inline:auto}
.hero.split .hero-in,.hero.pack .hero-in{display:grid;grid-template-columns:1.02fr .98fr;gap:clamp(32px,4.4444vw,88.8889px);align-items:center}
.hero.split .hero-title{font-size:clamp(28px,2.9167vw,58.3333px)}
/* ---------- 商品パッケージ ----------
   売っているのが1つの商品のとき、いちばん大きいのは品名。
   左右ならびのまま、品名だけをうんと大きくして、まわりに短い言葉を置く。
   写真は縦長にする。棚に置いてあるものは、たいてい縦に長い。 */
.hero.pack .hero-in{grid-template-columns:1.2fr .8fr}
/* 品名は長くなりがち。目いっぱい大きくすると、改行を入れてある行まで
   はみ出して折り返す。9文字くらいは1行に入る大きさで止める。 */
.hero.pack .hero-title{
  font-size:clamp(31px,4.3vw,86px);line-height:1.14;letter-spacing:-.005em;
  margin-bottom:clamp(12px,1.8vh,22px)
}
.hero.pack .eyebrow{font-size:clamp(12px,1.05vw,19px);letter-spacing:.24em;margin-bottom:clamp(10px,1.6vh,20px)}
.hero.pack .hero-text{font-size:clamp(14px,1.1vw,20px)}
/* 枠は「幅を先に決めて、高さを比で出す」。align-items:center の中では
   高さが中身なりに縮むので、width を書かないと逆算されて細長くなる
   （実測 48px になった）。 */
.hero.pack .hero-media{
  width:100%;aspect-ratio:3/4;background:none;box-shadow:none;border-radius:0;
  max-width:clamp(200px,26vw,420px);margin-left:auto
}
.hero.pack .hero-media img{object-fit:contain}
/* 写真がまだ無いあいだは、置き場所が分かるように枠を出しておく */
.hero.pack .hero-media:has(.ph){
  background:color-mix(in srgb,currentColor 7%,transparent);
  outline:1px dashed color-mix(in srgb,currentColor 24%,transparent);
  outline-offset:-1px;border-radius:var(--radius)
}
@supports not (color:color-mix(in srgb,red,blue)){
  .hero.pack .hero-media:has(.ph){background:rgba(128,128,128,.09)}
}
@media(max-width:760px){
  .hero.pack .hero-in{grid-template-columns:1fr}
  .hero.pack .hero-media{max-width:min(72vw,320px);margin:clamp(20px,3vh,32px) auto 0}
}
.hero.cover{color:#fff}
.hero.cover .hero-text{color:rgba(255,255,255,.92)}
/* 平らな暗幕だけでは、写真の明るい部分で文字が読めなくなる。
   文字が乗る真ん中だけをもう一段落として、写真の四隅は明るいまま残す。 */
.hero.cover::before{
  content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(125% 85% at 50% 50%,rgba(0,0,0,.36),rgba(0,0,0,0) 74%)
}
.hero.cover .hero-title,.hero.cover .hero-text{text-shadow:0 1px 20px rgba(0,0,0,.5)}
.hero-bg{position:absolute;inset:0;z-index:0;background:linear-gradient(135deg,var(--c-primary),var(--c-accent))}
.hero-bg img,.hero-bg video{width:100%;height:100%;object-fit:cover;display:block}
.hero-bg::after{content:"";position:absolute;inset:0;background:var(--hero-overlay,rgba(15,23,42,.55))}
.hero.center.cover .hero-in,.hero.left.cover .hero-in{padding:clamp(24px,3.3333vw,66.6667px) 0}

/* ==========================================================
   ヒーローの型（3つ）
   ========================================================== */

/* ---------- 動画＋色の帯（ribbon） ----------
   後ろに動画か写真、その上に薄い色の膜、さらに1本の帯を縦に通す。

   帯は枠より背を高くして、下へはみ出させる。ヒーローの底で切れると
   「ここで終わり」に見えるが、切れずに続くと、下の段まで地続きに見える。
   その代わり overflow:hidden をヒーローに残したままにして、
   横へはみ出す分だけは切る。 */
/* 帯だけは、ヒーローの底で切らずに下の段まで伸ばす。そこがこの型の要。
   だから overflow は切らない。代わりに帯を枠の幅ぴったりに収めて、
   横へはみ出さないようにする（横に出るとページ全体が横スクロールする）。 */
.hero.ribbon{padding:0;overflow:visible}
.hero.ribbon .hero-in{
  display:block;min-height:auto;
  padding:clamp(40px,7vh,110px) 0 clamp(56px,9vh,140px)
}
.rib-1{
  min-height:min(78svh,760px);display:grid;align-content:center;justify-items:center;
  text-align:center
}
.rib-2{
  max-width:min(760px,92%);margin-inline:auto;text-align:left;
  padding-top:clamp(24px,5vh,80px)
}
/* この型だけは明朝で組む。上品さの半分は書体から来ていて、
   ゴシックにすると同じ配置でもただの写真になる。 */
.hero.ribbon .hero-title{
  font-family:"Hiragino Mincho ProN","Yu Mincho",YuMincho,"Noto Serif JP",Georgia,serif;
  font-weight:400;letter-spacing:.02em;
  font-size:clamp(38px,6.6vw,132px);line-height:1.2
}
/* 写真も動画もまだ無いあいだの地。ほかの色を混ぜず、同じ色の濃淡で沈める */
.hero.ribbon .hero-bg{
  background:linear-gradient(163deg,
    color-mix(in srgb,var(--c-primary) 34%,#0b0f14),
    color-mix(in srgb,var(--c-primary) 12%,#0b0f14) 62%,
    #0b0f14)
}
@supports not (color:color-mix(in srgb,red,blue)){
  .hero.ribbon .hero-bg{background:linear-gradient(163deg,var(--c-dark),#0b0f14)}
}
.hero.ribbon .hero-text{
  color:#fff;max-width:none;font-size:clamp(15px,1.35vw,26px);line-height:2.05;
  text-shadow:0 1px 18px rgba(0,0,0,.45)
}
.hero.ribbon .hero-marks,.hero.ribbon .btn-row{justify-content:flex-start}
/* 帯。地の色を薄く敷いて、下地の動画を透かす */
.rib{
  position:absolute;left:0;right:0;top:0;bottom:-16%;z-index:1;pointer-events:none;
  color:var(--c-primary);opacity:.42;mix-blend-mode:multiply;
  /* 下の段へ出たぶんは、そのまま消えていく。切り口が出ると
     「はみ出した」だけに見えて、続いているようには見えない */
  -webkit-mask-image:linear-gradient(#000 76%,rgba(0,0,0,.35) 90%,transparent);
  mask-image:linear-gradient(#000 76%,rgba(0,0,0,.35) 90%,transparent)
}
.rib svg{display:block;width:100%;height:100%}
.rib path{fill:currentColor}
/* 掛け合わせが効かない環境では、そのまま重ねる（少し薄くする） */
@supports not (mix-blend-mode:multiply){ .rib{opacity:.3} }
/* いちばん下の合図。「( Scroll )」 */
.hsign{
  position:absolute;right:clamp(16px,4vw,64px);bottom:clamp(18px,4vh,52px);z-index:4;
  font-size:clamp(11px,.95vw,16px);font-weight:600;letter-spacing:.18em;
  color:inherit;opacity:.85;pointer-events:none
}
.hsign::after{
  content:"";display:block;width:1px;height:clamp(28px,4vh,54px);margin:10px auto 0;
  background:currentColor;opacity:.5;
  transform-origin:top;animation:hsign 2.4s ease-in-out infinite
}
@keyframes hsign{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
.hsign-low{right:auto;left:clamp(16px,4vw,64px);letter-spacing:.24em;font-weight:500}

/* ---------- ロゴ抜き（mark） ----------
   地の色をひと面ぶん敷き、その上をロゴの形で抜く。抜いた下は動く
   グラデーション。形の中だけを色がゆっくり流れる。

   色は「同じ色の濃淡＋アクセント」だけにする。関係のない色を混ぜると
   とたんに安く見える。 */
.hero.mark{
  overflow:hidden;background:var(--c-primary);color:var(--c-on-primary,#fff);
  padding:clamp(56px,9vw,150px) 0
}
.hero.mark .hero-in{position:relative;z-index:2;min-height:min(70svh,720px);
  display:grid;align-content:center}
.mrk{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1;
  width:min(84%,820px);aspect-ratio:60/44;pointer-events:none;
  -webkit-mask-image:var(--mark);mask-image:var(--mark);
  -webkit-mask-size:contain;mask-size:contain;
  -webkit-mask-position:center;mask-position:center;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
  /* 同じ色の濃淡だけで流す。ほかの色を混ぜると、とたんに安く見える */
  background:linear-gradient(118deg,
    color-mix(in srgb,var(--c-primary) 26%,#fff) 0%,
    color-mix(in srgb,var(--c-primary) 72%,#fff) 24%,
    color-mix(in srgb,var(--c-primary) 62%,#000) 52%,
    color-mix(in srgb,var(--c-primary) 80%,#fff) 76%,
    color-mix(in srgb,var(--c-primary) 22%,#fff) 100%);
  background-size:300% 300%;
  animation:mrkflow 17s ease-in-out infinite
}
@supports not (color:color-mix(in srgb,red,blue)){
  .mrk{background:linear-gradient(118deg,var(--c-primary),var(--c-dark) 52%,var(--c-primary))}
}
@keyframes mrkflow{
  0%,100%{background-position:0% 30%}
  50%{background-position:100% 70%}
}
/* 見出しも小見出しも、地の上では同じ色にそろえる。片方だけ白いと
   別々のものに見える */
.hero.mark .eyebrow{
  color:var(--c-text);opacity:.92;font-weight:800;letter-spacing:.06em;
  font-size:clamp(13px,1.35vw,26px)
}
.hero.mark .hero-title{
  font-size:clamp(38px,7.4vw,148px);line-height:1.06;letter-spacing:-.01em;font-weight:900;
  color:var(--c-text)
}
.hero.mark .hero-text{color:var(--c-text);opacity:.86;max-width:56ch}
@media(prefers-reduced-motion:reduce){
  .mrk{animation:none}
  .hsign::after{animation:none;transform:scaleY(.7)}
}

/* ---------- 線のかたち（lineart） ----------
   細い線を何十本もずらして重ねる。面ではなく「気配」になるので、
   白い地に置いても品が落ちない。線は必ず地の文字色から作る。 */
.hero.lineart{
  overflow:hidden;padding:clamp(64px,10vw,180px) 0 clamp(80px,12vw,200px)
}
.hero.lineart .hero-in{position:relative;z-index:2;min-height:min(74svh,760px);
  display:grid;align-content:center}
.lart{position:absolute;inset:0;z-index:1;pointer-events:none;color:var(--c-text);opacity:.22}
.lart svg{display:block;width:100%;height:100%}
.lart path{fill:none;stroke:currentColor;stroke-width:.8;vector-effect:non-scaling-stroke}
.lart-fan path{stroke-width:.6}
.hero.lineart .hero-title{
  font-size:clamp(30px,4.6vw,92px);line-height:1.42;letter-spacing:.01em;font-weight:500
}
.hero.lineart .hero-text{font-size:clamp(14px,1.15vw,22px);line-height:2;max-width:52ch}
.hero.lineart .eyebrow{
  font-family:var(--font-mono,"SF Mono",Menlo,Consolas,monospace);
  letter-spacing:.12em;text-transform:none;color:var(--c-muted)
}
@media(max-width:640px){
  .rib-1{min-height:min(66svh,560px)}
  .hero.mark .hero-in,.hero.lineart .hero-in{min-height:min(62svh,560px)}
  .mrk{width:124%}
}

/* ---------- 丸い印と、帯のラベル ----------
   パッケージに貼ってあるような、ひと目で伝わる短い言葉。
   文字の色は地に従う（currentColor）ので、濃い地でも薄い地でも読める。 */
.hero-marks{
  display:flex;align-items:center;gap:clamp(14px,1.8vw,30px);
  flex-wrap:wrap;margin-top:clamp(22px,3vh,38px)
}
.hero.center .hero-marks{justify-content:center}
.hero-badge{
  position:relative;flex:0 0 auto;display:grid;place-items:center;
  width:clamp(88px,8vw,132px);aspect-ratio:1/1;
  border-radius:50%;background:var(--c-accent);color:var(--c-on-accent,#fff)
}
.hero-badge svg{position:absolute;inset:0;width:100%;height:100%}
.hb-ring{fill:none;stroke:currentColor;stroke-width:1;opacity:.5}
.hb-arc{
  fill:currentColor;font-size:10px;font-weight:700;letter-spacing:.2em;
  text-anchor:middle;opacity:.85
}
/* 弧の上に乗せるので、少し下げないと線から浮いて見える */
.hb-arc textPath{dominant-baseline:hanging}
.hero-badge b{
  position:relative;display:flex;flex-direction:column;align-items:center;
  line-height:1.25;font-weight:800;letter-spacing:.02em;text-align:center
}
.hero-badge b i{font-style:normal}
.hero-tag{
  display:inline-block;flex:0 0 auto;
  background:var(--c-primary);color:var(--c-on-primary,#fff);
  border-radius:999px;padding:clamp(9px,1.2vh,14px) clamp(18px,2vw,34px);
  font-size:clamp(13px,1.05vw,17px);font-weight:700;line-height:1.5
}
/* 濃い地・写真の上では、地の色をそのまま使うと沈む。文字の色で抜く */
.hero.cover .hero-tag{background:var(--c-bg);color:var(--c-text)}
.hero.cover .hero-badge{background:var(--c-bg);color:var(--c-text)}
@media(max-width:560px){
  .hero-badge{width:82px}
  .hero-badge b{font-size:15px}
}

/* ---------- 溶け落ちる縁（メルト） ----------
   下の段の地の色を、ヒーローの下からすくい上げた形。色は currentColor
   ひとつだけにしてある。ヒーロー側の配色が何であれ、下の段とは必ず
   同じ色になるので、継ぎ目が出ない。

   枠は viewBox と同じ比（1200:120）にする。高さを別に決めて横だけ
   伸ばすと、しずくが平たいタブに化ける。深さを変えたいときは、
   下を軸にして縦へ伸ばす（--melt-d）。transform は場所を取らないので、
   深くしてもヒーローの高さは変わらず、上へ食い込むだけになる。 */
.melt{
  position:absolute;left:-1px;right:-1px;bottom:-1px;z-index:3;pointer-events:none;
  aspect-ratio:1200/120;height:auto;
  transform:scaleY(var(--melt-d,1));transform-origin:bottom;
  color:var(--c-bg);line-height:0
}
.melt svg{display:block;width:100%;height:100%}
.melt path{fill:currentColor}
/* 持ち込んだ形。パスの代わりに、読み込んだ画像で色を抜く。
   下ぞろえにするのは、縁の形が下端に来ているとはかぎらないため。 */
.melt-own{
  background:currentColor;
  -webkit-mask-image:var(--melt-shape);mask-image:var(--melt-shape);
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-position:bottom;mask-position:bottom;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
/* 地の色を持つ段が下に来るときは、そちらの色で流し込む。
   ヒーローの次の段が持っている色を、ヒーロー側からは知れないので、
   隣どうしの組み合わせをここで書いておく。 */
.hero.has-melt + .sec.bg-surface,.hero.has-melt + .sec.bg-primary,
.hero.has-melt + .sec.bg-dark{margin-top:0}
.hero.has-melt:has(+ .sec.bg-surface) .melt{color:var(--c-surface)}
.hero.has-melt:has(+ .sec.bg-primary) .melt{color:var(--c-primary)}
.hero.has-melt:has(+ .sec.bg-dark) .melt{color:var(--c-dark)}
/* 文字が縁まで下りてきたときに、しずくに食われないよう下を空ける。
   % の余白は「幅に対する割合」なので、メルトの高さ（幅の10分の1）と
   同じ物差しで測れる。深さを変えても、そのぶん一緒に空く。 */
.hero.has-melt{padding-bottom:calc(clamp(28px,3vw,60px) + 10% * var(--melt-d,1))}
/* スクロール連動の型は、貼り付いた枠の内側の底に置く */
.hero.hsc.has-melt .melt{bottom:0}

/* ==========================================================
   コラージュ・ヒーロー
   ①敷き詰めた背景 ②斜めに切り出した写真 ③縦書きの白い帯 の3層。
   ========================================================== */
.sec-collage{
  position:relative;overflow:hidden;padding:0;
  background:#0c0f14;color:#fff
}
.cg-s{min-height:min(72svh,620px)}
.cg-m{min-height:min(86svh,800px)}
.cg-l{min-height:100svh}

/* ---- 敷き詰めた背景 ----
   タイルは背景画像で描く（<img> を並べると data URI が枚数ぶん複製されて
   書き出したHTMLが巨大になる）。多めに敷いて、はみ出しは隠す。 */
.cwall{
  position:absolute;inset:0;display:grid;gap:3px;
  grid-template-columns:repeat(auto-fill,minmax(clamp(104px,13vw,260px),1fr));
  grid-auto-rows:clamp(104px,14vh,180px);overflow:hidden;align-content:start
}
.cwall .cw{
  display:block;background:#131820 center/cover no-repeat;
  background-image:inherit
}
.cg-gray .cwall{filter:grayscale(.72) contrast(1.05)}
.cwall::after{
  content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,
    rgba(8,11,16,calc(var(--cdark,.62) * 1.06)),
    rgba(8,11,16,calc(var(--cdark,.62) * .82)) 45%,
    rgba(8,11,16,calc(var(--cdark,.62) * 1.12)))
}

/* ---- 手前の斜め写真 ----
   枠を傾け、中身は逆に戻して立たせる。傾けた分だけ角が内側に入るので
   中身を --cov 倍にして隙間を消す（値は生成時に角度から計算）。 */
.cfront{position:absolute;inset:0}
.cpic{
  position:absolute;margin:0;aspect-ratio:1;overflow:hidden;width:var(--w,30%);
  box-shadow:0 34px 70px -30px rgba(0,0,0,.72);
  opacity:0;transform:rotate(var(--rot,0deg)) scale(.9) translateY(26px);
  transition:opacity .9s cubic-bezier(.2,.7,.3,1),transform .9s cubic-bezier(.2,.7,.3,1);
  transition-delay:var(--d,0ms)
}
.sec-collage.in .cpic{opacity:1;transform:rotate(var(--rot,0deg)) scale(1) translateY(0)}
.cpic-in{display:block;width:100%;height:100%;overflow:hidden;
  transform:rotate(calc(var(--rot,0deg) * -1)) scale(var(--cov,1.42))}
.cpic img{width:100%;height:100%;object-fit:cover;display:block}
.cpic .ph{background:linear-gradient(135deg,var(--c-primary),var(--c-accent))}

/* ---- 縦書きの白い帯 ----
   1行＝1列。日本語の縦書きは右から読むので row-reverse で並べる。
   字は writing-mode ではなく1文字ずつ積む。縦書き用の字送りを持たない
   フォントだと漢字の送りがゼロになり、字が重なって潰れるため。 */
.cband{
  position:absolute;top:0;bottom:0;z-index:6;
  display:flex;flex-direction:row-reverse;align-items:flex-start;
  gap:clamp(5px,0.8vw,16px);padding:clamp(20px,4vh,56px) clamp(12px,2.6vw,52px);
  pointer-events:none
}
.cband-r{right:0}
.cband-l{left:0;align-items:flex-end}
.cb{
  display:flex;flex-direction:column;align-items:center;
  background:#fff;color:#111;font-family:var(--font-head);
  font-weight:900;font-size:clamp(19px,2.4vw,48px);
  padding:clamp(12px,1.8vh,22px) clamp(6px,0.8vw,16px);
  box-shadow:0 22px 44px -22px rgba(0,0,0,.6);
  /* 列ごとに少しずらすと、貼り紙らしい表情になる */
  margin-top:calc(var(--i) * clamp(10px,2.4vh,34px));
  clip-path:inset(0 0 100% 0);
  transition:clip-path .95s cubic-bezier(.16,.84,.3,1);
  transition-delay:calc(var(--i) * 140ms + 200ms)
}
.cband-l .cb{margin-top:0;margin-bottom:calc(var(--i) * clamp(10px,2.4vh,34px))}
.sec-collage.in .cb{clip-path:inset(0 0 0 0)}
.cbc{
  display:block;width:1em;height:1em;line-height:1;text-align:center;
  margin-bottom:.14em
}
.cbc:last-child{margin-bottom:0}
.cbc.sp{height:.5em}
/* 長音や括弧は横向きの字なので、縦に積むときは90°回す */
.cbc.rot{transform:rotate(90deg)}
/* 句読点は枡の右上に寄せるのが縦書きの決まり */
.cbc.cor{transform:translate(.36em,-.4em);margin-bottom:-.5em}

/* ゆっくり浮かせる。枠ごとに周期をずらす */
.cg-float.in .cpic{animation:cg-bob ease-in-out infinite alternate}
.cg-float.in .cpic:nth-child(1){animation-duration:7.5s}
.cg-float.in .cpic:nth-child(2){animation-duration:9s;animation-delay:-2s}
.cg-float.in .cpic:nth-child(3){animation-duration:8.2s;animation-delay:-4s}
.cg-float.in .cpic:nth-child(4){animation-duration:10s;animation-delay:-1s}
.cg-float.in .cpic:nth-child(5){animation-duration:8.8s;animation-delay:-3s}
@keyframes cg-bob{
  from{transform:rotate(var(--rot,0deg)) translateY(0)}
  to{transform:rotate(var(--rot,0deg)) translateY(-16px)}
}

@media(max-width:760px){
  .cwall{grid-auto-rows:clamp(96px,13vh,150px)}
  /* 画面が狭いと写真が小さくなりすぎるので、大きめに出す */
  .cpic{width:calc(var(--w,30%) * 1.5)}
  .cb{font-size:clamp(17px,1.8056vw,36.1111px)}
  .cband{padding:clamp(16px,3vh,34px) clamp(8px,1.3889vw,27.7778px)}
}

/* ==========================================================
   スクロール連動ヒーロー
   長い区間（--pin）をとり、その中で中身を画面に貼り付ける。
   進み具合は JS が --p（0〜1）で渡し、動きはここに書く。
   ========================================================== */
.hsc{padding:0;height:var(--pin,200vh);overflow:visible}
.hsc-in{
  position:sticky;top:0;height:100svh;overflow:hidden;
  display:grid;align-items:center
}
.hsc .hero-bg{z-index:0}
.hsc .wrap{position:relative;z-index:2;width:100%}
/* 暗幕は .hero.cover::before に入っているが、スクロール型では
   その擬似要素が「縦に長いセクション」に付くため一緒に流れてしまう。
   貼り付く側（.wrap）に置き直す。 */
.hsc.cover::before{display:none}
.hsc.cover .wrap::before{
  content:"";position:absolute;top:-50vh;bottom:-50vh;left:50%;width:100vw;
  transform:translateX(-50%);z-index:-1;pointer-events:none;
  background:radial-gradient(62vw 46vh at 50% 50%,rgba(0,0,0,.38),rgba(0,0,0,0) 74%)
}

/* ---- 写真が縮んで枠に収まる ----
   全画面 → 角の丸い1枚の写真へ。まわりに背景色の余白が生まれる。 */
.hsc-zoomout .hero-bg{
  inset:calc(var(--p,0) * 7vh) calc(var(--p,0) * 9vw);
  border-radius:calc(var(--p,0) * 26px);overflow:hidden;
  box-shadow:0 calc(var(--p,0) * 50px) calc(var(--p,0) * 90px) calc(var(--p,0) * -40px) rgba(0,0,0,.5)
}
.hsc-zoomout .hero-bg img{transform:scale(calc((1 + var(--p,0) * .06) * var(--iz,1)))}
.hsc-zoomout .hero-in{
  transform:translate3d(0,calc(var(--p,0) * -6vh),0) scale(calc(1 - var(--p,0) * .12));
  opacity:calc(1 - var(--p,0) * 1.25)
}

/* ---- 写真と文字がずれて流れる ---- */
.hsc-parallax .hero-bg img{transform:scale(calc(1.22 * var(--iz,1))) translate3d(0,calc(var(--p,0) * 13vh),0)}
.hsc-parallax .hero-in{
  transform:translate3d(0,calc(var(--p,0) * -22vh),0);
  opacity:calc(1 - var(--p,0) * 1.15)
}

/* ---- 幕が上下に開く ----
   最初は背景色の板が写真を覆っていて、スクロールで上下に割れる。 */
.hsc-curtain .hsc-in::before,.hsc-curtain .hsc-in::after{
  content:"";position:absolute;left:0;right:0;height:50.5%;z-index:3;
  background:var(--c-dark);pointer-events:none
}
.hsc-curtain .hsc-in::before{top:0;transform:translate3d(0,calc(var(--p,0) * -100%),0)}
.hsc-curtain .hsc-in::after{bottom:0;transform:translate3d(0,calc(var(--p,0) * 100%),0)}
.hsc-curtain .wrap{z-index:4}
.hsc-curtain .hero-in{
  transform:translate3d(0,calc(var(--p,0) * -4vh),0);
  opacity:calc(1 - var(--p,0) * .9)
}

/* ---- 文字の中から写真が広がる ----
   写真は等倍のまま置き、その上に「文字の形だけ穴が開いた板」をかぶせて
   穴のほうを広げる。穴は SVG なので何倍にしても輪郭がぼやけない。
   板は常に画面より大きい（最小 140vmax）ので、外側が透けることはない。 */
.hsc-maskzoom .mzo{
  position:absolute;inset:0;z-index:3;pointer-events:none;
  background:var(--c-dark);
  --k:calc(140vmax + var(--p,0) * 3600vmax);
  -webkit-mask-image:var(--mzsvg);mask-image:var(--mzsvg);
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
  -webkit-mask-position:center;mask-position:center;
  -webkit-mask-size:var(--k) var(--k);mask-size:var(--k) var(--k);
  opacity:calc(1 - max(0,(var(--p,0) - .88)) * 8.4)
}
.hsc-maskzoom .hero-in{opacity:calc(max(0,var(--p,0) - .86) * 7.2)}
.hsc-maskzoom .hero-bg img{transform:scale(calc((1.14 - var(--p,0) * .14) * var(--iz,1)))}

@media (max-width:760px){
  .hsc-zoomout .hero-bg{inset:calc(var(--p,0) * 3vh) calc(var(--p,0) * 4vw)}
  .hsc-maskzoom .mzo{--k:calc(140vmax + var(--p,0) * 2400vmax)}
}

/* ==========================================================
   ヒーローの装飾レイヤー
   z-index は 0。写真(.hero-bg)より後に置くので写真の上に出るが、
   文字を守る暗幕(.hero.cover::before, z-index:1)より下に入る。
   これで、どの装飾を選んでも見出しのコントラストは落ちない。
   ポインタ位置は JS が --mx/--my（-1〜1）と --px/--py（px）で渡す。
   ========================================================== */
.deco{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.deco i{position:absolute;display:block;transform:translate3d(0,0,0)}
.deco b{display:block;width:100%;aspect-ratio:1;border-radius:50%}

/* ---- ふわふわ雲 ---- */
[data-deco="clouds"] i{
  transform:translate3d(calc(var(--mx,0) * var(--pk) * 1px),calc(var(--my,0) * var(--pk) * 1px),0);
  transition:transform .9s cubic-bezier(.16,.8,.3,1)
}
[data-deco="clouds"] b{
  background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.92),rgba(255,255,255,.28) 46%,rgba(255,255,255,0) 72%);
  filter:blur(22px);will-change:transform;
  animation-name:deco-drift;animation-timing-function:ease-in-out;animation-iteration-count:infinite
}
@keyframes deco-drift{
  0%,100%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(var(--dx),var(--dy),0) scale(var(--ds))}
}
.deco{opacity:var(--deco-k,1)}

/* ---- オーロラ ---- */
[data-deco="aurora"] i{
  transform:translate3d(calc(var(--mx,0) * var(--pk) * 1px),calc(var(--my,0) * var(--pk) * 1px),0);
  transition:transform 1.1s cubic-bezier(.16,.8,.3,1)
}
/* ブランド色をそのまま使うと、暗い写真の上では沈んで見えない。
   白を混ぜて明度を上げてから重ねる。 */
[data-deco="aurora"] b{
  background:radial-gradient(circle at 40% 38%,
    color-mix(in srgb,var(--col) 52%,white),
    color-mix(in srgb,var(--col) 66%,white) 34%,transparent 68%);
  filter:blur(52px) saturate(1.6);will-change:transform;
  animation-name:deco-drift;animation-timing-function:ease-in-out;animation-iteration-count:infinite
}

/* ---- すりガラス（ポインタ追従） ----
   背後をぼかすので、写真の上でいちばん効く。
   2枚を違う遅さで追わせると、ガラスに厚みが出る。 */
[data-deco="glass"] .gl{
  left:0;top:0;border-radius:50%;
  backdrop-filter:blur(15px) saturate(1.3) brightness(1.05);
  -webkit-backdrop-filter:blur(15px) saturate(1.3) brightness(1.05);
  background:linear-gradient(140deg,rgba(255,255,255,.17),rgba(255,255,255,.03) 58%);
  border:1px solid rgba(255,255,255,.3);
  box-shadow:0 34px 80px -34px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.45)
}
/* 位置は left/top で決める。transform の % は「自分の大きさ」に対する割合なので、
   親の中の座標には使えない（0,0 に貼りついてしまう）。 */
[data-deco="glass"] .gl1{
  width:clamp(230px,27.7778vw,555.5556px);aspect-ratio:1;
  left:var(--px,50%);top:var(--py,45%);transform:translate(-50%,-50%)
}
[data-deco="glass"] .gl2{
  width:clamp(110px,12.5vw,250px);aspect-ratio:1;opacity:.85;
  backdrop-filter:blur(7px) saturate(1.2);-webkit-backdrop-filter:blur(7px) saturate(1.2);
  left:var(--px2,50%);top:var(--py2,45%);transform:translate(-50%,-50%)
}

/* ---- スポットライト（ポインタ追従） ---- */
/* inset をずらすと --px/--py の基準までずれるので、枠は親と同じにする */
[data-deco="spot"] .sp{
  inset:0;width:auto;
  background:radial-gradient(circle 30vw at var(--px,50%) var(--py,45%),
    rgba(255,255,255,.3),rgba(255,255,255,.1) 34%,rgba(255,255,255,0) 64%)
}

/* ---- 光の粒 ---- */
[data-deco="dust"] .du{position:absolute;inset:0;width:100%;height:100%}

/* ---- 流れる線（絹） ----
   線ではなく細い面にすると、絹のように光が走って見える。 */
[data-deco="silk"] .sk{
  left:-30%;width:160%;height:38vh;top:calc(6% + var(--n) * 17%);
  border-radius:50%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.72) 46%,rgba(255,255,255,.1) 60%,transparent);
  filter:blur(18px);opacity:calc(.66 - var(--n) * .07);will-change:transform;
  animation-name:deco-silk;animation-timing-function:linear;animation-iteration-count:infinite
}
@keyframes deco-silk{
  0%{transform:translate3d(-16%,0,0) rotate(-4deg) scaleY(1)}
  50%{transform:translate3d(14%,-3vh,0) rotate(3deg) scaleY(1.24)}
  100%{transform:translate3d(-16%,0,0) rotate(-4deg) scaleY(1)}
}

/* ---- 奥行き（ポインタで視差） ----
   写真と文字を逆向きに動かす。写真は先に拡大しておかないと端が見える。 */
.hero.dk-depth .hero-bg img{
  transform:scale(1.08) translate3d(calc(var(--mx,0) * -14px),calc(var(--my,0) * -14px),0);
  transition:transform .7s cubic-bezier(.16,.8,.3,1)
}
.hero.dk-depth .hero-in{
  transform:translate3d(calc(var(--mx,0) * 7px),calc(var(--my,0) * 7px),0);
  transition:transform .7s cubic-bezier(.16,.8,.3,1)
}


/* ---- カーソルについてくる丸 ----
   位置は left/top で決める（transform の % は自分の大きさ基準なので使えない）。
   画面の外に出たら小さくたたむ。 */
[data-deco="cursor"] .cur{
  left:var(--px,50%);top:var(--py,45%);
  width:clamp(96px,9vw,180px);aspect-ratio:1;border-radius:50%;
  display:grid;place-items:center;
  transform:translate(-50%,-50%) scale(var(--curs,1));
  background:var(--c-primary);color:var(--c-on-primary,#fff);
  transition:transform .5s cubic-bezier(.16,.84,.3,1)
}
[data-deco="cursor"] .cur b{
  font-family:var(--font-head);font-size:12px;font-weight:900;
  letter-spacing:.18em;text-align:center;padding:0 8px
}
@media (hover:none){[data-deco="cursor"] .cur{left:50%;top:auto;bottom:8%;transition:none}}

/* ---- フィルムの粒状感（他の装飾と重ねられる） ---- */
.deco .grain{
  position:absolute;inset:-50%;display:block;pointer-events:none;
  opacity:.17;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
  animation:deco-grain .7s steps(1) infinite
}
@keyframes deco-grain{
  0%{transform:translate3d(0,0,0)}   20%{transform:translate3d(-3%,2%,0)}
  40%{transform:translate3d(2%,-3%,0)} 60%{transform:translate3d(-2%,-2%,0)}
  80%{transform:translate3d(3%,1%,0)}  100%{transform:translate3d(0,0,0)}
}

/* 指の環境ではポインタ追従が意味を持たないので、真ん中に置いて動かさない */
@media (hover:none){
  [data-deco="glass"] .gl,[data-deco="spot"] .sp{transition:none}
  .hero.dk-depth .hero-bg img,.hero.dk-depth .hero-in{transform:none}
}

/* ---------- 特徴 / カード ---------- */
.grid{display:grid;gap:24px}
/* 格子の子は既定で min-width:auto。中身が縮まないと桁が広がるので、
   縮める許可を明示しておく（保険） */
.grid > *{min-width:0}
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
.about-in{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,4.4444vw,88.8889px);align-items:center}
.about-in.rev .about-media{order:2}
.about-media{border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3;background:linear-gradient(135deg,var(--c-primary),var(--c-accent))}
.about-media img{width:100%;height:100%;object-fit:cover}
.about-body .sec-title{font-size:clamp(22px,2.0833vw,41.6667px)}
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

/* ---------- お品書き（価格表） ----------
   品名と価格のあいだは点線でつなぐ。品名が長くて折り返しても
   価格は右端に揃ったままにしたいので、dt を伸ばして dd を固定にする。 */
.menu-cols{display:grid;gap:44px 56px;max-width:960px;margin:0 auto}
.menu-cols.c2{grid-template-columns:1fr 1fr}
.mg-h{display:flex;align-items:baseline;gap:12px;margin-bottom:14px}
.mg-n{
  font-family:var(--font-head);font-size:15px;font-weight:700;
  letter-spacing:.16em;color:var(--c-primary);white-space:nowrap
}
.mg-rule{flex:1;height:1px;background:var(--c-border)}
.mg-note{
  font-size:10.5px;letter-spacing:.14em;color:var(--c-muted);
  white-space:nowrap;text-transform:uppercase
}
.mg-l{margin:0;display:grid;gap:11px}
.mi{display:flex;align-items:baseline;gap:10px}
.mi dt{flex:1;min-width:0;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.mi dt b{font-family:var(--font-head);font-size:16px;font-weight:600;letter-spacing:.01em}
.mi dt i{font-style:normal;font-size:11.5px;color:var(--c-muted);letter-spacing:.06em}
.mi dd{
  margin:0;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;
  white-space:nowrap;order:3
}
/* 点線のリーダー。dt と dd のあいだを埋める */
.mi::after{
  content:"";order:2;flex:0 1 42px;min-width:14px;align-self:center;
  border-bottom:1px dotted var(--c-border);margin-bottom:3px
}
.menu-note{
  text-align:center;margin:44px 0 0;font-size:12.5px;color:var(--c-muted);letter-spacing:.04em
}
@media(max-width:760px){
  .menu-cols,.menu-cols.c2{grid-template-columns:1fr;gap:36px}
  .mi dt b{font-size:15px}
}

/* 「( 01 )」形式の番号。丸で囲むより引いた印象になり、
   説明が主役のカードに向く。 */
.card .pnum{
  display:block;font-family:var(--font-head);font-weight:700;
  font-size:13px;letter-spacing:.14em;color:var(--c-muted);
  margin-bottom:clamp(10px,1.6vh,18px)
}
.sty-bold .card .pnum{color:var(--c-primary)}

/* ---------- お知らせ・イベント ---------- */
.nws{list-style:none;margin:0;padding:0;border-top:1px solid var(--c-border)}
.nws-i{border-bottom:1px solid var(--c-border)}
.nws-i a{
  display:flex;align-items:baseline;gap:clamp(12px,1.9444vw,38.8889px);
  padding:clamp(16px,2.2vh,24px) 4px;text-decoration:none;color:inherit;
  transition:opacity .2s,padding-left .25s
}
.nws-i a:hover{opacity:.65;padding-left:10px}
.nws-i time{
  font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--c-muted);
  white-space:nowrap;font-variant-numeric:tabular-nums;flex:0 0 auto
}
.nws-c{
  font-size:11px;font-weight:800;letter-spacing:.1em;white-space:nowrap;flex:0 0 auto;
  border:1px solid var(--c-border);border-radius:999px;padding:3px 11px;color:var(--c-muted)
}
.nws-i b{font-size:15.5px;font-weight:600;line-height:1.6;flex:1;min-width:0}
.sec-news .btn-row{margin-top:clamp(24px,4vh,44px)}
@media(max-width:640px){
  .nws-i a{flex-wrap:wrap;gap:8px 12px}
  .nws-i b{flex:0 0 100%}
}

/* ---------- フロアガイド ---------- */
.flr{display:grid;gap:clamp(28px,5vh,64px)}
.flr-i{
  display:grid;grid-template-columns:1.05fr 1fr;gap:clamp(20px,3.8889vw,77.7778px);align-items:center
}
.flr-i:nth-child(even){direction:rtl}
.flr-i:nth-child(even) > *{direction:ltr}
.flr-pic{
  aspect-ratio:16/10;overflow:hidden;border-radius:var(--radius);
  background:linear-gradient(135deg,var(--c-primary),var(--c-accent))
}
.flr-pic img{width:100%;height:100%;object-fit:cover;display:block}
.flr-n{
  display:block;font-family:var(--font-head);font-size:clamp(34px,4.4444vw,88.8889px);
  font-weight:900;line-height:1;letter-spacing:.02em;color:var(--c-primary);
  margin-bottom:clamp(8px,1.6vh,16px)
}
.flr-b h3{margin:0 0 10px;font-size:clamp(17px,1.5278vw,30.5556px);font-weight:700;line-height:1.5}
.flr-b p{margin:0;color:var(--c-muted);font-size:14.5px;line-height:1.9}
@media(max-width:760px){
  .flr-i,.flr-i:nth-child(even){grid-template-columns:1fr;direction:ltr}
}

/* ---------- 一覧カード（写真・条件・ボタン） ----------
   カードの背は揃える。中身の行数はものによって違うので、
   ボタンだけは下端にそろえないと、押すところが1枚ごとに上下する。 */
.lst{display:grid;gap:clamp(18px,2.4vw,34px)}
.lst.c2{grid-template-columns:repeat(2,1fr)}
.lst.c3{grid-template-columns:repeat(3,1fr)}
.lst.c4{grid-template-columns:repeat(4,1fr)}
.lst-i{display:flex;flex-direction:column;gap:clamp(10px,1.4vh,16px)}
.lst-fig{position:relative}
.lst-pic{
  aspect-ratio:4/3;overflow:hidden;border-radius:var(--radius);
  background:linear-gradient(135deg,var(--c-primary),var(--c-accent))
}
.lst-pic img{width:100%;height:100%;object-fit:cover;display:block}
.lst-badge{
  position:absolute;top:10px;left:10px;
  background:var(--c-bg);color:var(--c-primary);
  font-size:11px;font-weight:800;letter-spacing:.08em;
  border-radius:999px;padding:4px 11px;
  box-shadow:0 2px 10px -4px rgba(0,0,0,.45)
}
.lst-b{display:flex;flex-direction:column;gap:5px;flex:1}
.lst-t{font-size:15.5px;font-weight:700;line-height:1.5}
.lst-p{
  font-family:var(--font-head);font-size:clamp(20px,1.7vw,34px);
  font-weight:800;line-height:1.2;letter-spacing:.01em;color:var(--c-primary);
  font-variant-numeric:tabular-nums
}
.lst-m,.lst-n{color:var(--c-muted);font-size:13px;line-height:1.7}
/* ボタンは1枚ぶんの幅いっぱい。押すところを探させない */
.lst-btn{width:100%;margin-top:auto;padding:12px 18px;font-size:14px}
.lst-more{justify-content:center}
@media(max-width:1000px){
  .lst.c4{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:760px){
  .lst.c3,.lst.c4{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:560px){
  .lst,.lst.c2,.lst.c3,.lst.c4{grid-template-columns:1fr}
  .lst-p{font-size:22px}
}

/* ---------- 予定の表（曜日 × 時間帯） ----------
   曜日が7つあると、狭い画面では必ず入りきらない。ページ全体を
   横に流すのではなく、表だけを枠の中で流す。左端の見出しは
   貼り付けたままにしておかないと、流したときに何の行か分からなくなる。 */
/* --sch-face は「左端の列の下地」。貼り付けた列の下を桝目が通るので、
   透けない色を必ず1つ決めておく。地の色は4通りあるので、
   その4通りぶんだけ決め直す。 */
.sch{--sch-line:var(--c-border);--sch-face:var(--c-bg)}
.sec.bg-surface .sch{--sch-face:var(--c-surface)}
.sec.bg-primary .sch{--sch-face:var(--c-primary);--sch-line:rgba(255,255,255,.24)}
.sec.bg-dark .sch{--sch-face:var(--c-dark);--sch-line:rgba(255,255,255,.24)}
/* 板に載せたときの下地は、地の色ではなく板そのものの色。
   上の3行と同じ強さ（クラス3つ）にして、後ろに置くことで勝たせる。
   弱いと、白い板の中に地の灰色の帯が1本だけ残る。 */
.sec .sch.sch-card{--sch-face:var(--c-bg)}
.sch-card{
  background:var(--c-bg);border:1px solid var(--c-border);
  border-radius:var(--radius);padding:clamp(16px,2.6vw,36px);
  box-shadow:0 18px 44px -34px rgba(0,0,0,.5)
}
/* 濃い地の上では、白い板を置くと浮きすぎる。地を少しだけ明るくする。
   透かして明るくすると、その上に置く「貼り付けた列」の色を同じにできず、
   左端に明るさの違う帯が出てしまうので、混ぜた色を実際に作って両方に使う。 */
.sec.bg-primary .sch-card{--sch-plate:var(--c-primary)}
.sec.bg-dark .sch-card{--sch-plate:var(--c-dark)}
.sec.bg-primary .sch-card,.sec.bg-dark .sch-card{
  background:color-mix(in srgb,#fff 8%,var(--sch-plate));
  border-color:rgba(255,255,255,.18);box-shadow:none
}
.sec.bg-primary .sch.sch-card,.sec.bg-dark .sch.sch-card{
  --sch-face:color-mix(in srgb,#fff 8%,var(--sch-plate))
}
@supports not (color:color-mix(in srgb,red,blue)){
  .sec.bg-primary .sch-card,.sec.bg-dark .sch-card{background:rgba(255,255,255,.08)}
  .sec.bg-primary .sch.sch-card{--sch-face:var(--c-primary)}
  .sec.bg-dark .sch.sch-card{--sch-face:var(--c-dark)}
}
.sch-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.sch-t{width:100%;border-collapse:collapse;text-align:center}
.sch-t th,.sch-t td{
  padding:clamp(11px,1.7vh,18px) clamp(6px,1vw,16px);
  font-size:14.5px;font-weight:600;white-space:nowrap
}
.sch-t thead th{font-size:14px;font-weight:700;color:inherit}
.sch-t thead tr{border-bottom:1px solid var(--sch-line)}
.sch-t tbody tr + tr{border-top:1px solid var(--sch-line)}
/* 左端の列は、横に流しても見えたままにする */
.sch-t th[scope="row"],.sch-corner{
  position:sticky;left:0;z-index:1;background:var(--sch-face);
  text-align:left;font-variant-numeric:tabular-nums
}
.sch-corner{font-size:13px;color:var(--c-muted)}
.sch-t th[scope="row"]{font-size:15.5px;font-weight:700}
/* 丸と線。文字で打つと大きさが揃わないので、こちらで描く */
.sch-o{
  display:inline-block;width:13px;height:13px;border-radius:50%;
  background:var(--c-primary);vertical-align:middle
}
.sch-x{
  display:inline-block;width:15px;height:2px;border-radius:2px;
  background:var(--c-muted);opacity:.55;vertical-align:middle
}
.sch-note{
  margin:clamp(14px,2.2vh,22px) 0 0;color:var(--c-muted);
  font-size:13.5px;line-height:1.9
}
/* 濃い地の上では、メインカラーの丸も、薄いグレーの文字も地に沈む。
   どちらも「文字と同じ色を薄くしたもの」に置きかえる。 */
.bg-primary .sch-o,.bg-dark .sch-o,
.bg-primary .sch-x,.bg-dark .sch-x{background:currentColor}
.bg-primary .sch-corner,.bg-dark .sch-corner,
.bg-primary .sch-note,.bg-dark .sch-note{color:inherit;opacity:.72}
@media(max-width:560px){
  .sch-t th,.sch-t td{padding:11px 8px;font-size:13.5px}
  .sch-t th[scope="row"]{font-size:14px}
}

/* ---------- 流れる文字（マーキー） ----------
   同じ並びを2組ならべ、1組ぶん動かして先頭に戻す。
   継ぎ目で一瞬止まるのを防ぐため、2組目は1組目の真後ろに置く。 */
.sec-marquee{padding:0;overflow:hidden}
.mq-in{display:flex;width:max-content;text-decoration:none;color:inherit;
  padding:clamp(14px,2.4vh,30px) 0}
.mq-run{
  display:flex;align-items:center;flex:0 0 auto;
  animation:mq-flow var(--mq-dur,22s) linear infinite;will-change:transform
}
.mq-r .mq-run{animation-direction:reverse}
@keyframes mq-flow{from{transform:translate3d(0,0,0)}to{transform:translate3d(-100%,0,0)}}
.mq-w,.mq-s{
  font-family:var(--font-head);font-weight:900;white-space:nowrap;
  font-size:var(--mq-size,96px);line-height:1.05;letter-spacing:.01em
}
.mq-w{padding:0 .18em}
.mq-s{padding:0 .1em;opacity:.5;font-size:calc(var(--mq-size,96px) * .5)}
/* 中を抜いた文字。線だけになるぶん、うるさくならずに大きく置ける。
   color を transparent にすると currentColor の線まで透明になるので、
   色はそのままにして「塗りだけ」を消す。 */
.mq-line .mq-w{
  -webkit-text-fill-color:transparent;
  -webkit-text-stroke:1.5px currentColor;
  paint-order:stroke fill
}
.mq-in:hover .mq-run{animation-play-state:paused}
@media(max-width:760px){.mq-w,.mq-s{font-size:calc(var(--mq-size,96px) * .55)}}

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
.contact-in{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,3.8889vw,77.7778px)}
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

/* ---------- フッターの型 ----------
   bar（既定）は上の指定のまま。ここから下は、その差分だけ。 */

/* 中央ぞろえ */
.ftr-center .ftr-in{flex-direction:column;justify-content:center;text-align:center;gap:18px}
.ftr-center .ftr-nav{justify-content:center}
.ftr-center .copy{text-align:center}

/* 明るい地。濃い地の前提が崩れるので、文字と線の色を敷き直す */
.ftr-light{background:var(--c-surface);color:var(--c-muted);border-top:1px solid var(--c-border)}
.ftr-light .logo{color:var(--c-text)}
.ftr-light .ftr-nav a:hover{color:var(--c-primary)}
.ftr-light .copy{border-top-color:var(--c-border)}

/* 大きめ。左に名前とひとこと、右にリンクを縦に並べる */
.ftr-big{padding-top:72px}
.ftr-cols{display:grid;grid-template-columns:1.4fr 1fr;gap:clamp(28px,4vw,72px)}
.ftr-lead{max-width:420px}
.ftr-note{margin:14px 0 0;line-height:1.9;font-size:13.5px}
.ftr-big .ftr-nav{flex-direction:column;gap:12px;align-items:flex-start}

/* 最後にひと押し。上に一言とボタンを置いてから、いつもの1行を出す */
.ftr-push{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px;
  padding-bottom:36px;margin-bottom:32px;border-bottom:1px solid rgba(255,255,255,.12)
}
.ftr-push .ftr-note{margin:0;font-size:clamp(17px,1.8vw,24px);font-weight:700;
  color:var(--c-on-dark,#fff);line-height:1.6}

/* ひとことだけ。細い帯にする */
.ftr-minimal{padding:34px 0 30px}
.ftr-minimal .ftr-in{justify-content:center}
.ftr-minimal .copy{margin-top:14px;padding-top:0;border-top:0;text-align:center}

@media(max-width:760px){
  .ftr-cols{grid-template-columns:1fr;gap:28px}
}

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
.sty-mono .sec-title{font-size:clamp(26px,3.1944vw,63.8889px);line-height:1.28;letter-spacing:-.01em}
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
.sty-bold .sec-title{font-size:clamp(28px,3.8889vw,77.7778px);font-weight:900;line-height:1.18;letter-spacing:-.02em}
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
.sty-edit .sec{padding:clamp(72px,9.1667vw,183.3333px) 0}
.sty-edit .sec-head{margin-bottom:clamp(40px,5vw,100px)}
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
/* 誌面のような型ではボタンが下線だけになる。写真の上では本文色（濃い色）のままだと
   ほとんど見えないので、白に切り替える。 */
.sty-edit .hero.cover .btn{color:#fff;border-bottom-color:rgba(255,255,255,.7);
  text-shadow:0 1px 16px rgba(0,0,0,.5)}
.sty-edit .hero.cover .btn:hover{color:#fff;border-bottom-color:#fff}
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
   文字を絵で塗る（文字のくり抜き）

   背景を文字の形に切り抜いて見せる。文字そのものは文字のままなので、
   読み上げにも検索にも残るし、あとから書き換えられる。

   グラデーションはCSSだけで作れるので、ここに全部書いてある（0バイト）。
   写真で塗るものだけ、絵を assets/text-fills.js に持つ。
   ========================================================== */
[data-txf]{
  background-image:var(--txf);
  background-size:cover;background-position:center;
  -webkit-background-clip:text;background-clip:text;
  color:transparent;-webkit-text-fill-color:transparent
}
/* 塗りが読み込めないときに文字が消えないよう、下に色を敷いておく */
@supports not ((-webkit-background-clip:text) or (background-clip:text)){
  [data-txf]{color:inherit;-webkit-text-fill-color:currentColor;background-image:none}
}
[data-txf="gold"]{--txf:linear-gradient(180deg,#fff4c2 0%,#e9b949 38%,#8a5a12 68%,#f7dd8a 100%)}
[data-txf="fire"]{--txf:linear-gradient(180deg,#ffe259 0%,#ff8a00 46%,#e63900 100%)}
[data-txf="metal"]{--txf:linear-gradient(180deg,#f7f9fb 0%,#c3ccd6 42%,#6d7682 68%,#eef2f6 100%)}
[data-txf="night"]{--txf:linear-gradient(120deg,#8b5cff 0%,#22d3ee 100%)}
[data-txf="rainbow"]{--txf:linear-gradient(90deg,#ff5f6d,#ffc371,#47e5bc,#4c8dff,#a06bff)}
[data-txf="brand"]{--txf:linear-gradient(120deg,var(--c-primary),var(--c-accent))}

/* ---------- ガラス ----------
   ほかの塗りは「絵で塗る」が、これだけは「透かす」。
   塗りを半透明にすると、下の地がそのまま文字の中に見える。

   ガラスらしさは3つでできている。
     ① 厚みの中の明暗   上と下のふちが明るく、真ん中がいちばん薄い
     ② ふちの光         まわりを1本の細い線がぐるりと回る
     ③ 落ち影           板ではなくかたまりだと分かるだけの距離を置く

   text-shadow は使えない。塗りが透けているので、影が文字の中から
   透けて見えてしまう。filter の drop-shadow なら、ふちと塗りを
   合わせた「絵として出来上がったもの」に落ちる。

   長さはすべて em。字の大きさに連れて厚みも変わらないと、
   小さいと重すぎ、大きいとただの輪郭線になる。 */
[data-txf="glass"]{
  /* ① 厚みの中の明暗。上から、光ったふち → 影 → いちばん薄いところ →
     もう一度うっすら → 下のふちの照り返し */
  --txf:linear-gradient(172deg,
    rgba(255,255,255,.82) 0%,
    rgba(255,255,255,.30) 7%,
    rgba(0,0,0,.10) 15%,
    rgba(255,255,255,.05) 42%,
    rgba(255,255,255,.02) 58%,
    rgba(255,255,255,.16) 74%,
    rgba(0,0,0,.06) 86%,
    rgba(255,255,255,.86) 100%);
  /* ② ふちの光。下に敷く（paint-order）。上に描くと線のぶん字が
     内側にやせて、細い書体だと潰れる */
  -webkit-text-stroke:.028em rgba(255,255,255,.7);
  paint-order:stroke fill;
  /* ③ 斜めに光と影を1組ずつ置いて厚みを出し、最後に落ち影 */
  filter:
    drop-shadow(-.012em -.014em 0 rgba(255,255,255,.85))
    drop-shadow(.012em .014em 0 rgba(0,0,0,.34))
    drop-shadow(0 .006em .016em rgba(255,255,255,.5))
    drop-shadow(0 .09em .12em rgba(0,0,0,.34));
}
/* 明るい地の上では、白いふちだけだと何も見えない。
   影のほうを強くして、輪郭が残るようにする */
.sec:not(.bg-dark):not(.bg-primary) [data-txf="glass"],
.hero:not(.cover):not(.bg-dark):not(.bg-primary) [data-txf="glass"]{
  -webkit-text-stroke-color:rgba(255,255,255,.95);
  filter:
    drop-shadow(-.012em -.014em 0 rgba(255,255,255,1))
    drop-shadow(.012em .014em 0 rgba(0,0,0,.42))
    drop-shadow(0 .006em .014em rgba(0,0,0,.16))
    drop-shadow(0 .08em .11em rgba(0,0,0,.28));
}
/* 文字を書き替えているあいだは、透けていると読めない。いったん戻す。
   color:inherit も一緒に戻すこと。currentColor は color を見るので、
   color が transparent のままだと、戻したつもりで透明のままになる。 */
[data-txf="glass"].__editing{
  color:inherit;-webkit-text-fill-color:currentColor;background-image:none;
  -webkit-text-stroke:0;filter:none
}

/* ==========================================================
   ボタンの型

   ここもスタイルやテンプレートの味付け（.sty-* / .tpl-*）より後ろに置く。
   同じ強さの指定なので、後ろに書いたほうが勝つ。前に置くと
   「下線だけ」を選んだのに角丸が残る、といったことが起きる（実際に起きた）。
   ========================================================== */

/* 丸（ピル） */
.btn.pill{border-radius:999px;padding-inline:34px}

/* 角なし（四角いまま） */
.btn.square{border-radius:0}

/* 白抜き。写真の上に置くとき */
.btn.solidlight{background:#fff;color:#111;box-shadow:0 8px 24px -12px rgba(0,0,0,.6)}
.btn.solidlight:hover{box-shadow:0 14px 30px -14px rgba(0,0,0,.7)}

/* 濃い地 */
.btn.dark{background:var(--c-text);color:var(--c-bg);box-shadow:none}
.btn.dark:hover{box-shadow:0 12px 26px -12px rgba(0,0,0,.5)}

/* 下線だけ。文字の延長のように見せる */
.btn.link{
  background:none;color:inherit;box-shadow:none;border:0;border-radius:0;
  padding:6px 2px;border-bottom:2px solid currentColor
}
.btn.link:hover{transform:none;opacity:.6;box-shadow:none}

/* 影を落とす（ずらした影） */
.btn.hard{
  border-radius:var(--radius);box-shadow:5px 5px 0 var(--c-text);
  border:1.5px solid var(--c-text)
}
.btn.hard:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--c-text)}

/* 矢印つき。押すと矢印だけ先に動く */
.btn.arrow::after{content:"→";display:inline-block;transition:transform .25s ease}
.btn.arrow:hover::after{transform:translateX(5px)}

/* 大きい */
.btn.lg{padding:19px 42px;font-size:17px}

/* 横いっぱい（スマホでの申し込みボタンに） */
.btn.full{width:100%}

/* ==========================================================
   ヘッダーのバーの型

   ここはスタイルやテンプレートの味付け（.sty-* / .tpl-*）より
   後ろに置く。同じ強さの指定なので、後ろに書いたほうが勝つ。
   「無色」を選んだのに味付けの線が残る、といったことを防ぐ。
   ========================================================== */
.hdr.bar-glass{background:color-mix(in srgb,var(--c-bg) 72%,transparent);
  backdrop-filter:blur(14px);border-bottom-color:color-mix(in srgb,var(--c-border) 60%,transparent)}

.hdr.bar-clear{background:transparent;border-bottom-color:transparent}

/* ヒーローの上に重ねる。バーのぶんの場所を取らないので、
   写真が画面の上端から始まる。
   位置の基準は初期包含ブロック（ページの左上）。見本の中では
   .dc-scale に transform が掛かっており、そちらが基準になるので、
   カードからはみ出さない。 */
.hdr.bar-over{position:absolute;top:0;left:0;right:0;
  background:transparent;border-bottom-color:transparent}
/* 下が写真のヒーローのときだけ白字にする。判定は site.js が行う
   （前の兄弟から次を見る CSS は、まだ全部の端末で当てにできない）。 */
.hdr.bar-over.on-photo{color:#fff}
.hdr.bar-over.on-photo .nav a{color:rgba(255,255,255,.82)}
.hdr.bar-over.on-photo .nav a:hover{color:#fff}
.hdr.bar-over.on-photo .hdr-toggle{border-color:rgba(255,255,255,.45)}
@media(max-width:640px){
  /* たたんだメニューは地が要る。透明のままだと写真の上で読めない */
  .hdr.bar-over .nav{background:var(--c-bg);color:var(--c-text)}
  .hdr.bar-over.on-photo .nav a{color:var(--c-muted)}
}

/* メインカラーで塗る。地が濃くなるので、載る文字はすべて反転させる */
.hdr.bar-solid{background:var(--c-primary);border-bottom-color:transparent;
  color:var(--c-on-primary,#fff)}
.hdr.bar-solid .nav a{color:color-mix(in srgb,var(--c-on-primary,#fff) 82%,transparent)}
.hdr.bar-solid .nav a:hover{color:var(--c-on-primary,#fff)}
.hdr.bar-solid .hdr-toggle{border-color:color-mix(in srgb,var(--c-on-primary,#fff) 45%,transparent)}
/* ボタンは地に埋もれるので、白抜きにして残す */
.hdr.bar-solid .btn{background:var(--c-on-primary,#fff);color:var(--c-primary);box-shadow:none}
.hdr.bar-solid .btn:hover{box-shadow:0 10px 24px -12px rgba(0,0,0,.5)}

/* 帯ではなく、角の丸い島が浮いて見える型。
   島の地は擬似要素で敷く。.hdr-in は .wrap でもあり、その左右の余白は
   画面幅で決まっているので、そこに背景を付けるとスマホで端まで届いてしまう。 */
.hdr.bar-float{background:transparent;border-bottom-color:transparent}
.hdr.bar-float .hdr-in{position:relative;height:62px;margin-top:12px;margin-bottom:12px}
.hdr.bar-float .hdr-in::before{
  content:"";position:absolute;left:10px;right:10px;top:0;bottom:0;z-index:-1;
  background:color-mix(in srgb,var(--c-bg) 82%,transparent);backdrop-filter:blur(14px);
  border:1px solid var(--c-border);border-radius:999px;
  box-shadow:0 18px 40px -24px rgba(15,23,42,.55)
}

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
/* 行マスクだけは1行ぜんぶが1つの .ch になる。.ch には white-space:pre が
   かかっているため、そのままだと長い行が折り返せず、カードの最小幅が
   行の長さぶんに広がってレイアウトが破裂する（実測で確認）。ここだけ戻す。 */
[data-ta].ta-maskline .ch{white-space:normal;display:block}
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
.pin-cap b{display:block;font-size:clamp(18px,1.9444vw,38.8889px);font-family:var(--font-head);line-height:1.4}
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
  position:sticky;height:56vh;border-radius:calc(var(--radius) * 1.6);padding:clamp(24px,3.0556vw,61.1111px);
  overflow:hidden;border:1px solid var(--c-border);background:var(--c-surface);
  display:flex;flex-direction:column;justify-content:space-between;
  will-change:transform;transform-origin:50% 0%
}
.stackcard .no{font-family:Menlo,monospace;font-size:12px;letter-spacing:.2em;color:var(--c-primary)}
.stackcard h3{margin:0 0 8px;font-size:clamp(20px,2.0833vw,41.6667px);font-family:var(--font-head)}
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
/* width が要る。親の .pin-in は place-items:center なので、
   指定しないと中身なり（＝中は全部 position:absolute なので 0）に潰れ、
   まっさらな帯だけが出る。 */
.clip-box{position:relative;width:100%;height:100vh;overflow:hidden}
.clip-side{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:0 24px}
.clip-a{background:var(--c-surface)}
.clip-b{background:linear-gradient(140deg,var(--c-primary),var(--c-accent));color:#fff;
  clip-path:circle(var(--r,0%) at 50% 50%)}
.clip-side img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.clip-side .in-txt{position:relative;z-index:2}
.clip-box h3{font-size:clamp(24px,3.4722vw,69.4444px);font-weight:800;margin:0;font-family:var(--font-head)}
.clip-box p{margin:10px 0 0;font-size:14.5px;opacity:.85}

/* ---------- 3Dカルーセル ---------- */
/* 円をえがいて並ぶので、外側の輪はカードの幅ぶんだけ横に張り出す。
   狭い画面ではカードを小さくし、それでもはみ出す分は枠で切る
   （切らないと、ページ全体が横スクロールしてしまう）。 */
.car{perspective:1300px;height:400px;display:grid;place-items:center;cursor:grab;
  touch-action:pan-y;overflow:hidden}
.car:active{cursor:grabbing}
.car-in{position:relative;width:min(220px,44vw);height:min(300px,60vw);transform-style:preserve-3d}
@media(min-width:761px){.car-in{width:220px;height:300px}}
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
.slots{display:grid;gap:clamp(28px,3vw,60px);text-align:center}
/* 桁は縦に回すので transform がかかる。background-clip:text は
   変形した子孫の文字には効かず、数字がまるごと消える（実測で確認）。
   ここは単色で塗る。

   数字は「読ませる」ものではなく「効かせる」もの。小さいと、
   ただの注記に見えて何も残らない。見出しと同じくらいの大きさにする。
   等幅フォントではなく見出しのフォントを使い、桁が揃うよう tnum を効かせる
   （回る桁は0〜9を縦に積むので、桁ごとの幅が揺れると数字が踊る）。 */
.slot{display:inline-flex;font-family:var(--font-head);font-weight:800;
  font-size:clamp(44px,5.5vw,110px);line-height:1.05;overflow:hidden;
  letter-spacing:-.02em;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;
  color:var(--c-text);-webkit-text-fill-color:currentColor}
/* メインカラーが明るいと、背景に対して数字が沈む（緑#00f04b と #f4f4f4 で
   コントラスト比 1.41 だった）。文字色を少し混ぜて、どの配色でも読める濃さにする。 */
.slot .col u{color:color-mix(in srgb,var(--c-primary) 62%,var(--c-text))}
.bg-primary .slot,.bg-dark .slot{color:inherit}
.bg-primary .slot .col u,.bg-dark .slot .col u{color:inherit}
/* 桁の窓の高さ・1桁ぶんの送り・行の高さは、3つとも 1.1em でそろえる。
   JS が translateY(-数字×1.1em) で送るので、どれかがずれると
   上下の桁が窓からはみ出して見える（見出しの行間を詰めたときに起きた）。 */
.slot .col{height:1.1em;overflow:hidden;line-height:1.1}
.slot .col u,.slot .fix{line-height:1.1}
.slot .col u{display:block;text-decoration:none;transition:transform 1.6s cubic-bezier(.16,1,.3,1)}
.slot .fix{opacity:.6}
.slots small{display:block;color:var(--c-muted);font-size:clamp(12.5px,.75vw,15px);
  margin-top:12px;letter-spacing:.08em;font-weight:600}

/* ---------- 折れ線・棒グラフ ----------
   線1本と枠だけの図は、作りかけの下書きに見える。
   面（グラデーション）・目盛り・点を敷いて、図として成立させる。 */
.draw-wrap{max-width:760px;margin:0 auto}
/* 図に使う色は1色だけ。線・棒・膜・点をぜんぶ同じ色にする。
   2色を混ぜたグラデーションは、色が濁って安っぽく見える。
   濃さの差は、その帯の地の色へどれだけ寄せるかで作る。

   濃い地の上では主役の色が沈むので、その帯の文字色で描く。 */
.chart,.sl-viz{--c-chart:var(--c-primary);--c-chart-bg:var(--c-bg)}
.bg-surface .chart{--c-chart-bg:var(--c-surface)}
.bg-dark .chart{--c-chart:currentColor;--c-chart-bg:var(--c-dark)}
.bg-primary .chart{--c-chart:currentColor;--c-chart-bg:var(--c-primary)}
.draw-plot{position:relative}
.draw-plot svg{width:100%;height:auto;overflow:visible;display:block}

/* うっすらとしたマス目。数えるためではなく、高さを比べるための下敷き */
.chart .gl{stroke:var(--c-border);stroke-width:1;opacity:.6}
.chart .axis{stroke:var(--c-border);stroke-width:1.5}
.chart .ln{stroke:var(--c-chart)}
/* 点のふちは、その帯の地の色で抜く。線に重なっても点が読める */
.chart .dot{fill:var(--c-chart);stroke:var(--c-chart-bg)}

/* グラデーションの色止め。同じ色の「濃い」と「薄い」だけで作る。
   薄いほうは地の色へ寄せるので、透かしているわけではない
   （透かすと、下にあるマス目や写真が透けて濁る）。

   color-mix を読めない端末のために、まず不透明度で薄くしたものを置き、
   読める端末だけ上書きする。読めないまま黒く塗られると図が潰れる。 */
.chart .gb0,.sl-viz .gb0{stop-color:var(--c-chart)}
.chart .gb1,.sl-viz .gb1{stop-color:var(--c-chart);stop-opacity:.3}
.chart .ga0,.sl-viz .ga0{stop-color:var(--c-chart);stop-opacity:.26}
.chart .ga1,.sl-viz .ga1{stop-color:var(--c-chart);stop-opacity:0}
@supports (color:color-mix(in srgb,red,blue)){
  .chart .gb1,.sl-viz .gb1{stop-color:color-mix(in srgb,var(--c-chart) 30%,var(--c-chart-bg));stop-opacity:1}
  .chart .ga0,.sl-viz .ga0{stop-color:color-mix(in srgb,var(--c-chart) 26%,var(--c-chart-bg));stop-opacity:1}
  .chart .ga1,.sl-viz .ga1{stop-color:var(--c-chart-bg);stop-opacity:1}
}
.bg-dark .chart .gl,.bg-primary .chart .gl,
.bg-dark .chart .axis,.bg-primary .chart .axis{stroke:currentColor;opacity:.3}

/* 棒は下から立ち上がる。線を引く動き（dasharray）は塗りには効かない */
.chart .bar{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}
.chart.in .bar{transform:scaleY(1);
  transition:transform 1s cubic-bezier(.16,1,.3,1) var(--d,0s)}

/* 線は引かれて、そのあと下の面がにじむ */
.chart .ln{stroke-dasharray:var(--len);stroke-dashoffset:var(--len)}
.chart.in .ln{stroke-dashoffset:0;transition:stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)}
.chart .area{opacity:0}
.chart.in .area{opacity:1;transition:opacity .9s ease .55s}
.chart .dot{opacity:0;transform-box:fill-box;transform-origin:50% 50%;transform:scale(.4)}
.chart.in .dot{opacity:1;transform:scale(1);
  transition:opacity .35s ease var(--d,0s),transform .45s cubic-bezier(.34,1.56,.64,1) var(--d,0s)}

/* ラベルと数値は、目盛りと同じ位置に置く（%で図に合わせる） */
.draw-lbl{position:relative;height:1.9em;margin-top:10px;
  font-size:12.5px;color:var(--c-muted);letter-spacing:.04em}
.draw-lbl span{position:absolute;transform:translateX(-50%);white-space:nowrap}
.bg-dark .draw-lbl,.bg-primary .draw-lbl{color:inherit;opacity:.72}
.draw-note{position:absolute;inset:0;pointer-events:none}
.draw-note span{
  position:absolute;transform:translate(-50%,-150%);white-space:nowrap;
  font-weight:800;font-size:13.5px;color:var(--c-text);letter-spacing:.02em
}
.bg-dark .draw-note span,.bg-primary .draw-note span{color:inherit}

/* ---------- 全画面メッセージ（背景色が変わる） ---------- */
.shift-pane{min-height:100vh;display:grid;place-items:center;text-align:center;padding:0 24px;
  transition:background .8s ease,color .8s ease}
.shift-pane h3{font-size:clamp(24px,3.6111vw,72.2222px);margin:0;font-weight:800;font-family:var(--font-head)}
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
  gap:clamp(24px,4vw,80px);padding:0 clamp(24px,6.9444vw,138.8889px)
}
.sl-viz{width:100%;display:grid;place-items:center}
.sl-viz svg{width:100%;max-width:440px;height:auto;overflow:visible}
.sl-no{
  display:block;font-family:Menlo,monospace;font-size:13px;letter-spacing:.24em;
  color:var(--c-primary);margin-bottom:18px
}
.sl-body h3{margin:0 0 16px;font-size:clamp(24px,2.9167vw,58.3333px);line-height:1.35;
  font-family:var(--font-head);font-weight:800}
.sl-lead{margin:0 0 22px;color:var(--c-muted);font-size:clamp(14px,1.1458vw,22.9167px);max-width:34em}
.sl-body ul{list-style:none;margin:0;padding:0;display:grid;gap:11px}
.sl-body li{position:relative;padding-left:24px;font-size:14.5px}
.sl-body li::before{content:"";position:absolute;left:0;top:.62em;width:9px;height:2px;background:var(--c-primary)}
.sl-num{display:block;font-family:var(--font-head);font-weight:800;line-height:1.02;
  font-size:clamp(46px,6vw,120px);color:var(--c-primary);margin-bottom:16px;
  letter-spacing:-.03em;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.sl-num span{font-size:.5em;margin-left:.1em}

/* 右端のドットナビ */
.sl-dots{
  position:absolute;right:clamp(12px,2.2222vw,44.4444px);top:50%;transform:translateY(-50%);
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
/* スライドの図も、本編のグラフと同じ作りにそろえる */
.sl-viz .gl{stroke:var(--c-border);stroke-width:1.5;opacity:.6}
.sl-viz .axis{stroke:var(--c-border);stroke-width:2}
.sl-viz .trk{stroke:var(--c-border);opacity:.55}
.sl-viz .dot{fill:var(--c-chart);stroke:var(--c-chart-bg);opacity:0;
  transform-box:fill-box;transform-origin:50% 50%;transform:scale(.4)}
.sl.play .sl-viz .dot{opacity:1;transform:scale(1);
  transition:opacity .35s ease var(--d,0s),transform .45s cubic-bezier(.34,1.56,.64,1) var(--d,0s)}
.sl-viz .area{opacity:0}
.sl.play .sl-viz .area{opacity:1;transition:opacity .9s ease .55s}
.sl-viz .bar{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}
.sl.play .sl-viz .bar{transform:scaleY(1);
  transition:transform 1s cubic-bezier(.16,1,.3,1) var(--d,0s)}
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
    padding:clamp(48px,5vw,100px) 24px;gap:28px}
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


/* ---------- 縦の罫線（ページ全体） ----------
   左・中央・右に細い線を通すと、全体が図面のように締まる。
   スクロールしても動かないよう、画面に固定する。 */
.has-rules::before{
  content:"";position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    linear-gradient(var(--c-border),var(--c-border)) left top/1px 100% no-repeat,
    linear-gradient(var(--c-border),var(--c-border)) center top/1px 100% no-repeat,
    linear-gradient(var(--c-border),var(--c-border)) right top/1px 100% no-repeat;
  opacity:.75
}
.has-rules .sec,.has-rules .hero,.has-rules .hdr,.has-rules .ftr{position:relative;z-index:1}
@media(max-width:760px){.has-rules::before{background-position:left top,right top;
  background-size:1px 100%,1px 100%;background-repeat:no-repeat}}

/* ==========================================================
   仕上げの作法
   高い制作費のサイトと、そうでないサイトの差は、
   派手さより「反応の速さ」と「出方の段差」に出る。
   ========================================================== */

/* ---------- ホバー ----------
   ゆっくり薄くなるとためらって見える。ほぼ即時に落として、戻りだけ緩める。 */
a:not(.btn):not(.logo):hover{opacity:.42;transition:opacity .06s cubic-bezier(.165,.84,.44,1)}
a:not(.btn):not(.logo){transition:opacity .5s cubic-bezier(.165,.84,.44,1)}
/* 画像は長めに、ごくわずかだけ寄る。動きが大きいと安く見える */
.gal figure,.flr-pic,.hs-card,.card .hero-media,.about-media,.cpic,.lst-pic{overflow:hidden}
.gal figure img,.flr-pic img,.hs-card img,.card .hero-media img,.lst-pic img{
  transition:transform .9s cubic-bezier(.165,.84,.44,1)}
.gal figure:hover img,.flr-i:hover .flr-pic img,.hs-card:hover img,.card:hover .hero-media img,
.lst-i:hover .lst-pic img{
  transform:scale(calc(var(--iz,1) * 1.055))}

/* ---------- 写真の見せ方（位置・大きさ） ----------
   枠に入りきらない部分をどこで切るか（object-position）と、
   どれだけ寄るか（scale）。値は枠の style から来る。
   何も指定がなければ、これまでどおり真ん中・等倍。 */
:is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic,.exp-l,.car-it,.clip-side,.hero-bg)
  :is(img,video){
  object-position:var(--ix,50%) var(--iy,50%)
}
:is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic,.exp-l,.car-it,.clip-side) img{
  transform:scale(var(--iz,1))
}
/* 写真いっぱいの型。スクロール連動の型は自分で transform を持っており、
   ここで上書きすると動きが消える。掛け合わせは各 .hsc-* の側でしている。 */
.hero:not(.hsc) .hero-bg img{transform:scale(var(--iz,1))}

/* ---------- 出現の段差 ----------
   ブロックごと一度に出すと「表示された」で終わる。
   見出し・説明・中身を少しずつずらすと、組み上がって見える。 */
.rv .sec-head > *,
.rv .grid > *,.rv .nws-i,.rv .flr-i,.rv .plan,.rv .faq details,.rv .btn-row,.rv .lst-i{
  opacity:0;transform:translate3d(0,20px,0);
  transition:opacity .7s var(--ta-ease,ease),transform .9s var(--ta-ease,ease)
}
.rv.in .sec-head > *,
.rv.in .grid > *,.rv.in .nws-i,.rv.in .flr-i,.rv.in .plan,.rv.in .faq details,.rv.in .btn-row,
.rv.in .lst-i{
  opacity:1;transform:none
}
.rv .sec-head > *:nth-child(2){transition-delay:.07s}
.rv .sec-head > *:nth-child(3){transition-delay:.14s}
.rv .grid > *:nth-child(1),.rv .nws-i:nth-child(1),.rv .flr-i:nth-child(1),.rv .plan:nth-child(1),
.rv .lst-i:nth-child(1){transition-delay:.12s}
.rv .grid > *:nth-child(2),.rv .nws-i:nth-child(2),.rv .flr-i:nth-child(2),.rv .plan:nth-child(2),
.rv .lst-i:nth-child(2){transition-delay:.2s}
.rv .grid > *:nth-child(3),.rv .nws-i:nth-child(3),.rv .flr-i:nth-child(3),.rv .plan:nth-child(3),
.rv .lst-i:nth-child(3){transition-delay:.28s}
.rv .grid > *:nth-child(4),.rv .nws-i:nth-child(4),.rv .flr-i:nth-child(4),.rv .lst-i:nth-child(4){transition-delay:.36s}
.rv .grid > *:nth-child(n+5),.rv .nws-i:nth-child(n+5),.rv .flr-i:nth-child(n+5),
.rv .lst-i:nth-child(n+5){transition-delay:.44s}
.rv .btn-row{transition-delay:.5s}

/* ---------- アイコンの一覧 ----------
   絵と短い言葉を縦に組んで、横に並べる。
   絵の色は文字の色に従うので、配色を変えても浮かない。 */
.icos{display:grid;gap:clamp(28px,3.6vw,56px) clamp(18px,2.4vw,40px);justify-items:center;text-align:center}
.icos.c2{grid-template-columns:repeat(2,1fr)}
.icos.c3{grid-template-columns:repeat(3,1fr)}
.icos.c4{grid-template-columns:repeat(4,1fr)}
.ico{display:flex;flex-direction:column;align-items:center;gap:14px;max-width:220px}
.ico-i{display:grid;place-items:center;color:var(--c-text)}
.ico-svg{display:block;width:100%;height:100%}
.ico-s .ico-i{width:44px;height:44px}
.ico-m .ico-i{width:62px;height:62px}
.ico-l .ico-i{width:84px;height:84px}
.ico b{font-size:clamp(14px,1.05vw,17px);font-weight:700;line-height:1.65}
/* 濃い地・メインカラーの上では、絵も文字と同じ色にする */
.bg-dark .ico-i,.bg-primary .ico-i{color:inherit}
@media(max-width:640px){
  .icos.c3,.icos.c4{grid-template-columns:repeat(2,1fr)}
  .ico-l .ico-i{width:64px;height:64px}
}

/* ---------- 写真が流れ続ける ----------
   同じ並びを2組出し、1組ぶん（=50%）動かして継ぎ目を消す。
   写真の枠は .strp-pic。形も土台も、ほかの写真と同じように効く。 */
.strp{position:relative;overflow:hidden;
  /* 両端をうすく消して、切れ目ではなく「続いている」ように見せる */
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)}
.strp-in{display:flex;width:max-content}
.strp-run{display:flex;gap:var(--strp-gap,22px);padding-right:var(--strp-gap,22px);
  animation:strp-flow var(--strp-spd,34s) linear infinite}
.strp-rev .strp-run{animation-direction:reverse}
@keyframes strp-flow{from{transform:translate3d(0,0,0)}to{transform:translate3d(-100%,0,0)}}
.strp:hover .strp-run{animation-play-state:paused}

.strp-it{flex:none;width:var(--strp-w,190px);text-decoration:none;color:inherit;display:block}
.strp-pic{width:100%;overflow:hidden;border-radius:var(--radius);
  background:linear-gradient(135deg,var(--c-primary),var(--c-accent));box-sizing:border-box}
.strp-pic img{width:100%;height:100%;object-fit:cover}
.strp-r4x3 .strp-pic{aspect-ratio:4/3}
.strp-r1x1 .strp-pic{aspect-ratio:1/1}
.strp-r16x9 .strp-pic{aspect-ratio:16/9}
.strp-r3x4 .strp-pic{aspect-ratio:3/4}
.strp-s{--strp-w:132px;--strp-gap:16px}
.strp-m{--strp-w:190px;--strp-gap:22px}
.strp-l{--strp-w:268px;--strp-gap:28px}
/* カードのとき。写真の下に見出しと説明を置く */
.strp-card .strp-it b{display:block;margin-top:12px;font-size:14.5px;font-weight:700;line-height:1.6}
.strp-card .strp-it small{display:block;margin-top:4px;font-size:12.5px;color:var(--c-muted)}
@media(max-width:640px){
  .strp-s{--strp-w:108px}.strp-m{--strp-w:150px}.strp-l{--strp-w:200px}
}

/* ---------- 動画 ----------
   置き場所は写真の枠と同じ扱いにする（形も土台もそのまま効く）。 */
.vid{position:relative;width:100%;overflow:hidden;border-radius:var(--radius);
  background:var(--c-dark);box-sizing:border-box}
.vid-16x9{aspect-ratio:16/9}
.vid-4x3{aspect-ratio:4/3}
.vid-1x1{aspect-ratio:1/1}
.vid-9x16{aspect-ratio:9/16;max-width:420px;margin-inline:auto}
.vid iframe,.vid video{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;
  object-fit:cover}
/* 土台を敷いたときは、内側いっぱいに置き直す */
.plt .vid iframe,.plt .vid video{position:static;height:100%}
.vid-ph{position:absolute;inset:0;color:#fff;opacity:.5}

/* ==========================================================
   写真の土台

   写真の下に色の面を敷き、写真をひと回り小さく載せる。
   面と写真は同じ枠なので、くり抜きの形もそのまま共有する
   （土台がアーチなら、写真もアーチの内側に収まる）。

   要素を増やさず、枠の余白と地の色だけで作っている。
   写真は枠の内側いっぱいなので、余白のぶんが土台として見える。
   ========================================================== */
.plt :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  padding:var(--pt,5%) var(--pr,5%) var(--pb,5%) var(--pl,5%);
  box-sizing:border-box
}
/* 写真の側は、土台の形につられて角が立つので、少しだけ丸めて収める */
.plt :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic) img{
  border-radius:calc(var(--radius) * .55)
}
.plt-dark :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){background:var(--c-dark)}
.plt-primary :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){background:var(--c-primary)}
.plt-accent :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){background:var(--c-accent)}
.plt-surface :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){background:var(--c-surface)}
.plt-white :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  background:#fff;box-shadow:0 24px 50px -30px rgba(15,23,42,.45)
}
/* ずらす。寄せた側の余白を細く、逆側を太くする */
.pltf-br{--pt:1.5%;--pl:1.5%;--pr:9%;--pb:9%}
.pltf-bl{--pt:1.5%;--pr:1.5%;--pl:9%;--pb:9%}
.pltf-tr{--pb:1.5%;--pl:1.5%;--pr:9%;--pt:9%}
.pltf-tl{--pb:1.5%;--pr:1.5%;--pl:9%;--pt:9%}

/* ==========================================================
   写真の形（くり抜き）

   写真そのものは触らない。枠の側を clip-path で抜くだけなので、
   いつでも「四角のまま」に戻せるし、書き出したHTMLも軽いままになる。

   抜くのは枠（.hero-media など）で、中の img ではない。枠には
   下地の色が敷いてあるので、img だけを抜くと下地が形の外に残る。
   ========================================================== */
:is(.shp-round,.shp-circle,.shp-arch,.shp-leaf,.shp-hex,.shp-slant,.shp-egg,
  .shp-slats,.shp-arches,.shp-wave,.shp-blob,
  .shp-step,.shp-notch,.shp-ticket,.shp-sparkle,.shp-cross,.shp-diamond)
  :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  /* 角丸と重ねると形が濁るので、抜くときは角丸を落とす */
  border-radius:0
}
.shp-round :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:clamp(18px,2.2vw,44px)
}
.shp-circle :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  clip-path:circle(50% at 50% 50%);aspect-ratio:1/1
}
.shp-arch :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:999px 999px 0 0
}
/* 木の葉：対角の2隅だけを大きく丸める */
.shp-leaf :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:clamp(40px,7vw,140px) 0 clamp(40px,7vw,140px) 0
}
.shp-hex :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)
}
.shp-slant :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  clip-path:polygon(0 0,100% 0,100% 88%,0 100%)
}
.shp-egg :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:50% 50% 46% 46% / 58% 58% 42% 42%
}


/* ---------- 形をなぞって抜く（デザイン寄り） ----------
   曲線は多角形（clip-path:polygon）では出せないので、SVGの絵を
   マスクとして敷く。SVGはCSSの中に文字として入れているので、
   外から読み込むものは増えない（file:// でもそのまま動く）。

   preserveAspectRatio='none' と mask-size:100% 100% で、枠の形に
   合わせて伸び縮みする。丸い部分は枠の縦横比なりに平たくなるが、
   見本の絵と同じ出かたなので、これでよい。 */
.shp-slats :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0.0 0 L22.0 0 L22.0 85 A11 15 0 0 1 0.0 85 Z M26.0 15 A11 15 0 0 1 48.0 15 L48.0 100 L26.0 100 Z M52.0 0 L74.0 0 L74.0 85 A11 15 0 0 1 52.0 85 Z M78.0 15 A11 15 0 0 1 100.0 15 L100.0 100 L78.0 100 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0.0 0 L22.0 0 L22.0 85 A11 15 0 0 1 0.0 85 Z M26.0 15 A11 15 0 0 1 48.0 15 L48.0 100 L26.0 100 Z M52.0 0 L74.0 0 L74.0 85 A11 15 0 0 1 52.0 85 Z M78.0 15 A11 15 0 0 1 100.0 15 L100.0 100 L78.0 100 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
.shp-arches :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0.0 18 A15.5 18 0 0 1 31.0 18 L31.0 100 L0.0 100 Z M34.5 18 A15.5 18 0 0 1 65.5 18 L65.5 100 L34.5 100 Z M69.0 18 A15.5 18 0 0 1 100.0 18 L100.0 100 L69.0 100 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0.0 18 A15.5 18 0 0 1 31.0 18 L31.0 100 L0.0 100 Z M34.5 18 A15.5 18 0 0 1 65.5 18 L65.5 100 L34.5 100 Z M69.0 18 A15.5 18 0 0 1 100.0 18 L100.0 100 L69.0 100 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
.shp-wave :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0 0 L100 0 L100 84 C83 100 67 68 50 84 C33 100 17 68 0 84 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0 0 L100 0 L100 84 C83 100 67 68 50 84 C33 100 17 68 0 84 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
.shp-blob :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M52 1 C80 -2 99 18 97 45 C95 72 78 99 49 98 C21 97 1 77 2 48 C3 21 24 4 52 1 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M52 1 C80 -2 99 18 97 45 C95 72 78 99 49 98 C21 97 1 77 2 48 C3 21 24 4 52 1 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}

/* 段ちがい */
.shp-step :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0 31.6 A4.5 4.5 0 0 1 4.5 27.1 L41.3 27.1 A4.5 4.5 0 0 0 45.8 22.6 L45.8 4.5 A4.5 4.5 0 0 1 50.3 0 L95.5 0 A4.5 4.5 0 0 1 100 4.5 L100 34.9 A4.5 4.5 0 0 1 95.5 39.4 L78.5 39.4 A4.5 4.5 0 0 0 74 43.9 L74 95.5 A4.5 4.5 0 0 1 69.5 100 L4.5 100 A4.5 4.5 0 0 1 0 95.5 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0 31.6 A4.5 4.5 0 0 1 4.5 27.1 L41.3 27.1 A4.5 4.5 0 0 0 45.8 22.6 L45.8 4.5 A4.5 4.5 0 0 1 50.3 0 L95.5 0 A4.5 4.5 0 0 1 100 4.5 L100 34.9 A4.5 4.5 0 0 1 95.5 39.4 L78.5 39.4 A4.5 4.5 0 0 0 74 43.9 L74 95.5 A4.5 4.5 0 0 1 69.5 100 L4.5 100 A4.5 4.5 0 0 1 0 95.5 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
/* 角を四角く欠く */
.shp-notch :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M5 0 L61 0 A5 5 0 0 1 66 5 L66 29 A5 5 0 0 0 71 34 L95 34 A5 5 0 0 1 100 39 L100 95 A5 5 0 0 1 95 100 L5 100 A5 5 0 0 1 0 95 L0 5 A5 5 0 0 1 5 0 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M5 0 L61 0 A5 5 0 0 1 66 5 L66 29 A5 5 0 0 0 71 34 L95 34 A5 5 0 0 1 100 39 L100 95 A5 5 0 0 1 95 100 L5 100 A5 5 0 0 1 0 95 L0 5 A5 5 0 0 1 5 0 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
/* チケット（左右がへこむ） */
.shp-ticket :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M6 0 L94 0 A6 6 0 0 1 100 6 L100 37 A13 13 0 0 0 100 63 L100 94 A6 6 0 0 1 94 100 L6 100 A6 6 0 0 1 0 94 L0 63 A13 13 0 0 0 0 37 L0 6 A6 6 0 0 1 6 0 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M6 0 L94 0 A6 6 0 0 1 100 6 L100 37 A13 13 0 0 0 100 63 L100 94 A6 6 0 0 1 94 100 L6 100 A6 6 0 0 1 0 94 L0 63 A13 13 0 0 0 0 37 L0 6 A6 6 0 0 1 6 0 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
/* 4点のきらめき */
.shp-sparkle :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M50 0 C50 34 66 50 100 50 C66 50 50 66 50 100 C50 66 34 50 0 50 C34 50 50 34 50 0 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M50 0 C50 34 66 50 100 50 C66 50 50 66 50 100 C50 66 34 50 0 50 C34 50 50 34 50 0 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
/* 丸みのある十字 */
.shp-cross :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M38 0 L62 0 A7 7 0 0 1 69 7 L69 24 A7 7 0 0 0 76 31 L93 31 A7 7 0 0 1 100 38 L100 62 A7 7 0 0 1 93 69 L76 69 A7 7 0 0 0 69 76 L69 93 A7 7 0 0 1 62 100 L38 100 A7 7 0 0 1 31 93 L31 76 A7 7 0 0 0 24 69 L7 69 A7 7 0 0 1 0 62 L0 38 A7 7 0 0 1 7 31 L24 31 A7 7 0 0 0 31 24 L31 7 A7 7 0 0 1 38 0 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M38 0 L62 0 A7 7 0 0 1 69 7 L69 24 A7 7 0 0 0 76 31 L93 31 A7 7 0 0 1 100 38 L100 62 A7 7 0 0 1 93 69 L76 69 A7 7 0 0 0 69 76 L69 93 A7 7 0 0 1 62 100 L38 100 A7 7 0 0 1 31 93 L31 76 A7 7 0 0 0 24 69 L7 69 A7 7 0 0 1 0 62 L0 38 A7 7 0 0 1 7 31 L24 31 A7 7 0 0 0 31 24 L31 7 A7 7 0 0 1 38 0 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}
/* 角の丸いひし形 */
.shp-diamond :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M42.0 8.0 Q50 0 58.0 8.0 L92.0 42.0 Q100 50 92.0 58.0 L58.0 92.0 Q50 100 42.0 92.0 L8.0 58.0 Q0 50 8.0 42.0 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M42.0 8.0 Q50 0 58.0 8.0 L92.0 42.0 Q100 50 92.0 58.0 L58.0 92.0 Q50 100 42.0 92.0 L8.0 58.0 Q0 50 8.0 42.0 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}

/* 自分で用意した形。マスクの画像はブロックの --shape から来る。
   透明なところが抜ける絵として作ってあるので、そのまま敷けばよい。 */
.shp-own :is(.hero-media,.about-media,.gal figure,.flr-pic,.hs-card,.cpic,.vid,.strp-pic,.lst-pic){
  border-radius:0;
  -webkit-mask-image:var(--shape);
  mask-image:var(--shape);
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat
}

/* ---------- 動きを減らす設定への配慮 ---------- */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;
    transition-duration:.001ms!important;scroll-behavior:auto!important}
  [data-ta] .ch{opacity:1!important;transform:none!important;filter:none!important;visibility:visible!important}
  [data-ta].ta-fillgrad{background-size:100% 100%,100% 100%!important}
  .ia-on{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}
  .rv,.rv .sec-head > *,.rv .grid > *,.rv .nws-i,.rv .flr-i,.rv .plan,
  .rv .faq details,.rv .btn-row{opacity:1!important;transform:none!important;transition-delay:0s!important}
  /* 装飾は「止まった1枚の絵」として残す。消すと画面が寂しくなるため */
  .deco b,.deco .sk,.deco .grain,.cg-float.in .cpic,.mq-run,.strp-run{animation:none!important}
  .cpic,.sec-collage .cpic{opacity:1!important;transform:rotate(var(--rot,0deg))!important}
  .cb{clip-path:none!important}
  .hero.dk-depth .hero-bg img,.hero.dk-depth .hero-in{transform:none!important}
  /* グラフは「伸びる前」が高さ0・点が消えた状態なので、
     動かさない設定では最初から出来上がった形で置く（図が消えては困る） */
  .chart .bar,.sl-viz .bar{transform:scaleY(1)!important}
  .chart .dot,.sl-viz .dot{opacity:1!important;transform:none!important}
  .chart .area,.sl-viz .area{opacity:1!important}
  .chart .ln,.sl-viz [data-draw]{stroke-dashoffset:0!important}
}

/* ---------- フォームの送信結果と、機械よけの欄 ----------
   機械よけ（honeypot）は、人には見えないが自動で埋める道具には見える欄。
   ここが埋まっていたら人ではないので、受け口で静かに捨てる。
   display:none にすると見つけられて避けられるので、画面の外へ出す。 */
.form{position:relative}
.fm-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.fm-msg{margin:12px 0 0;font-size:14px;line-height:1.8;min-height:1px}
.fm-msg.ok{color:var(--c-primary);font-weight:700}
.fm-msg.ng{color:#c0392b;font-weight:700}
`;

/* 書き出したHTMLでも動く最小限のJS
   ① ハンバーガーメニュー ② 文字アニメーション ③ ブロックの出現
   ④ お問い合わせフォームの送信 */

const SITE_JS = `
(function(){
  /* ---------- ハンバーガーメニュー ---------- */
  var t=document.querySelector('.hdr-toggle'),n=document.querySelector('.hdr .nav');
  if(t&&n){t.onclick=function(){n.classList.toggle('open')};}
  document.querySelectorAll('.nav a').forEach(function(a){
    a.addEventListener('click',function(){ if(n) n.classList.remove('open'); });
  });

  /* ---------- 重ねるヘッダーの文字色 ----------
     すぐ下が写真のヒーローなら白字にする。地の明るいヒーローに
     白字を出すと読めないので、下を見てから決める。 */
  document.querySelectorAll('.hdr.bar-over').forEach(function(h){
    var nx = h.nextElementSibling;
    if(nx && nx.matches('.hero.cover, .hsc.cover, .collage')) h.classList.add('on-photo');
  });

  /* ---------- お問い合わせフォーム ----------
     押した人を待たせないよう、送っている間はボタンを止めて言葉を出す。
     つながらなかったときに黙って終わると、送れたと思って待ってしまう。 */
  /* 届け先がまだ決まっていないフォームは、そのままだと押した瞬間に
     ページが読み直され、打った内容が黙って消える。送れないなら
     送れないと言って、書いたものは残す。 */
  document.querySelectorAll('form.form[data-form-wait]').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var m = f.querySelector('.fm-msg');
      if(m){ m.className='fm-msg ng'; m.textContent='ただいま受付を準備中です。お手数ですが、お電話でご連絡ください。'; }
    });
  });

  document.querySelectorAll('form.form[data-form]').forEach(function(f){
    var btn = f.querySelector('button[type=submit]'), msg = f.querySelector('.fm-msg');
    var label = btn ? btn.textContent : '';
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if(f.dataset.sending) return;
      f.dataset.sending = '1';
      if(btn){ btn.disabled = true; btn.textContent = '送信中…'; }
      if(msg){ msg.className = 'fm-msg'; msg.textContent = ''; }
      var fd = new FormData(f);
      fetch(f.dataset.form, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ siteId:f.dataset.site, name:fd.get('name'),
          email:fd.get('email'), message:fd.get('message'), company:fd.get('company') })
      }).then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j}; }); })
        .then(function(res){
          if(!res.ok) throw new Error(res.j && res.j.error);
          f.reset();
          if(msg){ msg.className = 'fm-msg ok'; msg.textContent = f.dataset.thanks || 'お問い合わせありがとうございます。'; }
        })
        .catch(function(err){
          if(msg){ msg.className = 'fm-msg ng';
            msg.textContent = (err && err.message) || '送れませんでした。電波の入るところでもう一度お試しください。'; }
        })
        .then(function(){
          delete f.dataset.sending;
          if(btn){ btn.disabled = false; btn.textContent = label; }
        });
    });
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
     ヒーローの装飾レイヤー
     ========================================================== */

  /* ---------- ポインタ追従 ----------
     生の座標をそのまま使うとカクつくので、毎フレーム少しずつ寄せる。
     この「遅れ」が、高い制作費のサイトらしい重みになる。 */
  [].slice.call(d.querySelectorAll('.hero[data-hpt]')).forEach(function(hero){
    var deco = hero.querySelector('.deco');
    var live = false, tx = .5, ty = .45, x = .5, y = .45, x2 = .5, y2 = .45, raf = 0;

    function frame(){
      x += (tx - x) * .085; y += (ty - y) * .085;      /* 大きいガラス：ゆっくり */
      x2 += (tx - x2) * .16; y2 += (ty - y2) * .16;    /* 小さいガラス：やや速く */
      var s = hero.style;
      s.setProperty('--mx', ((x - .5) * 2).toFixed(3));
      s.setProperty('--my', ((y - .5) * 2).toFixed(3));
      if(deco){
        var ds = deco.style;
        ds.setProperty('--px', (x * 100).toFixed(2) + '%');
        ds.setProperty('--py', (y * 100).toFixed(2) + '%');
        ds.setProperty('--px2', (x2 * 100).toFixed(2) + '%');
        ds.setProperty('--py2', (y2 * 100).toFixed(2) + '%');
      }
      var near = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tx - x2) + Math.abs(ty - y2);
      if(live || near > .002) raf = requestAnimationFrame(frame);
      else raf = 0;
    }
    function wake(){ if(!raf) raf = requestAnimationFrame(frame); }

    if(reduce || !matchMedia('(hover:hover)').matches) return;
    hero.addEventListener('pointermove', function(e){
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      live = true; wake();
    });
    hero.addEventListener('pointerleave', function(){
      tx = .5; ty = .45; live = false; wake();
    });
    frame();
  });

  /* ---------- 光の粒 ----------
     ゆっくり昇る粒。ポインタが近いと軽く押しのけられる。 */
  [].slice.call(d.querySelectorAll('[data-deco="dust"] .du')).forEach(function(cv){
    var hero = cv.closest('.hero'), ctx = cv.getContext('2d'), ps = [], w = 0, h = 0, dpr = 1;
    var mx = -999, my = -999, running = false;

    function fit(){
      dpr = Math.min(2, devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(40, Math.min(150, Math.round(w * h / 8200)));
      ps = [];
      for(var i = 0; i < n; i++) ps.push({
        x: Math.random() * w, y: Math.random() * h,
        r: 1 + Math.random() * 2.6,
        v: .12 + Math.random() * .38,          /* 昇る速さ */
        s: .45 + Math.random() * .55,          /* 明るさ */
        p: Math.random() * 6.28, a: .4 + Math.random() * .9,  /* 横ゆれ */
        ox: 0, oy: 0
      });
    }
    function draw(){
      ctx.clearRect(0, 0, w, h);
      for(var i = 0; i < ps.length; i++){
        var o = ps[i];
        o.y -= o.v; o.p += .01;
        if(o.y < -6){ o.y = h + 6; o.x = Math.random() * w; }
        var px = o.x + Math.sin(o.p) * o.a * 8;
        /* ポインタから遠ざける。戻りはゆっくり */
        var dx = px - mx, dy = o.y - my, dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < 130){ var f = (1 - dist / 130) * 16; o.ox += (dx / (dist || 1) * f - o.ox) * .1; o.oy += (dy / (dist || 1) * f - o.oy) * .1; }
        else { o.ox += (0 - o.ox) * .05; o.oy += (0 - o.oy) * .05; }
        /* 点のままだと写真の細かい葉に埋もれるので、にじみを付ける */
        ctx.shadowBlur = o.r * 4; ctx.shadowColor = 'rgba(255,255,255,.85)';
        ctx.beginPath();
        ctx.arc(px + o.ox, o.y + o.oy, o.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,255,255,' + o.s.toFixed(2) + ')';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      if(running) requestAnimationFrame(draw);
    }
    fit();
    addEventListener('resize', fit, {passive:true});
    if(hero){
      hero.addEventListener('pointermove', function(e){
        var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
      });
      hero.addEventListener('pointerleave', function(){ mx = my = -999; });
    }
    /* 画面の外に出たら止める。ずっと回し続けると電池を食う */
    if('IntersectionObserver' in window && !reduce){
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(e.isIntersecting && !running){ running = true; draw(); }
          else if(!e.isIntersecting) running = false;
        });
      }, {threshold:0}).observe(cv);
    }else if(!reduce){ running = true; draw(); }
    else draw();
  });

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


  /* ---------- 慣性スクロール ----------
     高いサイトの「手触り」はほぼこれ。ホイールを1回まわしたあと、
     指を離しても少し滑ってから止まる。

     よくある実装は中身を wrapper ごと transform でずらす方式だが、
     それだと position:sticky が効かなくなる。このツールは貼り付く
     ブロック（横流し・スクロール連動ヒーロー・積み重なるカード）を
     多く持つので、ページ本来のスクロール位置そのものを滑らかに
     動かす方式にした。sticky も IntersectionObserver もそのまま動く。 */
  if(body.dataset.smooth === '1' && !reduce && matchMedia('(hover:hover)').matches){
    var sTo = scrollY, sAt = scrollY, sRaf = 0, sWheel = 0;
    var sMax = function(){ return Math.max(0, d.documentElement.scrollHeight - innerHeight); };
    function sLoop(){
      sAt += (sTo - sAt) * .12;
      if(Math.abs(sTo - sAt) < .5){ sAt = sTo; sRaf = 0; scrollTo(0, sAt); return; }
      scrollTo(0, sAt);
      sRaf = requestAnimationFrame(sLoop);
    }
    addEventListener('wheel', function(e){
      if(e.ctrlKey || e.defaultPrevented) return;
      /* 中でスクロールできる箱の上では、そちらに任せる */
      var n = e.target;
      while(n && n !== body){
        if(n.scrollHeight - n.clientHeight > 4 && /auto|scroll/.test(getComputedStyle(n).overflowY)) return;
        n = n.parentElement;
      }
      e.preventDefault();
      sTo = Math.max(0, Math.min(sMax(), sTo + e.deltaY));
      sWheel = performance.now();
      if(!sRaf) sRaf = requestAnimationFrame(sLoop);
    }, {passive:false});
    /* キーボードやアンカーで飛んだときは、目標を今の位置に合わせ直す */
    addEventListener('scroll', function(){
      if(!sRaf && performance.now() - sWheel > 150){ sTo = sAt = scrollY; }
    }, {passive:true});
    addEventListener('resize', function(){ sTo = sAt = scrollY; }, {passive:true});
  }

  /* ---------- スクロール連動ヒーロー ----------
     区間の進み具合を --p（0〜1）で渡すだけ。動きはCSS側に任せる。 */
  [].slice.call(d.querySelectorAll('[data-heroscroll]')).forEach(function(sec){
    var last = -1;
    function upd(){
      var p = progress(sec);
      /* 小数3桁で足りる。毎フレーム同じ値を書き込むと無駄に再計算が走る */
      var v = Math.round(p * 1000) / 1000;
      if(v === last) return;
      last = v;
      sec.style.setProperty('--p', v);
    }
    watchScroll(upd);
    upd();
  });


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
    /* 輪の半径は、実際のカード幅から決める。決め打ちにすると、
       狭い画面でカードを小さくしても輪だけ大きいままになる。 */
    var half = (inner.offsetWidth || 220) / 2;
    var R = Math.round((half + 18) / Math.tan(Math.PI / N)) || 300;
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
    [].slice.call(w.querySelectorAll('[data-draw]')).forEach(function(el){
      try{ el.style.setProperty('--len', Math.ceil(el.getTotalLength())); }catch(e){}
    });
  });

  if(onScroll.length){
    addEventListener('scroll', scrollTick, {passive:true});
    addEventListener('resize', scrollTick, {passive:true});
    scrollTick();
  }

  /* ---------- 画面に入ったら再生 ---------- */
  var watch = [].slice.call(d.querySelectorAll('[data-ta]:not(.in), .ia-on, .rv, .draw-wrap, [data-slot], [data-collage]'));
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
