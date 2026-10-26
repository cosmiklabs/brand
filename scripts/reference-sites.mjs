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
 const groups=['Start here','Foundations','Experience','Implementation','Tools','Resources','Archive'];
 const order=['index.html','guide.html','identity.html','family-guide.html','typography.html','colour.html','voice.html','interface.html','motion.html','documents.html','families.html','family-contract.html','integration.html','baseline.html','quality.html','governance.html','assets.html','tokens.html','components.html','templates.html','token-guide.html','validation.html','kit-validation.html','licensing.html','changelog.html','repository.html','historical.html'];
 return entries.map(([url,title,group])=>[url,labels[url]??title,['identity.html','family-guide.html'].includes(url)?'Foundations':['quality.html','governance.html'].includes(url)?'Implementation':group]).sort((a,b)=>groups.indexOf(a[2])-groups.indexOf(b[2])||order.indexOf(a[0])-order.indexOf(b[0]));
}
export function referenceNavigation(entries,current){
 return [...new Set(entries.map(n=>n[2]))].map(group=>`<div class="nav-group"><p class="eyebrow">${escape(group)}</p><ul>${entries.filter(n=>n[2]===group).map(([url,title])=>`<li><a href="${url}"${url===current?' aria-current="page"':''}>${escape(title)}</a></li>`).join('')}</ul></div>`).join('');
}

export function componentExamples(name,foundation){return `<p class="eyebrow">Shared controls</p><h1>Component examples.</h1><p class="lead">Controls rendered with ${name} tokens and the shared ${foundation} foundation.</p><p>Try the fields, selectors and actions below. Read the <a href="interface.html">interface</a> and <a href="motion.html">motion</a> guidance for usage and behavior.</p>${['dark','light'].map(mode=>`<section class="component-panel" data-theme="${mode}" aria-labelledby="${mode}-components"><h2 id="${mode}-components">${mode==='dark'?'Dark':'Light'} controls</h2><form id="${mode}-form"><div class="sample-actions"><a class="c-button c-button--primary" href="assets.html">Browse assets</a><button class="c-button c-button--secondary" type="reset">Reset example</button><span class="c-status">Example status</span></div><label for="${mode}-label">Example label<input class="c-input" id="${mode}-label" placeholder="Type a label"></label><label for="${mode}-order">Example order<span class="c-select"><select id="${mode}-order"><option>Newest first</option><option>Name</option></select></span></label><details><summary>About these examples</summary><p>Fields are editable. Reset example restores this form’s original values. Browse assets opens the real asset library.</p></details></form></section>`).join('')}`;}
