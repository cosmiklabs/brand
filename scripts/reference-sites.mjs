/** Shared navigation destinations, separate from identity and token releases. */
import {escape} from './reference-markdown.mjs';
export const referenceSites=[
 {id:'cosmik',name:'Cosmik',repository:'brand',url:'https://cosmiklabs.github.io/brand/'},
 {id:'hplx',name:'HPLX',repository:'brand-hplx',url:'https://cosmiklabs.github.io/brand-hplx/'},
 {id:'tectra',name:'Tectra',repository:'brand-tectra',url:'https://cosmiklabs.github.io/brand-tectra/'},
];
export function siteNavigation(current){
 return `<nav class="brand-sites" aria-label="Brand references"><span>Brand guides</span>${referenceSites.map(site=>`<a href="${site.url}"${site.id===current?' aria-current="true"':''}>${escape(site.name)}</a>`).join('')}</nav>`;
}

// Keep shared destinations in the same order, while retaining kit-specific chapters.
export function normalizeNavigation(entries){
 const labels={'identity.html':'Identity & usage','family-guide.html':'Identity & usage','families.html':'Family contract','family-contract.html':'Family contract','tokens.html':'Design tokens','components.html':'Component examples','validation.html':'Validation record'};
 const groups=['Start here','Foundations','Experience','Implementation','Tools','Resources'];
 const order=['index.html','guide.html','identity.html','family-guide.html','typography.html','colour.html','voice.html','interface.html','motion.html','documents.html','families.html','family-contract.html','integration.html','baseline.html','quality.html','governance.html','assets.html','tokens.html','components.html','templates.html','token-guide.html','validation.html','kit-validation.html','licensing.html','changelog.html','repository.html'];
 return entries.map(([url,title,group])=>[url,labels[url]??title,['identity.html','family-guide.html'].includes(url)?'Foundations':['quality.html','governance.html'].includes(url)?'Implementation':group]).sort((a,b)=>groups.indexOf(a[2])-groups.indexOf(b[2])||order.indexOf(a[0])-order.indexOf(b[0]));
}
export function referenceNavigation(entries,current){
 return [...new Set(entries.map(n=>n[2]))].map(group=>`<div class="nav-group"><p class="eyebrow">${escape(group)}</p><ul>${entries.filter(n=>n[2]===group).map(([url,title])=>`<li><a href="${url}"${url===current?' aria-current="page"':''}>${escape(title)}</a></li>`).join('')}</ul></div>`).join('');
}

export function componentExamples(name,foundation){return `<p class="eyebrow">Shared controls</p><h1>Component examples.</h1><p class="lead">Controls rendered with ${name} tokens and the shared ${foundation} foundation.</p><p>Try the fields, selectors and actions below. Read the <a href="interface.html">interface</a> and <a href="motion.html">motion</a> guidance for usage and behavior.</p>${['dark','light'].map(mode=>`<section class="component-panel" data-theme="${mode}" aria-labelledby="${mode}-components"><h2 id="${mode}-components">${mode==='dark'?'Dark':'Light'} controls</h2><form id="${mode}-form"><div class="sample-actions"><a class="c-button c-button--primary" href="assets.html">Browse assets</a><button class="c-button c-button--secondary" type="reset">Reset example</button><span class="c-status">Example status</span></div><label for="${mode}-label">Example label<input class="c-input" id="${mode}-label" placeholder="Type a label"></label><label for="${mode}-order">Example order<span class="c-select"><select id="${mode}-order"><option>Newest first</option><option>Name</option></select></span></label><details><summary>About these examples</summary><p>Fields are editable. Reset example restores this form’s original values. Browse assets opens the real asset library.</p></details></form></section>`).join('')}`;}

// Navigation identities are UI labels, never reduced or recreated wordmarks.
// Canvas sizes compensate for the measured visible symbol height: Cosmik
// 779/1254, Glimmer 54/64, Latch 40/64. Each renders about 30 px of ink.
export function referenceHeader({name,repository,symbolDark,symbolLight,id}){
 return `<header class="site-header"><a class="identity" href="index.html" aria-label="${escape(name)} brand reference home"><picture class="identity-symbol identity-symbol--${id}"><source media="(prefers-color-scheme:dark)" srcset="files/${symbolDark}"><img src="files/${symbolLight}" width="48" height="48" alt="" data-identity-image data-dark-src="files/${symbolDark}" data-light-src="files/${symbolLight}"></picture><span>${escape(name)}</span></a><span class="header-label">Brand reference</span><div class="header-actions"><label class="theme-control" hidden>Theme <span class="c-select c-select--dense"><select id="theme" aria-label="Theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></span></label><a class="source-link" href="https://github.com/${repository}">GitHub ↗</a></div></header>`;
}
export function identitySurfaces({name,id,identity,symbols=false}){
 return `<div class="identity-surfaces${symbols?' identity-surfaces--symbols':''}">${['dark','light'].map(mode=>{const file=identity[(symbols?'symbol':'lockup')+(mode==='dark'?'Dark':'Light')];return `<figure class="identity-surface" data-theme="${mode}"><div class="artwork-stage artwork-stage--${id}">${symbols?`<img class="artwork-symbol" src="files/${file}" width="128" height="128" alt="${escape(name)} emblem on a ${mode} surface">`:`<picture><source media="(max-width:400px)" srcset="files/${identity['symbol'+(mode==='dark'?'Dark':'Light')]}"><img class="artwork-lockup" src="files/${file}" alt="${escape(name)} approved identity on a ${mode} surface"></picture>`}</div><figcaption><span>${symbols?'Emblem':'<span class="artwork-kind-lockup">Wordmark &amp; emblem</span><span class="artwork-kind-symbol">Emblem preview</span>'} · ${mode} surface</span><a download href="files/${file}" aria-label="Download ${escape(name)} ${symbols?'emblem':'lockup'} SVG for a ${mode} surface">Download SVG <span aria-hidden="true">↓</span></a></figcaption></figure>`;}).join('')}</div>`;
}
export function referenceOverview({name,description,identityUrl,board,context}){
 const chapters=[['guide.html','Guide index','Find every chapter and tool in this reference.'],[identityUrl,'Identity & usage','Names, approved artwork, clear space and reproduction.'],['tokens.html','Design tokens','Search the exported values for colors, type, space and behavior.'],['assets.html','Asset library','Download approved artwork, fonts and implementation files.']];
 return `<div class="hero"><p class="eyebrow">${escape(name)} brand guide</p><h1>The ${escape(name)}<br> brand reference.</h1><p class="lead">${escape(description)}</p><div class="hero-actions"><a class="c-button c-button--primary" href="guide.html">Read the brand guide <span aria-hidden="true">→</span></a><a class="c-link" href="assets.html">Browse assets</a></div></div>${board}<section class="overview-explore" aria-labelledby="explore"><h2 id="explore">From principles to practice.</h2><div class="chapters">${chapters.map(([url,title,text])=>`<a class="chapter" href="${url}"><h3>${escape(title)} <span aria-hidden="true">↗</span></h3><p>${text}</p></a>`).join('')}</div></section><section class="scope-section" aria-labelledby="scope"><h2 id="scope">About this guide.</h2>${context}<p><a href="validation.html">Validation record</a> · <a href="quality.html">Quality review</a></p></section><p class="notice">Identity approval does not announce product availability or certify a consuming interface. Follow the source guidance and review the final experience.</p>`;
}
const chapterDescriptions={
 'identity.html':'Approved identity, names, clear space and reproduction.', 'family-guide.html':'Approved identity, names, clear space and reproduction.',
 'typography.html':'Type roles, hierarchy and readable content.', 'colour.html':'Semantic colors, light and dark themes, and contrast.', 'voice.html':'Writing, imagery and icon guidance.',
 'interface.html':'Layout, density, controls and responsive behavior.', 'motion.html':'Transitions and motion preferences.', 'documents.html':'Documents, templates and export review.',
 'families.html':'How product families build on the Cosmik foundation.', 'family-contract.html':'How this family builds on its pinned Cosmik foundation.', 'integration.html':'Using the foundation in websites and applications.', 'baseline.html':'The shared baseline kit, assets and tokens.',
 'quality.html':'Visual review, interactions and validation evidence.', 'governance.html':'Decisions, contribution, releases and upgrades.',
 'assets.html':'Approved artwork, fonts and downloads.', 'tokens.html':'Searchable CSS names and resolved token values.', 'components.html':'Interactive examples of shared controls.',
 'templates.html':'Document templates and export guidance.', 'validation.html':'Checks and limitations for this reference.', 'licensing.html':'Code, artwork and font usage terms.', 'changelog.html':'Recorded changes to the kit.', 'repository.html':'Repository structure and contribution guidance.',
 'token-guide.html':'Family token sources, outputs and integration.', 'kit-validation.html':'Validation evidence for the family kit.'
};
export function guideIndex({name,nav,identityUrl,note}){
 const groups=[...new Set(nav.map(n=>n[2]))].filter(group=>group!=='Start here');
 const toc=groups.map(group=>({level:2,id:'index-'+group.toLowerCase().replaceAll(' ','-'),title:group}));
 return {toc,body:`<article class="prose guide-index"><p class="eyebrow">Start here</p><h1 id="${name.toLowerCase()}-brand-guide">${escape(name)} brand guide</h1><p class="lead">The complete guide to ${escape(name)} identity, interfaces and implementation.</p><p>Start with <a href="${identityUrl}">Identity &amp; usage</a>, or choose a chapter below. ${note}</p>${groups.map((group,i)=>`<section><h2 id="${toc[i].id}">${escape(group)}</h2><div class="table-scroll" tabindex="0" role="region" aria-label="${escape(group)} chapters"><table><thead><tr><th scope="col">Page</th><th scope="col">What it covers</th></tr></thead><tbody>${nav.filter(n=>n[2]===group).map(([url,title])=>`<tr><td><a href="${url}">${escape(title)}</a></td><td>${escape(chapterDescriptions[url]??title)}</td></tr>`).join('')}</tbody></table></div></section>`).join('')}</article>`};
}
