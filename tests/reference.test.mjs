import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildReference,documents,root} from '../scripts/build-reference.mjs';
import {renderMarkdown,inline} from '../scripts/reference-markdown.mjs';
const output=fs.mkdtempSync(path.join(os.tmpdir(),'cosmik-reference-'));
const result=buildReference(output);
process.on('exit',()=>fs.rmSync(output,{recursive:true,force:true}));
const read=file=>fs.readFileSync(path.join(output,file),'utf8');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(output),html=files.filter(f=>f.endsWith('.html'));
const content=text=>text.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/g,'');

test('the reference covers every current guide and preserves the source heading structure',()=>{
 const expected=fs.readdirSync(path.join(root,'guide')).filter(f=>f.endsWith('.md')).map(f=>'guide/'+f);
 for(const source of expected)assert.ok(documents.some(([file])=>file===source),source);
 assert.equal(result.pages,22);
 for(const [source,url] of documents){
  const original=fs.readFileSync(path.join(root,source),'utf8');
  const parsed=renderMarkdown(original);
  const page=read(url);
  for(const heading of parsed.headings)assert.ok(page.includes(`id="${heading.id}"`),`${url}: ${heading.title}`);
  assert.equal((page.match(/<h1 /g)||[]).length,1,url);
  assert.match(page,/Markdown source/);
 }
});

test('every generated navigation, fragment, download and stylesheet resolves',()=>{
 for(const file of html){
  const page=content(fs.readFileSync(file,'utf8'));
  for(const [,href] of page.matchAll(/(?:href|src|srcset)="([^"]+)"/g)){
   if(/^(?:https?:|mailto:)/.test(href))continue;
   const [resource,fragment]=href.split('#');const target=resource?path.resolve(path.dirname(file),resource):file;
   assert.ok(fs.existsSync(target),`${path.relative(output,file)}: ${href}`);
   if(fragment&&target.endsWith('.html'))assert.ok(fs.readFileSync(target,'utf8').includes(`id="${fragment}"`),`${path.relative(output,file)}: ${href}`);
  }
 }
 const css=read('reference.css');for(const [,url] of css.matchAll(/url\('([^']+)'\)/g))assert.ok(fs.existsSync(path.join(output,url)),url);
});

test('the publish directory contains only reference pages and intentional assets',()=>{
 for(const file of files){
  const relative=path.relative(output,file);
  assert.doesNotMatch(relative,/(?:^|\/)(?:\.git|node_modules|tests|scripts|guide\/archive)(?:\/|$)|\.env|AGENTS\.md/);
 }
 assert.ok(fs.existsSync(path.join(output,'.nojekyll')));
 for(const file of ['fonts/licenses/Inter-OFL.txt','fonts/licenses/IBM-Plex-OFL.txt'])assert.ok(read('files/'+file).includes('SIL OPEN FONT LICENSE'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'asset-manifest.json'),'utf8'));
 for(const key of ['emblem_master','lockup_master'])assert.ok(fs.readFileSync(path.join(output,'files',manifest.entry_points[key])).equals(fs.readFileSync(path.join(root,manifest.entry_points[key]))));
});

test('the Markdown renderer handles nested lists, tables, code and duplicate heading links safely',()=>{
 const source='# Guide\n\n## Repeated\n\n## Repeated\n\n1. First\n   continued\n   - Nested **item**\n2. Second\n\n| Name | Value |\n| --- | ---: |\n| `a|b` | 2 |\n\n```html\n<script>alert(1)</script>\n```\n\n[Source](../guide/identity.md)\n\n<iframe src="bad">';
 const result=renderMarkdown(source,href=>'resolved/'+href);
 assert.deepEqual(result.headings.map(h=>h.id),['guide','repeated','repeated-1']);
 assert.match(result.html,/<ol><li><p>First continued<\/p>\n<ul><li><p>Nested <strong>item<\/strong>/);
 assert.match(result.html,/<code>a\|b<\/code>/);
 assert.match(result.html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 assert.doesNotMatch(result.html,/<script>|<iframe/);
 assert.match(result.html,/href="resolved\/\.\.\/guide\/identity.md"/);
 assert.throws(()=>inline('[bad](javascript:alert)'),/Unsupported link/);
 assert.equal(inline('[Read `file`](file.md)'),'<a href="file.md">Read <code>file</code></a>');
});

test('the token reference uses real CSS names, both color modes and motion policy',()=>{
 const page=read('tokens.html'),css=fs.readFileSync(path.join(root,'kits/cosmik/tokens/cosmik.css'),'utf8');
 for(const [,name] of page.matchAll(/<th scope="row"><code>(--c-[^<]+)<\/code>/g))assert.ok(css.includes(name+':'),name);
 for(const [,name] of css.matchAll(/(--c-[\w-]+):/g))assert.ok(page.includes(`<code>${name}</code>`),`missing CSS token ${name}`);
 assert.match(page,/--c-motion-normal-duration/);assert.match(page,/scoped by data-motion/);
 const tokens=JSON.parse(fs.readFileSync(path.join(root,'kits/cosmik/tokens/cosmik.json'),'utf8'));
 for(const role of Object.keys(tokens.semantic.dark)){
  assert.ok(page.includes(`--c-${role}`),role);assert.ok(page.includes(tokens.semantic.dark[role]),role);assert.ok(page.includes(tokens.semantic.light[role]),role);
 }
});

test('the build is deterministic and works without a root domain',()=>{
 const again=fs.mkdtempSync(path.join(os.tmpdir(),'cosmik-reference-repeat-'));
 try{buildReference(again);for(const file of files)assert.ok(fs.readFileSync(file).equals(fs.readFileSync(path.join(again,path.relative(output,file)))));}
 finally{fs.rmSync(again,{recursive:true,force:true});}
 for(const file of html)assert.doesNotMatch(fs.readFileSync(file,'utf8'),/(?:href|src)="\//);
 for(const [,url] of documents)assert.match(read(url),/<main id="main" tabindex="-1"/);
 assert.doesNotMatch(read('reference.js'),/localStorage|sessionStorage|fetch\(|cookie/);
});


test('the deployed 404 recovers relative links at a GitHub Pages project path',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'cosmik-reference-base-'));
 try{buildReference(temporary,{baseUrl:'https://cosmiklabs.github.io/brand/'});assert.ok(fs.readFileSync(path.join(temporary,'404.html'),'utf8').includes('<base href="/brand/">'));assert.throws(()=>buildReference(temporary,{baseUrl:'https://user:secret@example.com/brand/'}),/without credentials/);}
 finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
