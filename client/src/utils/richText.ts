const ALLOWED_TAGS = new Set(['A', 'B', 'BR', 'DIV', 'EM', 'I', 'LI', 'OL', 'P', 'SPAN', 'STRONG', 'U', 'UL'])
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function hasMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function getSafeColor(styleValue: string) {
  const match = String(styleValue || '').match(/color\s*:\s*([^;]+)/i)
  return match?.[1]?.trim() || ''
}

function sanitizeHref(href: string) {
  const value = String(href || '').trim()
  if (!value) return ''
  if (value.startsWith('/') || value.startsWith('#')) return value

  try {
    const parsed = new URL(value, window.location.origin)
    if (SAFE_PROTOCOLS.includes(parsed.protocol)) return parsed.href
  } catch (error) {
    return ''
  }

  return ''
}

export function sanitizeRichTextHtml(value: string) {
  if (!value) return ''

  const parser = new DOMParser()
  const documentNode = parser.parseFromString(`<div>${value}</div>`, 'text/html')
  const root = documentNode.body.firstElementChild as HTMLElement | null
  if (!root) return ''

  const sanitizeChildren = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child)
        return
      }

      const element = child as HTMLElement
      if (!ALLOWED_TAGS.has(element.tagName)) {
        element.replaceWith(...Array.from(element.childNodes))
        sanitizeChildren(node)
        return
      }

      Array.from(element.attributes).forEach((attribute) => {
        const { name, value: attributeValue } = attribute
        if (name === 'href' && element.tagName === 'A') {
          const safeHref = sanitizeHref(attributeValue)
          if (safeHref) {
            element.setAttribute('href', safeHref)
            if (/^https?:/i.test(safeHref)) {
              element.setAttribute('target', '_blank')
              element.setAttribute('rel', 'noreferrer noopener')
            } else {
              element.removeAttribute('target')
              element.removeAttribute('rel')
            }
          } else {
            element.removeAttribute('href')
            element.removeAttribute('target')
            element.removeAttribute('rel')
          }
          return
        }

        if (name === 'style') {
          const color = getSafeColor(attributeValue)
          if (color) element.setAttribute('style', `color: ${color};`)
          else element.removeAttribute('style')
          return
        }

        if (name === 'target' || name === 'rel') return
        element.removeAttribute(name)
      })

      if (element.tagName !== 'A') {
        element.removeAttribute('target')
        element.removeAttribute('rel')
      }

      sanitizeChildren(element)
    })
  }

  sanitizeChildren(root)
  return root.innerHTML
}

export function normalizeRichTextHtml(value?: string | null) {
  const source = String(value || '')
  if (!source.trim()) return ''
  if (hasMarkup(source)) return sanitizeRichTextHtml(source)
  return escapeHtml(source).replace(/\n/g, '<br>')
}
