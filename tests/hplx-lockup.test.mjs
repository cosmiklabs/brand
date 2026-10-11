import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodePng, parsePath} from '../scripts/vector-raster.mjs';
import {readFont} from '../scripts/font-outlines.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p));
const source=JSON.parse(read('assets/hplx/hplx-lockup.source.json'));
const ember=JSON.parse(read('assets/hplx/ember.source.json'));
const svgs=Object.fromEntries(['primary','amber','bone','ink'].map(v=>[v,read(`assets/hplx/hplx-lockup-${v}.svg`).toString()]));
const shape=(svg,id)=>svg.match(new RegExp(`<path id="${id}" fill="([^"]+)" d="([^"]+)"`)).slice(1);

test('every HPLX lockup variant shares one Ember and one outlined HPLX, as true vectors',()=>{
  const [,symbol]=shape(svgs.primary,'symbol'),[,word]=shape(svgs.primary,'wordmark');
  for(const [variant,svg] of Object.entries(svgs)){
    assert.equal(shape(svg,'symbol')[1],symbol);assert.equal(shape(svg,'wordmark')[1],word);
    assert.doesNotMatch(svg,/<image|<text\b|<script|href=|data:|<foreignObject|<filter|<mask/i);
    assert.equal((svg.match(/id="background"/g)||[]).length,variant==='primary'?1:0);
    assert.match(svg,/<title[^>]*>HPLX<\/title>/);
  }
  // Ember keeps its three shapes and their curves; the word keeps H, P (and its counter), L and X.
  assert.equal(parsePath(symbol).length,ember.shapes.length);
  assert.equal((symbol.match(/C/g)||[]).length,ember.shapes.flatMap(s=>s.commands).filter(c=>c[0]==='C').length);
  assert.equal(parsePath(word).length,5);
  assert.equal(source.text,'HPLX');
  assert.ok(readFont(read(source.font.path)).capHeight>0 && fs.existsSync(path.join(root,source.font.license_file)));
});

test('the HPLX lockup keeps Ember\'s colours: amber above bone, bone or ink alone',()=>{
  const {amber,bone,ink,background}=ember.colours;
  assert.deepEqual([shape(svgs.primary,'symbol')[0],shape(svgs.primary,'wordmark')[0]],[amber,bone]);
  assert.match(svgs.primary,new RegExp(`id="background" fill="${background}"`));
  assert.deepEqual([shape(svgs.amber,'symbol')[0],shape(svgs.amber,'wordmark')[0]],[amber,bone]);
  assert.deepEqual([shape(svgs.bone,'symbol')[0],shape(svgs.bone,'wordmark')[0]],[bone,bone]);
  assert.deepEqual([shape(svgs.ink,'symbol')[0],shape(svgs.ink,'wordmark')[0]],[ink,ink]);
});

test('HPLX lockup exports are the banner size and 1024 px wide; transparent ones have real alpha',()=>{
  for(const variant of Object.keys(svgs))for(const size of [[2172,724],[1024,341]]){
    const {width,height,rgba}=decodePng(read(`assets/hplx/png/hplx-lockup-${variant}-${size.join('x')}.png`));
    assert.deepEqual([width,height],size);
    const alphas=new Set();for(let i=3;i<rgba.length;i+=4)alphas.add(rgba[i]);
    if(variant==='primary')assert.deepEqual([...alphas],[255]);
    else assert.ok(alphas.has(0)&&alphas.has(255)&&alphas.size>2);
  }
});
