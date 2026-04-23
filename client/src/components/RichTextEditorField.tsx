import { useEffect, useRef, useState } from 'react'
import { FiLink, FiList } from 'react-icons/fi'
import { normalizeRichTextHtml, sanitizeRichTextHtml } from '../utils/richText'

type RichTextEditorFieldProps = {
  label?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichTextEditorField({
  label,
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = 140
}: RichTextEditorFieldProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const normalized = normalizeRichTextHtml(value)
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTarget, setLinkTarget] = useState<'_self' | '_blank'>('_self')
  const [linkColor, setLinkColor] = useState('#2563eb')

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (document.activeElement === editor) return
    if (editor.innerHTML !== normalized) editor.innerHTML = normalized
  }, [normalized])

  const emitChange = () => {
    const nextValue = sanitizeRichTextHtml(editorRef.current?.innerHTML || '')
    onChange(nextValue)
  }

  const getActiveLink = () => {
    const selection = window.getSelection()
    const node = selection?.anchorNode
    if (!node) return null
    const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement
    return element?.closest('a') || null
  }

  const saveCurrentSelection = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return false
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return false
    savedRangeRef.current = range.cloneRange()
    return true
  }

  const restoreSelection = () => {
    const range = savedRangeRef.current
    const selection = window.getSelection()
    if (!range || !selection) return
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const applyCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand('styleWithCSS', false, command === 'foreColor' ? 'true' : 'false')
    document.execCommand(command, false, commandValue)
    emitChange()
  }

  const openLinkPopover = () => {
    const hasSelection = saveCurrentSelection()
    const activeLink = getActiveLink()
    setLinkUrl(activeLink?.getAttribute('href') || '')
    setLinkTarget(activeLink?.getAttribute('target') === '_blank' ? '_blank' : '_self')
    setLinkColor(activeLink?.style.color || '#2563eb')
    setLinkPopoverOpen(true)
    if (!hasSelection && !activeLink) {
      editorRef.current?.focus()
    }
  }

  const applyLinkSettings = () => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    restoreSelection()
    document.execCommand('styleWithCSS', false, 'false')
    if (linkUrl.trim()) {
      document.execCommand('createLink', false, linkUrl.trim())
      const activeLink = getActiveLink()
      if (activeLink) {
        if (linkTarget === '_blank') {
          activeLink.setAttribute('target', '_blank')
          activeLink.setAttribute('rel', 'noreferrer noopener')
        } else {
          activeLink.removeAttribute('target')
          activeLink.removeAttribute('rel')
        }
        activeLink.style.color = linkColor
      }
    }
    emitChange()
    setLinkPopoverOpen(false)
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-bold text-gray-700">{label}</label>}
      <div className="overflow-hidden rounded-lg border border-blue-200 shadow-sm">
        <div className="border-b bg-blue-50 px-3 py-2">
          <p className="text-sm font-bold text-blue-900">Formatting Toolbar</p>
          <p className="mt-1 text-xs text-blue-700">Highlight text, then use bold, italic, underline, links, and color.</p>
        </div>
        <div className="relative flex flex-wrap items-center gap-2 border-b bg-gray-50 p-2">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('bold')} className="rounded border bg-white px-3 py-1 text-sm font-bold text-gray-800 hover:bg-gray-100" title="Bold">B</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('italic')} className="rounded border bg-white px-3 py-1 text-sm italic text-gray-800 hover:bg-gray-100" title="Italic">I</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('underline')} className="rounded border bg-white px-3 py-1 text-sm underline text-gray-800 hover:bg-gray-100" title="Underline">U</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('insertUnorderedList')} className="inline-flex items-center gap-1 rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100" title="Bullet list"><FiList size={14} /> Bullets</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('insertOrderedList')} className="rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100" title="Numbered list">1.</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={openLinkPopover} className="inline-flex items-center gap-1 rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100" title="Add hyperlink"><FiLink size={14} /> Link</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('unlink')} className="rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100" title="Remove hyperlink">Unlink</button>
          <label className="inline-flex items-center gap-2 rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800">
            Text Color
            <input type="color" onChange={(e) => applyCommand('foreColor', e.target.value)} className="h-7 w-8 cursor-pointer rounded border p-0" title="Change text color" />
          </label>
          {linkPopoverOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setLinkPopoverOpen(false)}>
              <div className="w-full max-w-md rounded-lg border bg-white p-4 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">Link URL</label>
                    <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com or /contact" className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">Open Link In</label>
                    <div className="flex gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input type="radio" checked={linkTarget === '_self'} onChange={() => setLinkTarget('_self')} />
                        Existing tab
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input type="radio" checked={linkTarget === '_blank'} onChange={() => setLinkTarget('_blank')} />
                        New tab
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">Link Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={linkColor} onChange={(e) => setLinkColor(e.target.value)} className="h-10 w-12 rounded border p-1" />
                      <input value={linkColor} onChange={(e) => setLinkColor(e.target.value)} className="flex-1 rounded-lg border px-3 py-2 text-sm text-gray-900" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setLinkPopoverOpen(false)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={applyLinkSettings} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Apply Link</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={emitChange}
          className="rich-text-editor min-h-[140px] bg-white px-4 py-3 text-gray-900 focus:outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  )
}
