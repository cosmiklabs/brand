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

const kitPicker = document.getElementById('kit-picker');
kitPicker.addEventListener('change', () => {
  const family = kitPicker.value === 'hplx';
  document.querySelectorAll('.theme-section').forEach(section => {
    if (family) section.dataset.family = 'hplx';
    else delete section.dataset.family;
    section.querySelector('.theme-heading .eyebrow').textContent = family
      ? 'HPLX / Proposed family' : 'Cosmik / Approved baseline';
  });
  document.getElementById('kit-status').textContent = family
    ? 'Showing the proposed HPLX family.' : 'Showing the approved Cosmik baseline.';
});

document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    tab.focus();
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      let index = tabs.indexOf(tab);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault();
      select(tabs[index]);
    });
  });
});

const confirmations = {
  duplicate: ['Duplicate this project?', 'A new project would be named “My story (copy)”. The original would stay unchanged.', 'Duplicate'],
  copy: ['Create an editable copy?', 'A copy would be stored in your HPLX project directory. The acquired story would stay unchanged.', 'Create copy'],
  delete: ['Delete this project?', 'This would permanently delete the editable project and its contents. Make a backup first.', 'Delete project'],
};
document.querySelectorAll('.interaction-panel').forEach(panel => {
  const dialog = panel.querySelector('dialog');
  const accept = dialog.querySelector('[data-accept]');
  let action, opener;
  panel.querySelectorAll('[data-confirm]').forEach(button => {
    button.addEventListener('click', () => {
      action = button.dataset.confirm;
      opener = button;
      const [title, description, label] = confirmations[action];
      dialog.querySelector('h3').textContent = title;
      dialog.querySelector('p').textContent = `${description} This is a preview; no files will change.`;
      accept.textContent = label;
      accept.className = action === 'delete' ? 'button-danger' : 'button-primary';
      dialog.returnValue = '';
      dialog.showModal();
      dialog.querySelector('[data-cancel]').focus();
    });
  });
  dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close('cancel'));
  accept.addEventListener('click', () => dialog.close('confirm'));
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'confirm') {
      panel.closest('.theme-section').querySelector('.demo-result').textContent =
        `${confirmations[action][2]} preview confirmed. No files were changed.`;
    }
    opener?.focus();
  });
  panel.querySelector('.story-actions').addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dialog.open) {
      event.currentTarget.open = false;
      event.currentTarget.querySelector('summary').focus();
    }
  });
});
