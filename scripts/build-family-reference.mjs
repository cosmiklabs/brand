/** Family reference presentation. Lives in cosmiklabs/brand; the consuming family
 * supplies its own guide, approved assets, resolved tokens and pinned foundation.
 * This does not generate tokens, alter a brand contract, or upgrade vendor/. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {escape,plain,renderMarkdown} from './reference-markdown.mjs';
import {siteNavigation,normalizeNavigation,referenceNavigation,componentExamples} from './reference-sites.mjs';
const toolingRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const label=text=>`<p class="eyebrow">${escape(text)}</p>`;
const headingNotes={
 'typography.html':['type-preview','The family type roles'],
 'colour.html':['color-preview','The family in both modes'],
};
export function buildFamilyReference(directory,output=path.join(directory,'site'),{baseUrl}={}){
 const read=file=>fs.readFileSync(path.join(directory,file),'utf8');
 const config=JSON.parse(read('reference/config.json'));
 const manifest=JSON.parse(read('asset-manifest.json'));
 const lock=JSON.parse(read('vendor/brand/brand.lock.json'));
 const family=config.id,name=config.name,repository=`cosmiklabs/brand-${family}`;
 const tokens=JSON.parse(read(`tokens/${family}.json`));
 const identity=config.identity;
 const documents=[
  ['README.md','family-guide.html',`${name} guide`,'Family'],
  ...['typography','colour','voice','interface','motion','documents','families','quality','governance'].map(id=>[`vendor/brand/guide/${id}.md`,id==='families'?'family-contract.html':`${id}.html`,({colour:'Color & themes',families:'Family contract',voice:'Voice & imagery',quality:'Quality review'})[id]??id[0].toUpperCase()+id.slice(1),['typography','colour','voice'].includes(id)?'Foundations':['interface','motion','documents'].includes(id)?'Experience':'Implementation']),
  ['LICENSE.md','licensing.html','Licensing & brand use','Resources'],
  ['CHANGELOG.md','changelog.html','Changelog','Resources'],
  ['reference/validation.md','validation.html','Validation record','Resources'],
 ];
 if(fs.existsSync(path.join(directory,'tokens/README.md')))documents.push(['tokens/README.md','token-guide.html','Family token guide','Resources']);
 if(fs.existsSync(path.join(directory,'validation.md')))documents.push(['validation.md','kit-validation.html','Kit validation','Resources']);
 if(fs.existsSync(path.join(directory,'EMBER-HISTORICAL.md')))documents.push(['EMBER-HISTORICAL.md','historical.html','Historical Ember','Archive']);
 const nav=normalizeNavigation([['index.html','Overview','Start here'],...documents.map(([,url,title,group])=>[url,title,group]),['assets.html','Asset library','Tools'],['tokens.html','Token reference','Tools'],['components.html','Component examples','Tools']]);
 const routes=new Map(documents.map(([source,url])=>[source,url]));
 const downloads=new Set(['asset-manifest.json',...Object.values(identity),...Object.values(manifest.entry_points.tokens[family]),manifest.entry_points.controls,...manifest.entry_points.web_fonts,...manifest.entry_points.desktop_fonts,...manifest.entry_points.font_licenses]);
 const ownIdentity=manifest.entry_points.family??manifest.entry_points.tectra_identity;
 for(const asset of Object.values(ownIdentity))if(typeof asset==='string'&&asset.endsWith('.svg'))downloads.add(asset);
 const flatten=(value,into=[])=>{for(const item of Object.values(value??{}))if(typeof item==='string')into.push(item);else if(item&&typeof item==='object')flatten(item,into);return into;};
 for(const file of flatten(manifest.entry_points.tokens.cosmik))downloads.add(file);
 const linkFor=(source,href)=>{
  if(/^(?:https?:|mailto:|#)/.test(href))return href;
  const [file,fragment]=href.split('#'),suffix=fragment?'#'+fragment:'';
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(source),file));
  if(routes.has(target))return routes.get(target)+suffix;
  if(downloads.has(target))return 'files/'+target+suffix;
  if(target==='specimen.html'&&family==='tectra')return 'review-board.html'+suffix;
  if(target.startsWith('vendor/brand/'))return `https://github.com/cosmiklabs/brand/blob/${lock.tag}/${target.slice(13)}${suffix}`;
  return `https://github.com/${repository}/${target.endsWith('/')?'tree':'blob'}/main/${target}${suffix}`;
 };
 const navigation=current=>referenceNavigation(nav,current);
 const search=[];fs.mkdirSync(output,{recursive:true});
 const write=(file,data)=>{const target=path.join(output,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);};
 let baseHref='./';if(baseUrl){const url=new URL(baseUrl);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Reference base URL must be HTTPS without credentials, query or fragment.');baseHref=url.pathname.replace(/\/?$/,'/');}
 const sourceLink=source=>source.startsWith('vendor/brand/')?`https://github.com/cosmiklabs/brand/blob/${lock.tag}/${source.slice(13)}`:`https://github.com/${repository}/blob/main/${source}`;
 const shell=({url,title,description,body,toc=[],source})=>`<!doctype html>
<html lang="en" data-family="${family}" data-motion="system"><head>${url==='404.html'?`<base href="${escape(baseHref)}">`:''}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escape(title)} — ${name} brand reference</title><meta name="description" content="${escape(description)}"><link rel="stylesheet" href="files/vendor/brand/kits/cosmik/tokens/cosmik.css"><link rel="stylesheet" href="files/tokens/${family}.css"><link rel="stylesheet" href="files/${manifest.entry_points.controls}"><link rel="stylesheet" href="reference.css"><link rel="stylesheet" href="family-reference.css"><script defer src="search-index.js"></script><script defer src="reference.js"></script></head><body>
<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="identity family-identity" href="index.html" aria-label="${name} brand reference home"><picture><source media="(prefers-color-scheme:dark)" srcset="files/${identity.lockupDark}"><img src="files/${identity.lockupLight}" width="160" alt="${name}" data-identity-image data-dark-src="files/${identity.lockupDark}" data-light-src="files/${identity.lockupLight}"></picture></a><span class="header-label">Brand reference</span><div class="header-actions"><label class="theme-control" hidden>Theme <span class="c-select c-select--dense"><select id="theme" aria-label="Theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></span></label><a class="source-link" href="https://github.com/${repository}">GitHub ↗</a></div></header>${siteNavigation(family)}
<div class="reference-layout"><aside class="sidebar"><details class="navigation" open><summary>Reference navigation</summary><div class="navigation-content"><div class="search" hidden><label for="guide-search">Find guidance</label><input class="c-input" type="search" id="guide-search" placeholder="Search this guide…" autocomplete="off" aria-controls="search-results"><p id="search-status" role="status" aria-live="polite"></p><ul id="search-results" hidden></ul></div><nav aria-label="Reference">${navigation(url)}</nav><p class="sidebar-version">${name} kit ${manifest.version}<br>Cosmik ${lock.tag}</p></div></details></aside><main id="main" tabindex="-1" class="${url==='index.html'?'overview':'document'}">${source?`<div class="document-meta">${label(source.startsWith('vendor/')?'Inherited foundation':url==='historical.html'?'Historical reference':'Family guidance')}<a class="source-link" href="${sourceLink(source)}">Markdown source ↗</a></div>`:''}${body}<footer class="page-footer"><div><p>${name} brand reference · Kit ${manifest.version}</p><p class="endorsement">A Cosmik project</p></div><p><a href="licensing.html">Licensing &amp; brand use</a> / <a href="quality.html">Quality review</a></p></footer></main><aside class="page-index" aria-label="On this page">${toc.length?`${label('On this page')}<nav><ul>${toc.filter(h=>h.level===2).map(h=>`<li><a href="#${escape(h.id)}">${escape(h.title)}</a></li>`).join('')}</ul></nav>`:''}</aside></div></body></html>`;
 const page=options=>write(options.url,shell(options));
 const image=(mode,lockup=true)=>`<img src="files/${identity[lockup?'lockup'+(mode==='dark'?'Dark':'Light'):'symbol'+(mode==='dark'?'Dark':'Light')]}" alt="${name} ${lockup?'horizontal lockup':config.mark}" ${lockup?'width="320"':'width="128" height="128"'}>`;
 const board=`<div class="family-boards">${['dark','light'].map(mode=>`<figure class="family-board" data-theme="${mode}">${image(mode)}<figcaption>${config.mark} · ${mode} surface</figcaption></figure>`).join('')}</div>`;
 const chapter=(url,title,text)=>`<a class="chapter" href="${url}"><h3>${title} <span aria-hidden="true">↗</span></h3><p>${text}</p></a>`;
 page({url:'index.html',title:'Overview',description:`The ${name} brand reference: ${config.mark}, family tokens, shared rules and approved assets.`,body:`<div class="hero">${label('A Cosmik family')}<h1>The ${name}<br> brand reference.</h1><p class="lead">${escape(config.description)}</p><div class="hero-actions"><a class="c-button c-button--primary" href="family-guide.html">Read the brand guide <span aria-hidden="true">→</span></a><a class="c-link" href="assets.html">Browse assets</a></div></div>${board}<section class="family-intro"><h2>${escape(config.mark)} and the family around it.</h2><p>${escape(config.identityNote)}</p><p class="endorsement">A Cosmik project</p><div class="chapters">${chapter('family-guide.html','Identity & voice','Approved artwork, scope, presentation and family-specific guidance.')}${chapter('typography.html','Type & color','Live family type roles and both complete color modes.')}${chapter('tokens.html','Design tokens','Search the resolved values from this family’s generated outputs.')}${chapter('components.html','Shared behavior','Use the controls shipped with this family’s pinned foundation.')}</div></section><section class="scope-section"><h2>A family with a pinned foundation.</h2><p>${name} kit <strong>${manifest.version}</strong> builds on Cosmik <strong>${lock.tag}</strong>. The family’s approved values and its vendored shared rules are shown together; the latest Cosmik reference is a separate site.</p><p><a href="family-contract.html">Understand the family contract</a> · <a href="validation.html">Read this guide’s review record</a></p></section><p class="notice">This is a brand reference. Identity approval does not announce product availability, commercial terms or compatibility.</p>`});
 function exhibits(url){
  if(url==='typography.html')return `<section class="visual-reference"><h2 id="type-preview">The family type roles</h2><p>Live roles from the resolved ${name} tokens. Reading and utility typography stay Inter; family headings use ${tokens.type.display.fontFamily}.</p><div class="type-specimens">${Object.entries(tokens.type).map(([role,value])=>`<div class="type-specimen">${label(`${role} · ${value.fontSize} · ${value.fontWeight}`)}<p class="type-sample" style="font-family:var(--c-type-${role}-font-family);font-size:var(--c-type-${role}-font-size);font-weight:var(--c-type-${role}-font-weight);line-height:var(--c-type-${role}-line-height);letter-spacing:var(--c-type-${role}-letter-spacing)${value.textTransform?`;text-transform:var(--c-type-${role}-text-transform)`:''}">${role==='label'?'Family reference':role==='identity-label'?'Cosmik':`${name} brand reference.`}</p></div>`).join('')}</div></section>`;
  if(url==='colour.html')return `<section class="visual-reference"><h2 id="color-preview">The family in both modes</h2><div class="color-panels">${['dark','light'].map(mode=>`<div class="color-panel" data-theme="${mode}">${label(mode+' mode')}${['bg','surface','raised','text','muted','border','accent'].filter(role=>tokens.semantic[mode][role]).map(role=>`<div class="color-role"><span style="background:var(--c-${role})" aria-hidden="true"></span><code>--c-${role}</code><code>${escape(tokens.semantic[mode][role])}</code></div>`).join('')}</div>`).join('')}</div><p><a href="tokens.html">Inspect all resolved tokens →</a></p></section>`;
  return '';
 }
 for(const [source,url,title] of documents){
  let markdown=read(source);
  if(url==='historical.html'){let first=true;markdown=markdown.replace(/^# (.+)$/gm,(_,title)=>{const h=first?'# ':'## ';first=false;return h+title;});}
  const rendered=renderMarkdown(markdown,href=>linkFor(source,href));
  const inherited=source.startsWith('vendor/brand/');
  const note=inherited?`<p class="notice">Shared Cosmik guidance from the foundation pinned by this family: <strong>${lock.tag}</strong>. Family-specific identity and exceptions are in the <a href="family-guide.html">${name} guide</a>. The linked Cosmik site may describe a newer foundation.</p>`:url==='historical.html'?'<p class="notice">Deprecated Ember history. New integrations use Glimmer. These files are not promoted in the current asset library.</p>':'';
  let content=rendered.html.replace(/<\/h1>/,end=>end+exhibits(url));
  const toc=headingNotes[url]?[{level:2,id:headingNotes[url][0],title:headingNotes[url][1]},...rendered.headings]:rendered.headings;
  page({url,title:nav.find(n=>n[0]===url)?.[1]??title,description:`${title} for the ${name} brand family.`,body:note+`<article class="prose">${content}</article>`,toc,source});
  search.push({title:nav.find(n=>n[0]===url)?.[1]??title,url,text:plain(markdown).replace(/\s+/g,' '),sections:rendered.headings.filter(h=>h.level===2)});
 }
 const assetGroups=[['Current identity', [...new Set(Object.values(ownIdentity).filter(file=>file.endsWith('.svg')))]],['Family tokens',Object.values(manifest.entry_points.tokens[family])],['Fonts & license notices',[...manifest.entry_points.web_fonts,...manifest.entry_points.desktop_fonts,...manifest.entry_points.font_licenses]]];
 page({url:'assets.html',title:'Asset library',description:`Approved ${name} identity variants, fonts and tokens.`,body:`${label('Accepted identity')}<h1>Asset library.</h1><p class="lead">${config.mark}, exactly as approved. Preserve its proportions, geometry, clear space and supplied colors.</p>${board}<div class="family-symbols">${['dark','light'].map(mode=>`<figure data-theme="${mode}">${image(mode,false)}<figcaption>${name} ${config.mark} · ${mode}</figcaption></figure>`).join('')}</div><p class="notice">${escape(config.assetNote)} <a href="licensing.html">Read the artwork terms</a>; the tooling license does not grant unrestricted identity use.</p>${assetGroups.map(([title,files])=>`<section class="download-group"><h2>${title}</h2><ul class="download-list">${files.map(file=>`<li><a download href="files/${file}"><span>${escape(path.basename(file))}</span><span>${escape(path.dirname(file))}</span><span aria-hidden="true">↓</span></a></li>`).join('')}</ul></section>`).join('')}<p><a download href="files/asset-manifest.json">Full asset manifest and hashes</a> · <a href="family-guide.html">Identity rules</a></p>`});
 // Read the actual exported names; family elevation and extension roles are not
 // reconstructed from a second schema. Semantic values come from resolved JSON.
 const baseCss=read('vendor/brand/kits/cosmik/tokens/cosmik.css'),familyCss=read(`tokens/${family}.css`);
 const declarations=new Map([...baseCss.matchAll(/(--c-[\w-]+):\s*([^;]+);/g),...familyCss.matchAll(/(--c-[\w-]+):\s*([^;]+);/g)].map(([,key,value])=>[key,value.trim()]));
 const rows=[...declarations].map(([key,raw])=>{
  const role=key.slice(4),isColor=Object.hasOwn(tokens.semantic.dark,role);
  const group=isColor?'Color':role.startsWith('primitive-')?'Primitives':role.startsWith('type-')?'Typography':role.split('-')[0].replace(/^./,c=>c.toUpperCase());
  const value=key==='--c-motion-duration'?'Effective duration, resolved from data-motion and system preference':key==='--c-motion-system-duration'?'Normal or reduced duration, selected by the operating system':raw;
  return {key,group,dark:isColor?tokens.semantic.dark[role]:value,light:isColor?tokens.semantic.light[role]:'',color:isColor};
 }).sort((a,b)=>(a.group==='Color'?-1:b.group==='Color'?1:0)||a.group.localeCompare(b.group)||a.key.localeCompare(b.key));
 page({url:'tokens.html',title:'Design tokens',description:`All exported CSS tokens and resolved ${name} color modes.`,body:`${label('Source-backed reference')}<h1>Design tokens.</h1><p class="lead">The resolved ${name} family, with the actual exported CSS names and both color modes.</p><p>Family ${manifest.version} · pinned Cosmik ${lock.tag} · baseline token schema ${tokens.extends}</p><div class="token-tools" hidden><label for="token-search">Find a token<input class="c-input" id="token-search" type="search" placeholder="Try accent, focus or font-family" aria-controls="token-table"></label><label for="token-group">Group<span class="c-select"><select id="token-group"><option value="all">All groups</option>${[...new Set(rows.map(r=>r.group))].map(group=>`<option>${group}</option>`).join('')}</select></span></label><p id="token-status" role="status" aria-live="polite">${rows.length} tokens</p></div><p class="notice">Use semantic roles in interfaces. Primitives document the palette. Swatches do not prove arbitrary color combinations are accessible; apply the family’s guidance and the pinned foundation’s contrast rules.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Design tokens"><table class="token-table" id="token-table"><thead><tr><th scope="col">Token / group</th><th scope="col">Dark or shared value</th><th scope="col">Light value</th></tr></thead><tbody>${rows.map(row=>`<tr data-token-group="${row.group}"><th scope="row"><code>${row.key}</code><span class="token-group-label">${row.group}</span></th><td>${row.color?`<span class="swatch" style="--swatch:${row.dark}" aria-hidden="true"></span>`:''}<code>${escape(row.dark)}</code></td><td>${row.light?`<span class="swatch" style="--swatch:${row.light}" aria-hidden="true"></span><code>${escape(row.light)}</code>`:'<span class="shared-value">Shared</span>'}</td></tr>`).join('')}</tbody></table></div><p id="token-empty" hidden>No tokens match. Clear the search or choose another group.</p>`});
 page({url:'components.html',title:'Component examples',description:`Neutral controls from ${name}’s own pinned foundation.`,body:componentExamples(name,lock.tag)});
 for(const [url,title,text] of [['assets.html','Asset library','approved identity symbol lockup SVG downloads fonts notices'],['tokens.html','Design tokens','semantic colors CSS native JSON Rust DTCG'],['components.html','Component examples','components shared controls buttons fields selects status']])search.push({url,title,text,sections:[]});
 page({url:'404.html',title:'Page not found',description:`Return to the ${name} brand reference.`,body:'<h1>Page not found.</h1><p>Return to the <a href="index.html">reference overview</a>.</p>'});
 write('search-index.js',`window.CosmikReferenceIndex=${JSON.stringify(search).replace(/</g,'\\u003c')};\n`);
 for(const file of ['reference.css','reference.js'])write(file,fs.readFileSync(path.join(toolingRoot,'reference',file)));
 write('family-reference.css',`${family==='hplx'?"@font-face{font-family:Spectral;src:url('files/fonts/web/Spectral-SemiBold.woff2') format('woff2');font-weight:600;font-style:normal;font-display:swap}":''}\n.family-identity img{width:160px;height:auto}.family-boards,.family-symbols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--c-space-6);margin-block:var(--c-space-8)}.family-board{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:200px;padding:var(--c-space-8);border:1px solid var(--c-divider-strong);gap:var(--c-space-6)}.family-board img{width:100%;min-width:160px;max-width:320px;height:auto}.family-board figcaption,.family-symbols figcaption{font-size:var(--c-type-ui-small-font-size);color:var(--c-muted)}.family-symbols figure{text-align:center;padding:var(--c-space-8);border:1px solid var(--c-divider-strong)}.family-symbols img{margin:0 auto var(--c-space-4);width:96px;height:96px}.endorsement{margin-top:var(--c-space-4);font:var(--c-type-ui-font-weight) var(--c-type-ui-font-size)/var(--c-type-ui-line-height) var(--c-type-ui-font-family),sans-serif;color:var(--c-muted)}.family-intro>p{margin-top:var(--c-space-4)}@media(max-width:720px){.family-boards,.family-symbols{grid-template-columns:1fr}.family-board{padding:var(--c-space-6)}}\n`);
 // Only the selected family and its own locked baseline feed the deployed files.
 for(const file of downloads)write('files/'+file,fs.readFileSync(path.join(directory,file)));
 for(const file of manifest.entry_points.web_fonts){const basename=path.posix.basename(file);write('files/fonts/web/'+basename,fs.readFileSync(path.join(directory,file)));}
 for(const file of manifest.entry_points.font_licenses)write('files/fonts/licenses/'+path.posix.basename(file),fs.readFileSync(path.join(directory,file)));
 if(family==='tectra'){
  write('review-board.html',read('specimen.html').replace('<body>','<body><p><a href="index.html">← Tectra brand reference</a></p>'));
  write('specimen.css',read('specimen.css'));
  for(const file of manifest.entry_points.web_fonts)write(file,fs.readFileSync(path.join(directory,file)));
  for(const file of ['tokens/tectra.css','vendor/brand/kits/cosmik/tokens/cosmik.css',identity.symbolDark,identity.symbolLight])write(file,fs.readFileSync(path.join(directory,file)));
 }
 write('.nojekyll','');
 return {family,pages:documents.length+5,output,tokens:rows.length,foundation:lock.tag};
}
