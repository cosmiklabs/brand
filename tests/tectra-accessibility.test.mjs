import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const t=JSON.parse(read('tokens/tectra/tectra.json'));
const base=JSON.parse(read('tokens/cosmik/cosmik.json'));
const html=read('specimens/tectra.html'), css=read('specimens/tectra.css');
const lum=h=>h.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
test('Tectra illustration strokes and labels remain contrasted on both diagram fills',()=>{
 for(const m of Object.values(t.semantic)) for(const bg of ['surface','raised']){
  for(const fg of ['border','accent'])assert.ok(ratio(m[fg],m[bg])>=3);
  assert.ok(ratio(m.muted,m[bg])>=4.5);
 }
});
test('Tectra preserves parent typography and control/focus dimensions',()=>{
 assert.deepEqual(t.native.type,base.native.type);
 assert.equal(t.native.type.body.fontSizePx,17);
 assert.equal(t.native.type.label.fontSizePx,14);
 assert.equal(t.native.layout['control-min'],44);
 assert.equal(t.native.layout['focus-width'],2);
 assert.equal(t.native.layout['focus-offset'],2);
});
test('Preview references resolve and all visible labels are scalable HTML',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]));
 assert.doesNotMatch(html,/<text\b/);assert.equal((html.match(/class="diagram-legend"/g)||[]).length,2);
 assert.doesNotMatch(css,/white-space:nowrap|font-size:\.75rem/);
 assert.match(css,/vector-effect:non-scaling-stroke/);
});
test('Preview carries focus, forced-color, reduced-motion and wrapping safeguards',()=>{
 for(const part of [':focus-visible','forced-colors:active','prefers-reduced-motion:reduce','flex-wrap:wrap','min-width:var(--c-layout-control-min)','.primary:active','.secondary:active'])assert.ok(css.includes(part));
 assert.match(html,/class="skip-link"/);assert.doesNotMatch(html,/<script\b/);
});
