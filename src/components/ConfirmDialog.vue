<template>
<div v-if="modelValue" class="overlay" @click.self="close"><div class="dialog" role="dialog" aria-modal="true" :aria-label="title"><div class="dialog-header"><div class="warning-icon">!</div><h3>{{title}}</h3></div><p>{{message}}</p><div class="buttons"><button class="secondary" type="button" @click="close">Cancel</button><button class="danger" type="button" @click="confirm">Delete</button></div></div></div>
</template>
<script setup lang="ts">
defineProps<{modelValue:boolean;title:string;message:string}>();const emit=defineEmits(["update:modelValue","confirm"]);
function close(){emit("update:modelValue",false)}function confirm(){emit("confirm");close()}
</script>
<style scoped>
.overlay{position:fixed;inset:0;z-index:1000;display:flex;justify-content:center;align-items:center;padding:20px;background:#0007;backdrop-filter:blur(2px)}
.dialog{width:min(390px,100%);padding:20px;border:1px solid var(--border-strong);border-radius:10px;background:var(--dialog-bg);color:var(--text-1);box-shadow:0 16px 45px #1a273440}
.dialog-header{display:flex;align-items:center;gap:10px}.warning-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--danger-soft);color:var(--danger);font-weight:800}
h3{margin:0;font-size:17px}p{margin:16px 0 0;color:var(--text-2);line-height:1.5}.buttons{display:flex;justify-content:flex-end;gap:9px;margin-top:20px}button{min-width:78px;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600}.secondary{border:1px solid var(--border-strong);background:var(--button-bg);color:var(--text-2)}.danger{border:1px solid #c53b3b;background:#d84a4a;color:#fff}
</style>