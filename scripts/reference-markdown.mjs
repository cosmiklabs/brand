/** The repository's Markdown subset, rendered offline with no runtime dependencies.
 * Raw HTML is text, except <br>; fenced HTML examples can never become live UI.
 * This is deliberately a documentation renderer, not a general Markdown engine. */
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const plain = value => value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '');
export const slug = value => plain(value).toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, '').replace(/\s/g, '-');

export function inline(source, resolve = href => href) {
  const saved = [];
  const save = html => `\u0000${saved.push(html)-1}\u0000`;
  let text = source.replace(/`([^`]+)`/g, (_, code) => save(`<code>${escape(code)}</code>`));
  text = text.replace(/(!?)\[([^\]]+)\]\(([^)]+)\)/g, (_, image, label, href) => {
    if (/^[a-z][\w+.-]*:/i.test(href) && !/^(?:https?:|mailto:)/i.test(href)) throw Error(`Unsupported link scheme: ${href}`);
    const url = escape(resolve(href));
    return save(image ? `<img src="${url}" alt="${escape(label)}" loading="lazy">` : `<a href="${url}">${inline(label, resolve)}</a>`);
  });
  text = text.replace(/<br\s*\/?>/g, () => save('<br>'));
  text = escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  for(let pass=0;pass<=saved.length;pass++) {
    const restored=text.replace(/\u0000(\d+)\u0000/g, (match,n)=>saved[Number(n)] ?? match);
    if(restored===text)break;text=restored;
  }
  return text;
}

function cells(line) {
  const result = []; let cell = '', code = false;
  for (const char of line.trim().replace(/^\|/, '').replace(/\|$/, '')) {
    if (char === '`') code = !code;
    if (char === '|' && !code) { result.push(cell.trim()); cell = ''; } else cell += char;
  }
  result.push(cell.trim()); return result;
}
const marker = line => line.match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
export function renderMarkdown(markdown, resolve = href => href) {
  const headings = [], seen = new Map();
  const render = lines => {
    const out=[]; let i=0;
    const block = n => /^\s*$|^#{1,6} |^```|^> ?|^\s*[-+*] |^\s*\d+\. |^---+$/.test(lines[n] ?? '') || (lines[n]?.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[n+1] ?? ''));
    while (i < lines.length) {
      const line=lines[i];
      if (!line.trim()) { i++; continue; }
      if (line.startsWith('```')) {
        const language=line.slice(3).trim(); const code=[]; i++;
        while (i<lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
        if (i===lines.length) throw Error('Unclosed code fence');
        out.push(`<figure class="code-example"><figcaption>${escape(language || 'Example')}</figcaption><pre tabindex="0"><code>${escape(code.join('\n'))}</code></pre></figure>`); i++; continue;
      }
      const heading=line.match(/^(#{1,6}) (.+)$/);
      if (heading) {
        const level=heading[1].length, title=plain(heading[2]), base=slug(heading[2]), count=seen.get(base) ?? 0;
        seen.set(base,count+1); const id=count ? `${base}-${count}` : base;
        headings.push({level,title,id});out.push(`<h${level} id="${escape(id)}">${inline(heading[2],resolve)}<a class="heading-anchor" href="#${escape(id)}" aria-label="Link to ${escape(title)}">#</a></h${level}>`);i++;continue;
      }
      if (/^---+$/.test(line)) {out.push('<hr>');i++;continue;}
      if (line.startsWith('>')) {
        const quote=[];while(i<lines.length && lines[i].startsWith('>'))quote.push(lines[i++].replace(/^> ?/,''));
        out.push(`<blockquote>${render(quote)}</blockquote>`);continue;
      }
      if (line.includes('|') && cells(lines[i+1] ?? '').every(c=>/^:?-{3,}:?$/.test(c)) && (lines[i+1] ?? '').includes('-')) {
        const head=cells(line), alignment=cells(lines[i+1]).map(c=>c.endsWith(':') ? (c.startsWith(':')?'center':'right'):'left'); i+=2;
        const rows=[];while(i<lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
        const row=(values,tag)=>`<tr>${head.map((_,n)=>`<${tag}${tag==='th'?' scope="col"':''} class="align-${alignment[n]}">${inline(values[n] ?? '',resolve)}</${tag}>`).join('')}</tr>`;
        out.push(`<div class="table-scroll" tabindex="0" role="region" aria-label="${escape(head.map(plain).join(', '))} table"><table><thead>${row(head,'th')}</thead><tbody>${rows.map(r=>row(r,'td')).join('')}</tbody></table></div>`);continue;
      }
      const first=marker(line);
      if (first) {
        const indent=first[1].length, ordered=/\d/.test(first[2]), tag=ordered?'ol':'ul', items=[];
        while (i<lines.length) {
          const m=marker(lines[i]);if(!m || m[1].length!==indent || /\d/.test(m[2])!==ordered)break;
          const content=[m[3]], contentIndent=m[0].length-m[3].length;i++;
          while(i<lines.length) {
            const next=marker(lines[i]);
            if(next && next[1].length<=indent)break;
            if(!lines[i].trim()) {
              if(i+1>=lines.length || (lines[i+1].trim() && (lines[i+1].match(/^\s*/)[0].length<=indent)))break;
              content.push('');i++;continue;
            }
            if(lines[i].match(/^\s*/)[0].length<=indent && block(i))break;
            content.push(lines[i].slice(Math.min(contentIndent,lines[i].match(/^\s*/)[0].length)));i++;
          }
          items.push(`<li>${render(content)}</li>`);
          if(!lines[i]?.trim() && marker(lines[i+1] ?? '')?.[1].length===indent)i++;
        }
        const start=ordered && first[2]!=='1.'?` start="${parseInt(first[2])}"`:'';
        out.push(`<${tag}${start}>${items.join('')}</${tag}>`);continue;
      }
      const para=[line];i++;
      while(i<lines.length && !block(i))para.push(lines[i++]);
      out.push(`<p>${inline(para.join(' '),resolve)}</p>`);
    }
    return out.join('\n');
  };
  return {html:render(markdown.replace(/\r\n/g,'\n').split('\n')),headings};
}
