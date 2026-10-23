<template><div v-if="open" class="context-menu" :style="{left:x+'px',top:y+'px'}" role="menu" @click.stop>
<button type="button" class="menu-item" @click="$emit('play-vlc')"><span class="menu-icon">▶</span>Play By VLC</button>
<button type="button" class="menu-item" @click="$emit('play-mx')"><span class="menu-icon">▶</span>Play By MXPlayer</button>
<button type="button" class="menu-item" @click="$emit('copy-url')"><span class="menu-icon">🔗</span>Copy URL</button></div></template>
<script setup lang="ts">
defineProps<{open:boolean;x:number;y:number}>();
defineEmits<{(event:"play-vlc"):void;(event:"play-mx"):void;(event:"copy-url"):void}>();
</script>
<style scoped>
.context-menu{position:fixed;z-index:2147483647;min-width:190px;padding:6px;border:1px solid #465462;border-radius:8px;background:#252d35;box-shadow:0 10px 28px #0007}
.menu-item{width:100%;min-height:38px;display:flex;align-items:center;gap:10px;padding:0 11px;border:0;border-radius:6px;background:#252d35;color:#f1f5f9;text-align:left;font:inherit;font-size:14px;font-weight:600;cursor:pointer}.menu-item:hover{background:#34414d;color:white}.menu-icon{width:20px;flex:0 0 20px;display:inline-grid;place-items:center;color:#76a9d0}
</style>