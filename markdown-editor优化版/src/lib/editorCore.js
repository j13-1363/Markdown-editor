import hljs from 'highlight.js'
import marked from 'marked'

export function initMarked() {
  marked.setOptions({
    breaks: true,
    highlight: (code, lang) => {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })

  // 注册常用语言
  hljs.registerLanguage('javascript', hljs.getLanguage('javascript'))
  hljs.registerLanguage('python', hljs.getLanguage('python'))
}

export function updatePreview(content) {
  return marked.parse(content)
}

export function highlightCodeBlocks() {
  document.querySelectorAll('pre code').forEach(block => {
    hljs.highlightBlock(block)
  })
}
