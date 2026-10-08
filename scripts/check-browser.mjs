/** Headless Chromium regression checks; Node 22+, no packages.
 * BRAND_BROWSER points to an installed Chrome/Edge/Chromium executable.
 * Optional BRAND_SCREENSHOTS saves review PNGs outside the kit.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.BRAND_BROWSER) throw Error('Set BRAND_BROWSER to an installed Chromium browser executable.');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cosmik-browser-'));
const screenshots = process.env.BRAND_SCREENSHOTS;
if (screenshots) fs.mkdirSync(screenshots, {recursive:true});
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  const mime = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.woff2':'font/woff2', '.ttf':'font/ttf'};
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = spawn(process.env.BRAND_BROWSER, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
{windowsHide:true, stdio:'ignore'});
let launchError;
browser.on('error', error => { launchError = error; });
let socket;
const pending = new Map();
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile) && !launchError; i++) await pause(100);
  if (launchError) throw launchError;
  const debugPort = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const errors = [];
  let id = 0;
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const call = pending.get(message.id);
      if (!call) return;
      clearTimeout(call.timer); pending.delete(message.id);
      if (message.error) call.reject(Error(JSON.stringify(message.error)));
      else call.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params);
    else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry);
  };
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    const timer = setTimeout(() => { pending.delete(n); reject(Error(`Timed out: ${method}`)); }, 10000);
    pending.set(n, {resolve, reject, timer});
    socket.send(JSON.stringify({id:n, method, params}));
  });
  const evaluate = async expression => {
    const response = await cdp('Runtime.evaluate', {expression, awaitPromise:true, returnByValue:true});
    if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const key = async (key, code, windowsVirtualKeyCode, modifiers = 0) => {
    for (const type of ['keyDown', 'keyUp']) await cdp('Input.dispatchKeyEvent', {type, key, code, windowsVirtualKeyCode, modifiers});
  };
  const size = width => cdp('Emulation.setDeviceMetricsOverride', {width, height:1000, deviceScaleFactor:1, mobile:false});
  const shot = async name => {
    if (!screenshots) return;
    await pause(180); // Let the specimen's short color transitions settle.
    const result = await cdp('Page.captureScreenshot', {format:'png', captureBeyondViewport:false, fromSurface:true});
    fs.writeFileSync(path.join(screenshots, name + '.png'), Buffer.from(result.data, 'base64'));
  };
  console.log('Browser:', (await cdp('Browser.getVersion')).product);
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable');
  await size(1280);
  await cdp('Page.navigate', {url:`http://127.0.0.1:${server.address().port}/specimens/components.html`});
  for (let i = 0; i < 100; i++) {
    if (await evaluate('document.readyState === "complete" && !!document.querySelector("#kit-picker")')) break;
    await pause(50);
  }
  assert.equal(await evaluate('new Set([...document.querySelectorAll("[id]")].map(e=>e.id)).size === document.querySelectorAll("[id]").length'), true, 'unique IDs');
  assert.equal(await evaluate(`[...document.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby]')].every(e=>['aria-controls','aria-labelledby','aria-describedby'].every(a=>!e.hasAttribute(a)||e.getAttribute(a).split(' ').every(id=>document.getElementById(id))))`), true, 'ARIA references resolve');
  for (const kit of ['cosmik', 'hplx']) {
    await evaluate(`{const p=document.querySelector('#kit-picker');p.value='${kit}';p.dispatchEvent(new Event('change'));}`);
    await evaluate('document.fonts.ready.then(()=>true)');
    const heading = await evaluate(`getComputedStyle(document.querySelector('#dark-title')).fontFamily`);
    assert.ok(heading.includes(kit === 'hplx' ? 'Spectral' : 'Inter'), heading);
    assert.ok((await evaluate(`getComputedStyle(document.querySelector('#dark button')).fontFamily`)).includes('Inter'));
    for (const scale of [100, 200]) for (const width of [1280, 768, 390, 320]) {
      await size(width);
      await evaluate(`document.documentElement.style.fontSize='${scale}%'`);
      const bounds = await evaluate('({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})');
      assert.ok(bounds.scroll <= bounds.width + 1, `${kit} ${width}px ${scale}% text overflows: ${JSON.stringify(bounds)}`);
      if ((width === 1280 && scale === 100) || (width === 320 && scale === 200)) {
        for (const mode of ['dark', 'light']) {
          await evaluate(`document.querySelector('#${mode}').scrollIntoView()`);
          await shot(`${kit}-${mode}-${width}-text${scale}`);
        }
      }
    }
    await size(1280); await evaluate('document.documentElement.style.fontSize="100%"');
    for (const mode of ['dark', 'light']) {
      await evaluate(`document.querySelector('#${mode}-play-tab').focus()`);
      await key('ArrowRight', 'ArrowRight', 39);
      assert.equal(await evaluate(`document.querySelector('#${mode}-create-tab').getAttribute('aria-selected')`), 'true');
      assert.equal(await evaluate(`document.querySelector('#${mode}-play-panel').hidden`), true);
      await key('Home', 'Home', 36);
      assert.equal(await evaluate(`document.activeElement.id`), `${mode}-play-tab`);
      await key('End', 'End', 35);
      await evaluate(`document.querySelector('#${mode} summary').click()`);
      for (const action of ['duplicate', 'copy', 'delete']) {
        await evaluate(`document.querySelector('#${mode} [data-confirm="${action}"]').click()`);
        assert.equal(await evaluate(`document.querySelector('#${mode} dialog').open`), true);
        assert.equal(await evaluate(`document.activeElement.hasAttribute('data-cancel')`), true, 'safe initial focus');
        // Native dialogs keep background controls inert. Chromium may visit browser
        // chrome (reported as BODY) when tabbing past the first dialog control.
        await key('Tab', 'Tab', 9);
        assert.equal(await evaluate('document.activeElement.hasAttribute("data-accept")'), true);
        await key('Tab', 'Tab', 9, 8);
        assert.equal(await evaluate('document.activeElement.hasAttribute("data-cancel")'), true);
        await key('Tab', 'Tab', 9, 8);
        if (await evaluate('document.activeElement === document.body')) await key('Tab', 'Tab', 9, 8);
        assert.equal(await evaluate('document.activeElement.hasAttribute("data-accept")'), true);
        await evaluate(`document.querySelector('#kit-picker').focus()`);
        assert.equal(await evaluate(`!!document.activeElement.closest('dialog')`), true, 'background stays inert');
        if (kit === 'hplx' && action === 'delete') await shot(`hplx-${mode}-delete-dialog`);
        await key('Escape', 'Escape', 27);
        await pause(30);
        assert.equal(await evaluate(`document.querySelector('#${mode} dialog').open`), false);
        assert.equal(await evaluate(`document.activeElement.dataset.confirm`), action, 'focus returns to opener');
      }
      await evaluate(`document.querySelector('#${mode} [data-confirm="duplicate"]').click();document.querySelector('#${mode} [data-accept]').click()`);
      await pause(30);
      assert.match(await evaluate(`document.querySelector('#${mode}-result').textContent`), /No files were changed/);
      await key('Escape', 'Escape', 27);
      assert.equal(await evaluate(`document.querySelector('#${mode} details').open`), false);
      await evaluate(`document.querySelector('#${mode}-play-tab').click()`);
    }
  }
  // Every combination of distant, nearest and explicit themes, including both orders.
  await evaluate(`{const box=document.createElement('div');box.id='probes';document.body.append(box)}`);
  const colors = JSON.parse(fs.readFileSync(path.join(root, 'tokens/hplx/hplx.json'), 'utf8')).semantic;
  const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')})`;
  for (const distant of ['dark','light']) for (const nearest of ['dark','light']) for (const explicit of ['', 'dark', 'light']) {
    await evaluate(`document.querySelector('#probes').innerHTML='<div data-theme="${distant}"><div data-theme="${nearest}"><div data-family="hplx" ${explicit ? `data-theme="${explicit}"` : ''} id="probe" style="background:var(--c-bg)"><div data-theme="light"><div data-theme="dark" id="inner" style="background:var(--c-bg);box-shadow:var(--c-elevation-2-shadow)">Probe</div></div></div></div></div>'`);
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#probe")).backgroundColor'), rgb(colors[explicit || nearest].bg));
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#inner")).backgroundColor'), rgb(colors.dark.bg));
    assert.notEqual(await evaluate('getComputedStyle(document.querySelector("#inner")).boxShadow'), 'none');
  }
  await evaluate('document.querySelector("#probes").remove()');
  await evaluate(`{const input=document.querySelector('#dark-slug');input.value='valid-slug';input.dispatchEvent(new Event('input'));}`);
  assert.equal(await evaluate('document.querySelector("#dark-slug").getAttribute("aria-invalid")'), 'false');
  assert.equal(await evaluate('document.querySelector("#dark-slug-error").hidden'), true);
  await evaluate('document.querySelector("#dark-include").focus()'); await key(' ', 'Space', 32);
  assert.equal(await evaluate('document.querySelector("#dark-include").checked'), false);
  await cdp('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion', value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".loading-mark")).animationName'), 'none');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("button")).transitionDuration'), '0s');
  const fonts = await evaluate('[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status}))');
  assert.ok(fonts.every(f => f.status === 'loaded'), JSON.stringify(fonts));
  await cdp('Emulation.setEmulatedMedia', {features:[{name:'forced-colors', value:'active'}]});
  await evaluate('document.querySelector("#light-details").scrollIntoView()'); await shot('hplx-forced-colors');
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: both kits, 32 layout/text cases, nested themes, fonts, tabs, confirmations, focus, forms and reduced motion.');
  await cdp('Browser.close');
  for (let i=0; i<30 && browser.exitCode===null; i++) await pause(100);
} finally {
  for (const call of pending.values()) clearTimeout(call.timer);
  socket?.close(); browser.kill(); server.close();
  assert.equal(path.dirname(path.resolve(profile)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(profile).startsWith('cosmik-browser-'));
  try { fs.rmSync(profile, {recursive:true, force:true, maxRetries:3, retryDelay:100}); }
  catch { console.warn('Browser temporary profile is still in use; the OS temporary-folder cleanup can remove it.'); }
}
