import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

const DOCUMENT_BUCKET = "documents";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isPublicAppPath(value: string): boolean {
  return value.startsWith("/");
}

/**
 * Converts a private Supabase object path into a short-lived URL.
 * Legacy absolute URLs remain supported so existing records keep working.
 */
export async function resolveStoredFileUrl(fileUrl: string): Promise<string> {
  if (!fileUrl || isAbsoluteUrl(fileUrl) || isPublicAppPath(fileUrl)) return fileUrl;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(fileUrl, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("Could not create signed document URL", error);
    return "";
  }

  return data.signedUrl;
}

export async function resolveStoredFileUrls<T extends { fileUrl: string }>(records: T[]): Promise<T[]> {
  return Promise.all(
    records.map(async (record) => ({
      ...record,
      fileUrl: await resolveStoredFileUrl(record.fileUrl),
    }))
  );
}

/** Removes the private object when its database metadata is deleted. */
export async function deleteStoredFile(fileUrl: string): Promise<void> {
  if (!fileUrl || isAbsoluteUrl(fileUrl) || isPublicAppPath(fileUrl)) return;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).remove([fileUrl]);
  if (error) console.error("Could not remove stored document", error);
}
