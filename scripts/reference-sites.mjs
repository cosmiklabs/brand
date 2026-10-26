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
