/** Rebuild the selected Ember mark from its vector geometry. Node.js only.
 * The same source commands produce the SVG masters and antialiased PNG exports.
 * No concept-board pixels, wordmark, generated replacement, or external fonts are used.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/hplx');
const source = JSON.parse(fs.readFileSync(path.join(dir, 'ember.source.json'), 'utf8'));
const write = (name, content) => fs.writeFileSync(path.join(dir, name), content);
const commands = source.shapes.map(shape => shape.commands);
const pathData = commands.map(shape => shape.map(c => c.join(' ')).join(' '));
const samePoint = (a, b) => a[0] === b[0] && a[1] === b[1];
const midpoint = (a, b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];

// Flatten cubic curves to < 0.01 source-pixel control-point distance from a chord.
// SVG files keep their true curves; flattening is used only for raster coverage.
function flattenCubic(a, b, c, d, out, depth = 0) {
  const dx=d[0]-a[0], dy=d[1]-a[1], length=Math.hypot(dx, dy);
  const distance = p => length ? Math.abs(dy*(p[0]-a[0])-dx*(p[1]-a[1]))/length : Math.hypot(p[0]-a[0],p[1]-a[1]);
  if (depth >= 16 || Math.max(distance(b), distance(c)) <= 0.01) { out.push(d); return; }
  const ab=midpoint(a,b), bc=midpoint(b,c), cd=midpoint(c,d), abc=midpoint(ab,bc), bcd=midpoint(bc,cd), m=midpoint(abc,bcd);
  flattenCubic(a,ab,abc,m,out,depth+1); flattenCubic(m,bcd,cd,d,out,depth+1);
}
const polygons = commands.map(shape => {
  const points=[]; let current;
  for (const [op,...v] of shape) {
    if (op==='M' || op==='L') { current=v; points.push(v); }
    else if (op==='C') { const end=v.slice(4,6); flattenCubic(current,v.slice(0,2),v.slice(2,4),end,points); current=end; }
    else if (op!=='Z') throw Error(`Unsupported Ember command ${op}`);
  }
  if (!samePoint(points[0],points.at(-1))) points.push(points[0]);
  return points;
});

const crcTable = new Uint32Array(256).map((_,n) => { let c=n; for(let k=0;k<8;k++) c=c&1?0xedb88320^(c>>>1):c>>>1; return c; });
const crc32 = bytes => { let c=0xffffffff; for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0; };
const chunk = (type,data) => { const h=Buffer.alloc(8),t=Buffer.from(type),crc=Buffer.alloc(4);h.writeUInt32BE(data.length);t.copy(h,4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([h,data,crc]); };
function png(width,height,pixels) {
  const rows=Buffer.alloc(height*(width*4+1));
  for(let y=0;y<height;y++)pixels.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
const rgb = hex => hex.slice(1).match(/../g).map(x=>parseInt(x,16));
function raster(viewBox,width,height,fill,background) {
  const [vx,vy,vw,vh]=viewBox, samples=16, coverage=new Float64Array(width*height);
  const shapes=polygons.map(points=>points.map(([x,y])=>[(x-vx)*width/vw,(y-vy)*height/vh]));
  // Exact horizontal pixel-area coverage at sixteen vertical subpixel positions.
  for(let sy=0;sy<height*samples;sy++) {
    const y=(sy+0.5)/samples,row=Math.floor(sy/samples);
    for(const points of shapes) {
      const xs=[];
      for(let i=1;i<points.length;i++) {
        const a=points[i-1],b=points[i];
        if((a[1]<=y && b[1]>y)||(b[1]<=y && a[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      xs.sort((a,b)=>a-b);
      for(let i=0;i<xs.length;i+=2) {
        const lo=Math.max(0,xs[i]),hi=Math.min(width,xs[i+1]);
        for(let x=Math.floor(lo);x<Math.ceil(hi);x++)coverage[row*width+x]+=Math.max(0,Math.min(x+1,hi)-Math.max(x,lo))/samples;
      }
    }
  }
  const pixels=Buffer.alloc(width*height*4),fg=rgb(fill),bg=background?rgb(background):null;
  for(let i=0;i<coverage.length;i++) {
    const a=Math.min(1,coverage[i]),p=i*4;
    for(let c=0;c<3;c++)pixels[p+c]=bg?Math.round(fg[c]*a+bg[c]*(1-a)):(a?fg[c]:0);
    pixels[p+3]=bg?255:Math.round(a*255);
  }
  return png(width,height,pixels);
}
function svg(viewBox,fill,background) {
  const [x,y,w,h]=viewBox;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(' ')}" role="img" aria-labelledby="title"><title id="title">HPLX Ember</title>${background?`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${background}"/>`:''}<g fill="${fill}">${pathData.map(d=>`<path d="${d}"/>`).join('')}</g></svg>\n`;
}
fs.mkdirSync(path.join(dir,'png'),{recursive:true});
for(const [variant,fill] of Object.entries(source.colours)) {
  if(variant==='background')continue;
  write(`hplx-ember-${variant}.svg`,svg(source.viewBox,fill));
  const width=1024,height=Math.round(width*source.viewBox[3]/source.viewBox[2]);
  write(`png/hplx-ember-${variant}-${width}x${height}.png`,raster(source.viewBox,width,height,fill));
}
write('hplx-ember-primary.svg',svg(source.iconViewBox,source.colours.amber,source.colours.background));
for(const size of [16,24,32,48,64,96,128,256,512,1024]) {
  write(`png/hplx-ember-primary-${size}.png`,raster(source.iconViewBox,size,size,source.colours.amber,source.colours.background));
}
console.log('Generated HPLX Ember SVGs and PNGs from the selected original geometry.');
