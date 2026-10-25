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
import {renderFamily} from './family.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// A fictional, test-only family proves family scopes and the controls layer compose. It is rendered
// in memory by the family API and served at a virtual path; nothing is written into the kit.
const fixtureFamily = renderFamily(path.join(root, 'tests/fixtures/example'));
const fixtureCss = fixtureFamily.files.find(([name]) => name === 'example.css')[1];
if (!process.env.BRAND_BROWSER) throw Error('Set BRAND_BROWSER to an installed Chromium browser executable.');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cosmik-browser-'));
const screenshots = process.env.BRAND_SCREENSHOTS;
if (screenshots) fs.mkdirSync(screenshots, {recursive:true});
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  if (pathname === '/__fixture__/example.css') { res.setHeader('Content-Type', 'text/css'); res.end(fixtureCss); return; }
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
    if (await evaluate('document.readyState === "complete" && !!document.querySelector("#motion-picker")')) { ready = true; break; }
    await pause(50);
  }
  assert.ok(ready, 'Component specimen did not finish loading');
  assert.equal(await evaluate('new Set([...document.querySelectorAll("[id]")].map(e=>e.id)).size === document.querySelectorAll("[id]").length'), true, 'unique IDs');
  assert.equal(await evaluate(`[...document.querySelectorAll('[aria-controls],[aria-labelledby],[aria-describedby]')].every(e=>['aria-controls','aria-labelledby','aria-describedby'].every(a=>!e.hasAttribute(a)||e.getAttribute(a).split(' ').every(id=>document.getElementById(id))))`), true, 'ARIA references resolve');
  {
    const kit = 'cosmik';
    await evaluate('document.fonts.ready.then(()=>true)');
    const heading = await evaluate(`getComputedStyle(document.querySelector('#dark-title')).fontFamily`);
    assert.ok(heading.includes('Inter'), heading);
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
        await evaluate(`document.querySelector('#motion-picker').focus()`);
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
  // Shared controls layer: forced states resolve to their semantic roles in both themes.
  // Zero-duration motion makes each computed colour final rather than mid-transition.
  {
    await evaluate(`{const p=document.querySelector('#motion-picker');p.value='reduce';p.dispatchEvent(new Event('change'));}`);
    await cdp('DOM.enable'); await cdp('CSS.enable');
    const {root: doc} = await cdp('DOM.getDocument', {depth: 0});
    const force = async (selector, states = []) => {
      const {nodeId} = await cdp('DOM.querySelector', {nodeId: doc.nodeId, selector});
      assert.ok(nodeId, `missing ${selector}`);
      await cdp('CSS.forcePseudoState', {nodeId, forcedPseudoClasses: states});
    };
    const css = (selector, property, pseudo = '') => evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)})${pseudo ? `, '${pseudo}'` : ''}).getPropertyValue(${JSON.stringify(property)})`);
    const token = (mode, role) => evaluate(`(() => {const p=document.createElement('span');p.style.color='var(--c-${role})';document.querySelector('#${mode}').append(p);const c=getComputedStyle(p).color;p.remove();return c})()`);
    const expectRole = async (selector, property, mode, role, states = [], label = `${selector} ${states.join('+') || 'default'} ${property}`) => {
      await force(selector, states);
      assert.equal(await css(selector, property), await token(mode, role), label);
      await force(selector);
    };
    for (const mode of ['dark', 'light']) {
      const primary = `#${mode}-actions .state:nth-child(1) .c-button`, disabled = `#${mode}-actions .state:nth-child(5) .c-button`;
      const secondary = `#${mode}-actions .action-row .c-button`, link = `#${mode}-actions .c-link`;
      await expectRole(primary, 'background-color', mode, 'action-primary');
      await expectRole(primary, 'color', mode, 'action-primary-fg');
      await expectRole(primary, 'background-color', mode, 'action-primary-hover', ['hover']);
      await expectRole(primary, 'background-color', mode, 'action-primary-active', ['hover', 'active']);
      await expectRole(disabled, 'background-color', mode, 'disabled-bg', ['hover', 'active']);
      await expectRole(disabled, 'color', mode, 'disabled-fg', ['hover']);
      await expectRole(secondary, 'background-color', mode, 'action-secondary');
      await expectRole(secondary, 'border-top-color', mode, 'border');
      await expectRole(secondary, 'background-color', mode, 'action-secondary-hover', ['hover']);
      await expectRole(secondary, 'background-color', mode, 'action-secondary-active', ['hover', 'active']);
      await force(secondary, ['focus', 'focus-visible']);
      assert.deepEqual([await css(secondary, 'outline-style'), await css(secondary, 'outline-width'), await css(secondary, 'outline-offset'), await css(secondary, 'outline-color')], ['solid', '2px', '2px', await token(mode, 'focus')], `${mode} focus ring`);
      await force(secondary);
      await expectRole(link, 'color', mode, 'link');
      await expectRole(link, 'color', mode, 'link-hover', ['hover']);
      await expectRole(link, 'color', mode, 'link-active', ['hover', 'active']);
      await force(link, ['hover']); assert.equal(await css(link, 'text-decoration-thickness'), '2px'); await force(link);
      await expectRole(`#${mode}-name`, 'background-color', mode, 'input-bg');
      await expectRole(`#${mode}-name`, 'color', mode, 'input-fg');
      await expectRole(`#${mode}-name`, 'border-top-color', mode, 'border');
      await expectRole(`#${mode}-name`, 'border-top-color', mode, 'text', ['hover']);
      await expectRole(`#${mode}-unavailable`, 'background-color', mode, 'disabled-bg', ['hover']);
      assert.match(await css(`#${mode}-slug`, 'box-shadow'), /inset/, 'invalid fields draw a heavier boundary inside');
      // Select: native control, stroked chevron inset by a token space, never intercepting clicks.
      const order = `#${mode}-order`;
      assert.equal(await css(order, 'appearance'), 'none');
      await expectRole(order, 'background-color', mode, 'input-bg');
      const chevron = await evaluate(`(() => {const w=document.querySelector('${order}').parentElement; w.scrollIntoView({block:'center'}); const a=getComputedStyle(w,'::after'), r=w.getBoundingClientRect();
        return {content:a.content, events:a.pointerEvents, style:a.borderRightStyle, bottom:a.borderBottomStyle, color:a.borderRightColor, right:a.right, left:a.borderLeftStyle,
          hit:document.elementFromPoint(r.right - parseFloat(a.right) - parseFloat(a.width) / 2, r.top + r.height / 2)?.id}})()`);
      assert.deepEqual(chevron, {content: '""', events: 'none', style: 'solid', bottom: 'solid', color: await token(mode, 'input-fg'), right: '16px', left: 'none', hit: `${mode}-order`}, `${mode} select chevron`);
      assert.ok(parseFloat(await css(order, 'padding-right')) >= 40, 'select text clears the chevron');
      // Chips: selection uses the selected roles plus a drawn check; hover never erases it.
      const chip = `#${mode}-chip-first`, second = `#${mode} .chip-row .c-chip:nth-child(2)`;
      await expectRole(chip, 'background-color', mode, 'selected', ['hover']);
      await expectRole(chip, 'color', mode, 'on-selected');
      assert.equal(await css(chip, 'border-right-style', '::before'), 'solid');
      await expectRole(second, 'background-color', mode, 'action-secondary');
      assert.equal(await css(second, 'content', '::before'), 'none');
      await evaluate(`document.querySelector(${JSON.stringify(second)}).focus()`);
      await key(' ', 'Space', 32);
      assert.equal(await evaluate(`document.querySelector(${JSON.stringify(second)}).getAttribute('aria-pressed')`), 'true');
      await expectRole(second, 'background-color', mode, 'selected');
      await key(' ', 'Space', 32);
      assert.equal(await evaluate(`document.querySelector(${JSON.stringify(second)}).getAttribute('aria-pressed')`), 'false');
      await expectRole(`#${mode}-details .c-status`, 'background-color', mode, 'status-bg');
      await expectRole(`#${mode}-details .c-status`, 'border-top-color', mode, 'status-border');
      // A status label is not a control: label type, a pill no control uses, no pointer
      // cursor, no hover/pressed change, no transition and not focusable.
      for (const status of [`#${mode}-details .c-status`, `#${mode}-sizes .c-status`, `#${mode}-sizes .c-status--dense`]) {
        const look = await evaluate(`(() => {const s=document.querySelector(${JSON.stringify(status)}), b=document.querySelector('#${mode}-sizes .c-button'), c=document.querySelector('#${mode}-chip-first'), i=document.querySelector('#${mode}-name');
          const st=getComputedStyle(s), label=getComputedStyle(document.documentElement);
          return {cursor:st.cursor, tab:s.tabIndex, family:st.fontFamily.includes(label.getPropertyValue('--c-type-label-font-family').trim().replace(/"/g,'')), transform:st.textTransform,
            pill:parseFloat(st.borderTopLeftRadius) >= s.getBoundingClientRect().height / 2,
            controls:[b,c,i].every(e=>parseFloat(getComputedStyle(e).borderTopLeftRadius) < e.getBoundingClientRect().height / 2 && getComputedStyle(e).fontFamily !== st.fontFamily),
            transition:st.transitionDuration.split(',').every(v=>parseFloat(v)===0)}})()`);
        assert.deepEqual(look, {cursor:'default', tab:-1, family:true, transform:'uppercase', pill:true, controls:true, transition:true}, `${status} reads as a label`);
        for (const states of [['hover'], ['hover', 'active']]) {
          await expectRole(status, 'background-color', mode, 'status-bg', states);
          await expectRole(status, 'border-top-color', mode, 'status-border', states);
          await expectRole(status, 'color', mode, 'status-fg', states);
        }
      }
      // Dense status label: the ui-small size and line height, the label family and
      // tracking, tighter padding and a space-6 minimum height, never a control size.
      const denseStatus = await evaluate(`(() => {const d=document.querySelector('#${mode}-sizes .c-status--dense'), s=document.querySelector('#${mode}-sizes .c-status:not(.c-status--dense)'), r=getComputedStyle(document.documentElement), ds=getComputedStyle(d), ss=getComputedStyle(s), rem=parseFloat(r.fontSize);
        return {size:ds.fontSize===parseFloat(r.getPropertyValue('--c-type-ui-small-font-size'))*rem+'px', line:Math.abs(parseFloat(ds.lineHeight)-parseFloat(r.getPropertyValue('--c-type-ui-small-line-height'))*parseFloat(ds.fontSize))<0.5,
          family:ds.fontFamily===ss.fontFamily, tracking:ds.letterSpacing!=='normal'&&parseFloat(ds.letterSpacing)/parseFloat(ds.fontSize)-parseFloat(ss.letterSpacing)/parseFloat(ss.fontSize)<0.001, weight:ds.fontWeight===ss.fontWeight,
          tighter:parseFloat(ds.paddingLeft)<parseFloat(ss.paddingLeft)&&parseFloat(ds.paddingTop)<=parseFloat(ss.paddingTop), smaller:d.getBoundingClientRect().height<s.getBoundingClientRect().height,
          min:ds.minHeight===parseFloat(r.getPropertyValue('--c-space-6'))*rem+'px', notTarget:d.getBoundingClientRect().height<parseFloat(r.getPropertyValue('--c-layout-control-dense'))*rem}})()`);
      assert.deepEqual(denseStatus, {size:true, line:true, family:true, tracking:true, weight:true, tighter:true, smaller:true, min:true, notTarget:true}, `${mode} dense status label`);
      // Targets: standard controls meet control-min; dense controls control-dense on a fine pointer.
      assert.equal(await evaluate(`[...document.querySelectorAll('#${mode} .c-button:not(.c-button--dense), #${mode} .c-input:not(.c-input--dense), #${mode} .c-select:not(.c-select--dense) select')].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=44)`), true);
      assert.equal(await evaluate(`[...document.querySelectorAll('#${mode} .c-chip, #${mode} .c-button--dense, #${mode} .c-input--dense, #${mode} .c-select--dense select')].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=32)`), true);
      // Dense fields on a fine pointer: the control-dense target and the ui type role.
      const denseFields = await evaluate(`[...document.querySelectorAll('#${mode} .c-input--dense, #${mode} .c-select--dense select')].map(e=>{const s=getComputedStyle(e), r=getComputedStyle(document.documentElement);return {height:Math.round(e.getBoundingClientRect().height), size:s.fontSize, ui:parseFloat(r.getPropertyValue('--c-type-ui-font-size'))*16+'px'}})`);
      assert.equal(denseFields.length, 2);
      for (const field of denseFields) assert.deepEqual({height:field.height, size:field.size}, {height:32, size:field.ui}, `${mode} dense field on a fine pointer`);
      assert.ok(parseFloat(await css(`#${mode}-rows`, 'padding-right')) >= 28, 'dense select text clears the chevron');
      // Large: a taller target than the standard button, from layout and space tokens.
      const large = await evaluate(`(() => {const l=document.querySelector('#${mode}-sizes .c-button--large'), b=document.querySelector('#${mode}-actions .state:nth-child(1) .c-button'), r=getComputedStyle(document.documentElement);
        return {large:l.getBoundingClientRect().height, standard:b.getBoundingClientRect().height, expected:(parseFloat(r.getPropertyValue('--c-layout-control-min'))+parseFloat(r.getPropertyValue('--c-space-base'))*3)*16, font:getComputedStyle(l).fontSize===getComputedStyle(b).fontSize}})()`);
      assert.ok(large.large >= large.expected - 0.5 && large.large > large.standard && large.font, `${mode} large button target ${JSON.stringify(large)}`);
      await expectRole(`#${mode}-sizes .c-button--large`, 'background-color', mode, 'action-primary-hover', ['hover']);
      await evaluate(`document.querySelector('#${mode}-details').scrollIntoView()`);
      await evaluate(`document.querySelector('#${mode}-name').focus()`);
      await shot(`cosmik-${mode}-controls`);
    }
    // Transitions use the effective motion duration and easing tokens.
    const transition = () => evaluate(`(() => {const s=getComputedStyle(document.querySelector('#dark-actions .c-button'));return [s.transitionDuration.split(',').map(v=>parseFloat(v)), s.transitionTimingFunction]})()`);
    assert.ok((await transition())[0].every(v => v === 0));
    await evaluate(`{const p=document.querySelector('#motion-picker');p.value='full';p.dispatchEvent(new Event('change'));}`);
    const [durations, easing] = await transition();
    assert.ok(durations.every(v => Math.abs(v - parseFloat(JSON.parse(fs.readFileSync(path.join(root, 'kits/cosmik/tokens/cosmik.json'), 'utf8')).motion.duration) / 1000) < 1e-9), JSON.stringify(durations));
    assert.match(easing, /ease-out/);
    await evaluate(`{const p=document.querySelector('#motion-picker');p.value='system';p.dispatchEvent(new Event('change'));}`);
    await cdp('CSS.disable'); await cdp('DOM.disable');
  }
  // Every combination of distant, nearest and explicit themes, including both orders.
  await evaluate(`{const box=document.createElement('div');box.id='probes';document.body.append(box)}`);
  await evaluate(`new Promise((resolve, reject) => {const l=document.createElement('link');l.rel='stylesheet';l.href='/__fixture__/example.css';l.id='fixture-family';l.onload=resolve;l.onerror=reject;document.querySelector('link[href$="controls.css"]').before(l)})`);
  {
  const family = 'example';
  const colors = fixtureFamily.semantic;
  const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')})`;
  for (const distant of ['dark','light']) for (const nearest of ['dark','light']) for (const explicit of ['', 'dark', 'light']) {
    await evaluate(`document.querySelector('#probes').innerHTML='<div data-theme="${distant}"><div data-theme="${nearest}"><div data-family="${family}" ${explicit ? `data-theme="${explicit}"` : ''} id="probe" style="background:var(--c-bg)"><button type="button" class="c-button c-button--primary" id="family-button">Apply</button><div data-theme="light"><div data-theme="dark" id="inner" style="background:var(--c-bg);box-shadow:var(--c-elevation-2-shadow)">Probe</div></div></div></div></div>'`);
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#probe")).backgroundColor'), rgb(colors[explicit || nearest].bg));
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#inner")).backgroundColor'), rgb(colors.dark.bg));
    assert.notEqual(await evaluate('getComputedStyle(document.querySelector("#inner")).boxShadow'), 'none');
    // The shared controls pick up the family's roles inside its scope.
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#family-button")).backgroundColor'), rgb(colors[explicit || nearest]['action-primary']));
  }
  }
  await evaluate('document.querySelector("#probes").remove()');
  // A root that names no theme follows the operating system, and families with it.
  {
    const was = await evaluate('document.documentElement.getAttribute("data-theme")');
    await evaluate(`document.documentElement.removeAttribute('data-theme');{const p=document.createElement('div');p.id='system-probe';p.dataset.family='example';p.style.background='var(--c-bg)';document.body.append(p)}`);
    const example = fixtureFamily.semantic;
    const hex = h => `rgb(${h.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')})`;
    for (const scheme of ['light', 'dark']) {
      await cdp('Emulation.setEmulatedMedia', {features:[{name:'prefers-color-scheme', value:scheme}]});
      assert.equal(await evaluate('getComputedStyle(document.querySelector("#system-probe")).backgroundColor'), hex(example[scheme].bg));
    }
    await cdp('Emulation.setEmulatedMedia', {features:[]});
    await evaluate(`document.querySelector('#system-probe').remove();document.querySelector('#fixture-family').remove();${was === null ? '' : `document.documentElement.setAttribute('data-theme', ${JSON.stringify(was)})`}`);
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
  await shot('cosmik-motion-desktop');
  // Large text, a short viewport, touch targets and an overflowing menu/dialog.
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:480,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.documentElement.style.fontSize='200%';document.querySelector('#dark-actions-tab').click();document.querySelector('#dark-menu-trigger').scrollIntoView({block:'center'});document.querySelector('#dark-menu-trigger').click()`);
  await until(`getComputedStyle(document.querySelector('#dark-action-menu')).opacity === '1'`);
  const fits = selector => evaluate(`(() => {const r=document.querySelector('${selector}').getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()`);
  assert.equal(await fits('#dark-action-menu'),true,'menu fits short viewport');
  assert.equal(await evaluate(`[...document.querySelectorAll('#dark-action-menu button')].every(e=>e.getBoundingClientRect().height>=44)`),true);
  assert.equal(await evaluate(`[...document.querySelectorAll('#dark .c-chip, #dark .c-button--dense')].every(e=>e.getBoundingClientRect().height>=44&&e.getBoundingClientRect().width>=44)`),true,'dense controls keep the standard target for touch');
  // Dense fields return to the standard target and the body size on touch, so focus never zooms.
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('#dark .c-input--dense, #dark .c-select--dense select')].map(e=>e.getBoundingClientRect().height>=44&&getComputedStyle(e).fontSize===parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--c-type-body-font-size'))*parseFloat(getComputedStyle(document.documentElement).fontSize)+'px')`),[true,true],'dense fields keep the standard target and body size for touch');
  // A dense status label is not a target, so touch does not enlarge it.
  assert.equal(await evaluate(`(() => {const d=document.querySelector('#dark-sizes .c-status--dense'), r=getComputedStyle(document.documentElement);return getComputedStyle(d).minHeight===parseFloat(r.getPropertyValue('--c-space-6'))*parseFloat(r.fontSize)+'px'&&getComputedStyle(d).fontSize===parseFloat(r.getPropertyValue('--c-type-ui-small-font-size'))*parseFloat(r.fontSize)+'px'})()`),true,'dense status label keeps its size on touch');
  await shot('cosmik-menu-320-short-text200');
  await evaluate(`document.querySelector('#dark [data-confirm="delete"]').click()`);
  await until(`getComputedStyle(document.querySelector('#dark dialog')).opacity === '1'`);
  assert.equal(await fits('#dark dialog'),true,'dialog fits short viewport');
  assert.equal(await evaluate('document.activeElement.id'),'dark-dialog-title','long confirmation opens at its context');
  await shot('cosmik-dialog-320-short-text200');
  await key('Tab','Tab',9);
  assert.equal(await evaluate('document.activeElement.hasAttribute("data-cancel")'),true);
  await shot('cosmik-dialog-actions-320-short-text200');
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
  // Forced colours keep the drawn chevron, the chip's selection check and the focus ring.
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('#light-order').parentElement,'::after').borderRightStyle`),'solid');
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('#light-order').parentElement,'::after').borderRightColor`),'rgba(0, 0, 0, 0)');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('#light-chip-first'),'::before').borderRightStyle`),'solid');
  await evaluate('document.querySelector("#light-name").focus()');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('#light-name')).outlineStyle`),'solid','forced colours retain the focus ring');
  // Both status labels, dense or not, keep a visible boundary in the text colours.
  const forcedStatus = await evaluate(`[...document.querySelectorAll('#light-sizes .c-status')].map(e=>{const s=getComputedStyle(e);return [s.borderTopStyle, s.borderTopColor, s.color, s.backgroundColor].join(' ')})`);
  assert.equal(forcedStatus.length, 2); assert.equal(forcedStatus[0], forcedStatus[1], 'dense status label takes the same forced colours'); assert.match(forcedStatus[0], /^solid /);
  await evaluate('document.querySelector("#light-details").scrollIntoView()'); await shot('cosmik-forced-colors');
  await evaluate('document.querySelector("#light-sizes").scrollIntoView({block:"center"})'); await shot('cosmik-forced-colors-sizes');
  assert.deepEqual(errors, []);
  console.log('Component checks passed: baseline and a test-only family scope, responsive themes, nested preferences, fonts, shared controls states, keyboard menus/dialogs, focus, real exit/interruption transitions, disclosure, tooltip, completion and short touch layouts.');
  await cdp('Emulation.setEmulatedMedia', {features:[]});
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
