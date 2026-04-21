const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'u',
  'ul',
]);

const ALLOWED_ATTRS = new Set(['href', 'target', 'rel']);

function sanitizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;

  try {
    const url = new URL(trimmed, 'https://example.invalid');
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

function fallbackSanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\shref="javascript:[^"]*"/gi, '')
    .replace(/\shref='javascript:[^']*'/gi, '');
}

export function sanitizeHtml(html: string): string {
  if (!html) {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return fallbackSanitize(html);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const visit = (node: Node): void => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = element.parentNode;
      if (!parent) return;

      if (tag === 'script' || tag === 'style') {
        parent.removeChild(element);
        return;
      }

      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      return;
    }

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(name)) {
        element.removeAttribute(attr.name);
        continue;
      }

      if (name === 'href') {
        const safeHref = sanitizeUrl(attr.value);
        if (safeHref) {
          element.setAttribute('href', safeHref);
        } else {
          element.removeAttribute('href');
        }
      }
    }

    if (tag === 'a') {
      const target = element.getAttribute('target');
      if (target === '_blank') {
        element.setAttribute('rel', 'noreferrer noopener');
      } else {
        element.removeAttribute('target');
        element.removeAttribute('rel');
      }
    }

    for (const child of Array.from(element.childNodes)) {
      visit(child);
    }
  };

  for (const child of Array.from(doc.body.childNodes)) {
    visit(child);
  }

  return doc.body.innerHTML;
}
