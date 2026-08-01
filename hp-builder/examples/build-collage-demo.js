/* コラージュ・ヒーローの見本。実行: node examples/build-collage-demo.js */
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..');
const ctx=vm.createContext({console,Math,Date,JSON});
for(const f of ['assets/site-css.js','assets/blocks.js','assets/templates.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
vm.runInContext('globalThis.__api={BLOCKS,SITE_CSS,SITE_JS,fontStack};',ctx);
const {BLOCKS,SITE_CSS,SITE_JS,fontStack}=ctx.__api;
const photo=JSON.parse(fs.readFileSync(path.join(__dirname,'verdure-photos.json'),'utf8'));
const P=Object.values(photo);

const body = BLOCKS.collage.render(Object.assign({}, BLOCKS.collage.defaults, {
  bandR: '緑を感じながら、\nゆっくり過ごす',
  bandL: '木漏れ日の\nガーデンカフェ',
  front: 3, dark: 62, gray: true, float: true, tall: 'l',
  photos: P.map((src,i)=>({src, alt:`写真${i+1}`})),
})) + BLOCKS.rich.render(Object.assign({}, BLOCKS.rich.defaults, {
  title:'コラージュのあと', align:'center',
  body:'ヒーローのあとは、ふつうのセクションが続きます。',
}));

const t={primary:'#e0001b',accent:'#111111',bg:'#ffffff',surface:'#f4f4f4',
  text:'#111111',muted:'#6b6b6b',border:'#d8d8d8',dark:'#111111',
  radius:0,max:1180,font:'gothic',fontHead:'gothic'};
const on=(h)=>{const n=parseInt(h.slice(1),16);const L=(v)=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
  return (0.2126*L((n>>16)&255)+0.7152*L((n>>8)&255)+0.0722*L(n&255))>0.42?'#111111':'#ffffff';};
fs.writeFileSync(path.join(__dirname,'hero-collage.html'), `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>コラージュ・ヒーローの見本</title><style>
:root{--c-primary:${t.primary};--c-accent:${t.accent};--c-bg:${t.bg};--c-surface:${t.surface};
--c-text:${t.text};--c-muted:${t.muted};--c-border:${t.border};--c-dark:${t.dark};
--radius:${t.radius}px;--max:${t.max}px;--font:${fontStack(t.font)};--font-head:${fontStack(t.fontHead)};
--c-on-primary:${on(t.primary)};--c-on-accent:${on(t.accent)};--c-on-dark:${on(t.dark)};
--ta-dur:1s;--ta-stagger:.04s;--ta-ease:cubic-bezier(.2,.7,.3,1);}
${SITE_CSS}</style></head>
<body class="tpl-recruit sty-mono" data-anim="fadeup" data-reveal="0">
${body}
<script>${SITE_JS}<\/script></body></html>`);
console.log('examples/hero-collage.html を作成しました');
