<template><div v-if="open" class="context-menu" :class="{ dark }" :style="{ left: x + 'px', top: y + 'px' }" role="menu" @click.stop>
  <button type="button" class="menu-item" @click="$emit('play-vlc')"><span class="menu-icon">▶</span>Play By VLC</button>
  <button type="button" class="menu-item" @click="$emit('play-mx')"><span class="menu-icon">▶</span>Play By MXPlayer</button>
  <button type="button" class="menu-item" @click="$emit('copy-url')"><span class="menu-icon">🔗</span>Copy URL</button>
</div></template>

<script setup lang="ts">
defineProps<{ open: boolean; x: number; y: number; dark: boolean }>();
defineEmits<{ (event: "play-vlc"): void; (event: "play-mx"): void; (event: "copy-url"): void }>();
</script>

<style scoped>
.context-menu {
  --menu-background: #f7f9fb;
  --menu-border: #c4cbd2;
  --menu-text: #26323d;
  --menu-hover: #e7eef5;
  --menu-icon: #2e6598;
  position: fixed;
  z-index: 2147483647;
  min-width: 190px;
  padding: 6px;
  border: 1px solid var(--menu-border);
  border-radius: 8px;
  background: var(--menu-background);
  color: var(--menu-text);
  box-shadow: 0 10px 28px #14233326;
}
.context-menu.dark {
  --menu-background: #252d35;
  --menu-border: #465462;
  --menu-text: #e7edf2;
  --menu-hover: #34414d;
  --menu-icon: #76a9d0;
  box-shadow: 0 10px 28px #0007;
}
.menu-item {
  width: 100%;
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 11px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--menu-text);
  text-align: left;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.menu-item:hover {
  background: var(--menu-hover);
  color: var(--menu-text);
}
.menu-icon {
  width: 20px;
  flex: 0 0 20px;
  display: inline-grid;
  place-items: center;
  color: var(--menu-icon);
}
</style>