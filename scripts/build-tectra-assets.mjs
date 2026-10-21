/** Approved angle-only Latch geometry; outlined Inter label, never an optical redesign. */
import fs from 'node:fs';
import {readFont,advance,outline} from './font-outlines.mjs';
import {flatten} from './vector-raster.mjs';
const dir=new URL('../kits/tectra/assets/',import.meta.url);
const source=JSON.parse(fs.readFileSync(new URL('latch.source.json',dir)));
const font=readFont(fs.readFileSync(new URL('../fonts/desktop/Inter-SemiBold.ttf',import.meta.url)));
const move=(cs,f)=>cs.map(c=>c.map(([op,...v])=>{const a=[op];for(let i=0;i<v.length;i+=2)a.push(...f(v[i],v[i+1]));return a;}));
let pen=0;const chars=[...'Tectra'].map(c=>font.glyphId(c.codePointAt(0))),letters=[];
chars.forEach((id,i)=>{letters.push(...move(outline(font,id),(x,y)=>[x+pen,y]));pen+=advance(font,id)+(i+1<chars.length?font.kerning(id,chars[i+1]):0);});
const pts=letters.flatMap(flatten),minX=Math.min(...pts.map(p=>p[0]));
const scale=28/font.capHeight;
const word=move(letters,(x,y)=>[+(72+(x-minX)*scale).toFixed(3),+(46-y*scale).toFixed(3)]);
const wordPath=word.map(c=>c.map(a=>a.join(' ')).join(' ')).join(' ');
const bounds=word.flatMap(flatten),right=Math.max(...bounds.map(p=>p[0])),W=Math.ceil(right+8);
for(const [name,fill]of Object.entries(source.variants)){
 const shapes=source.paths.map(d=>`<path fill="${fill}" d="${d}"/>`).join('');
 fs.writeFileSync(new URL(`tectra-latch-${name}.svg`,dir),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Tectra Latch">${shapes}</svg>\n`);
 fs.writeFileSync(new URL(`tectra-lockup-${name}.svg`,dir),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 64" role="img" aria-label="Tectra">${shapes}<path fill="${fill}" d="${wordPath}"/></svg>\n`);
}
console.log(`Tectra Latch and Inter lockups generated; lockup viewBox 0 0 ${W} 64; visible bounds 8 12 ${+(right-8).toFixed(3)} 40.`);
