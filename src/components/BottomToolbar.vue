<template>
  <footer class="bottom-toolbar" aria-label="File actions">
    <button class="tool-button primary" type="button" title="New Folder" @click="$emit('add')"><span class="tool-icon">＋</span><span class="tool-label">New Folder</span></button>
    <button class="tool-button" type="button" :disabled="!canEdit" title="Rename" @click="$emit('rename')"><span class="tool-icon">✎</span><span class="tool-label">Rename</span></button>
    <button class="tool-button" type="button" :disabled="!canEdit" title="Copy" @click="$emit('copy')"><span class="tool-icon">▢</span><span class="tool-label">Copy</span></button>
    <button class="tool-button" type="button" :disabled="!canEdit" title="Cut" @click="$emit('cut')"><span class="tool-icon">✂</span><span class="tool-label">Cut</span></button>
    <button class="tool-button" type="button" :disabled="!canPaste" title="Paste" @click="$emit('paste')"><span class="tool-icon">▤</span><span class="tool-label">Paste</span></button>
    <button class="tool-button newfile" type="button" title="New File" @click="$emit('new-file')"><span class="tool-icon">⇧</span><span class="tool-label">New File</span></button>
    <button class="tool-button" type="button" :disabled="!canUpload" title="Upload" @click="$emit('upload')"><span class="tool-icon">⇧</span><span class="tool-label">Upload</span></button>
    <button class="tool-button" type="button" :disabled="!canDownload" title="Copy URL" @click="$emit('download')"><span class="tool-icon">↧</span><span class="tool-label">URL</span></button>
    <button class="tool-button danger" type="button" :disabled="!canEdit" title="Delete" @click="$emit('delete')"><span class="tool-icon">⌫</span><span class="tool-label">Delete</span></button>
    <button class="tool-button" type="button" :disabled="!canEdit" title="Info" @click="$emit('info')"><span class="tool-icon">ⓘ</span><span class="tool-label">Info</span></button>
  </footer>
</template>
<script setup lang="ts">
defineProps<{canDownload?:boolean;canEdit?:boolean;canPaste?:boolean;canUpload?:boolean}>();
defineEmits<{(event:"add"):void;(event:"rename"):void;(event:"new-file"):void;(event:"delete"):void;(event:"download"):void;(event:"upload"):void;(event:"copy"):void;(event:"cut"):void;(event:"paste"):void;(event:"info"):void}>();
</script>
<style scoped>
.bottom-toolbar{min-height:94px;display:flex;justify-content:center;align-items:stretch;gap:4px;padding:8px 12px 10px;background:linear-gradient(180deg,var(--surface-1),var(--surface-3));border-top:1px solid var(--border);box-shadow:0 -2px 6px #0001;color:var(--accent);flex-shrink:0}
.tool-button{min-width:82px;flex:0 1 92px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;padding:5px 8px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--accent);cursor:pointer;transition:background .15s,border-color .15s,color .15s}
.tool-button:hover:not(:disabled){background:var(--button-hover);border-color:var(--border);color:var(--accent-strong)}.tool-icon{height:34px;display:grid;place-items:center;font-size:27px}.tool-label{font-size:13px;line-height:18px;font-weight:600;white-space:nowrap}.danger{color:var(--danger)}.tool-button:disabled{color:var(--disabled);cursor:default}
@media(max-width:850px){.bottom-toolbar{overflow-x:auto;justify-content:flex-start}.tool-button{flex:0 0 82px}}
</style>