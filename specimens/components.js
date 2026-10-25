const {createPresence, reducedMotion} = window.CosmikMotion;

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

// Toggle chips keep their selected state in aria-pressed; the controls layer draws it.
document.querySelectorAll('.c-chip[aria-pressed]').forEach(chip => {
  chip.addEventListener('click', () => chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')));
});

// Toolbars use one tab stop and arrow keys; toggles keep their state in aria-pressed.
document.querySelectorAll('.c-toolbar[role="toolbar"]').forEach(bar => {
  const items = [...bar.querySelectorAll('button')];
  bar.addEventListener('keydown', event => {
    const step = {ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1}[event.key];
    const at = items.indexOf(document.activeElement);
    if (!step || at < 0) return;
    event.preventDefault();
    const next = items[(at + step + items.length) % items.length];
    items.forEach(item => { item.tabIndex = item === next ? 0 : -1; });
    next.focus();
  });
  items.filter(item => item.hasAttribute('aria-pressed')).forEach(item => item.addEventListener('click', () => item.setAttribute('aria-pressed', String(item.getAttribute('aria-pressed') !== 'true'))));
});
// Segmented radio groups: click or arrow keys move the one checked option and the tab stop.
document.querySelectorAll('.c-segmented[role="radiogroup"]').forEach(group => {
  const options = [...group.querySelectorAll('.c-segmented__option')];
  const choose = option => options.forEach(o => { o.setAttribute('aria-checked', String(o === option)); o.tabIndex = o === option ? 0 : -1; });
  options.forEach(option => option.addEventListener('click', () => choose(option)));
  group.addEventListener('keydown', event => {
    const step = {ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1}[event.key];
    const at = options.indexOf(document.activeElement);
    if (!step || at < 0) return;
    event.preventDefault();
    const next = options[(at + step + options.length) % options.length];
    choose(next); next.focus();
  });
});

document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = tab => {
    const trigger = list.closest('.interaction-panel').querySelector('[aria-haspopup="menu"]');
    if (trigger?.getAttribute('aria-expanded') === 'true') trigger.click();
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
  duplicate: ['Duplicate this item?', 'A second item would be created with a new name. The source item would stay unchanged.', 'Duplicate'],
  copy: ['Copy these contents?', 'The selected contents would be copied. The source item would stay unchanged.', 'Copy contents'],
  delete: ['Delete this item?', 'This would permanently remove the selected item and its contents. This action cannot be undone.', 'Delete item'],
};
// Dialogs stay in the top layer through exit. Closing controls become inert,
// and a later open invalidates the earlier close rather than losing its payload.
document.querySelectorAll('.interaction-panel').forEach(panel => {
  const dialog = panel.querySelector('dialog');
  const accept = dialog.querySelector('[data-accept]');
  const trigger = panel.querySelector('[aria-haspopup="menu"]');
  const menu = panel.querySelector('[role="menu"]');
  const items = [...menu.querySelectorAll('[role="menuitem"]')];
  const menuPresence = createPresence(menu, {show: () => { menu.hidden = false; placeMenu(); }});
  const dialogPresence = createPresence(dialog, {
    show: () => { if (!dialog.open) dialog.showModal(); },
    hide: () => dialog.close(),
  });
  let action;
  let opener;
  let closingId = 0;
  const placeMenu = () => {
    if (menu.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const padding = 16;
    const below = rect.bottom + 6;
    const above = below + menu.offsetHeight > innerHeight - padding && rect.top > menu.offsetHeight + padding;
    menu.style.left = `${Math.max(padding, Math.min(rect.left, innerWidth - menu.offsetWidth - padding))}px`;
    menu.style.top = `${Math.max(padding, Math.min(above ? rect.top - menu.offsetHeight - 6 : below, innerHeight - menu.offsetHeight - padding))}px`;
    menu.style.transformOrigin = above ? 'bottom left' : 'top left';
    menu.style.setProperty('--surface-start', `translateY(${above ? '' : '-'}.25rem) scale(.98)`);
  };
  const closeMenu = (restore = false) => {
    trigger.setAttribute('aria-expanded', 'false');
    if (restore || menu.contains(document.activeElement)) trigger.focus({preventScroll:true});
    return menuPresence.close();
  };
  const openMenu = (last = false) => {
    trigger.setAttribute('aria-expanded', 'true');
    menuPresence.open();
    (last ? items.at(-1) : items[0]).focus({preventScroll:true});
  };
  trigger.addEventListener('click', () => menuPresence.state === 'open' ? closeMenu(true) : openMenu());
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown','ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    openMenu(event.key === 'ArrowUp');
  });
  let search = '';
  let searchAt = 0;
  menu.addEventListener('keydown', event => {
    let next = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') next = (next + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (next + items.length - 1) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(true); return; }
    else if (event.key === 'Tab') { closeMenu(true); return; }
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' ') {
      const now = performance.now();
      search = now - searchAt > 700 ? event.key.toLowerCase() : search + event.key.toLowerCase();
      searchAt = now;
      const repeated = [...search].every(char => char === search[0]);
      const term = repeated ? search[0] : search;
      const start = repeated ? next + 1 : next;
      const match = items.map((_, index) => items[(start + index + items.length) % items.length])
        .find(item => item.textContent.trim().toLowerCase().startsWith(term));
      if (!match) return;
      next = items.indexOf(match);
    } else return;
    event.preventDefault();
    items[next].focus();
  });
  document.addEventListener('pointerdown', event => {
    if (menuPresence.state === 'open' && !menu.contains(event.target) && !trigger.contains(event.target)) closeMenu();
  });
  // Closing an enclosing tab must also dismiss its detached floating menu.
  panel.querySelectorAll('[role="tab"]').forEach(tab => tab.addEventListener('click', () => closeMenu()));
  addEventListener('resize', placeMenu);
  document.addEventListener('scroll', placeMenu, true);
  items.forEach(button => {
    button.addEventListener('click', () => {
      closingId++;
      action = button.dataset.confirm;
      opener = trigger;
      const [title, description, label] = confirmations[action];
      dialog.querySelector('h3').textContent = title;
      dialog.querySelector('p').textContent = `${description} This is a preview; no files will change.`;
      accept.textContent = label;
      accept.className = action === 'delete' ? 'c-button button-danger' : 'c-button c-button--primary';
      closeMenu();
      dialogPresence.open();
      // On short screens, focusing a button below the fold would skip the
      // question and consequence. Start at the heading, then Tab to the actions.
      const initial = dialog.scrollHeight > dialog.clientHeight ? dialog.querySelector('h3') : dialog.querySelector('[data-cancel]');
      initial.focus();
    });
  });
  const closeDialog = async confirmed => {
    if (dialogPresence.state !== 'open') return;
    const request = ++closingId;
    const accepted = action;
    await dialogPresence.close();
    if (request !== closingId) return;
    if (confirmed) panel.closest('.theme-section').querySelector('.demo-result').textContent =
      `${confirmations[accepted][2]} preview confirmed. No files were changed.`;
    const destination = opener?.isConnected && opener.getClientRects().length ? opener : panel.querySelector('[role="tab"][aria-selected="true"]');
    destination?.focus({preventScroll:true});
  };
  dialog.querySelector('[data-cancel]').addEventListener('click', () => closeDialog(false));
  accept.addEventListener('click', () => closeDialog(true));
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(false); });
});

const motionPicker = document.querySelector('#motion-picker');
const updateMotion = () => {
  document.documentElement.dataset.motion = motionPicker.value;
  document.querySelectorAll('.loading-mark').forEach(mark => {
    mark.classList.toggle('motion-paused', reducedMotion(mark));
  });
};
motionPicker.addEventListener('change', updateMotion);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateMotion);
updateMotion();

// Intrinsic grid height animates a disclosure while keeping its actual content
// available through exit; links become inert as soon as collapse starts.
const disclosure = document.querySelector('#disclosure-body');
const disclosureTrigger = document.querySelector('#disclosure-trigger');
const disclosurePresence = createPresence(disclosure);
disclosureTrigger.addEventListener('click', () => {
  const open = disclosurePresence.state !== 'open';
  disclosureTrigger.setAttribute('aria-expanded', String(open));
  if (open) disclosurePresence.open();
  else {
    if (disclosure.contains(document.activeElement)) disclosureTrigger.focus({preventScroll:true});
    disclosurePresence.close();
  }
});

const tip = document.querySelector('#sample-tooltip');
const tipTrigger = document.querySelector('#tip-trigger');
const tipPresence = createPresence(tip);
let tipTimer;
const hideTip = () => { clearTimeout(tipTimer); tipPresence.close(); };
const showTip = () => {
  clearTimeout(tipTimer);
  tipPresence.open();
  const rect = tipTrigger.getBoundingClientRect();
  tip.style.left = `${Math.max(16, Math.min(rect.left, innerWidth - tip.offsetWidth - 16))}px`;
  const below = rect.bottom + 6;
  tip.style.top = `${Math.max(16, below + tip.offsetHeight <= innerHeight - 16 ? below : rect.top - tip.offsetHeight - 6)}px`;
};
tipTrigger.addEventListener('pointerenter', event => {
  if (event.pointerType !== 'touch') tipTimer = setTimeout(showTip, 400);
});
tipTrigger.addEventListener('pointerleave', () => {
  clearTimeout(tipTimer);
  if (document.activeElement !== tipTrigger) tipTimer = setTimeout(hideTip, 120);
});
tip.addEventListener('pointerenter', () => clearTimeout(tipTimer));
tip.addEventListener('pointerleave', () => { if (document.activeElement !== tipTrigger) hideTip(); });
tipTrigger.addEventListener('focus', showTip);
tipTrigger.addEventListener('blur', hideTip);
document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTip(); });
addEventListener('resize', hideTip);
document.addEventListener('scroll', hideTip, true);

const completion = document.querySelector('#completion-result');
document.querySelector('#completion-trigger').addEventListener('click', () => {
  completion.textContent = 'Example ready. No operation was performed.';
  completion.classList.remove('completion-cue');
  if (!reducedMotion(completion)) {
    getComputedStyle(completion).backgroundColor;
    completion.classList.add('completion-cue');
  }
});
completion.addEventListener('animationend', () => completion.classList.remove('completion-cue'));
