<template>
  <div class="file-menu">
    <!-- 抽屉触发按钮 -->
    <button 
      class="tool-btn drawer-trigger"
      @click="toggleDrawer"
      :class="{ 'active': showDrawer }"
    >
      文件操作 ▼
    </button>

    <!-- 抽屉内容 -->
    <transition name="slide-fade">
      <div 
        v-if="showDrawer" 
        class="drawer-content"
        @click.stop
      >
        <button @click="handleMenuClick('save')">保存</button>
        <button @click="handleMenuClick('load')">打开</button>
        <button @click="handleMenuClick('export-html')">导出HTML</button>
        <button @click="handleMenuClick('export-pdf')">导出PDF</button>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showDrawer: false, // 控制抽屉显示
    };
  },
  methods: {
    // 切换抽屉
    toggleDrawer() {
      this.showDrawer = !this.showDrawer;
    },
    // 点击菜单项
    handleMenuClick(action) {
      this.showDrawer = false; // 点击后关闭抽屉
      this.$emit(action); // 触发对应事件
    },
    // 关闭抽屉（点击外部区域）
    closeDrawer(event) {
      if (!this.$el.contains(event.target)) {
        this.showDrawer = false;
      }
    },
  },
  mounted() {
    // 监听点击事件关闭抽屉
    document.addEventListener('click', this.closeDrawer);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeDrawer);
  },
};
</script>

<style scoped>
/* 抽屉触发按钮样式 */
.drawer-trigger {
  margin-right: 10px; /* 与右侧按钮保持间距 */
  width: 120px; /* 固定宽度 */
  text-align: left;
  padding-left: 15px;
}

.drawer-trigger.active {
  background-color: var(--tool-btn-hover);
}

/* 抽屉内容样式 */
.drawer-content {
  position: absolute;
  top: 35px; /* 根据按钮高度调整 */
  left: 0;
  background-color: var(--menu-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  z-index: 1000;
  padding: 8px 0;
}

/* 抽屉按钮样式 */
.drawer-content button {
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
}

.drawer-content button:hover {
  background-color: var(--menu-item-hover);
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* 暗色模式适配 */
[data-theme="dark"] .drawer-content {
  background-color: var(--menu-bg);
  border-color: var(--border-color);
}

/* 主题变量继承 */
:where(.tool-btn) {
  @apply 
    bg-[var(--tool-btn-bg)] 
    hover:bg-[var(--tool-btn-hover)] 
    border-[var(--border-color)] 
    text-[var(--text-color)];
}
</style>
