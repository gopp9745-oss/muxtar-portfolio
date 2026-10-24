import { useEffect, useState } from 'react'
import { Save, Upload } from 'lucide-react'
import { requireSupabase } from '../../lib/supabase'
import { getProfile, saveProfile } from '../../lib/portfolio'
import type { ArtistProfile } from '../../types/portfolio'

const initial: Omit<ArtistProfile, 'id'> = { name: 'MUXTAR', subtitle: '3D ARTIST / DIGITAL ART', tagline: 'Crafting digital objects, characters and worlds.', bio: '', specialization: '', skills: [], software: [], interests: [], email: '', artstation: '', behance: '', instagram: '', other_links: [], hero_image_path: null, show_about: true, show_contact: true }
const list = (value: string) => value.split(',').map((part) => part.trim()).filter(Boolean)

export default function ProfileEditorPage() {
  const [profile, setProfile] = useState(initial)
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  useEffect(() => { getProfile().then(({ id: _id, ...item }) => setProfile({ ...initial, ...item })).catch((error: Error) => setStatus(error.message)) }, [])
  useEffect(() => { if (!heroFile) return; const url = URL.createObjectURL(heroFile); setPreview(url); return () => URL.revokeObjectURL(url) }, [heroFile])
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('')
    try {
      let heroPath = profile.hero_image_path
      if (heroFile) {
        if (heroFile.size > 12 * 1024 * 1024) throw new Error('Изображение должно быть меньше 12 МБ.')
        const path = `${crypto.randomUUID()}-${heroFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
        const { error } = await requireSupabase().storage.from('portfolio-media').upload(path, heroFile, { contentType: heroFile.type })
        if (error) throw error
        heroPath = path
      }
      await saveProfile({ ...profile, hero_image_path: heroPath })
      setProfile({ ...profile, hero_image_path: heroPath }); setHeroFile(null); setStatus('Настройки сохранены.')
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Не удалось сохранить профиль.') }
    finally { setBusy(false) }
  }
  const update = <K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) => setProfile((current) => ({ ...current, [key]: value }))
  return <div className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">КОНТЕНТ / НАСТРОЙКИ</p><h1>Профиль сайта</h1><p>Редактируйте данные, которые видны посетителям.</p></div></div><form className="editor-form" onSubmit={save}><section className="form-section"><h2>Бренд и первый экран</h2><div className="form-grid"><label>Название<input value={profile.name} onChange={(event) => update('name', event.target.value)} /></label><label>Подзаголовок<input value={profile.subtitle} onChange={(event) => update('subtitle', event.target.value)} /></label><label className="field-full">Слоган<input value={profile.tagline} onChange={(event) => update('tagline', event.target.value)} /></label><label className="upload-label field-full">Главное изображение первого экрана<span className="upload-box profile-upload">{preview ? <img src={preview} alt="Предпросмотр" /> : profile.hero_image_path ? <img src={requireSupabase().storage.from('portfolio-media').getPublicUrl(profile.hero_image_path).data.publicUrl} alt="Текущее главное изображение" /> : <><Upload /><span>Загрузить рендер</span></>}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setHeroFile(event.target.files?.[0] ?? null)} /></span></label></div></section><section className="form-section"><h2>О художнике</h2><div className="form-grid"><label>Имя / псевдоним<input value={profile.name} onChange={(event) => update('name', event.target.value)} /></label><label>Специализация<input value={profile.specialization} onChange={(event) => update('specialization', event.target.value)} /></label><label className="field-full">Биография<textarea rows={5} value={profile.bio} onChange={(event) => update('bio', event.target.value)} /></label><label>Навыки через запятую<input value={profile.skills.join(', ')} onChange={(event) => update('skills', list(event.target.value))} /></label><label>Инструменты через запятую<input value={profile.software.join(', ')} onChange={(event) => update('software', list(event.target.value))} /></label><label className="field-full">Профессиональные интересы через запятую<input value={profile.interests.join(', ')} onChange={(event) => update('interests', list(event.target.value))} /></label></div></section><section className="form-section"><h2>Контакты</h2><div className="form-grid"><label>Email<input type="email" value={profile.email} onChange={(event) => update('email', event.target.value)} /></label><label>ArtStation URL<input type="url" value={profile.artstation} onChange={(event) => update('artstation', event.target.value)} /></label><label>Behance URL<input type="url" value={profile.behance} onChange={(event) => update('behance', event.target.value)} /></label><label>Instagram URL<input type="url" value={profile.instagram} onChange={(event) => update('instagram', event.target.value)} /></label></div></section><section className="form-section"><h2>Видимость секций</h2><div className="visibility-options"><label><input type="checkbox" checked={profile.show_about} onChange={(event) => update('show_about', event.target.checked)} /> Показывать секцию «Обо мне»</label><label><input type="checkbox" checked={profile.show_contact} onChange={(event) => update('show_contact', event.target.checked)} /> Показывать секцию контактов</label></div></section>{status && <div className={status.includes('сохранены') ? 'notice notice-success' : 'notice notice-error'}>{status}</div>}<div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? 'Сохранение…' : <><Save size={16} /> Сохранить настройки</>}</button></div></form></div>
}
