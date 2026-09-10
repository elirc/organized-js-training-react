/**
 * A ~70 line "framework". Everything in this app is built from `h()`.
 *
 * Reading this file is itself part of the curriculum: React's `createElement`
 * has the exact same shape - `h(type, props, ...children)` - and JSX is only
 * sugar that compiles down to calls like these.
 */

/**
 * Create an element.
 *
 * @param {string} tag  e.g. "div", "div.card", "button.btn.primary"
 * @param {object} [props] attributes; `class`, `onClick`, `html`, `dataset`,
 *                 `style` (object) and `ref` (callback) get special handling.
 * @param {...any} children strings, numbers, Nodes, arrays, null/false (skipped)
 */
export function h(tag, props, ...children) {
  const parts = tag.split('.');
  const el = document.createElement(parts[0] || 'div');
  for (const cls of parts.slice(1)) el.classList.add(cls);

  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
    children.unshift(props);
    props = null;
  }

  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;

    if (key === 'class' || key === 'className') {
      for (const cls of String(value).split(/\s+/).filter(Boolean)) el.classList.add(cls);
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (key === 'ref') {
      value(el);
    } else if (key === 'style' && typeof value === 'object') {
      for (const [prop, val] of Object.entries(value)) {
        // Custom properties (--accent) must go through setProperty; camelCase
        // properties can be assigned directly.
        if (prop.startsWith('--')) el.style.setProperty(prop, val);
        else el.style[prop] = val;
      }
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in el && key !== 'list' && typeof value !== 'object') {
      el[key] = value;
    } else {
      el.setAttribute(key, value === true ? '' : value);
    }
  }

  append(el, children);
  return el;
}

function append(parent, children) {
  for (const child of children) {
    if (child == null || child === false || child === true) continue;
    if (Array.isArray(child)) append(parent, child);
    else parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Replace everything inside `parent` with `nodes`. */
export function mount(parent, ...nodes) {
  parent.replaceChildren();
  append(parent, nodes);
  return parent;
}

/** Escape a string so it is safe to drop into innerHTML. */
export function esc(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Minimal inline markdown -> HTML. Supports `code`, **bold**, _em_.
 * Escapes first, so content is never able to inject markup.
 */
export function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_/g, '$1<em>$2</em>');
}

/** A <span>/<div> whose content is inline-markdown. */
export function rich(text, tag = 'span') {
  return h(tag, { html: inline(text) });
}

/** A syntax-neutral code block. */
export function code(src, lang) {
  return h('pre', { 'data-lang': lang || '' }, h('code', src));
}

/** Show a transient message at the bottom of the screen. */
let toastTimer = null;
export function toast(message) {
  document.querySelector('.toast')?.remove();
  const node = h('div.toast', message);
  document.body.append(node);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.remove(), 2200);
}

/** Open a modal. Returns a `close()` function. */
export function modal(content, { onClose } = {}) {
  const close = () => {
    back.remove();
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const back = h('div.modal-back', {
    onClick: (e) => { if (e.target === back) close(); },
  }, h('div.modal', { role: 'dialog', 'aria-modal': 'true' }, content(close)));

  document.body.append(back);
  document.addEventListener('keydown', onKey);
  back.querySelector('button, [tabindex], input, textarea')?.focus();
  return close;
}
