import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {decodePng, parsePath} from '../scripts/vector-raster.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p));
const source=JSON.parse(read('assets/vector/cosmik-lockup.source.json'));
const master=read('assets/vector/cosmik-emblem-master-offwhite.svg').toString().match(/<path id="emblem"[^>]* d="([^"]+)"/)[1];
const wordmark=source.wordmark.glyphs.map(g=>g.d).join(' ');

test('every lockup variant shares the master emblem and one traced wordmark, as true vectors',()=>{
  for(const variant of ['offwhite','ink','primary']) {
    const svg=read(`assets/vector/cosmik-lockup-${variant}.svg`).toString();
    assert.equal(svg.match(/<path id="emblem"[^>]* d="([^"]+)"/)[1],master);
    assert.match(svg,new RegExp(`transform="matrix\\(${source.emblem.transform.join(' ')}\\)"`));
    assert.equal(svg.match(/<path id="wordmark"[^>]* d="([^"]+)"/)[1],wordmark);
    assert.match(svg,/viewBox="0 0 2172 724"/);
    assert.doesNotMatch(svg,/<image|<text\b|<script|href=|data:|<foreignObject|<filter|<mask/i);
    assert.equal((svg.match(/id="background"/g)||[]).length,variant==='primary'?1:0);
  }
});

test('the wordmark is COSMIK, the O keeps its counter, and the trace stays close to the approved banner',()=>{
  assert.deepEqual(source.wordmark.glyphs.map(g=>g.id),[...'COSMIK']);
  for(const g of source.wordmark.glyphs)assert.equal(parsePath(g.d).length,g.id==='O'?2:1);
  // The approved raster is the reference and stays byte for byte as approved.
  const banner=read(source.source_reference.path);
  assert.equal(crypto.createHash('sha256').update(banner).digest('hex'),source.source_reference.sha256);
  assert.equal(JSON.parse(read('asset-manifest.json')).assets.find(a=>a.path===source.source_reference.path).sha256,source.source_reference.sha256);
  const qa=JSON.parse(read('references/lockup-qa.json'));
  assert.ok(qa.wordmark.iou>=0.99,`wordmark overlap ${qa.wordmark.iou}`);
  assert.ok(qa.wordmark.edge_max_px<=1.5,`wordmark edge ${qa.wordmark.edge_max_px} px`);
  assert.deepEqual(qa.emblem_transform,source.emblem.transform);
});

test('lockup exports are the banner size and 1024 px wide; transparent ones have real alpha',()=>{
  for(const variant of ['offwhite','ink','primary']) {
    for(const [file,size] of [[`assets/vector/cosmik-lockup-${variant}.png`,[2172,724]],[`assets/vector/png/cosmik-lockup-${variant}-1024x341.png`,[1024,341]]]) {
      const {width,height,rgba}=decodePng(read(file));
      assert.deepEqual([width,height],size);
      const alphas=new Set();for(let i=3;i<rgba.length;i+=4)alphas.add(rgba[i]);
      if(variant==='primary')assert.deepEqual([...alphas],[255]);
      else assert.ok(alphas.has(0)&&alphas.has(255)&&alphas.size>2,`${file} has no antialiased alpha`);
    }
  }
});
