import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tokens=JSON.parse(fs.readFileSync(path.join(root,'tokens/cosmik.json'),'utf8'));
const luminance=hex=>{const rgb=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const contrast=(a,b)=>{let [x,y]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (y+.05)/(x+.05);};
const checks=[];
for(const [mode,t] of Object.entries(tokens.semantic)){
 const add=(fg,bg,threshold,kind)=>checks.push({mode,kind,pair:`${fg} / ${bg}`,foreground:t[fg],background:t[bg],ratio:Number(contrast(t[fg],t[bg]).toFixed(3)),threshold,pass:contrast(t[fg],t[bg])>=threshold});
 for(const fg of ['text','muted','link','link-hover','link-active']) for(const bg of ['bg','surface','raised']) add(fg,bg,4.5,'text');
 for(const bg of ['action-primary','action-primary-hover','action-primary-active']) add('action-primary-fg',bg,4.5,'text');
 for(const bg of ['action-secondary','action-secondary-hover','action-secondary-active']) add('action-secondary-fg',bg,4.5,'text');
 add('input-fg','input-bg',4.5,'text');add('input-placeholder','input-bg',4.5,'text');add('disabled-fg','disabled-bg',4.5,'text');add('status-fg','status-bg',4.5,'text');add('on-selected','selected',4.5,'text');
 for(const bg of ['bg','surface','raised','input-bg','disabled-bg','status-bg']) add('border',bg,3,'boundary');
 for(const bg of ['bg','surface','raised']) add('focus',bg,3,'focus');
 for(const bg of ['bg','surface','raised']) add('selected',bg,3,'boundary');
 for(const fg of ['action-primary','action-primary-hover','action-primary-active']) for(const bg of ['bg','surface','raised']) add(fg,bg,3,'boundary');
 for(const bg of ['bg','surface','raised','disabled-bg']) add('disabled-border',bg,3,'boundary');
 for(const bg of ['input-bg','status-bg']) add('muted',bg,4.5,'text');
 for(const s of ['error','warning','success','info']){
  for(const bg of [`status-${s}-bg`,'bg','surface','raised']) add(`status-${s}-fg`,bg,4.5,'text');
  add('muted',`status-${s}-bg`,4.5,'text');
  for(const bg of [`status-${s}-bg`,'bg','surface','raised']) add(`status-${s}-border`,bg,3,'boundary');
 }
}
// Translucent roles (scrim, shadow) depend on what lies beneath them and are not contrast-checked.
for(const c of checks) if(!/^#[0-9A-F]{6}$/i.test(c.foreground)||!/^#[0-9A-F]{6}$/i.test(c.background)) throw new Error(`${c.mode} ${c.pair}: contrast pairs must be opaque #RRGGBB colours`);

const failed=checks.filter(x=>!x.pass);
console.log(JSON.stringify({checks:checks.length,failed,minText:Math.min(...checks.filter(x=>x.kind==='text').map(x=>x.ratio)),minBoundary:Math.min(...checks.filter(x=>x.kind==='boundary').map(x=>x.ratio))},null,2));
process.exit(failed.length?1:0);
