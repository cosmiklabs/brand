(() => {
/** Framework-neutral presence example. Observable behavior is specified in guide/motion.md. */
function reducedMotion(element) {
  return parseFloat(getComputedStyle(element).getPropertyValue('--c-motion-duration')) === 0;
}

/** Retain the same DOM and payload through exit; never wait for a child loading animation. */
function createPresence(element, {show = () => { element.hidden = false; }, hide = () => { element.hidden = true; }} = {}) {
  let generation = 0;
  let state = 'closed';
  let completion = Promise.resolve();
  let stopWatching = () => {};
  element.dataset.phase = state;
  return {
    get state() { return state; },
    open() {
      if (state === 'open') return;
      stopWatching();
      generation++;
      if (state === 'closed') {
        show();
        // Establish the initial style before starting the transition. Reopening
        // during exit skips this reset: CSS reverses from its current position.
        getComputedStyle(element).opacity;
      }
      state = 'open';
      element.inert = false;
      element.removeAttribute('aria-hidden');
      element.dataset.phase = state;
    },
    close() {
      if (state !== 'open') return completion;
      const closing = ++generation;
      state = 'closing';
      element.dataset.phase = state;
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
      const finish = () => {
        if (generation !== closing || state !== 'closing') return;
        stopWatching();
        hide();
        state = 'closed';
        element.dataset.phase = state;
      };
      const animations = reducedMotion(element) ? [] : element.getAnimations({subtree:true}).filter(animation =>
        animation.effect?.target === element && Number.isFinite(animation.effect.getComputedTiming().endTime));
      if (!animations.length) {
        finish();
        return completion = Promise.resolve();
      }
      // Changing transition-duration alone does not finish a transition that
      // already started. Resolve an active exit when the user's policy changes.
      const preference = matchMedia('(prefers-reduced-motion: reduce)');
      const changed = () => { if (reducedMotion(element)) finish(); };
      const observer = new MutationObserver(changed);
      observer.observe(document.documentElement, {attributes:true, subtree:true, attributeFilter:['data-motion']});
      preference.addEventListener('change', changed);
      stopWatching = () => {
        observer.disconnect();
        preference.removeEventListener('change', changed);
        stopWatching = () => {};
      };
      return completion = Promise.allSettled(animations.map(animation => animation.finished)).then(finish);
    },
  };
}

window.CosmikMotion = Object.freeze({createPresence, reducedMotion});
})();
