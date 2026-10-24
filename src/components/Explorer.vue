<template><main class="explorer"><FolderList v-if="library.currentFolder.value===null"/><FileList v-else :files="library.files.value" :dark="dark"/></main></template>
<script setup lang="ts">
import FolderList from "./FolderList.vue";import FileList from "./FileList.vue";import {useLibrary} from "../stores/library";const props=defineProps<{dark:boolean}>();const dark=props.dark;const library=useLibrary();
</script>
<style scoped>.explorer{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:var(--content-bg)}</style>