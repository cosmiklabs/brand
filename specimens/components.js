/* Local specimen interactions only. No storage, forms, fetch, analytics, or external navigation. */
document.querySelectorAll('[data-demo]').forEach(button=>{
  button.addEventListener('click',()=>{
    const panel=button.closest('[data-theme]');
    panel.querySelector('[role="status"]').textContent=`${button.dataset.demo} preview activated. Nothing was sent or saved.`;
  });
});
document.querySelectorAll('[data-slug]').forEach(input=>{
  input.addEventListener('input',()=>{
    const id=input.dataset.slug;
    const valid=/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(input.value);
    input.setAttribute('aria-invalid',String(!valid));
    const error=document.getElementById(`${id}-slug-error`);
    error.hidden=valid;
    if(!valid) error.innerHTML='<span class="error-symbol" aria-hidden="true">[!]</span> Error: use letters, numbers, and single hyphens.';
    input.setAttribute('aria-describedby',`${id}-slug-help${valid?'':` ${id}-slug-error`}`);
  });
});
