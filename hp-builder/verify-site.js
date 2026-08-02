/* docs/ を実際にHTTPで配信して、公開後と同じ条件で確かめる。
   file:// で開くのとは条件が違う（相対リンクの解決、iframe の扱い）ので、
   公開前の確認はかならずHTTP越しに行う。

   実行: node build-site.js && node verify-site.js
   Playwright が要る:  npm i -D playwright && npx playwright install chromium
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('playwright が見つかりません。npm i -D playwright を実行してください。');
  process.exit(2);
}

const ROOT = path.join(__dirname, '..', 'docs');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, p);
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  } catch { res.writeHead(404); return res.end('404'); }
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const fail = [];
const note = (ok, msg) => { console.log(`${ok ? '  ok ' : '  NG '} ${msg}`); if (!ok) fail.push(msg); };

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();

  /* --- 1. 各ページが単体で開くか --- */
  const pages = ['/', '/app/', '/demo/', '/demo/cafe-verdure.html', '/demo/hero-deco.html',
    '/demo/hero-scroll.html', '/demo/hero-collage.html'];
  for (const p of pages) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    const resp = await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    /* ビルダーは起動直後にテンプレート選択が開く。実際の使い方どおり1つ選んでから見る */
    if (p === '/app/') {
      await page.frameLocator('#tplFrame').locator('.tc').first().click();
      await page.waitForTimeout(1500);
    }
    note(resp.status() === 200, `${p} → ${resp.status()}`);
    note(errs.length === 0, `${p} JSエラー ${errs.length}件 ${errs.slice(0, 2).join(' / ')}`);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    note(over <= 0, `${p} 横はみ出し ${over}px`);
    /* 一度も出てこない要素がないか。
       opacity:0 を見つけただけでは判定できないものが3種あるので、
       候補ごとにその位置まで運んでから測り直す：
        ・出現待ち（IntersectionObserver が届く前／ずらしの途中）
        ・スクロールに連れて薄くなる型（通り過ぎた後は 0 が正しい）
        ・ホバーで出るUI（ブロック一覧の上下ボタンなど） */
    const hidden = await page.evaluate(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const flat = (el) => {
        const r = el.getBoundingClientRect();
        if (!el.textContent.trim() && el.tagName !== 'IMG') return false;
        const cs = getComputedStyle(el);
        return cs.opacity === '0' && cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0;
      };
      /* html{scroll-behavior:smooth} が効いているので scrollTo は即座には着かない。
         behavior:'instant' で運び、止まったのを確かめてから測る。 */
      const goto = async (y) => {
        scrollTo({ top: y, behavior: 'instant' });
        let prev = -1;
        for (let i = 0; i < 40 && Math.round(scrollY) !== prev; i++) { prev = Math.round(scrollY); await wait(50); }
      };
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 400) { await goto(y); await wait(160); }
      await goto(h); await wait(2600);

      const out = [];
      window.__stuck = [];
      for (const el of [...document.querySelectorAll('body *')].filter(flat)) {
        const r = el.getBoundingClientRect();
        await goto(scrollY + r.top + r.height / 2 - innerHeight / 2);
        await wait(1800);
        if (!flat(el)) continue;

        /* スクロールで濃さが変わる型は、区間ぜんぶを通してどこかで見えれば正しい */
        const sec = el.closest('[data-heroscroll], [data-hscroll], .pinsec');
        if (sec) {
          const top = sec.offsetTop, h = sec.offsetHeight;
          let peak = 0;
          for (let y = top; y <= top + h; y += 100) {
            await goto(y);
            peak = Math.max(peak, parseFloat(getComputedStyle(el).opacity));
            if (peak > 0.9) break;
          }
          if (peak > 0.9) continue;
        }
        /* ホバーで出るUIかどうかは、本物のホバーでないと分からない（後段で見る） */
        window.__stuck.push(el);
        out.push((el.tagName + '.' + el.className).slice(0, 60));
      }
      return out;
    });

    /* CSS の :hover は合成イベントでは点かないので、本物のホバーで測り直す */
    const stuck = [];
    for (let i = 0; i < hidden.length; i++) {
      const h = await page.evaluateHandle((k) => window.__stuck[k], i);
      const el = h.asElement();
      let shown = false;
      try {
        await el.hover({ timeout: 4000 });
        await page.waitForTimeout(500);
        shown = await el.evaluate((n) => getComputedStyle(n).opacity !== '0');
      } catch { /* ホバーできない＝出しようがない、とみなす */ }
      if (!shown) stuck.push(hidden[i]);
    }
    note(stuck.length === 0, `${p} 出てこない要素 ${stuck.length}件 ${stuck.slice(0, 3).join(' / ')}`);
    await ctx.close();
  }

  /* --- 2. LPのリンクが全部つながっているか --- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    const hrefs = await page.evaluate(() =>
      [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))]);
    for (const h of hrefs) {
      if (h === '#' || h === '') {
        note(false, `LP 行き先のないリンク "${h}"`);
      } else if (h === '#top') {
        note(true, 'LP アンカー #top（仕様上つねに文書の先頭）');
      } else if (h.startsWith('#')) {
        const found = await page.evaluate((id) => !!document.getElementById(id.slice(1)), h);
        note(found, `LP アンカー ${h}`);
      } else {
        const url = new URL(h, base + '/').href;
        const r = await page.request.get(url);
        note(r.status() === 200, `LP リンク ${h} → ${r.status()}`);
      }
    }
    await ctx.close();
  }

  /* --- 3. 見本ページのリンク --- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(base + '/demo/', { waitUntil: 'load' });
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
    for (const h of hrefs) {
      const r = await page.request.get(new URL(h, base + '/demo/').href);
      note(r.status() === 200, `見本 リンク ${h} → ${r.status()}`);
    }
    await ctx.close();
  }

  /* --- 4. ビルダー本体が実際に動くか（テンプレを選んでプレビューが描かれる） --- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(base + '/app/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const f = document.querySelector('iframe');
      const d = f && f.contentDocument;
      return {
        iframe: !!f,
        secs: d ? d.querySelectorAll('section,header,footer').length : 0,
        blocks: document.querySelectorAll('#layers .layer, .layer').length,
      };
    });
    note(info.iframe, 'ビルダー プレビューiframe あり');
    note(info.secs > 3, `ビルダー プレビュー内のブロック ${info.secs}個`);
    note(errs.length === 0, `ビルダー JSエラー ${errs.length}件 ${errs.slice(0, 2).join(' / ')}`);
    await ctx.close();
  }

  /* --- 5. 幅を変えて横はみ出しを見る --- */
  for (const w of [390, 768, 1024, 1440, 1920, 2560]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    note(over <= 0, `LP ${w}px 横はみ出し ${over}px`);
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(fail.length ? `\n失敗 ${fail.length}件` : '\nすべて通過');
  process.exit(fail.length ? 1 : 0);
})();
