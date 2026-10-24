<template><div class="file-manager" :class="{dark:isDark}">
<template v-if="authReady && authenticated">
<Toolbar :dark="isDark" @toggle-theme="toggleTheme" @lock="lockApp"/><NavigationBar/><Explorer :dark="isDark"/>
<BottomToolbar :can-download="!!library.selectedFile.value" :can-edit="library.canEdit.value" :can-paste="library.canPaste.value" @add="addItem" @rename="renameItem" @new-file="newFile" @download="downloadFile" @copy="library.copySelection" @cut="library.cutSelection" @paste="pasteClipboard" @delete="deleteItem" @info="showInfo"/>
<InputDialog v-model="showInput" :title="dialogTitle" :value="dialogValue" @ok="onInputOk"/><ConfirmDialog v-model="showConfirm" :title="confirmTitle" :message="confirmMessage" @confirm="onDeleteConfirm"/><FileDialog v-model="showFileDialog" title="New Virtual File" :name="fileName" :url="fileUrl" @ok="onFileOk"/><InfoDialog v-model="showInfoDialog" :item="library.selectedFile.value||library.selectedFolder.value"/>
<div v-if="error" class="toast-error" role="alert"><span>{{error}}</span><button type="button" @click="error=''">Dismiss</button></div>
</template>
<section v-else class="login-stage">
  <div v-if="!authReady" class="login-card loading-card"><span class="login-mark">AmirFile</span><p>Checking secure access…</p></div>
  <form v-else class="login-card" @submit.prevent="submitLogin">
    <span class="login-mark">AmirFile</span><p class="login-description">Your personal file manager</p>
    <label for="amirfile-password">Access password</label>
    <input id="amirfile-password" v-model="loginPassword" type="password" autocomplete="current-password" placeholder="Enter your AmirFile password" :disabled="loginBusy" required />
    <p v-if="loginError" class="login-error" role="alert">{{loginError}}</p>
    <button class="unlock-button" type="submit" :disabled="loginBusy || !loginPassword">{{loginBusy ? "Unlocking…" : "Unlock AmirFile"}}</button>
    <p class="login-footnote">Access is protected by a private session.</p>
  </form>
</section>
</div></template>
<script setup lang="ts">
import {ref,onMounted} from "vue";import {useLibrary} from "../stores/library";import api from "../services/api";import FileDialog from "./FileDialog.vue";import Toolbar from "./Toolbar.vue";import Explorer from "./Explorer.vue";import BottomToolbar from "./BottomToolbar.vue";import NavigationBar from "./NavigationBar.vue";import InputDialog from "./InputDialog.vue";import ConfirmDialog from "./ConfirmDialog.vue";import InfoDialog from "./InfoDialog.vue";
const library=useLibrary(),showInput=ref(false),showConfirm=ref(false),dialogTitle=ref(""),dialogValue=ref(""),confirmTitle=ref("Delete"),confirmMessage=ref("Delete the selected item?"),showFileDialog=ref(false),showInfoDialog=ref(false),fileName=ref(""),fileUrl=ref(""),error=ref("");
const isDark=ref(typeof localStorage!=="undefined"&&localStorage.getItem("amirfile-theme")==="dark");
const authenticated=ref(false),authReady=ref(false),loginPassword=ref(""),loginError=ref(""),loginBusy=ref(false);
function toggleTheme(){isDark.value=!isDark.value;localStorage.setItem("amirfile-theme",isDark.value?"dark":"light")}
function addItem(){library.clearSelection();dialogTitle.value="New Folder";dialogValue.value="";showInput.value=true}
function showInfo(){if(library.canEdit.value)showInfoDialog.value=true}
function newFile(){if(!library.currentFolder.value){window.alert("Please open a folder first.");return}fileName.value="";fileUrl.value="";showFileDialog.value=true}
function renameItem(){if(library.selectedFolder.value){dialogTitle.value="Rename Folder";dialogValue.value=library.selectedFolder.value.name;showInput.value=true}else if(library.selectedFile.value){dialogTitle.value="Rename File";dialogValue.value=library.selectedFile.value.name;showInput.value=true}}
function deleteItem(){if(library.selectedFolder.value){confirmTitle.value="Delete Folder";confirmMessage.value='Delete "'+library.selectedFolder.value.name+'"?';showConfirm.value=true}else if(library.selectedFile.value){confirmTitle.value="Delete File";confirmMessage.value='Delete "'+library.selectedFile.value.name+'"?';showConfirm.value=true}}
async function onDeleteConfirm(){try{if(library.selectedFolder.value){await library.deleteFolder(library.selectedFolder.value.id);library.clearSelection()}else if(library.selectedFile.value){await library.deleteFile(library.selectedFile.value.id);library.clearSelection()}}catch(e){setError(e)}}
async function onInputOk(name:string){const n=name.trim();if(!n)return;try{if(library.selectedFolder.value){await library.renameFolder(library.selectedFolder.value.id,n);library.clearSelection()}else if(library.selectedFile.value){await library.renameFile(library.selectedFile.value.id,n);library.clearSelection()}else await library.createFolder(n)}catch(e){setError(e)}}
async function onFileOk(file:{name:string;stream_url:string}){try{await library.createFile(file)}catch(e){setError(e)}}
async function pasteClipboard(){try{await library.pasteSelection()}catch(e){setError(e)}}
async function downloadFile(){const file=library.selectedFile.value;if(!file)return;try{await navigator.clipboard.writeText(file.stream_url);window.alert("URL copied to clipboard")}catch{window.alert("Clipboard access failed")}}
function setError(e:unknown){console.error(e);error.value=e instanceof Error?e.message:"The request failed. Check the AmirFile configuration and try again."}
async function submitLogin(){loginBusy.value=true;loginError.value="";try{await api.login(loginPassword.value);authenticated.value=true;loginPassword.value="";try{await library.loadFolders()}catch(e){setError(e)}}catch(e){loginError.value=e instanceof Error?e.message:"Could not unlock AmirFile."}finally{loginBusy.value=false}}
async function lockApp(){try{await api.logout()}catch(e){loginError.value=e instanceof Error?e.message:"Could not close the session."}authenticated.value=false;loginPassword.value="";loginError.value="";library.clearSelection()}
onMounted(async()=>{try{authenticated.value=await api.getAuthState();if(authenticated.value){try{await library.loadFolders()}catch(e){setError(e)}}}catch(e){loginError.value=e instanceof Error?e.message:"Could not check access settings."}finally{authReady.value=true}})
</script>
<style scoped>
.file-manager{--surface-1:#f7f9fb;--surface-2:#e7ebef;--surface-3:#d9e0e6;--content-bg:#fff;--header-bg-1:#e3eaf1;--header-bg-2:#d8e1e9;--button-bg:#f8fafc;--button-hover:#e7eef5;--button-active:#e2ebf3;--input-bg:#fff;--dialog-bg:#f7f9fb;--border:#c4cbd2;--border-strong:#aebdcb;--border-subtle:#e2e6ea;--text-1:#26323d;--text-2:#5c6b78;--text-3:#84919c;--accent:#58728e;--accent-strong:#2e6598;--row-hover:#f3f7fa;--row-selected:#e5f0fa;--danger:#d53b3b;--danger-soft:#f2dddd;--disabled:#aeb7bf;width:100%;height:100dvh;min-height:0;display:flex;flex-direction:column;overflow:hidden;position:relative;background:var(--content-bg);color:var(--text-1);transition:background .18s,color .18s}
.file-manager.dark{--surface-1:#303943;--surface-2:#252d35;--surface-3:#1f262d;--content-bg:#171d23;--header-bg-1:#303b46;--header-bg-2:#28323c;--button-bg:#2a333d;--button-hover:#34414d;--button-active:#394a5a;--input-bg:#1c232a;--dialog-bg:#252d35;--border:#465462;--border-strong:#607080;--border-subtle:#303a44;--text-1:#e7edf2;--text-2:#b4c0ca;--text-3:#82909d;--accent:#8eabc3;--accent-strong:#76a9d0;--row-hover:#202930;--row-selected:#263d50;--danger:#f06464;--danger-soft:#4b2c2c;--disabled:#5c6873}
.toast-error{position:fixed;right:16px;bottom:110px;z-index:2000;max-width:min(520px,calc(100vw - 32px));display:flex;gap:14px;align-items:center;padding:12px 14px;border:1px solid var(--danger);border-radius:8px;background:var(--dialog-bg);color:var(--text-1);box-shadow:0 8px 24px #0003}.toast-error button{border:0;background:transparent;color:var(--accent-strong);font-weight:700;cursor:pointer}
.login-stage{flex:1;min-height:0;display:grid;place-items:center;overflow:auto;padding:24px;background:linear-gradient(145deg,var(--surface-1),var(--surface-2))}
.login-card{box-sizing:border-box;width:min(400px,100%);padding:30px;border:1px solid var(--border-strong);border-radius:14px;background:var(--dialog-bg);color:var(--text-1);box-shadow:0 18px 55px #1b2c3d24;display:flex;flex-direction:column;gap:13px}
.login-mark{font-family:Georgia,"Times New Roman",serif;font-size:29px;font-weight:700;text-align:center;color:var(--accent-strong)}
.login-description{text-align:center;margin:0 0 7px;color:var(--text-2);font-size:14px}
.login-card label{font-size:13px;font-weight:700;color:var(--text-2)}
.login-card input{width:100%;min-width:0;padding:12px;border:1px solid var(--border-strong);border-radius:7px;background:var(--input-bg);color:var(--text-1);outline:none}
.login-card input:focus{border-color:var(--accent-strong);box-shadow:0 0 0 3px #5d89ae22}
.unlock-button{padding:11px;border:1px solid #4f7da3;border-radius:7px;background:#5d89ae;color:white;font-weight:700;cursor:pointer}
.unlock-button:disabled{opacity:.55;cursor:wait}
.login-error{margin:0;padding:10px;border:1px solid var(--danger);border-radius:7px;background:var(--danger-soft);color:var(--danger);font-size:12px;line-height:1.5;overflow-wrap:anywhere}
.login-footnote{margin:4px 0 0;text-align:center;color:var(--text-3);font-size:11px}
.loading-card{text-align:center;align-items:center}.loading-card p{margin:0;color:var(--text-2)}
</style>