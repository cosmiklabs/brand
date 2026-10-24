# Motion and interaction

Motion explains a change: where a surface came from, what belongs together, or
whether an action completed. It must never delay an action or become the only way
to understand its result. A quiet, consistent response is more valuable than a
different effect on every component.

This is the behavior contract for all families. Use the selected kit's tokens;
keep the language consistent across an interface's different surfaces.
The [interactive specimen](../specimens/components.html#motion) demonstrates the
contract. Its [presence helper](../specimens/motion.js) is a small reference, not
a framework dependency or a replacement for an accessible component library.
The rules describe visible behavior, independent of a product or implementation
framework. CSS, DOM and ARIA examples below are a browser adaptation. Native
interfaces should provide equivalent lifecycle, focus and accessibility behavior
through their platform's facilities.

## Timing and shape

The baseline token source owns the normal duration, easing and reduced duration.
Use `--c-motion-duration` and `--c-motion-easing` for ordinary interactions. The
duration is already resolved for the user's preference. The normal-duration token
is for resolving policy, not for bypassing it inside components.

- **Feedback:** a short color, border or opacity transition. Keyboard focus and
  direct manipulation respond immediately; never animate a focus ring traveling
  between controls or ease a pointer's drag position behind the pointer.
- **Entrances:** use the base duration, easing out into the final state. Small
  surfaces move only a few pixels from their anchor; a subtle scale may reinforce
  their origin. Do not fly menus across the screen or bounce them into place.
- **Exits:** use the same language in reverse, with a shorter duration (the
  specimen uses seven tenths of the base duration) and easing in. Accept the
  next action immediately; do not hold interaction until the animation finishes.
- **Completion:** one quiet cue, then a stable state. A slightly longer finite
  cue can help a newly ready result be noticed. Avoid repeated attention pulses.
- **Waiting:** motion may indicate activity, but persistent text must explain
  what is happening. Do not invent percentage progress when it is unknown.

Keep travel small enough that the control's final position remains predictable.
Animate opacity and transforms for floating surfaces. Animate disclosure height
only where revealing content really changes the layout. Never use `transition:
all`: specify the properties that communicate the change.

## Component behavior

| Surface | Entrance and exit | Interaction requirements |
| --- | --- | --- |
| Menu or popover | Fade with a small movement from the actual anchor; reverse on close | Collision placement determines the transform origin. Preserve trigger focus on keyboard dismissal. Menu actions use menu keyboard semantics; arbitrary forms use popover/dialog semantics instead. |
| Dialog or sheet | Restrained movement and fade with a coordinated scrim | Keep the surface and scrim present through exit. Trap focus while modal, choose safe initial focus, then restore focus to a visible logical trigger. Never refocus a menu item whose menu has closed. |
| Tooltip | Small fade near the target | Show promptly on keyboard focus; use a short hover discovery delay. Allow pointer movement onto the tooltip and Escape dismissal. Essential instructions must also exist without hover. Touch must not depend on a tooltip. |
| Disclosure | Reveal intrinsic content height with a light fade | `aria-expanded` reflects the requested state immediately. Collapsing content becomes inert immediately; move focus out first if it contains focus. Preserve focus outlines in the expanded content. |
| Tabs and selection | Immediate state change; a short color transition is enough | Keep stable control dimensions. Do not make users wait for old content to leave before the new task becomes usable. Avoid sliding the entire page. |
| Loading and completion | Modest activity cue; one completion emphasis | Announce meaningful status with text. Reduced motion uses a static loading state and the same completion information. |

Hover discovery delays and asynchronous work are not animation durations. Removing
motion must not introduce a delay into an otherwise immediate interaction. On
touch and short viewports, placement, reachable targets and usable scroll regions
matter more than effects. See [Interface](interface.md).

## Presence is a lifecycle

An exit transition needs a live surface to animate. Separate “the user requested
closed” from “the DOM can be removed.” An implementation should support:

1. **Closed:** no focusable or pointer-active hidden content.
2. **Opening/open:** mount the complete payload, establish its initial style,
   then animate to the resting state. Interaction is available immediately.
3. **Closing:** retain the same content and geometry while animating out. Stop
   accepting interaction with that surface and update expanded state immediately.
4. **Closed:** remove or hide it after its own finite exit has settled.

A reopen during exit cancels that close and reverses from the current visual
position. A stale callback must not remove a newly opened surface, restore focus
over it, or erase its content. Keep confirmation text, images and selected records
until exit completes; clearing them first produces empty collapsing shells.

Do not wait for every descendant animation: an infinite spinner must not keep a
dialog alive. Handle completion, cancellation, an absent animation and a duration
of zero. Do not rely exclusively on `animationend` or a hard-coded timeout.
If a CSS transition is used, wait on the surface's finite transitions rather than
guessing how long they took. Restore menu focus immediately on keyboard dismissal;
modal focus returns when the modal releases its background. Any delayed focus
restoration belongs to that close operation and must be cancelled on reopen.

## System and application preferences

The default follows `prefers-reduced-motion`. Applications may offer a device
preference with three values; use the following shared contract:

```html
<html data-motion="system"> <!-- follow the operating system -->
<html data-motion="reduce"> <!-- explicitly remove UI motion -->
<html data-motion="full">   <!-- explicitly request normal UI motion -->
```

These are alternatives, not nested document roots. A nearer scope may override a
parent. A nested `system` returns to the OS preference; a nested `full` under
`reduce` deliberately restores normal motion. Explicit full motion should only
follow a user's choice, never a component author's wish to ignore accessibility.

| CSS token | Meaning |
| --- | --- |
| `--c-motion-duration` | Effective duration for this scope; use this in components |
| `--c-motion-normal-duration` | Normal value from the source |
| `--c-motion-system-duration` | Normal or reduced value resolved from the OS |
| `--c-motion-reduced-duration` | Reduced value from the source |

Portalled overlays must receive the same family, theme and motion scope as their
trigger. Avoid a global `!important` reduced-motion override that defeats an
explicit preference. JSON, DTCG and Rust exports contain source values: native
consumers resolve the operating system and application policy themselves.

For reduced motion, remove decorative travel, scale, pulsing and looping activity
animation. Render the final state immediately and retain all text, focus behavior
and task affordances. When preferences change while something is closing, finish
cleanly; do not leave a transparent modal blocking the page. Avoid smooth camera
travel and page scrolling when motion is reduced. An animation is never required
to complete a user action.

## Verification

Inspect both entrance and exit in the target runtime. A screenshot of the resting
state cannot verify motion. Exercise rapid toggle, Escape, outside click, a
selection that opens another surface, a disappearing trigger, live preference
changes and a nested scope. Check the actual moving surface, not only a button's
transition token.

The [quality checklist](quality.md) covers keyboard, touch, reflow, theme and
rendered review. The [validation record](../specimens/validation.md) distinguishes
automated checks, visual inspection and remaining manual checks. Product journeys
must additionally cover their own data, routing, async work and framework portal
lifecycle; passing this reference does not certify an application.
