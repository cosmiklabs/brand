# Interface

Build a quiet frame around useful work. A polished interface makes the next action
clear, keeps the user's place and responds consistently. Decoration and animation
cannot compensate for unclear hierarchy or a broken interaction.

The [component reference](../specimens/components.html) demonstrates the baseline
in both themes; product families apply the same rules from their own repositories.
These are reusable visual and behavioral principles, not a website layout,
product workflow or production UI framework.
The browser reference is one implementation; native and other interfaces should
adapt the same observable behavior using their platform conventions. Use
[semantic tokens](../kits/README.md) for values and [motion guidance](motion.md)
for transitions and their lifecycle.

## Composition and density

- Give each surface one clear purpose. Use a title, the content or controls it
  describes and a small action area. A popover heading is a utility label; it
  does not need the visual weight of a page heading.
- Group related controls with spacing first. Use a separator between different
  tasks, not between every row. Align labels, fields and supporting text to a
  shared edge. Do not put a card inside another card merely to create hierarchy.
- Reserve primary emphasis for the main next action in a local task. Other actions
  remain easy to find without competing with it. Selected and hovered are distinct
  states; hovering a different option must not erase the current selection.
- Give reading content the `body` role and a bounded reading measure. Use `ui` for
  application navigation, menus, toolbars and lists; `ui-small` for brief secondary
  metadata, never as a way to squeeze essential explanations into a crowded panel.
- Forms and reading pages use the standard `control-min` target. Dense application
  controls may use `control-dense` for a mouse or trackpad. Keep touch targets at
  the standard minimum and leave space between independent actions.
- Use the radius tokens and semantic surface roles. Family elevation tokens may
  distinguish an overlay from its surroundings; shadows are not decoration and
  must not be the only boundary on a busy canvas. Controls floating over such a
  canvas may use [glass](#shared-controls); everything else stays solid.

## Controls and feedback

| State | Required treatment |
| --- | --- |
| Default | A specific action label; no unexplained icon or ambiguous “OK” |
| Hover / pressed | Immediate feedback without shifting nearby controls; retain text contrast |
| Focus | Visible `focus` outline and offset, including inside scrolling panels and overlays |
| Selected | A persistent indicator plus the appropriate selected semantics |
| Disabled | Prevent activation and use disabled roles; explain the prerequisite when it is not apparent |
| Pending | Preserve width and context, name the operation and expose its busy state |
| Complete | Confirm the result where the user is looking; avoid repeated or celebratory effects for routine actions |
| Failed | Say what failed and offer a useful next step; preserve recoverable input and context |

A button performs an action; a link navigates. Underline inline links. Give an
icon-only control an accessible name and a tooltip available on keyboard focus as
well as hover. Tooltips add clarification; they never hold the only explanation
of a critical action or contain interactive controls.

Keep visible labels stable when selection changes would otherwise resize a
navigation toolbar. The current value can appear in the opened menu; the trigger
can retain a short functional label such as “View”. Use a checkmark or equivalent
selection indicator in addition to colour.

## Shared controls

`kits/cosmik/components/controls.css` implements the states above for the common
controls, using semantic tokens only; the [consumer guide](../kits/README.md#shared-controls)
lists its classes and markup. This section is the rule; the CSS and the reference
demonstrate it. A platform without CSS should reproduce the same observable behavior.

- **Buttons** come in two emphases. Primary is the main next action in a local
  task; secondary is everything else. Use the standard `control-min` target, and
  `control-dense` only for dense mouse or trackpad controls, never on touch.
  A large button, a taller target with wider padding, gives a page's one
  prominent call to action more presence; it is still a primary or secondary
  button, and the product decides where it appears.
  Hover and pressed change only colour, so nothing nearby moves. Hover
  treatments apply only where the pointer can hover (`(hover: hover)`): a tap
  on touch leaves the browser's hover state on what was tapped, and it must not
  look hovered or selected afterwards. Pressed feedback applies everywhere.
- **Quiet buttons** have no fill or boundary until hover, for actions inside a
  toolbar or another bounded group whose surface supplies the boundary. Use the
  secondary emphasis for a button that stands alone.
- **Icon buttons** are square at the button's target size: `control-dense` on a
  mouse or trackpad when dense, `control-min` on touch. An icon-only control must
  have an accessible name and a tooltip that opens on keyboard focus as well as
  hover and names the same action; the tooltip is the product's implementation.
  When a toolbar narrows, drop the visible labels of its buttons together and
  keep their icons, so the tooltip carries the name; never drop the icon and keep
  the label in one place while doing the opposite elsewhere.
- **Toggles** (`aria-pressed`) show selection with the selected roles plus a drawn
  bar along the bottom edge, so it never depends on colour; hover and pressed
  never erase it.
- **Toolbars** group related controls on a surface with a border, so they stay
  legible over a busy canvas without relying on a shadow; a family elevation
  shadow may add depth. Give the group `role="toolbar"` with arrow-key focus, or
  `role="group"`, and an accessible name. Keep one toolbar per task and leave
  space between independent groups; placement is the product's.
- **Glass** is an opt-in surface for controls that float over busy or moving
  content: a 3D canvas, video or an image the user is working on. Use it for the
  toolbars, triggers, hints and the menus and popovers opened from them, and keep
  it consistent across one such region. Never use it for reading content, forms,
  dense lists, dialogs, navigation or panels beside the content: those stay on
  solid surfaces. It is a mechanism, not a default; the product chooses where it
  applies. Glass paints the `glass` tint over a blurred, saturated copy of the
  content behind it, clear enough that the content visibly shows through. It has
  no solid border: its edge is a sheen, a 1px gradient where the rim catches light
  from the top left (`glass-sheen`), fading along the sides to a fainter return at
  the bottom right (`glass-sheen-low`). The sheen is decorative and gives the
  shape; what identifies a control on glass is its label, icon, selection and
  focus, which carry the contrast requirements. The solid fallbacks replace the
  sheen with a plain, subtle `glass-border`.
- **Glass tone.** Glass has a dark and a light tone, and a tone is that theme for
  the surface and its contents: text, muted text (`glass-muted`), selection,
  hover and focus all follow it. Each tone keeps AA text, icons and selection only
  over content on its side of the published threshold (`--c-glass-tone-threshold`,
  a relative luminance) and a little past it (`--c-glass-tone-hysteresis`); the
  wrong tone does not. A surface without `data-glass-tone` takes the page's
  theme, which is right only over content whose brightness the product knows,
  such as a fixed image. Over content whose brightness varies (a 3D canvas,
  video, a photograph the user changes) the product must choose the tone from
  what is behind each surface: measure the backdrop's relative luminance, take
  the light tone at or above the threshold and the dark tone below it, and switch
  with hysteresis so the tone does not flicker. A menu or popover takes the tone
  of the content it opens over. A tone change crossfades with the motion tokens.
  Selection stays opaque (the selected roles and bar), and hover and pressed use
  the usual action roles. Where the browser cannot blur, the user asks for
  reduced transparency or forced colours are on, the same controls are solid.
  Keep glass calm: one layer deep where possible, no glow, gradient or tinted
  accent, and no glass on large panels, where the blur costs the most and adds
  the least. Backdrop blur redraws with every frame of moving content; measure it
  in the product and drop the blur first if it costs frames: `data-glass="flat"`
  on a region keeps the tint without the blur (contrast holds, because blurring
  only averages the content), and `data-glass="solid"` makes it solid.
- **Segmented controls** choose one of a few mutually exclusive options: a
  `radiogroup` of `radio` options with a roving tab stop and arrow keys, or a
  group of `aria-pressed` buttons. Every option takes the widest option's width,
  so the group never resizes when the selection changes. Selection uses the
  selected roles plus the drawn bar; hover never erases it. Icon-only options
  follow the icon button rules.
- **Disabled** controls use the disabled roles in every interaction state. Prefer
  the native `disabled` attribute; use `aria-disabled="true"` when the control must
  stay focusable to explain its prerequisite, and block activation yourself.
- **Pending** buttons keep their label and width, set `aria-busy="true"` and name
  the operation; announce the start and the outcome.
- **Links** in text stay underlined and take the link roles; hover thickens the
  underline as well as changing colour.
- **Text fields** use the input roles and the body type role, keep a visible
  label above them and show an invalid state as a heavier boundary drawn inside
  the field plus an associated message in words.
- **Selects** keep the native `<select>` for its semantics and keyboard support.
  Remove only its platform arrow and draw a stroked chevron in the field's text
  colour, inset by a token space, that never intercepts a click.
- **Dense fields** (a select or text field) use `control-dense` and the `ui` type
  on a mouse or trackpad, for compact toolbars and footers. On touch they return
  to `control-min` and the body type, so focusing one never zooms the page.
- **Chips** are compact toggles or filters with `aria-pressed` (or the selected
  semantics of their container). Selection shows a drawn check as well as the
  selected roles, and hover never erases it.
- **Status labels** are neutral and non-interactive, and must not look like a
  control: the `label` type role, a pill shape that no control uses, the status
  roles, and no hover, pressed or focus state or pointer cursor. Never make one a
  link or button. The words carry the meaning; add a symbol for important status.
  A family's status hues supplement the words.
  In dense contexts (a compact row, a header, a card) use the dense status label:
  the same pill, roles and label family, tracking and case at the `ui-small`
  size with tighter padding. It is still a label, with no interaction state, and
  its height is not a target size.
- **Focus** uses one ring everywhere: the `focus` role at `focus-width`, offset by
  `focus-offset`. Custom focusable controls use the same ring.
- **Transitions** use the effective motion duration and easing, so a reduced
  motion preference removes them.
- **Forced colours** keep every boundary, the chevron, the selection check, the
  selection bar and the focus ring, because they are borders and outlines rather
  than fills. Glass surfaces become opaque system surfaces with a solid system
  border in place of the sheen.

## Forms and settings

Place a persistent label above each text or selection field. A placeholder may
show an example; it does not replace the label. Keep a short explanation directly
under a setting when its effect is not obvious. Optional secondary detail may be
progressively disclosed, but the user must be able to decide without hunting for
basic meaning.

Use native input semantics where practical. A checkbox or switch is a boolean;
radio buttons or a segmented group select one mutually exclusive option. Do not
use tabs for unrelated actions or a switch for an operation that needs a separate
confirmation. State whether settings take effect immediately or require Save.

Keep entered values after validation failures. Name the error in words, associate
it with its field and explain how to correct it. Validate when the result is useful;
do not interrupt every keystroke with a new error. Distinguish an unavailable value
from a request that failed to load it. Retry should preserve the user's selection.

For inherited settings, show both the source and the effective values. Read-only
values should remain legible. Do not hide the settings just because another scope
currently controls them.

## Menus, popovers and dialogs

| Surface | Use it for | Interaction contract |
| --- | --- | --- |
| Menu | A short set of actions or mutually exclusive choices | Clear selection, appropriate menu keyboard navigation, Escape to dismiss and focus returned to the trigger |
| Popover | A small related task or a group of settings | A compact heading when needed, meaningful field labels, bounded scrolling and predictable outside-click / Escape dismissal |
| Dialog | A focused task that interrupts the page | Accessible title, intentional initial focus, contained keyboard focus, inert background and a visible close or cancel action |
| Tooltip | Brief supplemental explanation | Opens on focus or hover, does not cover its trigger and disappears without trapping focus |
| Disclosure | Optional content within the page | Trigger exposes expanded state; collapsed content is not focusable |

Use the semantics of the content. In a browser, a popover containing form fields
is not an ARIA menu; other platforms need the equivalent accessible role. Opening a child surface must not accidentally close its parent. Dismiss the
topmost dismissible surface first. Closing returns focus to the trigger when it
still exists, otherwise to a useful nearby control. A confirmation names the item
and consequence; the safe action receives initial focus for destructive choices.

Anchor popovers to their trigger, permit collision handling and keep them inside
the available viewport. Give long menus a scrollable body. Keep a dialog's title
and actions reachable on short screens; they must not consume nearly all of its
height. Prefer one deliberate scrolling region over nested competing scrollers.

Tabbed dialogs should keep a stable outer frame when switching between similarly
sized tasks. Avoid a large empty shell for short content. Constrain that frame to
the available height and allow content to scroll without moving the controls the
user needs to finish or close the task. Never clip text to preserve a fixed height.

Define surface ownership and a consistent layer order: content, local controls,
anchored surfaces, modal backdrop and dialog, then content owned by that dialog.
An overlay rendered outside its logical parent still needs the correct family,
theme and motion preference. In browsers this includes portals and `z-index`;
native implementations should use their equivalent layering and focus mechanisms.

## Collections, previews and status

Use a card for a meaningful unit of content, not every button or metadata row.
Keep repeated thumbnail proportions and text alignment consistent. List layouts
should make comparison easier and preserve the same actions as the grid. Show
full names when inspecting an item; do not make hover the only route to truncated
information. Preserve selection and scroll position when a view changes.

Choose preview size by purpose. A thumbnail can open a larger view; an inspection
surface needs enough room to examine its content and reach its controls.
Label illustrative content and placeholders honestly. Loading and broken-image
states must not masquerade as real previews or collapse the layout unexpectedly.

Status uses words: “Saved”, “Loading”, “Could not load items”. Pair
important status with a distinct symbol or structure. Neutral baseline status and
family hues both need text; accent colour does not automatically mean success.
Announce meaningful asynchronous changes without re-announcing every progress tick.

Distinguish an empty collection from an empty search result and a loading failure.
Offer the relevant action: create the first item, clear the filter or retry. Do not
fill useful empty space with ornamental illustrations or repeated instructions.

## Responsive and accessible behavior

Fit the layout to content and available space. Reading layouts normally stack below
the `compact` breakpoint; a compact toolbar or two short related controls may stay
side by side if they fit at enlarged text size and preserve target sizes. Narrow
width does not imply touch input, and a wide screen may still be touch operated.

Preserve all useful actions when the layout changes. Use an explicitly labelled
overflow menu for secondary actions rather than squeezing targets. Preserve the
user's orientation when adapting the layout. At short heights, reduce ornamental
space before taking space from the task itself.

Use semantic headings, lists, labels and buttons. Make keyboard order follow the
visual task. Support keyboard access to the same useful content as pointer and
touch. Never rely solely on colour, hover, animation or spatial position to convey
meaning. Retain visible focus in forced-colour modes, including controls drawn
with custom CSS.

Before shipping, use the [quality review](quality.md): rendered screens and complete
interactions are required alongside token and source checks.
