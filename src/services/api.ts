import { upload as uploadToBlob } from "@vercel/blob/client";
import type { MediaFile } from "../types/media";
const API_PREFIX = "/api";
const api = (path: string) => API_PREFIX + path;
type ApiEnvelope<T> = { data: T };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(api(path), { cache: "no-store", credentials: "same-origin", ...init });
  let payload: unknown;
  try { payload = await response.json(); }
  catch {
    throw new Error(`AmirFile API returned a non-JSON response (HTTP ${response.status}). Check that the Vercel API function exists for ${path}.`);
  }
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export interface Folder {
  id: string; parent_id: string | null; name: string; icon: string;
  modified_at?: string | null; created_at?: string | null;
}
export async function getAuthState(): Promise<boolean> {
  const response = await requestJson<{ authenticated: boolean }>("/auth");
  return response.authenticated === true;
}
export async function login(password: string): Promise<void> {
  await requestJson("/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
}
export async function logout(): Promise<void> {
  await requestJson("/auth", { method: "DELETE" });
}
export async function getFolders(): Promise<Folder[]> {
  return (await requestJson<ApiEnvelope<Folder[]>>("/folders")).data;
}
export async function createFolder(data: { id?: string; name: string; parent_id: string | null; icon: string }) {
  return requestJson("/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, id: data.id ?? crypto.randomUUID() }) });
}
export async function renameFolder(id: string, name: string) {
  return requestJson("/folders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name }) });
}
export async function deleteFolder(id: string) {
  return requestJson("/folders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
}
export async function moveFolder(id: string, parent_id: string | null) {
  return requestJson("/folders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, parent_id }) });
}
export async function getFiles(folderId: string): Promise<MediaFile[]> {
  return (await requestJson<ApiEnvelope<MediaFile[]>>("/files?folder=" + encodeURIComponent(folderId))).data;
}
export async function createFile(data: { folder_id: string; name: string; stream_url: string; icon: string }) {
  return requestJson("/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}
export async function uploadFile(folderId: string, file: File) {
  await uploadToBlob(file.name, file, {
    access: "public",
    handleUploadUrl: api("/files/upload"),
    clientPayload: JSON.stringify({ folder_id: folderId }),
  });
}
export async function renameFile(id: string, name: string, stream_url: string) {
  return requestJson("/files", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name, stream_url }) });
}
export async function moveFile(id: string, folder_id: string) {
  return requestJson("/files", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, folder_id }) });
}
export async function deleteFile(id: string) {
  return requestJson("/files", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
}
export async function getFileInfo(id: string) {
  const response = await requestJson<ApiEnvelope<{ type: string; size: number | null; created_at: string | null; modified_at: string | null; url: string; mime: string }>>("/files/" + encodeURIComponent(id) + "/info");
  return response.data;
}
export default {
  getAuthState, login, logout, getFileInfo, getFolders, createFolder, renameFolder, deleteFolder, moveFolder,
  getFiles, createFile, uploadFile, renameFile, moveFile, deleteFile,
};
