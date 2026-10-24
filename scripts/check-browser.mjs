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
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.realpathSync(file).startsWith(fs.realpathSync(root) + path.sep)) {
    res.writeHead(404); res.end(); return;
  }
  const mime = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.woff2':'font/woff2', '.ttf':'font/ttf', '.svg':'image/svg+xml', '.png':'image/png', '.json':'application/json'};
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const browser = spawn(process.env.BRAND_BROWSER, ['--headless=new', '--disable-gpu', '--no-first-run',
  // This disposable profile has no credentials. On macOS a new Chrome for
  // Testing binary otherwise waits for an invisible Keychain permission prompt
  // before it sends even its first loopback HTTP request.
  ...(process.platform === 'darwin' ? ['--use-mock-keychain'] : []),
  '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
{windowsHide:true, stdio:['ignore', 'ignore', 'pipe']});
let launchError, browserLog = '';
browser.stderr.on('data', bytes => { browserLog = (browserLog + bytes).slice(-4000); });
browser.on('error', error => { launchError = error; });
let socket;
const pending = new Map();
const exited = () => browser.exitCode !== null || browser.signalCode !== null;
const rejectPending = error => {
  for (const call of pending.values()) { clearTimeout(call.timer); call.reject(error); }
  pending.clear();
};
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile) && !launchError && !exited(); i++) await pause(100);
  if (launchError) throw launchError;
  if (!fs.existsSync(portFile)) throw Error(`Chromium did not open its debugging port${exited() ? ' before exiting' : ' within 10 seconds'}: ${browserLog}`);
  const debugPort = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`, {signal:AbortSignal.timeout(10000)})).json();
  const page = pages.find(page => page.type === 'page');
  if (!page) throw Error('Chromium did not create a page target');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Timed out opening Chromium debugging connection')), 10000);
    socket.onopen = () => { clearTimeout(timer); resolve(); };
    socket.onerror = () => { clearTimeout(timer); reject(Error('Chromium debugging connection failed')); };
  });
  socket.addEventListener('close', () => rejectPending(Error('Chromium debugging connection closed')));
  socket.addEventListener('error', () => rejectPending(Error(`Chromium debugging connection failed: ${browserLog}`)));
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
    if (socket.readyState !== WebSocket.OPEN) { reject(Error(`Chromium connection is not open: ${method}`)); return; }
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
  const navigation = await cdp('Page.navigate', {url:`http://127.0.0.1:${server.address().port}/specimens/components.html`});
  assert.equal(navigation.errorText, undefined, `Component navigation failed: ${navigation.errorText}`);
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (await evaluate('document.readyState === "complete" && !!document.querySelector("#kit-picker")')) { ready = true; break; }
    await pause(50);
  }
  assert.ok(ready, 'Component specimen did not finish loading');
  assert.equal(await evaluate('new Set([...document.querySelectorAll("[id]")].map(e=>e.id)).size === document.querySelectorAll("[id]").length'), true, 'unique IDs');
  assert.equal(await evaluate(`[...document.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby]')].every(e=>['aria-controls','aria-labelledby','aria-describedby'].every(a=>!e.hasAttribute(a)||e.getAttribute(a).split(' ').every(id=>document.getElementById(id))))`), true, 'ARIA references resolve');
  for (const kit of ['cosmik', 'hplx', 'tectra']) {
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
      await evaluate(`document.querySelector('#${mode}-selection-tab').focus()`);
      await key('ArrowRight', 'ArrowRight', 39);
      assert.equal(await evaluate(`document.querySelector('#${mode}-actions-tab').getAttribute('aria-selected')`), 'true');
      assert.equal(await evaluate(`document.querySelector('#${mode}-selection-panel').hidden`), true);
      await key('Home', 'Home', 36);
      assert.equal(await evaluate(`document.activeElement.id`), `${mode}-selection-tab`);
      await key('End', 'End', 35);
      const menu = `#${mode}-action-menu`;
      const trigger = `#${mode}-menu-trigger`;
      const settled = async expression => {
        for (let i=0; i<100; i++) { if (await evaluate(expression)) return; await pause(20); }
        assert.fail(`Did not settle: ${expression}`);
      };
      await evaluate(`document.querySelector('${trigger}').focus()`);
      await key('ArrowUp', 'ArrowUp', 38);
      assert.equal(await evaluate('document.activeElement.dataset.confirm'), 'delete');
      await key('Home', 'Home', 36);
      assert.equal(await evaluate('document.activeElement.dataset.confirm'), 'duplicate');
      await key('c', 'KeyC', 67);
      assert.equal(await evaluate('document.activeElement.dataset.confirm'), 'copy');
      await key('Escape', 'Escape', 27);
      await settled(`document.querySelector('${menu}').hidden`);
      assert.equal(await evaluate('document.activeElement.id'), `${mode}-menu-trigger`);
      for (const action of ['duplicate', 'copy', 'delete']) {
        await evaluate(`document.querySelector('${trigger}').scrollIntoView({block:'center'});document.querySelector('${trigger}').click()`);
        if (action === 'duplicate') await shot(`${kit}-${mode}-menu`);
        await evaluate(`document.querySelector('#${mode} [data-confirm="${action}"]').click()`);
        assert.equal(await evaluate(`document.querySelector('#${mode} dialog').open`), true);
        assert.equal(await evaluate(`document.activeElement.hasAttribute('data-cancel')`), true, 'safe initial focus');
        await key('Tab', 'Tab', 9);
        assert.equal(await evaluate('document.activeElement.hasAttribute("data-accept")'), true);
        await key('Tab', 'Tab', 9, 8);
        assert.equal(await evaluate('document.activeElement.hasAttribute("data-cancel")'), true);
        await key('Tab', 'Tab', 9, 8);
        if (await evaluate('document.activeElement === document.body')) await key('Tab', 'Tab', 9, 8);
        assert.equal(await evaluate('document.activeElement.hasAttribute("data-accept")'), true);
        await evaluate(`document.querySelector('#kit-picker').focus()`);
        assert.equal(await evaluate(`!!document.activeElement.closest('dialog')`), true, 'background stays inert');
        if (action === 'delete') await shot(`${kit}-${mode}-delete-dialog`);
        await key('Escape', 'Escape', 27);
        await settled(`!document.querySelector('#${mode} dialog').open`);
        assert.equal(await evaluate(`document.activeElement.id`), `${mode}-menu-trigger`, 'focus returns to visible trigger');
      }
      await evaluate(`document.querySelector('${trigger}').click();document.querySelector('#${mode} [data-confirm="duplicate"]').click();document.querySelector('#${mode} [data-accept]').click()`);
      await settled(`!document.querySelector('#${mode} dialog').open`);
      assert.match(await evaluate(`document.querySelector('#${mode}-result').textContent`), /No files were changed/);
      await evaluate(`document.querySelector('#${mode}-selection-tab').click()`);
    }
  }
  // Every combination of distant, nearest and explicit themes, including both orders.
  await evaluate(`{const box=document.createElement('div');box.id='probes';document.body.append(box)}`);
  for (const family of ['hplx', 'tectra']) {
  const colors = JSON.parse(fs.readFileSync(path.join(root, `kits/${family}/tokens/${family}.json`), 'utf8')).semantic;
  const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')})`;
  for (const distant of ['dark','light']) for (const nearest of ['dark','light']) for (const explicit of ['', 'dark', 'light']) {
    await evaluate(`document.querySelector('#probes').innerHTML='<div data-theme="${distant}"><div data-theme="${nearest}"><div data-family="${family}" ${explicit ? `data-theme="${explicit}"` : ''} id="probe" style="background:var(--c-bg)"><div data-theme="light"><div data-theme="dark" id="inner" style="background:var(--c-bg);box-shadow:var(--c-elevation-2-shadow)">Probe</div></div></div></div></div>'`);
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#probe")).backgroundColor'), rgb(colors[explicit || nearest].bg));
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#inner")).backgroundColor'), rgb(colors.dark.bg));
    if (family === 'hplx') assert.notEqual(await evaluate('getComputedStyle(document.querySelector("#inner")).boxShadow'), 'none');
  }
  }
  await evaluate('document.querySelector("#probes").remove()');
  // A root that names no theme follows the operating system, and families with it.
  {
    const was = await evaluate('document.documentElement.getAttribute("data-theme")');
    await evaluate(`document.documentElement.removeAttribute('data-theme');{const p=document.createElement('div');p.id='system-probe';p.dataset.family='tectra';p.style.background='var(--c-bg)';document.body.append(p)}`);
    const tectra = JSON.parse(fs.readFileSync(path.join(root, 'kits/tectra/tokens/tectra.json'), 'utf8')).semantic;
    const hex = h => `rgb(${h.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')})`;
    for (const scheme of ['light', 'dark']) {
      await cdp('Emulation.setEmulatedMedia', {features:[{name:'prefers-color-scheme', value:scheme}]});
      assert.equal(await evaluate('getComputedStyle(document.querySelector("#system-probe")).backgroundColor'), hex(tectra[scheme].bg));
    }
    await cdp('Emulation.setEmulatedMedia', {features:[]});
    await evaluate(`document.querySelector('#system-probe').remove();${was === null ? '' : `document.documentElement.setAttribute('data-theme', ${JSON.stringify(was)})`}`);
  }
  await evaluate(`{const input=document.querySelector('#dark-slug');input.value='valid-slug';input.dispatchEvent(new Event('input'));}`);
  assert.equal(await evaluate('document.querySelector("#dark-slug").getAttribute("aria-invalid")'), 'false');
  assert.equal(await evaluate('document.querySelector("#dark-slug-error").hidden'), true);
  await evaluate('document.querySelector("#dark-include").focus()'); await key(' ', 'Space', 32);
  assert.equal(await evaluate('document.querySelector("#dark-include").checked'), false);
  const until = async (expression, label = expression) => {
    for(let i=0; i<100; i++) { if(await evaluate(expression)) return; await pause(20); }
    assert.fail(`Did not settle: ${label}`);
  };
  const preference = async value => evaluate(`{const p=document.querySelector('#motion-picker');p.value='${value}';p.dispatchEvent(new Event('change'));}`);
  const osMotion = value => cdp('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value}]});
  await osMotion('no-preference');
  await preference('system');
  // Real transitions must exist on the surfaces, not just on trigger buttons.
  await evaluate(`document.querySelector('#dark-actions-tab').click();document.querySelector('#dark-menu-trigger').scrollIntoView({block:'center'});document.querySelector('#dark-menu-trigger').click()`);
  await until(`getComputedStyle(document.querySelector('#dark-action-menu')).opacity === '1'`);
  const exit = await evaluate(`(() => {
    const m=document.querySelector('#dark-action-menu');
    const payload=m.textContent;
    document.querySelector('#dark-menu-trigger').click();
    const animations=m.getAnimations();animations.forEach(a=>a.pause());
    return {hidden:m.hidden,inert:m.inert,phase:m.dataset.phase,animations:animations.length,payload:payload===m.textContent};
  })()`);
  assert.deepEqual({...exit,animations:undefined}, {hidden:false,inert:true,phase:'closing',animations:undefined,payload:true});
  assert.ok(exit.animations > 0, 'menu exit is animated');
  await evaluate(`document.querySelector('#dark-menu-trigger').click();document.querySelector('#dark-action-menu').getAnimations().forEach(a=>a.finish())`);
  await pause(30);
  assert.deepEqual(await evaluate(`({hidden:document.querySelector('#dark-action-menu').hidden,inert:document.querySelector('#dark-action-menu').inert,expanded:document.querySelector('#dark-menu-trigger').getAttribute('aria-expanded')})`),{hidden:false,inert:false,expanded:'true'},'stale close does not hide a reopened menu');
  // Outside pointer dismissal does not strand focus in an inert menu.
  await evaluate(`document.querySelector('#dark-title').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
  await until(`document.querySelector('#dark-action-menu').hidden`);
  assert.equal(await evaluate('document.activeElement.id'), 'dark-menu-trigger');
  // Modal exit keeps content and the native top layer until the transition ends.
  await evaluate(`document.querySelector('#dark-menu-trigger').click();document.querySelector('#dark [data-confirm="delete"]').click()`);
  await until(`getComputedStyle(document.querySelector('#dark dialog')).opacity === '1'`);
  const modalExit = await evaluate(`(() => {
    const d=document.querySelector('#dark dialog');const payload=d.textContent;
    d.querySelector('[data-cancel]').click();const animations=d.getAnimations({subtree:true}).filter(a=>a.effect?.target===d);animations.forEach(a=>a.pause());
    return {open:d.open,inert:d.inert,phase:d.dataset.phase,payload:payload===d.textContent,animations:animations.length};
  })()`);
  assert.equal(modalExit.open && modalExit.inert && modalExit.payload, true);
  assert.equal(modalExit.phase, 'closing');assert.ok(modalExit.animations > 0);
  await evaluate(`document.querySelector('#dark dialog').getAnimations().forEach(a=>a.finish())`);
  await pause(30);
  assert.equal(await evaluate(`document.querySelector('#dark dialog').open`),true,'modal retains its scrim until its exit settles');
  await evaluate(`document.querySelector('#dark dialog').getAnimations({subtree:true}).filter(a=>a.effect?.target===document.querySelector('#dark dialog')).forEach(a=>a.finish())`);
  await until(`!document.querySelector('#dark dialog').open`);
  assert.equal(await evaluate('document.activeElement.id'), 'dark-menu-trigger');
  // An infinite child animation cannot block its parent closing. A cancelled
  // transition and changing preferences mid-exit also must release the surface.
  await evaluate(`{const e=document.createElement('div');e.id='presence-probe';e.hidden=true;e.className='motion-surface';e.innerHTML='<span class="loading-mark">Working</span>';document.body.append(e);window.testPresence=CosmikMotion.createPresence(e);testPresence.open()}`);
  await until(`getComputedStyle(document.querySelector('#presence-probe')).opacity === '1'`);
  await evaluate('testPresence.close()');
  assert.equal(await evaluate(`document.querySelector('#presence-probe').hidden`), true);
  await evaluate('testPresence.open()');
  await until(`getComputedStyle(document.querySelector('#presence-probe')).opacity === '1'`);
  await evaluate(`{testPresence.close();document.querySelector('#presence-probe').getAnimations().forEach(a=>a.pause())}`);
  await preference('reduce');
  await until(`document.querySelector('#presence-probe').hidden`);
  await evaluate(`document.querySelector('#presence-probe').remove();delete window.testPresence`);
  // Both OS settings and explicit/nested overrides resolve to real CSS behavior.
  const normal = JSON.parse(fs.readFileSync(path.join(root,'kits/cosmik/tokens/cosmik.json'),'utf8')).motion.duration;
  await evaluate(`{const p=document.createElement('div');p.id='motion-probes';p.innerHTML='<div data-motion="reduce"><span id="reduce-probe"></span><span id="full-probe" data-motion="full"></span><span id="system-motion-probe" data-motion="system"></span></div>';document.body.append(p)}`);
  for (const os of ['reduce','no-preference']) {
    await osMotion(os);
    for(const pref of ['system','reduce','full']) {
      await preference(pref);
      const durations=await evaluate(`['motion-picker','reduce-probe','full-probe','system-motion-probe'].map(id=>parseFloat(getComputedStyle(document.getElementById(id)).getPropertyValue('--c-motion-duration')))`);
      const expected = pref==='reduce'||pref==='system'&&os==='reduce' ? 0 : parseFloat(normal);
      assert.deepEqual(durations,[expected,0,parseFloat(normal),os==='reduce'?0:parseFloat(normal)]);
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('.loading-mark')).animationName === 'none'`), expected===0);
    }
  }
  await evaluate(`document.querySelector('#motion-probes').remove()`);
  await preference('reduce');
  assert.equal(await evaluate(`(() => {const t=document.querySelector('#dark-menu-trigger');t.click();t.click();return document.querySelector('#dark-action-menu').hidden})()`), true, 'zero-duration closes synchronously');
  await preference('full');
  await evaluate(`document.querySelector('#motion').scrollIntoView();document.querySelector('#disclosure-trigger').click()`);
  await until(`getComputedStyle(document.querySelector('#disclosure-body')).opacity === '1'`);
  assert.equal(await evaluate(`document.querySelector('#disclosure-trigger').getAttribute('aria-expanded')`),'true');
  await evaluate(`document.querySelector('#disclosure-trigger').click();document.querySelector('#disclosure-trigger').click()`);
  await until(`getComputedStyle(document.querySelector('#disclosure-body')).opacity === '1'`);
  assert.equal(await evaluate(`document.querySelector('#disclosure-body').hidden`),false);
  await evaluate(`document.querySelector('#disclosure-body a').focus();document.querySelector('#disclosure-trigger').click()`);
  assert.equal(await evaluate('document.activeElement.id'),'disclosure-trigger','collapsing content restores focus before becoming inert');
  await until(`document.querySelector('#disclosure-body').hidden`);
  await evaluate(`document.querySelector('#disclosure-trigger').click()`);
  await evaluate(`document.querySelector('#tip-trigger').focus()`);
  assert.equal(await evaluate(`document.querySelector('#sample-tooltip').hidden`),false);
  await key('Escape','Escape',27);
  await until(`document.querySelector('#sample-tooltip').hidden`);
  await evaluate(`document.querySelector('#completion-trigger').click()`);
  assert.match(await evaluate(`document.querySelector('#completion-result').textContent`),/Example ready/);
  assert.ok(await evaluate(`document.querySelector('#completion-result').getAnimations().length > 0`));
  await until(`document.querySelector('#completion-result').getAnimations().length === 0`);
  await shot('tectra-motion-desktop');
  // Large text, a short viewport, touch targets and an overflowing menu/dialog.
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:480,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.documentElement.style.fontSize='200%';document.querySelector('#dark-actions-tab').click();document.querySelector('#dark-menu-trigger').scrollIntoView({block:'center'});document.querySelector('#dark-menu-trigger').click()`);
  await until(`getComputedStyle(document.querySelector('#dark-action-menu')).opacity === '1'`);
  const fits = selector => evaluate(`(() => {const r=document.querySelector('${selector}').getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()`);
  assert.equal(await fits('#dark-action-menu'),true,'menu fits short viewport');
  assert.equal(await evaluate(`[...document.querySelectorAll('#dark-action-menu button')].every(e=>e.getBoundingClientRect().height>=44)`),true);
  await shot('tectra-menu-320-short-text200');
  await evaluate(`document.querySelector('#dark [data-confirm="delete"]').click()`);
  await until(`getComputedStyle(document.querySelector('#dark dialog')).opacity === '1'`);
  assert.equal(await fits('#dark dialog'),true,'dialog fits short viewport');
  assert.equal(await evaluate('document.activeElement.id'),'dark-dialog-title','long confirmation opens at its context');
  await shot('tectra-dialog-320-short-text200');
  await key('Tab','Tab',9);
  assert.equal(await evaluate('document.activeElement.hasAttribute("data-cancel")'),true);
  await shot('tectra-dialog-actions-320-short-text200');
  await key('Escape','Escape',27);
  await until(`!document.querySelector('#dark dialog').open`);
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});
  await size(1280);await evaluate(`document.documentElement.style.fontSize='100%'`);
  await preference('system');await osMotion('reduce');
  await until(`getComputedStyle(document.querySelector('.loading-mark')).animationName === 'none'`, 'OS change removes the loading pulse');
  assert.ok((await evaluate('getComputedStyle(document.querySelector("button")).transitionDuration')).split(',').every(v=>parseFloat(v)===0));
  // Browsers load a face only when text uses it; ask every declared face to load so a broken source fails.
  const fonts = await evaluate('Promise.all([...document.fonts].map(f=>f.load().then(()=>({family:f.family,weight:f.weight,status:f.status}),()=>({family:f.family,weight:f.weight,status:"error"}))))');
  assert.ok(fonts.every(f => f.status === 'loaded'), JSON.stringify(fonts));
  await cdp('Emulation.setEmulatedMedia', {features:[{name:'forced-colors', value:'active'}]});
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('#light-selection-tab')).borderBottomWidth`),await evaluate(`getComputedStyle(document.querySelector('#light-actions-tab')).borderBottomWidth`),'forced colors retain the selected tab indicator');
  await evaluate('document.querySelector("#light-details").scrollIntoView()'); await shot('tectra-forced-colors');
  assert.deepEqual(errors, []);
  console.log('Component checks passed: three kits, responsive themes, nested preferences, fonts, keyboard menus/dialogs, focus, real exit/interruption transitions, disclosure, tooltip, completion and short touch layouts.');
  // Tectra board: simulated enlarged text and a 320-CSS-px reflow viewport.
  // Viewport emulation is not a claim of actual browser zoom or assistive-tech testing.
  await cdp('Emulation.setEmulatedMedia', {features:[]});
  await cdp('Page.navigate', {url:`http://127.0.0.1:${server.address().port}/kits/tectra/specimen.html`});
  for (let i=0;i<100;i++) { if(await evaluate('document.readyState === "complete" && !!document.querySelector(".diagram-legend")')) break; await pause(50); }
  await evaluate('document.fonts.ready.then(()=>true)');
  for (const width of [1280,768,390,320]) for (const scale of [100,200]) {
    await size(width); await evaluate(`document.documentElement.style.fontSize='${scale}%'`);
    for (const spacing of [false,true]) {
      await evaluate(`{document.querySelector('#text-spacing-test')?.remove();if(${spacing}){const s=document.createElement('style');s.id='text-spacing-test';s.textContent='*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';document.head.append(s)}}`);
      assert.equal(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1'),true,`Tectra board overflow: ${width}px, ${scale}%, spacing ${spacing}`);
      assert.equal(await evaluate('[...document.querySelectorAll(".control")].every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})'),true);
    }
  }
  await evaluate('document.querySelector("#text-spacing-test").remove();document.documentElement.style.fontSize="100%"');
  await size(1280); await evaluate('document.querySelector(".skip-link").focus()');
  assert.equal(await evaluate('document.activeElement.classList.contains("skip-link")'),true);
  await cdp('Emulation.setEmulatedMedia', {features:[{name:'forced-colors',value:'active'}]});
  await shot('tectra-board-forced-colors');
  assert.deepEqual(errors, []);
  console.log('Tectra board checks passed: 16 viewport/text cases, each with default and user text spacing. Actual browser zoom and assistive technology still require manual review.');
  // The download remains genuinely offline: file URLs must support interactions.
  await cdp('Emulation.setEmulatedMedia',{features:[]});
  await cdp('Page.navigate',{url:new URL('../specimens/components.html',import.meta.url).href});
  await until(`document.readyState === 'complete' && typeof window.CosmikMotion === 'object'`);
  await evaluate(`document.querySelector('#disclosure-trigger').click()`);
  assert.equal(await evaluate(`document.querySelector('#disclosure-trigger').getAttribute('aria-expanded')`),'true');
  assert.deepEqual(errors,[]);
  console.log('Direct file opening passed: no server or module loader required.');
  await cdp('Browser.close');
  for (let i=0; i<30 && !exited(); i++) await pause(100);
} finally {
  socket?.close();
  rejectPending(Error('Browser check finished'));
  if (!exited()) browser.kill();
  for (let i=0; i<30 && !exited(); i++) await pause(100);
  if (!exited()) browser.kill('SIGKILL');
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  assert.equal(path.dirname(path.resolve(profile)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(profile).startsWith('cosmik-browser-'));
  try { fs.rmSync(profile, {recursive:true, force:true, maxRetries:3, retryDelay:100}); }
  catch { console.warn('Browser temporary profile is still in use; the OS temporary-folder cleanup can remove it.'); }
}
