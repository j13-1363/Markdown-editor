/**
 * 导出工具集
 * 提供Markdown内容导出为HTML/PDF的功能
 */

import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// 默认CSS样式
const DEFAULT_CSS = `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
p { margin-bottom: 16px; }

pre {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 3px;
  overflow: auto;
  margin-bottom: 16px;
}

code {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  background: rgba(27, 31, 35, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 85%;
}

blockquote {
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
  padding: 0 1em;
  margin: 0 0 16px 0;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
  display: block;
  overflow-x: auto;
}

table th, table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

img {
  max-width: 100%;
  box-sizing: content-box;
}

ul, ol {
  padding-left: 2em;
  margin-bottom: 16px;
}

li {
  margin-bottom: 0.5em;
}

li > p {
  margin-bottom: 0.5em;
}
`

// 暗色主题CSS
const DARK_CSS = `
body {
  background-color: #2d2d2d;
  color: #e0e0e0;
}

pre {
  background: #1a1a1a;
}

code {
  background: rgba(0, 0, 0, 0.3);
}

blockquote {
  border-left-color: #444;
  color: #aaa;
}

table tr {
  background-color: #2d2d2d;
}

table tr:nth-child(2n) {
  background-color: #1a1a1a;
}
`

/**
 * 生成HTML导出内容
 * @param {string} content HTML内容
 * @param {Object} options 选项
 * @param {string} [options.theme='light'] 主题 ('light' 或 'dark')
 * @param {string} [options.title='Markdown Export'] 文档标题
 * @param {boolean} [options.includeHighlightJS=true] 是否包含highlight.js
 * @returns {string} 完整的HTML文档
 */
export function generateHTMLExport(
  content,
  { 
    theme = 'light',
    title = 'Markdown Export',
    includeHighlightJS = true 
  } = {}
) {
  const css = theme === 'dark' ? DEFAULT_CSS + DARK_CSS : DEFAULT_CSS
  const hljsStyle = includeHighlightJS 
    ? '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">'
    : ''
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${hljsStyle}
  <style>${css}</style>
</head>
<body>
  <div class="markdown-body">
    ${content}
  </div>
</body>
</html>`
}

/**
 * 导出为HTML文件
 * @param {string} content HTML内容
 * @param {string} [fileName='markdown_export'] 文件名（不含扩展名）
 * @param {Object} [options] 选项（同generateHTMLExport）
 */
export function exportAsHTML(content, fileName = 'markdown_export', options = {}) {
  const html = generateHTMLExport(content, options)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  saveAs(blob, `${fileName}.html`)
}

/**
 * 生成PDF导出
 * @param {string} htmlContent HTML内容
 * @param {Object} options 选项
 * @param {string} [options.fileName='markdown_export'] 文件名（不含扩展名）
 * @param {string} [options.theme='light'] 主题 ('light' 或 'dark')
 * @param {string} [options.size='a4'] 纸张大小 ('a4', 'letter' 等)
 * @param {string} [options.orientation='portrait'] 方向 ('portrait' 或 'landscape')
 * @returns {Promise<void>}
 */
export async function generatePDFExport(
  htmlContent,
  {
    fileName = 'markdown_export',
    theme = 'light',
    size = 'a4',
    orientation = 'portrait'
  } = {}
) {
  // 创建临时容器
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = size === 'a4' ? '210mm' : '216mm'
  container.style.padding = '20mm'
  container.style.fontFamily = 'Arial, sans-serif'
  container.style.background = theme === 'dark' ? '#2d2d2d' : '#fff'
  container.style.color = theme === 'dark' ? '#e0e0e0' : '#333'
  
  // 添加内容
container.innerHTML = `
  <style>${theme === 'dark' ? DEFAULT_CSS + DARK_CSS : DEFAULT_CSS}</style>
  ${htmlContent}
`;

  try {
    // 渲染为Canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: theme === 'dark' ? '#2d2d2d' : '#fff'
    })

    // 创建PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: size
    })

    // 计算尺寸
    const imgWidth = pdf.internal.pageSize.getWidth() - 20 // 左右边距
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 添加图片到PDF
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, imgHeight)
    
    // 保存文件
    pdf.save(`${fileName}.pdf`)
  } catch (error) {
    console.error('PDF导出失败:', error)
    throw error
  } finally {
    // 清理临时元素
    document.body.removeChild(container)
  }
}

/**
 * 导出为PDF文件
 * @param {string} content HTML内容
 * @param {string} [fileName='markdown_export'] 文件名（不含扩展名）
 * @param {Object} [options] 选项（同generatePDFExport）
 * @returns {Promise<void>}
 */
export async function exportAsPDF(content, fileName = 'markdown_export', options = {}) {
  // 先生成HTML确保样式正确
  const html = generateHTMLExport(content, {
    theme: options.theme,
    includeHighlightJS: false
  })
  
  // 创建临时div获取纯内容
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  const bodyContent = tempDiv.querySelector('body').innerHTML
  
  await generatePDFExport(bodyContent, { fileName, ...options })
}

/**
 * 导出为Markdown文件
 * @param {string} content Markdown内容
 * @param {string} [fileName='markdown_export'] 文件名（不含扩展名）
 */
export function exportAsMarkdown(content, fileName = 'markdown_export') {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, `${fileName}.md`)
}

// 快捷导出方法
export const exportHelpers = {
  html: exportAsHTML,
  pdf: exportAsPDF,
  md: exportAsMarkdown
}