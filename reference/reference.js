/* Progressive enhancement. Content, links, downloads and navigation work offline
 * and without JavaScript. Only the selected theme is stored locally; no analytics or network writes. */
(() => {
  const doc=document.documentElement;
  const theme=document.querySelector('#theme');
  const image=document.querySelector('[data-identity-image]');
  const picture=image?.parentElement;
  const dark=matchMedia('(prefers-color-scheme: dark)');
  function identity(){
    if(!image)return;
    const isDark=theme.value==='dark'||(theme.value==='system'&&dark.matches);
    // A picture's source otherwise keeps following the OS after an explicit choice.
    picture.querySelector('source')?.remove();
    image.src=isDark?image.dataset.darkSrc:image.dataset.lightSrc;
  }
  if(theme){
    try{const saved=localStorage.getItem('cosmik-reference-theme');if(['system','light','dark'].includes(saved))theme.value=saved;}catch{}
    if(theme.value!=='system')doc.dataset.theme=theme.value;
    theme.closest('label').hidden=false;
    theme.addEventListener('change',()=>{if(theme.value==='system')doc.removeAttribute('data-theme');else doc.dataset.theme=theme.value;try{localStorage.setItem('cosmik-reference-theme',theme.value);}catch{}identity();});
    dark.addEventListener('change',identity);identity();
  }
  const navigation=document.querySelector('.navigation'),compact=matchMedia('(max-width:720px)');
  if(navigation){const fit=()=>{navigation.open=!compact.matches;};compact.addEventListener('change',fit);fit();}
  const search=document.querySelector('#guide-search'),results=document.querySelector('#search-results'),status=document.querySelector('#search-status');
  if(search&&results&&status&&Array.isArray(window.CosmikReferenceIndex)){
    search.closest('.search').hidden=false;
    search.addEventListener('input',()=>{
      const query=search.value.trim().toLowerCase();results.replaceChildren();results.hidden=!query;
      if(!query){status.textContent='';return;}
      const terms=query.split(/\s+/),matches=[];
      for(const page of window.CosmikReferenceIndex){
        if(!terms.every(term=>(page.title+' '+page.text).toLowerCase().includes(term)))continue;
        const section=page.sections.find(s=>terms.every(term=>s.title.toLowerCase().includes(term)));
        matches.push({page,section});
      }
      matches.sort((a,b)=>Number(b.page.title.toLowerCase().includes(query))-Number(a.page.title.toLowerCase().includes(query)));
      for(const {page,section} of matches){
        const li=document.createElement('li'),a=document.createElement('a');a.href=page.url+(section?'#'+section.id:'');a.textContent=page.title;
        if(section){const subtitle=document.createElement('span');subtitle.textContent=section.title;a.append(subtitle);}li.append(a);results.append(li);
      }
      status.textContent=matches.length?`${matches.length} matching ${matches.length===1?'page':'pages'}`:'No matching pages. Try another term.';
    });
    search.addEventListener('keydown',event=>{if(event.key==='Escape'){search.value='';search.dispatchEvent(new Event('input'));}});
  }
  const tokenSearch=document.querySelector('#token-search'),group=document.querySelector('#token-group');
  if(tokenSearch&&group){
    document.querySelector('.token-tools').hidden=false;
    const rows=[...document.querySelectorAll('#token-table tbody tr')],count=document.querySelector('#token-status'),empty=document.querySelector('#token-empty');
    const filter=()=>{const terms=tokenSearch.value.toLowerCase().trim().split(/\s+/);let visible=0;for(const row of rows){row.hidden=!(group.value==='all'||group.value===row.dataset.tokenGroup)||!terms.every(term=>row.textContent.toLowerCase().includes(term));if(!row.hidden)visible++;}count.textContent=`${visible} of ${rows.length} tokens`;empty.hidden=visible!==0;};
    tokenSearch.addEventListener('input',filter);group.addEventListener('change',filter);
  }
})();
