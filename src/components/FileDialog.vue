<template>
<div v-if="modelValue" class="overlay" @click.self="close"><div class="dialog" role="dialog" aria-modal="true" :aria-label="title">
<div class="dialog-header"><span class="dialog-icon">A</span><div><h3>{{title}}</h3><p class="subtitle">Create a virtual file from a URL.</p></div></div>
<label><span>Name</span><input ref="nameInput" v-model="name" placeholder="File name" autocomplete="off" @keyup.enter="ok"/></label>
<label><span>URL</span><input v-model="url" type="url" placeholder="https://..." autocomplete="off" @keyup.enter="ok"/></label>
<p v-if="error" class="error">{{error}}</p><div class="buttons"><button class="secondary" type="button" @click="close">Cancel</button><button class="primary" type="button" @click="ok">Create</button></div>
</div></div></template>
<script setup lang="ts">
import {ref,watch,nextTick} from "vue";
const props=defineProps<{modelValue:boolean;title:string;name?:string;url?:string}>();
const emit=defineEmits(["update:modelValue","ok"]);const name=ref(""),url=ref(""),error=ref(""),nameInput=ref<HTMLInputElement>();
watch(()=>props.modelValue,async show=>{if(show){name.value=props.name??"";url.value=props.url??"";error.value="";await nextTick();nameInput.value?.focus()}});
function close(){emit("update:modelValue",false)}
function ok(){const n=name.value.trim(),u=url.value.trim();if(!n){error.value="Please enter a file name.";return}if(!u){error.value="Please enter a URL.";return}try{const parsed=new URL(u);if(!["http:","https:"].includes(parsed.protocol))throw new Error()}catch{error.value="Please enter a valid HTTP(S) URL.";return}emit("ok",{name:n,stream_url:u});close()}
</script>
<style scoped>
.overlay{position:fixed;inset:0;z-index:1000;display:flex;justify-content:center;align-items:center;padding:20px;background:#0007;backdrop-filter:blur(2px)}.dialog{box-sizing:border-box;width:min(450px,calc(100vw - 40px));padding:20px;border:1px solid var(--border-strong);border-radius:10px;background:var(--dialog-bg);color:var(--text-1);box-shadow:0 16px 45px #0005}
.dialog-header{display:flex;align-items:center;gap:10px;margin-bottom:15px}.dialog-icon{width:30px;height:30px;display:grid;place-items:center;border:1px solid var(--border);border-radius:7px;background:var(--surface-3);font-family:Georgia,serif;font-weight:700}h3{margin:0;font-size:17px}.subtitle{margin:2px 0 0;color:var(--text-3);font-size:12px}
label{display:block;width:100%;margin-top:12px}label span{display:block;margin-bottom:6px;color:var(--text-2);font-size:13px;font-weight:650}input{box-sizing:border-box;display:block;width:100%;padding:10px 11px;border:1px solid var(--border-strong);border-radius:6px;outline:none;background:var(--input-bg);color:var(--text-1);font:inherit}.error{margin:9px 0 0;color:var(--danger);font-size:12px}.buttons{margin-top:20px;display:flex;justify-content:flex-end;gap:9px}button{min-width:78px;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600}.secondary{border:1px solid var(--border-strong);background:var(--button-bg);color:var(--text-2)}.primary{border:1px solid #4f7da3;background:#5d89ae;color:#fff}
</style>