import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p));
const source=JSON.parse(read('assets/hplx/ember.source.json'));
const paths=source.shapes.map(shape=>shape.commands.map(c=>c.join(' ')).join(' '));
const pngSize=b=>{assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return [b.readUInt32BE(16),b.readUInt32BE(20)];};

test('selected Ember has three true-vector shapes and leaves theme approval unchanged',()=>{
  assert.equal(source.selection,'Original 01 / EMBER');
  assert.deepEqual(source.shapes.map(s=>s.id),['diamond','upper_arc','lower_arc']);
  assert.equal(source.shapes.flatMap(s=>s.commands).filter(c=>c[0]==='C').length,8);
  assert.match(JSON.parse(read('tokens/hplx/family.json')).status,/^Proposed/);
  for(const variant of ['amber','bone','ink','primary']) {
    const svg=read(`assets/hplx/hplx-ember-${variant}.svg`).toString();
    assert.deepEqual([...svg.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]),paths);
    assert.doesNotMatch(svg,/<image|<text\b|<script|href=|data:|<foreignObject/i);
    assert.match(svg,/<title[^>]*>HPLX Ember<\/title>/);
    assert.equal((svg.match(/<rect /g)||[]).length,variant==='primary'?1:0);
  }
});

test('transparent Ember export has genuine alpha and exactly three separate shapes',()=>{
  const b=read('assets/hplx/png/hplx-ember-amber-1024x384.png');
  const [w,h]=pngSize(b);assert.deepEqual([w,h],[1024,384]);
  assert.equal(b[24],8);assert.equal(b[25],6);
  const idat=[];let at=8;
  while(at<b.length){const n=b.readUInt32BE(at),type=b.toString('ascii',at+4,at+8);if(type==='IDAT')idat.push(b.subarray(at+8,at+8+n));at+=n+12;}
  const raw=zlib.inflateSync(Buffer.concat(idat)),mask=new Uint8Array(w*h);let clear=0,solid=0,partial=0;
  for(let y=0;y<h;y++){
    assert.equal(raw[y*(w*4+1)],0);
    for(let x=0;x<w;x++){const a=raw[y*(w*4+1)+1+x*4+3];if(a===0)clear++;else if(a===255)solid++;else partial++;mask[y*w+x]=a>127?1:0;}
  }
  assert.ok(clear>0 && solid>0 && partial>0);
  let components=0;
  for(let i=0;i<mask.length;i++)if(mask[i]){
    components++;const stack=[i];mask[i]=0;
    while(stack.length){const p=stack.pop(),x=p%w,y=Math.floor(p/w);for(const n of [x? p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(n>=0&&mask[n]){mask[n]=0;stack.push(n);}}
  }
  assert.equal(components,3);
});

test('platform containers contain the HPLX plate exports at the documented sizes',()=>{
  for(const size of [16,24,32,48,64,96,128,256,512,1024])assert.deepEqual(pngSize(read(`assets/hplx/png/hplx-ember-primary-${size}.png`)),[size,size]);
  assert.deepEqual(pngSize(read('icons/hplx-ember-512.png')),[512,512]);
  assert.deepEqual(pngSize(read('icons/hplx-ember-apple-touch-180.png')),[180,180]);
  const ico=read('icons/hplx-ember.ico'),sizes=[16,24,32,48,64,256];
  assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),sizes.length);
  sizes.forEach((size,i)=>{const e=6+16*i,n=ico.readUInt32LE(e+8),at=ico.readUInt32LE(e+12);assert.equal(ico[e]||256,size);assert.deepEqual(ico.subarray(at,at+n),read(`assets/hplx/png/hplx-ember-primary-${size}.png`));});
  const icns=read('icons/hplx-ember.icns');assert.equal(icns.toString('ascii',0,4),'icns');assert.equal(icns.readUInt32BE(4),icns.length);
  let at=8,count=0;while(at<icns.length){const n=icns.readUInt32BE(at+4);assert.ok(n>8&&at+n<=icns.length);pngSize(icns.subarray(at+8,at+n));at+=n;count++;}assert.equal(at,icns.length);assert.equal(count,11);
});

test('HPLX identity entry points refer only to real HPLX assets',()=>{
  const m=JSON.parse(read('asset-manifest.json'));
  assert.equal(m.family_identities.hplx.symbol,'Ember');
  assert.equal(m.family_identities.hplx.wordmark,'not supplied');
  for(const p of Object.values(m.entry_points.families.hplx)){
    assert.match(p,/^(assets\/hplx\/|icons\/hplx-ember)/);assert.ok(fs.existsSync(path.join(root,p)));
  }
});
