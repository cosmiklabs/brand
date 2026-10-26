/** Build the publishable reference from authoritative Markdown, tokens and manifest.
 * Outputs only to ignored site/. All links are relative, including direct-file use. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {escape, plain, renderMarkdown} from './reference-markdown.mjs';
import {siteNavigation,normalizeNavigation,referenceNavigation,componentExamples} from './reference-sites.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const documents=[
  ['guide/README.md','guide.html','Guide index','Start here'],
  ['guide/identity.md','identity.html','Identity','Foundations'],
  ['guide/typography.md','typography.html','Typography','Foundations'],
  ['guide/colour.md','colour.html','Color & themes','Foundations'],
  ['guide/voice.md','voice.html','Voice & imagery','Foundations'],
  ['guide/interface.md','interface.html','Interface','Experience'],
  ['guide/motion.md','motion.html','Motion','Experience'],
  ['guide/documents.md','documents.html','Documents','Experience'],
  ['guide/families.md','families.html','Product families','Implementation'],
  ['kits/README.md','integration.html','Integration','Implementation'],
  ['kits/cosmik/README.md','baseline.html','Baseline kit','Implementation'],
  ['templates/README.md','templates.html','Document template','Resources'],
  ['guide/quality.md','quality.html','Quality review','Resources'],
  ['guide/governance.md','governance.html','Governance','Resources'],
  ['specimens/validation.md','validation.html','Validation record','Resources'],
  ['LICENSE.md','licensing.html','Licensing & brand use','Resources'],
  ['CHANGELOG.md','changelog.html','Changelog','Resources'],
  ['README.md','repository.html','Repository guide','Resources'],
];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('asset-manifest.json')),tokens=JSON.parse(read('kits/cosmik/tokens/cosmik.json'));
const icon='kits/cosmik/icons/cosmik.ico',emblem=manifest.entry_points.emblem_master,lockup=manifest.entry_points.lockup_master;
const nav=normalizeNavigation([['index.html','Overview','Start here'],...documents.map(([,url,title,group])=>[url,title,group]),['assets.html','Asset library','Tools'],['tokens.html','Token reference','Tools'],['components.html','Component examples','Tools']]);
const sourceRoutes=new Map(documents.map(([source,url])=>[source,url]));
const downloads=new Set(['asset-manifest.json','kits/cosmik/tokens/source.json',...Object.values(manifest.entry_points.tokens.cosmik),manifest.entry_points.controls,
 ...manifest.entry_points.web_fonts,...manifest.entry_points.desktop_fonts,...Object.values(manifest.entry_points).filter(v=>typeof v==='string' && v.startsWith('kits/')),
 'fonts/licenses/Inter-OFL.txt','fonts/licenses/IBM-Plex-OFL.txt','templates/cosmik-technical-note-template.docx','templates/cosmik-technical-note-template.pdf']);
for(const asset of manifest.assets)if(/accepted|approved|generated/i.test(asset.status) && !/archive|deprecated/i.test(asset.status))downloads.add(asset.path);
for(const name of ['cosmik-emblem-ink.svg','cosmik-lockup-ink.svg'])downloads.add('kits/cosmik/assets/vector/'+name);
function linkFor(source,href){
 if(/^(?:https?:|mailto:|#)/.test(href))return href;
 const hash=href.indexOf('#'),file=hash<0?href:href.slice(0,hash),fragment=hash<0?'':href.slice(hash);
 const target=path.posix.normalize(path.posix.join(path.posix.dirname(source),file));
 if(sourceRoutes.has(target))return sourceRoutes.get(target)+fragment;
 if(target==='specimens/components.html')return target+fragment;
 if(downloads.has(target))return 'files/'+target+fragment;
 return `https://github.com/cosmiklabs/brand/${target.endsWith('/')?'tree':'blob'}/main/${target}${fragment}`;
}
const label=text=>`<p class="eyebrow">${escape(text)}</p>`;
const navigation=current=>referenceNavigation(nav,current);
function shell({url,title,description,body,toc=[],source,baseHref}){
 return `<!doctype html>
<html lang="en" data-motion="system"><head>${baseHref?`<base href="${escape(baseHref)}">`:""}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} — Cosmik brand reference</title><meta name="description" content="${escape(description)}"><meta name="color-scheme" content="light dark"><link rel="icon" href="files/${icon}"><link rel="stylesheet" href="files/kits/cosmik/tokens/cosmik.css"><link rel="stylesheet" href="files/kits/cosmik/components/controls.css"><link rel="stylesheet" href="reference.css"><script defer src="search-index.js"></script><script defer src="reference.js"></script></head><body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><a class="identity" href="index.html" aria-label="Cosmik brand reference home"><picture><source media="(prefers-color-scheme:dark)" srcset="files/${emblem}"><img src="files/kits/cosmik/assets/vector/cosmik-emblem-ink.svg" width="48" height="48" alt="" data-identity-image data-dark-src="files/${emblem}" data-light-src="files/kits/cosmik/assets/vector/cosmik-emblem-ink.svg"></picture><span>Cosmik</span></a><span class="header-label">Brand reference</span><div class="header-actions"><label class="theme-control" hidden>Theme <span class="c-select c-select--dense"><select id="theme" aria-label="Theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></span></label><a class="source-link" href="https://github.com/cosmiklabs/brand">GitHub ↗</a></div></header>
${siteNavigation('cosmik')}
<div class="reference-layout"><aside class="sidebar"><details class="navigation" open><summary>Reference navigation</summary><div class="navigation-content"><div class="search" hidden><label for="guide-search">Find guidance</label><input class="c-input" type="search" id="guide-search" placeholder="Search this guide…" autocomplete="off" aria-controls="search-results"><p id="search-status" role="status" aria-live="polite"></p><ul id="search-results" hidden></ul></div><nav aria-label="Reference">${navigation(url)}</nav><p class="sidebar-version">Cosmik kit ${escape(manifest.version)}<br>Token schema ${escape(tokens.version)}</p></div></details></aside>
<main id="main" tabindex="-1" class="${url==='index.html'?'overview':'document'}">${source?`<div class="document-meta">${label(nav.find(n=>n[0]===url)?.[2] ?? 'Reference')}<a class="source-link" href="https://github.com/cosmiklabs/brand/blob/main/${source}">Markdown source ↗</a></div>`:''}${body}<footer class="page-footer"><p>Cosmik brand reference · Kit ${escape(manifest.version)}</p><p><a href="licensing.html">Licensing &amp; brand use</a><span aria-hidden="true"> / </span><a href="quality.html">Quality review</a></p></footer></main>
<aside class="page-index" aria-label="On this page">${toc.length?`<p class="eyebrow">On this page</p><nav><ul>${toc.filter(h=>h.level===2).map(h=>`<li><a href="#${escape(h.id)}">${escape(h.title)}</a></li>`).join('')}</ul></nav>`:''}</aside></div>
</body></html>`;
}
const entry=(href,title,text,number)=>`<a class="chapter" href="${href}">${label(number)}<h3>${escape(title)} <span aria-hidden="true">↗</span></h3><p>${escape(text)}</p></a>`;
function overview(){
 return `<div class="hero">${label('The shared Cosmik foundation')}<h1>The Cosmik<br> brand reference.</h1><p class="lead">Identity, design and implementation guidance for Cosmik and its product families.</p><div class="hero-actions"><a class="c-button c-button--primary" href="identity.html">Read the brand guide <span aria-hidden="true">→</span></a><a class="c-link" href="assets.html">Browse assets</a></div></div>
<figure class="identity-board" data-theme="dark"><picture><source media="(max-width:400px)" srcset="files/${emblem}" width="1254" height="1254"><img src="files/${lockup}" width="2172" height="724" alt="Accepted Cosmik identity artwork"></picture><figcaption>Accepted Cosmik artwork <span>Black and warm off-white</span></figcaption></figure>
<section aria-labelledby="explore"><div class="section-title">${label('01 / Explore')}<h2 id="explore">From principles to practice.</h2></div><div class="chapters">${entry('identity.html','Identity','Names, approved marks, clear space and reproduction.','Foundation')}${entry('interface.html','Interface','Composition, controls, overlays and responsive behavior.','Experience')}${entry('integration.html','Implementation','Browser, native and DTCG integration; pinned family kits.','Implementation')}${entry('assets.html','Assets & tokens','Accepted downloads and a searchable reference of source values.','Resources')}</div></section>
<section class="scope-section" aria-labelledby="scope">${label('02 / Scope')}<h2 id="scope">One foundation. Distinct identities.</h2><p>Cosmik is the parent identity. Organization surfaces use this monochrome baseline. Each product’s identity lives in its own family kit, built on a pinned release of the foundation.</p><div class="scope-flow"><div><strong>Cosmik</strong><span>Foundation, shared behavior and utility type</span></div><div><strong>Product families</strong><span>Own identity, tokens and product guidance</span></div><div><strong>Consumers</strong><span>Websites, applications, adapters and documents</span></div></div><a class="c-link" href="families.html">Understand the family contract</a></section>
<section class="reference-status" aria-labelledby="status">${label('03 / Read the status')}<h2 id="status">Approval has a scope.</h2><p>An accepted mark is not a product launch or an accessibility certification. Follow the source guidance, check the asset status and review the final consuming experience.</p><div class="status-definition"><div><strong>Approved / accepted</strong><p>An owner decision or accepted identity master.</p></div><div><strong>Proposed</strong><p>An option awaiting a decision.</p></div><div><strong>Deprecated / archive</strong><p>Historical reference; never select it for new work.</p></div></div><a class="c-link" href="validation.html">Read the validation evidence</a></section>`;
}
function assetPage(){
 const tiles=[['The emblem',emblem,'Accepted standalone vector master.'],['The lockup',lockup,'Accepted emblem and outlined wordmark.']];
 const groups=[['Tokens & controls',Object.values(manifest.entry_points.tokens.cosmik).concat(manifest.entry_points.controls)],['Fonts & notices', [...manifest.entry_points.web_fonts,...manifest.entry_points.desktop_fonts,'fonts/licenses/Inter-OFL.txt','fonts/licenses/IBM-Plex-OFL.txt']],['Platform icons',[manifest.entry_points.app_icon_windows,manifest.entry_points.app_icon_macos,manifest.entry_points.app_icon_png,manifest.entry_points.apple_touch_icon]],['Document templates',['templates/cosmik-technical-note-template.docx','templates/cosmik-technical-note-template.pdf']]];
 return `${label('Downloads')}<h1>Asset library.</h1><p class="lead">Use the accepted originals. Preserve the supplied proportions, clear space, geometry and font notices. Previews are scaled for inspection; follow the identity guide’s size recommendations in production.</p><div class="asset-previews">${tiles.map(([title,file,description])=>`<section class="asset-card"><div class="asset-canvas" data-theme="dark"><img src="files/${file}" alt="${title==='The emblem'?'Accepted Cosmik emblem':'Accepted Cosmik horizontal lockup'}" width="${title==='The emblem'?1254:2172}" height="${title==='The emblem'?1254:724}"></div><h2>${title}</h2><p>${description}</p><a class="c-link" download href="files/${file}">Download off-white SVG</a> · <a class="c-link" download href="files/${title==='The emblem'?'kits/cosmik/assets/vector/cosmik-emblem-ink.svg':'kits/cosmik/assets/vector/cosmik-lockup-ink.svg'}">Ink SVG</a></section>`).join('')}</div><p class="notice">Marks and artwork have separate usage terms. <a href="licensing.html#2-brand-marks-trademark-style-policy">Read the brand-use policy</a> before reusing them. The component code license does not grant unrestricted use of the identity.</p><p><a href="identity.html">Identity rules</a> · <a download href="files/asset-manifest.json">Full asset manifest with hashes</a></p><details class="additional-assets"><summary>Browse additional approved identity exports</summary><ul class="download-list">${manifest.assets.filter(asset=>downloads.has(asset.path)&&/\.(svg|png)$/.test(asset.path)&&!['kits/cosmik/assets/vector/cosmik-emblem-master-offwhite.svg','kits/cosmik/assets/vector/cosmik-emblem-ink.svg','kits/cosmik/assets/vector/cosmik-lockup-offwhite.svg','kits/cosmik/assets/vector/cosmik-lockup-ink.svg'].includes(asset.path)).map(asset=>`<li><a download href="files/${asset.path}"><span>${escape(path.posix.basename(asset.path))}</span><span>${escape(asset.status)}</span><span aria-hidden="true">↓</span></a></li>`).join('')}</ul></details>${groups.map(([name,files],n)=>`<section class="download-group"><h2 id="download-${n}">${name}</h2><ul class="download-list">${files.map(file=>`<li><a download href="files/${file}"><span>${escape(path.posix.basename(file))}</span><span>${escape(path.posix.dirname(file))}</span><span aria-hidden="true">↓</span></a></li>`).join('')}</ul></section>`).join('')}<section><h2>Known gaps</h2><ul>${manifest.known_gaps.map(g=>`<li><strong>${escape(g.id)}</strong> — ${escape(g.summary)}</li>`).join('')}</ul></section>`;
}
const kebab=key=>key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
function visualReference(source) {
 if(source==='guide/identity.md')return ['dark','light'].map(mode=>{
   const art=mode==='dark'?lockup:'kits/cosmik/assets/vector/cosmik-lockup-ink.svg';
   const symbol=mode==='dark'?emblem:'kits/cosmik/assets/vector/cosmik-emblem-ink.svg';
   return `<figure class="identity-board identity-reference" data-theme="${mode}"><picture><source media="(max-width:400px)" srcset="files/${symbol}" width="1254" height="1254"><img src="files/${art}" width="2172" height="724" alt="Accepted Cosmik artwork on a ${mode} surface, with its original canvas and proportions"></picture><figcaption>Accepted vector artwork · ${mode} surface <a download href="files/${art}">Download ${mode==='dark'?'off-white':'ink'} SVG →</a></figcaption></figure>`;
 }).join('');
 if(source==='guide/colour.md')return `<section class="visual-reference" aria-labelledby="color-preview"><h2 id="color-preview">The baseline in both modes</h2><p>These panels use the actual semantic roles. The organization baseline has no accent color.</p><div class="color-panels">${['dark','light'].map(mode=>`<div class="color-panel" data-theme="${mode}"><p class="eyebrow">${mode} mode</p>${['bg','surface','raised','text','muted','border'].map(role=>`<div class="color-role"><span style="background:var(--c-${role})" aria-hidden="true"></span><code>--c-${role}</code><code>${tokens.semantic[mode][role]}</code></div>`).join('')}</div>`).join('')}</div><p><a href="tokens.html">Inspect every color role and value →</a></p></section>`;
 if(source==='guide/typography.md')return `<section class="visual-reference" aria-labelledby="type-preview"><h2 id="type-preview">The type roles, rendered</h2><p>Live type from the generated baseline. Inter carries reading and utility roles; IBM Plex Mono carries brief technical metadata.</p><div class="type-specimens">${Object.entries(tokens.type).map(([role,value])=>`<div class="type-specimen"><p class="eyebrow">${role} · ${value.fontSize} · ${value.fontWeight}</p><p class="type-sample" style="font-family:var(--c-type-${role}-font-family);font-size:var(--c-type-${role}-font-size);font-weight:var(--c-type-${role}-font-weight);line-height:var(--c-type-${role}-line-height);letter-spacing:var(--c-type-${role}-letter-spacing)${value.textTransform?`;text-transform:var(--c-type-${role}-text-transform)`:''}">${role==='label'?'Short metadata':role==='identity-label'?'Cosmik':'A shared reference.'}</p></div>`).join('')}</div></section>`;
 return '';
}

function tokenPage(){
 const colors=Object.keys(tokens.semantic.dark).map(role=>({name:`--c-${role}`,group:'Color',value:tokens.semantic.dark[role],light:tokens.semantic.light[role],dark:tokens.semantic.dark[role]}));
 const values=[];
 for(const group of ['space','layout','type','motion','radius','breakpoint','glass']){
   const walk=(value,parts=[])=>{if(value && typeof value==='object'){for(const [k,v] of Object.entries(value))walk(v,[...parts,k]);}else values.push({name:`--c-${group}-${parts.map(kebab).join('-')}`,group:group==='type'?'Typography':group[0].toUpperCase()+group.slice(1),value:String(value)});};walk(tokens[group]);
 }
 // Motion's source duration is the normal value; the effective duration is policy.
 const normal=values.find(r=>r.name==='--c-motion-duration');normal.name='--c-motion-normal-duration';
 values.push({name:'--c-motion-duration',group:'Motion',value:'var(--c-motion-system-duration); scoped by data-motion'}, {name:'--c-motion-system-duration',group:'Motion',value:'Normal or reduced duration, selected by the operating system'});
 const primitives=Object.entries(tokens.primitives).map(([name,value])=>({name:`--c-primitive-${name}`,group:'Primitives',value}));
 const rows=[...colors,...values,...primitives];
 return `${label('Source-backed reference')}<h1>Design tokens.</h1><p class="lead">Semantic values for color, type, space and behavior. These rows come from the generated baseline, not a hand-maintained list.</p><p>Kit version <strong>${manifest.version}</strong> · baseline token version <strong>${tokens.version}</strong>. A kit release and a token-schema revision are separate versions.</p><div class="token-tools" hidden><label for="token-search">Find a token<input type="search" class="c-input" id="token-search" placeholder="Try focus, control-min or font-size" aria-controls="token-table"></label><label for="token-group">Group<span class="c-select"><select id="token-group"><option value="all">All groups</option>${[...new Set(rows.map(r=>r.group))].map(g=>`<option>${g}</option>`).join('')}</select></span></label><p id="token-status" role="status" aria-live="polite">${rows.length} tokens</p></div><p class="notice">Use semantic roles in interfaces; primitives document the palette and are not component roles. Color values below are reference swatches, not accessibility results for arbitrary combinations. Glass roles are translucent and require the correct backdrop tone. <a href="colour.html">Read the color contract</a>.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Design tokens"><table class="token-table" id="token-table"><thead><tr><th scope="col">Token / group</th><th scope="col">Dark or shared value</th><th scope="col">Light value</th></tr></thead><tbody>${rows.map(row=>`<tr data-token-group="${escape(row.group)}"><th scope="row"><code>${escape(row.name)}</code><span class="token-group-label">${row.group}</span></th><td>${row.dark?`<span class="swatch" style="--swatch:${row.dark}" aria-hidden="true"></span>`:''}<code>${escape(row.value)}</code></td><td>${row.light?`<span class="swatch" style="--swatch:${row.light}" aria-hidden="true"></span><code>${escape(row.light)}</code>`:'<span class="shared-value">Shared</span>'}</td></tr>`).join('')}</tbody></table></div><p id="token-empty" hidden>No tokens match. Clear the search or choose another group.</p><p><a href="files/kits/cosmik/tokens/cosmik.css" download>CSS</a> · <a href="files/kits/cosmik/tokens/cosmik.json" download>Resolved JSON</a> · <a href="files/kits/cosmik/tokens/cosmik.tokens.json" download>DTCG JSON</a> · <a href="files/kits/cosmik/tokens/cosmik_tokens.rs" download>Rust</a></p>`;
}
export function buildReference(output=path.join(root,'site'),{baseUrl}={}){
 let baseHref='./';
 if(baseUrl){const url=new URL(baseUrl);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Reference base URL must be HTTPS without credentials, query or fragment.');baseHref=url.pathname.replace(/\/?$/,'/');}
 // This function owns only its supplied build directory; tests use fresh temp paths.
 fs.mkdirSync(output,{recursive:true});
 const write=(file,data)=>{const target=path.join(output,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);};
 const search=[];
 const page=options=>write(options.url,shell(options));
 page({url:'index.html',title:'Overview',description:'The complete Cosmik brand reference: identity, interface, implementation, assets and tokens.',body:overview()});
 for(const [source,url,title] of documents){
   const markdown=read(source),rendered=renderMarkdown(markdown,href=>linkFor(source,href));
   page({url,title:nav.find(n=>n[0]===url)?.[1]??title,description:plain(markdown.split('\n\n').find(p=>!p.startsWith('#')) ?? title).replace(/\s+/g,' ').slice(0,180),body:`<article class="prose">${rendered.html.replace(/<\/h1>/,end=>end+visualReference(source))}</article>`,toc:rendered.headings,source});
   search.push({title:nav.find(n=>n[0]===url)?.[1]??title,url,text:plain(markdown).replace(/\s+/g,' '),sections:rendered.headings.filter(h=>h.level===2)});
 }
 page({url:'components.html',title:'Component examples',description:'Shared controls and interactive specimens for the Cosmik brand.',body:componentExamples('Cosmik',`v${manifest.version}`)+'<section class="component-panel"><h2>Interactive specimen</h2><p>Explore the full control states, keyboard behavior, dialogs, menus and motion examples.</p><a class="c-link" href="specimens/components.html">Open the interactive specimen →</a></section>'});
 page({url:'assets.html',title:'Asset library',description:'Approved Cosmik assets, platform icons, fonts, templates and source-backed download links.',body:assetPage()});
 page({url:'tokens.html',title:'Design tokens',description:'Search the complete generated Cosmik baseline: semantic color, type, spacing, layout and motion tokens.',body:tokenPage()});
 search.push({title:'Asset library',url:'assets.html',text:'emblem lockup logo SVG icons fonts templates downloads assets',sections:[]},{title:'Design tokens',url:'tokens.html',text:'CSS JSON Rust DTCG colors typography spacing layout motion radius glass breakpoint',sections:[]},{title:'Component examples',url:'components.html',text:'components buttons inputs selects toolbar dialog popover menu glass states motion',sections:[]});
 write('search-index.js',`window.CosmikReferenceIndex=${JSON.stringify(search).replace(/</g,'\\u003c')};\n`);
 for(const file of ['reference.css','reference.js'])write(file,read('reference/'+file));
 for(const file of downloads){if(!fs.existsSync(path.join(root,file)))throw Error(`Missing reference asset: ${file}`);write('files/'+file,fs.readFileSync(path.join(root,file)));}
 // The existing offline component reference remains intact, including its relative paths.
 for(const file of ['components.html','components.css','components.js','motion.js'])write('specimens/'+file,file==='components.html'?read('specimens/'+file).replace('href="../guide/motion.md"','href="../motion.html"').replace('href="validation.md"','href="../validation.html"').replace('<nav class="reference-index"', '<p><a href="../components.html">← Component examples</a></p><nav class="reference-index"'):read('specimens/'+file));
 for(const file of [manifest.entry_points.controls,...Object.values(manifest.entry_points.tokens.cosmik),...manifest.entry_points.web_fonts,'fonts/licenses/Inter-OFL.txt','fonts/licenses/IBM-Plex-OFL.txt'])write(file,fs.readFileSync(path.join(root,file)));
 write('.nojekyll','');write('404.html',shell({baseHref,url:'404.html',title:'Page not found',description:'Return to the Cosmik brand reference.',body:'<h1>Page not found.</h1><p>Find the current chapters in the <a href="index.html">reference overview</a>.</p>'}));
 return {pages:documents.length+5,output};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 // Clean this generated output only; never copy the repository wholesale.
 const output=path.join(root,'site');fs.rmSync(output,{recursive:true,force:true});
 const result=buildReference(output,{baseUrl:process.env.REFERENCE_BASE_URL});console.log(`Built ${result.pages} reference pages in site/ (plus the preserved component specimen).`);
}
