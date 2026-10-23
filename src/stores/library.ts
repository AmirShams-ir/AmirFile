import { ref, computed } from "vue";
import api from "../services/api";
import type { Folder, MediaFile } from "../types/media";

const selectedFolder = ref<Folder | null>(null);
const selectedFile = ref<MediaFile | null>(null);
const currentFolder = ref<string | null>(null);
const folders = ref<Folder[]>([]);
const files = ref<MediaFile[]>([]);
type ClipboardItem =
  | { kind: "folder"; action: "copy" | "cut"; item: Folder }
  | { kind: "file"; action: "copy" | "cut"; item: MediaFile };
const clipboard = ref<ClipboardItem | null>(null);

const visibleFolders = computed(() => folders.value.filter((f) => f.parent_id === currentFolder.value));
const currentFolderRecord = computed(() => currentFolder.value === null ? null : folders.value.find((f) => f.id === currentFolder.value) ?? null);
const currentPath = computed(() => {
  const path: Folder[] = [], visited = new Set<string>();
  let folder = currentFolderRecord.value;
  while (folder && !visited.has(folder.id)) {
    path.unshift(folder); visited.add(folder.id);
    folder = folder.parent_id === null ? null : folders.value.find((f) => f.id === folder!.parent_id) ?? null;
  }
  return path;
});
const canGoBack = computed(() => currentFolder.value !== null);
const canEdit = computed(() => !!selectedFolder.value || !!selectedFile.value);
const canPaste = computed(() => {
  if (!clipboard.value) return false;
  if (clipboard.value.kind === "file") return currentFolder.value !== null;
  const sourceId = clipboard.value.item.id;
  if (currentFolder.value === sourceId) return false;
  let parent = currentFolder.value; const visited = new Set<string>();
  while (parent !== null && !visited.has(parent)) {
    if (parent === sourceId) return false;
    visited.add(parent);
    parent = folders.value.find((f) => f.id === parent)?.parent_id ?? null;
  }
  return true;
});
function selectFolder(folder: Folder) { selectedFolder.value = folder; selectedFile.value = null; }
function selectFile(file: MediaFile) { selectedFile.value = file; selectedFolder.value = null; }
function clearSelection() { selectedFolder.value = null; selectedFile.value = null; }
async function loadFolders() {
  folders.value = await api.getFolders();
  if (currentFolder.value !== null && !folders.value.some((f) => f.id === currentFolder.value)) {
    currentFolder.value = null; files.value = []; clearSelection();
  }
}
async function navigateToFolder(folderId: string | null) {
  currentFolder.value = folderId; clearSelection();
  files.value = folderId === null ? [] : await api.getFiles(folderId);
}
async function openFolder(id: string) { await navigateToFolder(id); }
async function goRoot() { await navigateToFolder(null); }
async function goBack() {
  if (currentFolder.value === null) return;
  await navigateToFolder(currentFolderRecord.value?.parent_id ?? null);
}
async function createFolder(name: string) {
  await api.createFolder({ parent_id: currentFolder.value, name, icon: "📁" }); await refresh();
}
async function renameFolder(id: string, name: string) { await api.renameFolder(id, name); await refresh(); }
async function renameFile(id: string, name: string) {
  const file = files.value.find((f) => f.id === id); if (!file) return;
  await api.renameFile(id, name, file.stream_url); await refresh();
}
function folderTreeIds(rootId: string) {
  const ids: string[] = [], stack = [rootId], visited = new Set<string>();
  while (stack.length) {
    const id = stack.pop(); if (!id || visited.has(id)) continue;
    visited.add(id); ids.push(id);
    for (const folder of folders.value) if (folder.parent_id === id) stack.push(folder.id);
  }
  return ids;
}
async function deleteFolder(id: string) {
  const ids = folderTreeIds(id);
  for (const folderId of ids) for (const file of await api.getFiles(folderId)) await api.deleteFile(file.id);
  for (const folderId of [...ids].reverse()) await api.deleteFolder(folderId);
  await refresh();
}
async function deleteFile(id: string) { await api.deleteFile(id); await refresh(); }
async function refresh() {
  await loadFolders();
  files.value = currentFolder.value ? await api.getFiles(currentFolder.value) : [];
}
async function createFile(data: { name: string; stream_url: string }) {
  if (!currentFolder.value) return;
  await api.createFile({ folder_id: currentFolder.value, name: data.name, stream_url: data.stream_url, icon: "🎬" });
  files.value = await api.getFiles(currentFolder.value);
}
async function uploadFile(file: File) {
  if (!currentFolder.value) throw new Error("Open a folder before uploading.");
  await api.uploadFile(currentFolder.value, file);
  files.value = await api.getFiles(currentFolder.value);
}
function copySelection() {
  if (selectedFolder.value) clipboard.value = { kind: "folder", action: "copy", item: selectedFolder.value };
  else if (selectedFile.value) clipboard.value = { kind: "file", action: "copy", item: selectedFile.value };
}
function cutSelection() {
  if (selectedFolder.value) clipboard.value = { kind: "folder", action: "cut", item: selectedFolder.value };
  else if (selectedFile.value) clipboard.value = { kind: "file", action: "cut", item: selectedFile.value };
}
function copiedName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? `${name.slice(0, dot)} (copy)${name.slice(dot)}` : `${name} (copy)`;
}
async function copyFolderTree(source: Folder, parentId: string | null, name: string) {
  const newId = crypto.randomUUID();
  await api.createFolder({ id: newId, parent_id: parentId, name, icon: source.icon || "📁" });
  for (const file of await api.getFiles(source.id)) {
    await api.createFile({ folder_id: newId, name: file.name, stream_url: file.stream_url, icon: file.icon || "🎬" });
  }
  for (const child of folders.value.filter((f) => f.parent_id === source.id)) await copyFolderTree(child, newId, child.name);
}
async function pasteSelection() {
  if (!clipboard.value || !canPaste.value) return;
  const entry = clipboard.value;
  if (entry.kind === "folder") {
    if (entry.action === "copy") await copyFolderTree(entry.item, currentFolder.value, copiedName(entry.item.name));
    else await api.moveFolder(entry.item.id, currentFolder.value);
  } else {
    if (currentFolder.value === null) return;
    if (entry.action === "copy") {
      await api.createFile({ folder_id: currentFolder.value, name: copiedName(entry.item.name), stream_url: entry.item.stream_url, icon: entry.item.icon || "🎬" });
    } else await api.moveFile(entry.item.id, currentFolder.value);
  }
  if (entry.action === "cut") clipboard.value = null;
  await refresh(); clearSelection();
}
export function useLibrary() {
  return { folders, visibleFolders, files, currentFolder, currentFolderRecord, currentPath, canGoBack, loadFolders, navigateToFolder,
    openFolder, goRoot, goBack, createFolder, renameFolder, renameFile, deleteFolder, deleteFile, selectedFolder, selectedFile,
    selectFolder, selectFile, clearSelection, createFile, uploadFile, refresh, clipboard, canEdit, canPaste, copySelection, cutSelection, pasteSelection };
}
