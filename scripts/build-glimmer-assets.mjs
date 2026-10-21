/** Exact approved Glimmer paths and Spectral outlines; no geometry reconstruction. */
import fs from 'node:fs';
const dir=new URL('../kits/hplx/assets/',import.meta.url),s=JSON.parse(fs.readFileSync(new URL('glimmer.source.json',dir)));
for(const [name,colours]of Object.entries(s.variants)){
 const shapes=s.paths.map(d=>`<path fill="${colours.symbol}" d="${d}"/>`).join('');
 const svg=(vb,content)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="HPLX Glimmer">${content}</svg>\n`;
 fs.writeFileSync(new URL(`hplx-glimmer-${name}.svg`,dir),svg(s.viewBox,shapes));
 fs.writeFileSync(new URL(`hplx-glimmer-lockup-${name}.svg`,dir),svg(s.lockup.viewBox,shapes+s.lockup.wordmark_paths.map(d=>`<path fill="${colours.wordmark}" d="${d}"/>`).join('')));
}
console.log('Generated approved HPLX Glimmer SVGs and Spectral lockups.');
