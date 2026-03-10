import { supabase } from '@/lib/supabase'

const BUCKET = 'receipts'

export function useStorage() {
  async function uploadReceipt(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const path = `family/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '31536000',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  async function deleteReceipt(url: string): Promise<void> {
    const prefix = `/storage/v1/object/public/${BUCKET}/`
    const idx = url.indexOf(prefix)
    if (idx === -1) return

    const path = url.slice(idx + prefix.length)
    await supabase.storage.from(BUCKET).remove([path])
  }

  return { uploadReceipt, deleteReceipt }
}
