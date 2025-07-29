<template>
  <div class="toolbar">
    <button 
      v-for="btn in buttons" 
      :key="btn.name"
      @click="handleButtonClick(btn)"
      :disabled="btn.requiresSelection && !hasSelection"
      class="tool-btn"
    >
      {{ btn.name }}
    </button>
  </div>
</template>

<script>
export default {
  props: ['buttons', 'hasSelection'],
  methods: {
    handleButtonClick(btn) {
      if (btn.action === 'image') {
        this.$emit('image-select');
      } else {
        this.$emit('format', btn.action);
      }
    }
  }
}
</script>