export function handleCodeFormat(content, selection) {
  return handleMultilineFormat(content, selection, '```', '\n```')
}

export function detectFormats(text) {
  if (!text || typeof text !== 'string') return {}
  const lines = text.split('\n')
  const isMultiline = lines.length > 1
  return {
    bold: /^\*\*.+\*\*$/.test(text),
    italic: /^_.+_$/.test(text),
    strikethrough: /^~~.+~~$/.test(text),
    h1: /^#\s.+$/.test(text),
    h2: /^##\s.+$/.test(text),
    h3: /^###\s.+$/.test(text),
    ul: lines.every(line => /^\s*[-*+]\s.+$/.test(line)),
    ol: lines.every(line => /^\s*\d+\.\s.+$/.test(line)),
    taskList: lines.every(line => /^\s*[-*+]\s\[[ xX]\]\s.+$/.test(line)),
    code: /^`.+`$/.test(text),
    codeblock: /^```[^\n]*\n[\s\S]*?\n```$/.test(text),
    quote: lines.every(line => /^\s*>/.test(line))
  }
}

function isWrappedWith(text, prefix, suffix = prefix) {
  if (!text || !prefix) return false
  return (
    text.startsWith(prefix) && 
    text.endsWith(suffix) &&
    text.length > prefix.length + suffix.length
  )
}

function toggleMarkdownFormat(content, selection, prefix, suffix) {
  const { start, end, text } = selection
  const isFormatted = isWrappedWith(text, prefix, suffix)
  if (isFormatted) {
    return removeMarkdownFormat(content, selection, prefix, suffix)
  } else {
    return addMarkdownFormat(content, selection, prefix, suffix)
  }
}

function addMarkdownFormat(content, selection, prefix, suffix) {
  const { start, end, text } = selection
  if (text.includes('\n')) {
    const lines = text.split('\n')
    const formattedLines = lines.map(line => prefix + line + suffix)
    const newText = formattedLines.join('\n')
    return {
      content: content.slice(0, start) + newText + content.slice(end),
      newStart: start,
      newEnd: start + newText.length
    }
  }
  return {
    content: content.slice(0, start) + prefix + text + suffix + content.slice(end),
    newStart: start + prefix.length,
    newEnd: end + prefix.length + suffix.length
  }
}

function removeMarkdownFormat(content, selection, prefix, suffix) {
  const { start, end, text } = selection
  if (text.includes('\n')) {
    const lines = text.split('\n')
    const unformattedLines = lines.map(line => {
      let result = line
      // 精确匹配前缀和后缀，避免截断
      const regex = new RegExp(`^${prefix}(.*?${suffix}$)`, 's')
      if (line.match(regex)) {
        result = line.replace(regex, '$1').replace(new RegExp(suffix, 's'), '')
      } else {
        result = line.replace(new RegExp(`^${prefix}`), '').replace(new RegExp(suffix + '$'), '')
      }
      return result
    })
    const newText = unformattedLines.join('\n')
    return {
      content: content.slice(0, start) + newText + content.slice(end),
      newStart: start,
      newEnd: start + newText.length
    }
  } else {
    const regex = new RegExp(`^${prefix}(.*?)${suffix}$`, 's')
    const match = text.match(regex)
    if (match) {
      const newText = match[1]
      return {
        content: content.slice(0, start) + newText + content.slice(end),
        newStart: start,
        newEnd: start + newText.length
      }
    }
    return { content, newStart: start, newEnd: end }
  }
}

function handleMultilineFormat(content, selection, prefix, suffix = '') {
  const { start, end, text } = selection
  const lines = text.split('\n')
  const isFormatted = lines.some(line => line.trim().startsWith(prefix))
  
  if (isFormatted) {
    const newLines = lines.map(line => line.replace(new RegExp(`^${prefix}`), ''))
    const newText = newLines.join('\n')
    return {
      content: content.slice(0, start) + newText + content.slice(end),
      newStart: start,
      newEnd: start + newText.length
    }
  } else {
    const newLines = lines.map(line => line ? prefix + line : line)
    const newText = newLines.join('\n')
    return {
      content: content.slice(0, start) + newText + content.slice(end),
      newStart: start,
      newEnd: end + (prefix.length * lines.filter(line => line).length)
    }
  }
}

function handleHeader(content, selection, level) {
  const prefix = '#'.repeat(level) + ' '
  const lines = selection.text.split('\n')
  // 修正：仅处理当前行
  const isFormatted = lines.some((line, index) => index === 0 && line.trimStart().startsWith(prefix.trimStart()))
  
  if (isFormatted) {
    const newLines = lines.map(line => line.replace(new RegExp(`^\\s*${prefix.trimStart()}`), ''))
    const newText = newLines.join('\n')
    return {
      content: content.slice(0, selection.start) + newText + content.slice(selection.end),
      newStart: selection.start,
      newEnd: selection.start + newText.length
    }
  } else {
    const newLines = lines.map(line => (line ? prefix + line : line))
    const newText = newLines.join('\n')
    return {
      content: content.slice(0, selection.start) + newText + content.slice(selection.end),
      newStart: selection.start + prefix.length,
      newEnd: selection.start + newText.length
    }
  }
}

export const formatHelpers = {
  bold: (content, selection) => toggleMarkdownFormat(content, selection, '**', '**'),
  italic: (content, selection) => toggleMarkdownFormat(content, selection, '_', '_'),
  strikethrough: (content, selection) => toggleMarkdownFormat(content, selection, '~~', '~~'),
  h1: (content, selection) => handleHeader(content, selection, 1),
  h2: (content, selection) => handleHeader(content, selection, 2),
  h3: (content, selection) => handleHeader(content, selection, 3),
  ul: (content, selection) => handleMultilineFormat(content, selection, '- '),
  ol: (content, selection) => handleMultilineFormat(content, selection, '1. '),
  taskList: (content, selection) => handleMultilineFormat(content, selection, '- [ ] '),
  quote: (content, selection) => handleMultilineFormat(content, selection, '> '),
  code: (content, selection) => toggleMarkdownFormat(content, selection, '`', '`'),
  codeblock: (content, selection) => handleMultilineFormat(content, selection, '```\n', '\n```'),
  table: (content, selection) => {
    const tableTemplate = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`
    const formattedTable = `\n${tableTemplate.trim()}\n`
    return {
      content: content.slice(0, selection.start) + formattedTable + content.slice(selection.end),
      newStart: selection.start + formattedTable.length,
      newEnd: selection.start + formattedTable.length
    }
  },
  image: (content, selection, imagePath) => {
    const markdownImage = `![图片](${imagePath})`
    return {
      content: content.slice(0, selection.start) + markdownImage + content.slice(selection.end),
      newStart: selection.start + markdownImage.length,
      newEnd: selection.start + markdownImage.length
    }
  },
  link: (content, selection, linkText, url) => {
    if (selection.text.includes('![图片]')) return { content, newStart: selection.start }
    const markdownLink = `[${linkText}](${url})`
    return {
      content: content.slice(0, selection.start) + markdownLink + content.slice(selection.end),
      newStart: selection.start + markdownLink.length,
      newEnd: selection.start + markdownLink.length
    }
  }
}
