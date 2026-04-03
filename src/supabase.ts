import { createClient } from "@supabase/supabase-js";

// Hardcode trực tiếp — publishable key, an toàn cho frontend
const supabase = createClient(
  "https://rzggxxagjddssznybprr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Z2d4eGFnamRkc3N6bnlicHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4Mjc2NjEsImV4cCI6MjA5MDQwMzY2MX0.Kdb7HUt_k63RDmsXuqKCNT-yhnF60h1qCFJWCf6cVwM",
);

export { supabase };

export async function uploadMusic(file: File): Promise<string | null> {
  try {
    const fileName = `music/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data, error } = await supabase.storage
      .from("game-assets")
      .upload(fileName, file, { cacheControl: "3600", upsert: true });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from("game-assets")
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    console.error("Upload failed:", e);
    return null;
  }
}
