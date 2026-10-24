/** Contrast check. `contrastChecks` evaluates the defined pairs for one resolved kit: every kit must
 * pass the baseline's pairs, and a family's extension roles (accent, status tones) add their own.
 * The CLI checks this checkout's baseline (kits/cosmik/tokens/cosmik.json) and any kit directory
 * with a token source; scripts/family.mjs applies the same pairs to a family in another repository.
 * Run through `node scripts/check.mjs`. Node.js only. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const luminance=hex=>{const rgb=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
export const contrast=(a,b)=>{let [x,y]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (y+.05)/(x+.05);};

/** Every defined pair for one kit's resolved `semantic` map ({dark, light}); throws on a malformed map. */
export function contrastChecks(kit, semantic){
 const checks=[];
 if (!semantic || typeof semantic !== 'object' || Object.keys(semantic).sort().join('|') !== 'dark|light') throw new Error(`${kit}: expected dark and light semantic maps`);
 for(const [mode,t] of Object.entries(semantic)){
  if (!t || typeof t !== 'object' || Array.isArray(t)) throw new Error(`${kit} ${mode}: invalid semantic map`);
  const add = (fg, bg, threshold, kind) => {
   for (const role of [fg, bg]) if (typeof t[role] !== 'string' || !/^#[0-9A-F]{6}$/i.test(t[role])) throw new Error(`${kit} ${mode} ${role}: contrast pairs require an opaque #RRGGBB role`);
   const ratio = contrast(t[fg], t[bg]);
   checks.push({kit, mode, kind, pair: `${fg} / ${bg}`, foreground: t[fg], background: t[bg], ratio: Number(ratio.toFixed(3)), threshold, pass: ratio >= threshold});
  };
  for(const fg of ['text','muted','link','link-hover','link-active']) for(const bg of ['bg','surface','raised']) add(fg,bg,4.5,'text');
  for(const bg of ['action-primary','action-primary-hover','action-primary-active']) add('action-primary-fg',bg,4.5,'text');
  for(const bg of ['action-secondary','action-secondary-hover','action-secondary-active']) add('action-secondary-fg',bg,4.5,'text');
  add('input-fg','input-bg',4.5,'text');add('input-placeholder','input-bg',4.5,'text');add('disabled-fg','disabled-bg',4.5,'text');add('status-fg','status-bg',4.5,'text');add('on-selected','selected',4.5,'text');
  for(const bg of ['bg','surface','raised','input-bg','disabled-bg','status-bg']) add('border',bg,3,'boundary');
  for(const bg of ['bg','surface','raised']) add('focus',bg,3,'focus');
  for(const bg of ['bg','surface','raised']) add('selected',bg,3,'boundary');
  for(const fg of ['action-primary','action-primary-hover','action-primary-active']) for(const bg of ['bg','surface','raised']) add(fg,bg,3,'boundary');
  for(const bg of ['bg','surface','raised','disabled-bg']) add('disabled-border',bg,3,'boundary');
  for(const bg of ['status-bg','bg','surface','raised']) add('status-border',bg,3,'boundary');
  for(const bg of ['input-bg','status-bg']) add('muted',bg,4.5,'text');
  // Family extensions: checked when a kit defines them.
  if('accent' in t) for(const bg of ['bg','surface','raised']) add('accent',bg,3,'boundary');
  for(const s of ['error','warning','success','info']){
   if(!(`status-${s}-fg` in t)) continue;
   for(const bg of [`status-${s}-bg`,'bg','surface','raised']) add(`status-${s}-fg`,bg,4.5,'text');
   add('muted',`status-${s}-bg`,4.5,'text');
   for(const bg of [`status-${s}-bg`,'bg','surface','raised']) add(`status-${s}-border`,bg,3,'boundary');
  }
 }
 // Translucent roles (scrim, shadow) depend on what lies beneath them and are not contrast-checked.
 return checks;
}

export function contrastReport(checks, kits){
 const failed=checks.filter(x=>!x.pass);
 const byKit=Object.fromEntries(kits.map(kit=>[kit,checks.filter(x=>x.kit===kit).length]));
 return {checks:checks.length,byKit,failed,minText:Math.min(...checks.filter(x=>x.kind==='text').map(x=>x.ratio)),minBoundary:Math.min(...checks.filter(x=>x.kind==='boundary').map(x=>x.ratio))};
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const kits=[];
 for (const id of fs.readdirSync(path.join(root, 'kits')).sort()) {
  const source = `kits/${id}/tokens/${id === 'cosmik' ? 'source' : 'family'}.json`;
  if (!fs.existsSync(path.join(root, source))) continue;
  const file = `kits/${id}/tokens/${id}.json`;
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing generated tokens: ${file}; run npm run build`);
  kits.push([id, file]);
 }
 if (!kits.some(([id]) => id === 'cosmik')) throw new Error('Missing Cosmik baseline; refusing an empty contrast check');
 // The baseline first.
 kits.sort((a,b)=>(b[0]==='cosmik')-(a[0]==='cosmik'));
 const checks=kits.flatMap(([kit,file])=>contrastChecks(kit, JSON.parse(fs.readFileSync(path.join(root,file),'utf8')).semantic));
 const report=contrastReport(checks, kits.map(([kit])=>kit));
 console.log(JSON.stringify(report,null,2));
 process.exit(report.failed.length?1:0);
}
