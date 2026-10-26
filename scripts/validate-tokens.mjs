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

// ---- Glass: a translucent role over content the kit cannot know ----
// A glass surface paints the `glass` tint over a filtered copy of whatever lies behind it: blurred,
// saturated, then the tone's contrast() and brightness(). Glass follows the theme, so each mode (a
// glass tone) must hold over ANY backdrop: its contrast is checked against a grid of 17 levels per
// sRGB channel (4,913 colours, the full luminance range and saturated primaries). Blurring only
// averages backdrop colours, so a solid backdrop is the worst case for text; the browser check
// samples real composites over stripes and checkers too. Filters and compositing are per channel in
// sRGB, as Chromium paints them (measured): saturate() is the CSS matrix, clamped; contrast(c) is
// (x - 0.5) * c + 0.5; brightness(b) is x * b, clamped; the tint composites straight-alpha.
const toHex=rgb=>'#'+rgb.map(c=>Math.round(Math.min(1,Math.max(0,c))*255).toString(16).padStart(2,'0')).join('').toUpperCase();
const channels=hex=>hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255);
const saturate=([r,g,b],s)=>[[.213+.787*s,.715-.715*s,.072-.072*s],[.213-.213*s,.715+.285*s,.072-.072*s],[.213-.213*s,.715-.715*s,.072+.928*s]].map(m=>m[0]*r+m[1]*g+m[2]*b);
export const GLASS_GRID_STEPS=16;
export const glassBackdrops=(()=>{const out=[];for(let r=0;r<=GLASS_GRID_STEPS;r++)for(let g=0;g<=GLASS_GRID_STEPS;g++)for(let b=0;b<=GLASS_GRID_STEPS;b++)out.push([r,g,b].map(v=>v/GLASS_GRID_STEPS));return out;})();
/** The opaque colour a glass tint (#RRGGBBAA) produces over one backdrop (sRGB floats). */
const linear=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
/** Relative luminance of a backdrop given as sRGB floats. */
export const backdropLuminance=([r,g,b])=>.2126*linear(r)+.7152*linear(g)+.0722*linear(b);
/** A backdrop (sRGB floats) through one tone's filter: saturate, contrast, brightness. */
export const glassFilter=(backdrop,glass,mode)=>{const {contrast:c=1,brightness:b=1}=glass[mode]??{};return saturate(backdrop,glass.saturation??1).map(v=>Math.min(1,Math.max(0,v))).map(v=>Math.min(1,Math.max(0,((v-.5)*c+.5)*b)));};
/** A translucent colour (#RRGGBBAA) painted over an opaque one (#RRGGBB). */
export const over=(tint,base)=>{const [r,g,b,a=1]=channels(tint);const under=channels(base);return toHex([r,g,b].map((c,i)=>c*a+under[i]*(1-a)));};
// Interaction states: hover and pressed move the same way from rest, pressed further, by at least
// these contrast steps, so pressing reads as a deeper hover rather than a return to rest.
export const PRESSED_STEP=1.25, PRESSED_BEYOND_HOVER=1.08;
const relative=hex=>luminance(hex);
/** Whether rest → hover → pressed moves one way in luminance, with pressed clearly apart. */
export const stateRamp=(rest,hover,pressed)=>{
 const [a,b,c]=[rest,hover,pressed].map(relative);
 const oneWay=(b-a)*(c-b)>0;
 return {oneWay, pressed:contrast(rest,pressed), beyond:contrast(hover,pressed)};
};
/** The opaque colour a glass tint (#RRGGBBAA) produces over one backdrop through `mode`'s filter. */
export const glassComposite=(tint,backdrop,glass,mode)=>{const [r,g,b,a=1]=channels(tint);const behind=glassFilter(backdrop,glass,mode);return toHex([r,g,b].map((c,i)=>c*a+behind[i]*(1-a)));};
/** How much of the scene a tone keeps: the relative luminance range of the filtered backdrop
 * (black to white) and of the composite over the whole grid, with the composite's own ratio. */
export const glassScene=(tint,glass,mode)=>{
 const filtered=[[0,0,0],[1,1,1]].map(b=>backdropLuminance(glassFilter(b,glass,mode)));
 const ls=glassBackdrops.map(b=>luminance(glassComposite(tint,b,glass,mode)));
 const lo=Math.min(...ls),hi=Math.max(...ls);
 return {filtered,composite:[lo,hi],ratio:(hi+.05)/(lo+.05)};
};

/** Every defined pair for one kit's resolved `semantic` map ({dark, light}); throws on a malformed map.
 * `glass` is the kit's glass group; its saturation shapes the backdrops the glass roles are checked over. */
export function contrastChecks(kit, semantic, glass = {saturation: 1, dark: {contrast: 1, brightness: 1}, light: {contrast: 1, brightness: 1}}){
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
  // Pressed is a deeper step of hover, never back towards rest.
  for(const p of ['action-primary','action-secondary']){
   const ramp=stateRamp(t[p],t[`${p}-hover`],t[`${p}-active`]);
   checks.push({kit, mode, kind:'state', pair:`${p} rest → hover → active (pressed / rest)${ramp.oneWay?'':', not one way'}`, foreground:t[`${p}-active`], background:t[p], ratio:Number(ramp.pressed.toFixed(3)), threshold:PRESSED_STEP, pass:ramp.oneWay&&ramp.pressed>=PRESSED_STEP});
   checks.push({kit, mode, kind:'state', pair:`${p} rest → hover → active (pressed / hover)${ramp.oneWay?'':', not one way'}`, foreground:t[`${p}-active`], background:t[`${p}-hover`], ratio:Number(ramp.beyond.toFixed(3)), threshold:PRESSED_BEYOND_HOVER, pass:ramp.oneWay&&ramp.beyond>=PRESSED_BEYOND_HOVER});
  }
  // Glass. Text, muted text, quiet controls, focus and selection over any backdrop, and muted
  // text on the solid fallback (no backdrop-filter, reduced transparency), which paints `surface`.
  if('glass' in t){
   if(typeof t.glass!=='string'||!/^#[0-9A-F]{8}$/i.test(t.glass)) throw new Error(`${kit} ${mode} glass: expected a translucent #RRGGBBAA role`);
   const band='any backdrop';
   const composites=glassBackdrops.map(b=>[b,glassComposite(t.glass,b,glass,mode)]);
   const overAny=(fg,threshold,kind,ratioOf)=>{
    let worst=Infinity,at;
    for(const [b,c] of composites){const r=ratioOf(c,b);if(r<worst){worst=r;at=toHex(b);}}
    checks.push({kit, mode, kind, pair: `${fg} / glass over ${band}`, foreground: t[fg]??t['action-secondary-fg'], background: `${t.glass} over ${at}`, ratio: Number(worst.toFixed(3)), threshold, pass: worst >= threshold});
   };
   for(const fg of ['text','glass-muted','action-secondary-fg']) overAny(fg,4.5,'text',c=>contrast(t[fg],c));
   // Hover and pressed tint the glass (translucent glass-hover and glass-active over it): text
   // holds on the pressed tint, and the tints step one way from rest, pressed clearly apart.
   for(const role of ['glass-hover','glass-active']) if(typeof t[role]!=='string'||!/^#[0-9A-F]{8}$/i.test(t[role])) throw new Error(`${kit} ${mode} ${role}: expected a translucent #RRGGBBAA role`);
   overAny('action-secondary-fg on glass-active',4.5,'text',c=>contrast(t['action-secondary-fg'],over(t['glass-active'],c)));
   let worstPressed=Infinity,worstBeyond=Infinity,oneWay=true;
   for(const [,c] of composites){const r=stateRamp(c,over(t['glass-hover'],c),over(t['glass-active'],c));oneWay&&=r.oneWay;worstPressed=Math.min(worstPressed,r.pressed);worstBeyond=Math.min(worstBeyond,r.beyond);}
   checks.push({kit, mode, kind:'state', pair:`glass rest → glass-hover → glass-active over ${band} (pressed / rest)`, foreground:t['glass-active'], background:t.glass, ratio:Number(worstPressed.toFixed(3)), threshold:PRESSED_STEP, pass:oneWay&&worstPressed>=PRESSED_STEP});
   checks.push({kit, mode, kind:'state', pair:`glass rest → glass-hover → glass-active over ${band} (pressed / hover)`, foreground:t['glass-active'], background:t['glass-hover'], ratio:Number(worstBeyond.toFixed(3)), threshold:PRESSED_BEYOND_HOVER, pass:oneWay&&worstBeyond>=PRESSED_BEYOND_HOVER});
   overAny('focus',3,'focus',c=>contrast(t.focus,c));
   overAny('selected',3,'boundary',c=>contrast(t.selected,c));
   // The panel's edge (the sheen, or glass-border on the solid fallback) is decorative: controls
   // inside identify themselves by their text, icons, selection and focus, checked above.
   for(const role of ['glass-sheen','glass-sheen-low']) if(typeof t[role]!=='string'||!/^#[0-9A-F]{8}$/i.test(t[role])) throw new Error(`${kit} ${mode} ${role}: expected a translucent #RRGGBBAA role`);
   add('glass-muted','surface',4.5,'text');
  }
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

/** Not a requirement, a record: how much of the scene each glass tone keeps. */
export const glassScenes=(kit,semantic,glass)=>Object.entries(semantic).filter(([,t])=>'glass' in t).map(([mode,t])=>{
 const scene=glassScene(t.glass,glass,mode);
 return `${kit} ${mode}: filtered backdrop luminance ${scene.filtered.map(v=>v.toFixed(3)).join('–')}, composite ${scene.composite.map(v=>v.toFixed(3)).join('–')} (${scene.ratio.toFixed(2)}:1 between the brightest and darkest scene)`;
});

export function contrastReport(checks, kits){
 const failed=checks.filter(x=>!x.pass);
 const byKit=Object.fromEntries(kits.map(kit=>[kit,checks.filter(x=>x.kit===kit).length]));
 return {checks:checks.length,byKit,failed,minText:Math.min(...checks.filter(x=>x.kind==='text').map(x=>x.ratio)),minBoundary:Math.min(...checks.filter(x=>x.kind==='boundary').map(x=>x.ratio)),glass:checks.filter(x=>x.pair.includes('glass')).map(x=>`${x.kit} ${x.mode} ${x.pair}: ${x.ratio}:1 (min ${x.threshold}:1)`)};
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
 const resolved=kits.map(([kit,file])=>[kit,JSON.parse(fs.readFileSync(path.join(root,file),'utf8'))]);
 const checks=resolved.flatMap(([kit,tokens])=>contrastChecks(kit, tokens.semantic, tokens.glass));
 const report={...contrastReport(checks, kits.map(([kit])=>kit)),glassScene:resolved.flatMap(([kit,tokens])=>glassScenes(kit,tokens.semantic,tokens.glass))};
 console.log(JSON.stringify(report,null,2));
 process.exit(report.failed.length?1:0);
}
