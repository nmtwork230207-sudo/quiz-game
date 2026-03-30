import { createClient } from '@supabase/supabase-js'

// Đọc từ .env hoặc hardcode (xem hướng dẫn bên dưới)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// Upload file nhạc lên Supabase Storage
export async function uploadMusic(file: File): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase chưa được cấu hình. File sẽ lưu dạng base64 trong localStorage.')
    return null
  }
  try {
    const fileName = `music/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { data, error } = await supabase.storage
      .from('game-assets')
      .upload(fileName, file, { cacheControl: '3600', upsert: true })
    if (error) { console.error('Upload error:', error); return null }
    const { data: urlData } = supabase.storage.from('game-assets').getPublicUrl(data.path)
    return urlData.publicUrl
  } catch (e) {
    console.error('Upload failed:', e)
    return null
  }
}
