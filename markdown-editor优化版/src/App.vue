<template>
  <div class="app-container" :data-theme="theme">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <!-- 文件菜单 -->
      <div class="file-menu-wrapper" ref="fileMenu">
        <button 
          class="file-menu-btn" 
          @click.stop="toggleFileMenu"
          :class="{ 'active': showFileMenu }"
        >
          <span>文件 ▼</span>
        </button>
        <transition name="fade">
          <div 
            v-show="showFileMenu" 
            class="file-menu-dropdown"
            @click.stop
          >
            <button @click="handleMenuClick('save')">保存</button>
            <button @click="handleMenuClick('load')">打开</button>
            <button @click="handleMenu极昼('exportHTML')">导出HTML</button>
            <button @click="handleMenuClick('exportPDF')">导出PDF</button>
          </div>
        </transition>
      </div>

      <!-- 格式按钮 -->
      <div class="format-buttons">
        <button 
          v-for="btn in toolbarButtons" 
          :key="btn.name"
          @click="handleFormat(btn.action)"
          :disabled="btn.requiresSelection && !hasSelection"
          class="tool-btn"
        >
          {{ btn.name }}
        </button>
      </div>

      <!-- 字体设置 -->
      <div class="font-settings">
        <select v-model="fontFamily" class="font-select">
          <option value="'Courier New', monospace">等宽字体</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
        </select>
        <select v-model="fontSize" class="size-select">
          <option value="14px">小</option>
          <option value="16px">中</option>
          <option value="18px">大</option>
        </select>
        <button @click="changeTheme" class="theme-btn">
          {{ theme === 'light' ? '🌙 极夜' : '☀️ 极昼' }}
        </button>
      </div>

      <!-- 隐藏的图片输入 -->
      <input 
        ref="imageInput" 
        type="file" 
        accept="image/*" 
        @change="handleImageUpload" 
        style="display: none;"
      />
    </div>

    <!-- 编辑区和预览区 -->
    <div class="editor-wrapper">
      <div 
        ref="editor"
        class="editor"
        contenteditable="true"
        @input="updatePreview"
        @mouseup="updateSelection"
        @keydown="handleKeydown"
        @paste="handlePaste"
        :style="{ fontFamily: fontFamily, fontSize: fontSize }" 
        placeholder="在这里输入Markdown内容..."
      ></div>
      <div class="preview" :style="{ fontFamily: fontFamily, fontSize: fontSize }" v-html="previewContent"></div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'
import hljs from 'highlight.js'
import { exportAsHTML, exportAsPDF } from './lib/exportUtils.js'
import { formatHelpers } from './lib/formatUtils.js'

export default {
  data() {
    return {
      markdownContent: '',
      previewContent: '',
      theme: 'light', // 修复：使用标准主题名称
      fontFamily: "'Courier New', monospace",
      fontSize: '14px',
      hasSelection: false,
      showFileMenu: false,
      toolbarButtons: [
        { name: '加粗', action: 'bold', requiresSelection: true },
        { name: '斜体', action: 'italic', requiresSelection: true },
        { name: '删除线', action: 'strikethrough', requiresSelection: true },
        { name: 'H1', action: 'h1', requiresSelection: true },
        { name: 'H2', action: 'h2', requiresSelection: true },
        { name: 'H3', action: 'h3', requiresSelection: true },
        { name: '无序列表', action: 'ul', requiresSelection: true },
        { name: '有序列表', action: 'ol', requiresSelection: true },
        { name: '任务列表', action: 'taskList', requiresSelection: true },
        { name: '引用', action: 'quote', requiresSelection: true },
        { name: '行内代码', action: 'code', requiresSelection: true },
        { name: '代码块', action: 'codeblock', requiresSelection: true },
        { name: '表格', action: 'table', requiresSelection: true },
        { name: '插入图片', action: 'image', requiresSelection: false },
        { name: '插入链接', action: 'link', requiresSelection: false }
      ]
    }
  },
  mounted() {
    marked.setOptions({
      renderer: new marked.Renderer(),
      highlight: (code) => hljs.highlightAuto(code).value,
      breaks: true,
      sanitize: false // 允许渲染图片
    })
    this.updatePreview()
    document.addEventListener('click', this.closeFileMenu)
    
    // 初始化主题
    document.documentElement.setAttribute('data-theme', this.theme)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeFileMenu)
  },
  methods: {
    updatePreview() {
      this.previewContent = marked.parse(this.getMarkdownContent())
    },
    updateSelection() {
      const selection = window.getSelection()
      this.hasSelection = selection.rangeCount > 0 && selection.toString().trim() !== ''
    },
    handleFormat(type) {
      const selection = this.getSelectionRange()
      const content = this.getMarkdownContent()

      if (type === 'image') {
        this.handleImageSelect()
        return
      }
      if (type === 'link') {
        this.insertLink(selection)
        return
      }

      const result = formatHelpers[type](content, selection)
      this.setMarkdownContent(result.content)
      this.$refs.editor.focus()
      
      // 精确恢复选区位置
      this.$nextTick(() => {
        const newRange = document.createRange()
        newRange.setStart(this.$refs.editor.firstChild, result.newStart)
        newRange.setEnd(this.$refs.editor.firstChild, result.newEnd)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(newRange)
      })
      
      this.updatePreview()
    },
    handleKeydown(e) {
      if (e.ctrlKey || e.meta极昼) {
        const key = e.key.toLowerCase()
        const customShortcuts = ['b', 'i', 'd', 'q', 'k', 'l', 'o', 't']

        if (customShortcuts.includes(key)) {
          if (key === 'b') this.handleFormat('bold')
          if (key === 'i') this.handleFormat('italic')
          if (key === 'd') this.handleFormat('strikethrough')
          if (key === 'q') this.handleFormat('quote')
          if (key === 'k') this.handleFormat('link')
          if (key === 'l') this.handleFormat('ul')
          if (key === 'o') this.handleFormat('ol')
          if (key === 't') this.handleFormat('taskList')
          e.preventDefault()
        }
      }
    },
    handlePaste(event) {
      event.preventDefault()
      const text = event.clipboardData.getData('text/plain')
      const selection = this.getSelectionRange()
      const content = this.getMarkdownContent()
      const newContent = content.slice(0, selection.start) + text + content.slice(selection.end)
      
      // 计算新光标位置
      const newSelection = {
        start: selection.start + text.length,
        end: selection.start + text.length
      }
      
      this.setMarkdownContent(newContent, newSelection)
      this.updatePreview()
    },
    getSelectionRange() {
      const selection = window.getSelection()
      if (!selection.rangeCount) return { start: 0, end: 0, text: '' }

      const editor = this.$refs.editor
      const range = selection.getRangeAt(0)
      const preRange = document.createRange()
      preRange.selectNodeContents(editor)
      preRange.setEnd(range.startContainer, range.startOffset)
      const start = preRange.toString().length
      preRange.setEnd(range.endContainer, range.endOffset)
      const end = preRange.toString().length
      return { start, end, text: range.toString() }
    },
    getMarkdownContent() {
      const editor = this.$refs.editor
      let markdown = ''

      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          markdown += node.textContent
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'IMG') {
            markdown += `![${node.alt || '图片'}](${node.src})`
          } else if (node.tagName === 'BR') {
            markdown += '\n'
          } else if (node.tagName === 'TABLE') {
            let tableMarkdown = ''
            Array.from(node.rows).forEach((row, rowIndex) => {
              const cells = Array.from(row.cells).map(cell => cell.textContent.trim())
              if (rowIndex === 0) {
                tableMarkdown += '|' + cells.join(' | ') + '|\n'
                tableMarkdown += '|' + cells.map(cell => '-'.repeat(cell.length)).join(' | ') + '|\n'
              } else {
                tableMarkdown += '|' + cells.join(' | ') + '|\n'
              }
            })
            markdown += tableMarkdown
          } else {
            Array.from(node.childNodes).forEach(childNode => walk(childNode))
          }
        }
      }

      walk(editor)
      return markdown
    },
    setMarkdownContent(content, newSelection = null) {
      const selection = window.getSelection()
      const hadSelection = selection.rangeCount > 0
      let savedRange = null

      if (hadSelection) {
        savedRange = selection.getRangeAt(0).cloneRange()
      }

      // 修复空行问题：只处理图片，不处理换行
      this.$refs.editor.innerHTML = content.replace(/\!\[.*?\]\((.*?)\)/g, (match, url) => {
        return `<img src="${url}" alt="图片" class="editor-image">`
      })

      // 优先使用传入的新选区
      if (newSelection) {
        this.$nextTick(() => {
          const newRange = document.createRange()
          newRange.setStart(this.$refs.editor.firstChild, newSelection.start)
          newRange.setEnd(this.$refs.editor.firstChild, newSelection.end)
          const sel = window.getSelection()
          sel.removeAllRanges()
          sel.addRange(newRange)
        })
      } else if (hadSelection && savedRange) {
        this.$nextTick(() => {
          const newRange = document.createRange()
          newRange.setStart(this.$refs.editor.firstChild, savedRange.startOffset)
          newRange.setEnd(this.$refs.editor.firstChild, savedRange.endOffset)
          const sel = window.getSelection()
          sel.removeAllRanges()
          sel.addRange(newRange)
        })
      }

      this.updatePreview()
    },
    handleImageSelect() {
      this.$refs.imageInput.click()
    },
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        const selection = this.getSelectionRange()
        const markdownImage = `![图片](${base64})`

        const currentContent = this.getMarkdownContent()
        const newContent = currentContent.slice(0, selection.start) +
                           markdownImage +
                           currentContent.slice(selection.end)
        
        // 计算新光标位置
        const newSelection = {
          start: selection.start + markdownImage.length,
          end: selection.start + markdownImage.length
        }
        
        this.setMarkdownContent(newContent, newSelection)
      }
      reader.readAsDataURL(file)
    },
    insertLink(selection) {
      const linkText = prompt('输入链接文本:', selection.text) || selection.text
      const url = prompt('输入链接地址:')
      if (!url) return

      if (selection.text.includes('![图片]')) {
        alert('图片区域无法插入链接')
        return
      }

      const markdownLink = `[${linkText}](${url})`
      const content = this.getMarkdownContent()
      const newContent = content.slice(0, selection.start) + markdownLink + content.slice(selection.end)
      
      // 计算新光标位置
      const newSelection = {
        start: selection.start + markdownLink.length,
        end: selection.start + markdownLink.length
      }
      
      this.setMarkdownContent(newContent, newSelection)
    },
    toggleFileMenu() {
      this.showFileMenu = !this.showFileMenu
    },
    closeFileMenu(event) {
      if (this.$refs.fileMenu && !this.$refs.fileMenu.contains(event.target)) {
        this.showFileMenu = false
      }
    },
    handleMenuClick(action) {
      this.showFileMenu = false
      switch (action) {
        case 'save': this.saveFile(); break
        case 'load': this.loadFile(); break
        case 'exportHTML': this.exportAsHTML(); break
        case 'exportPDF': this.exportAsPDF(); break
      }
    },
    changeTheme() {
      // 修复主题切换逻辑
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', this.theme)
    },
    saveFile() {
      const blob = new Blob([this.getMarkdownContent()], { type: 'text/markdown' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'document.md'
      link.click()
    },
    loadFile() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown'
      input.onchange = e => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = () => {
          this.setMarkdownContent(reader.result)
        }
        reader.readAsText(file)
      }
      input.click()
    },
    exportAsHTML() {
      exportAsHTML(this.previewContent, 'markdown_export', { theme: this.theme })
    },
    async exportAsPDF() {
      try {
        await exportAsPDF(this.previewContent, 'markdown_export', { theme: this.theme })
      } catch (error) {
        console.error('导出PDF失败:', error)
        alert('导出PDF失败，请重试')
      }
    }
  }
}
</script>


<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-color: #ffffff;
  --text-color: #333333;
  --border-color: #e0e0e0;
  --toolbar-bg: #f5f5f5;
  --tool-btn-bg: #ffffff;
  --tool-btn-hover: #eaeaea;
  --menu-bg: #ffffff;
  --menu-item-hover: #f0f0f0;
  --table-header-bg: #f5f5f5;
  --table-row-even-bg: #f9f9f9;
}

[data-theme="dark"] {
  --bg-color: #1e1e1e;
  --text-color: #e0e0e0;
  --border-color: #444444;
  --toolbar-bg: #2d2d2d;
  --tool-btn-bg: #3d3d3d;
  --tool-btn-hover: #4d4d4d;
  --menu-bg: #3d3d3d;
  --menu-item-hover: #4d4d4d;
  --table-header-bg: #3d3d3d;
  --table-row-even-bg: #2d2d2d;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-color);
}

/* 工具栏样式 */
.toolbar {
  padding: 8px 15px;
  background-color: var(--toolbar-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 文件菜单 */
.file-menu-wrapper {
  position: relative;
  display: inline-block;
}

.file-menu-btn {
  padding: 8px 15px;
  background-color: var(--tool-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.file-menu-btn:hover, .file-menu-btn.active {
  background-color: var(--tool-btn-hover);
}

.file-menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 120px;
  background-color: var(--menu-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
  margin-top: 5px;
}

.file-menu-dropdown button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
}

.file-menu-dropdown button:hover {
  background-color: var(--menu-item-hover);
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 格式按钮 */
.format-buttons {
  display: flex;
  gap: 8px;
}

.tool-btn {
  padding: 8px 12px;
  background-color: var(--tool-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tool-btn:hover {
  background-color: var(--tool-btn-hover);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 字体设置 */
.font-settings {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

.font-select, .size-select {
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--tool-btn-bg);
  color: var(--text-color);
}

.theme-btn {
  padding: 6px 12px;
  background-color: var(--tool-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

/* 编辑器区域 */
.editor-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor, .preview {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.editor img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer;
}

.editor {
  padding: 20px;
  border-right: 1px solid var(--border-color);
  resize: none;
  line-height: 1.6;
  background-color: var(--bg-color);
  color: var(--text-color);
  outline: none;
  min-height: 200px;
  white-space: pre-wrap;
}

.editor-image {
  max-width: 100px;
  max-height: 100px;
  vertical-align: middle;
  margin: 0 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: pre-wrap;
}

.preview {
  padding: 20px;
  overflow: auto;             /* 超出时显示滚动条 */
  word-break: break-word;     /* 长文本自动换行 */
}

/* 预览区域Markdown样式 */
.preview table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  display: block;
  overflow-x: auto;
}

.preview th, .preview td {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
}

.preview th {
  background-color: var(--table-header-bg);
  font-weight: bold;
}

.preview tr:nth-child(even) {
  background-color: var(--table-row-even-bg);
}

.preview h1, .preview h2, .preview h3 {
  margin: 20px 0 10px;
}

.preview ul, .preview ol {
  padding-left: 30px;
  margin: 10px 0;
}

.preview code {
  background-color: rgba(215, 215, 215, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Consolas', monospace;
}

.preview pre {
  background-color: rgba(215, 215, 215, 0.2);
  padding: 16px;
  border-radius: 3px;
  overflow: auto;
  margin: 10px 0;
}

.preview blockquote {
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
  padding: 0 1em;
  margin: 10px 0;
}

.preview img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s ease;
}

.preview img:hover {
  transform: scale(1.03);     /* 悬停轻微放大 */
  box-shadow: 0 6px 16px rgba(0,0,0,0.2); /* 悬停阴影加深 */
}

</style>
