"use client";

import { createClient } from "@/lib/supabase/client";

export interface UploadedFile {
  /** Private object path stored in the database. */
  url: string;
  path: string;
  size: number;
  mimeType: string;
  name: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const SAFE_EXTENSION = /^[a-z0-9]{1,10}$/i;

/** Uploads a document to the private Supabase `documents` bucket. */
export async function uploadDocumentFile(file: File): Promise<UploadedFile> {
  if (file.size <= 0) throw new Error("The selected file is empty.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Maximum file size is 25 MB.");

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Your session expired. Please sign in again.");

  const rawExtension = file.name.includes(".") ? file.name.split(".").pop() ?? "bin" : "bin";
  const extension = SAFE_EXTENSION.test(rawExtension) ? rawExtension.toLowerCase() : "bin";
  const yearMonth = new Date().toISOString().slice(0, 7);
  const path = `${user.id}/${yearMonth}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("documents").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;

  return {
    url: path,
    path,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    name: file.name,
  };
}
