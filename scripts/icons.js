/**
 * Icons, from Lucide (https://lucide.dev), ISC licensed.
 *
 * Copied in as raw paths rather than pulled from a package: the app has no
 * build step and no dependencies, and four icons do not justify either. Every
 * one is drawn on Lucide's 24px grid at 1.5 stroke with round caps and joins,
 * which is the same spec the cup and tab-bar marks already follow.
 *
 * Accessibility is not a property of the icon set, it is a property of the
 * markup. `icon()` marks the glyph aria-hidden because it is decoration; the
 * accessible name always comes from real text or an aria-label on the control
 * that wraps it. Never let an icon be the only thing naming a button.
 */

const PATHS = {
  // lucide: settings
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  // lucide: plus
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  // lucide: x
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  // lucide: arrow-up
  'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
};

/**
 * Returns an inline SVG string. Decorative by default: the control around it
 * must carry the accessible name.
 */
export function icon(name, size = 24) {
  const body = PATHS[name];
  if (!body) throw new Error(`unknown icon: ${name}`);
  return (
    `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" ' +
    `stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`
  );
}

/** Paint every [data-icon] placeholder in a subtree. */
export function paintIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((node) => {
    const size = Number(node.dataset.iconSize) || 24;
    node.innerHTML = icon(node.dataset.icon, size) + node.innerHTML;
    delete node.dataset.icon;
  });
}
