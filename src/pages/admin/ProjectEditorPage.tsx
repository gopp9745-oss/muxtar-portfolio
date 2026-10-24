import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Save, Trash2, Upload, X } from 'lucide-react'
import { requireSupabase } from '../../lib/supabase'
import type { Project, ProjectCategory, ProjectImage } from '../../types/portfolio'

const categories: ProjectCategory[] = ['Characters', 'Props', 'Environment', 'Product Design', 'Architecture', 'Other']
const imageLimit = 12 * 1024 * 1024
const modelLimit = 50 * 1024 * 1024
const slugify = (text: string) => text.toLowerCase().trim().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const empty: Omit<Project, 'id' | 'created_at' | 'updated_at'> = { title: '', slug: '', category: 'Other', short_description: '', description: '', cover_path: null, images: [], tools: [], year: null, model_path: null, published: false }

export default function ProjectEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [toolsText, setToolsText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loaded, setLoaded] = useState(!id)

  useEffect(() => {
    if (!id) return
    let active = true
    requireSupabase().from('projects').select('*').eq('id', id).single().then(({ data, error: loadError }) => {
      if (!active) return
      if (loadError || !data) setError(loadError?.message ?? 'Проект не найден.')
      else { setForm(data); setToolsText((data.tools ?? []).join(', ')); setLoaded(true) }
    })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!coverFile) return
    const url = URL.createObjectURL(coverFile); setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])
  useEffect(() => {
    const urls = galleryFiles.map((file) => URL.createObjectURL(file)); setGalleryPreviews(urls)
    return () => urls.forEach(URL.revokeObjectURL)
  }, [galleryFiles])

  function checkFile(file: File, kind: 'image' | 'model') {
    const accepted = kind === 'image' ? ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] : ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
    const max = kind === 'image' ? imageLimit : modelLimit
    if (!accepted.includes(file.type) && !(kind === 'model' && /\.(glb|gltf)$/i.test(file.name))) throw new Error(`Файл ${file.name}: неподдерживаемый формат.`)
    if (file.size > max) throw new Error(`${file.name}: размер больше ${kind === 'image' ? '12' : '50'} МБ.`)
  }
  async function upload(file: File, bucket: 'portfolio-media' | 'portfolio-models') {
    const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await requireSupabase().storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || undefined })
    if (uploadError) throw uploadError
    return path
  }
  function handleImage(file: File, target: 'cover' | 'gallery') {
    try { checkFile(file, 'image'); setError(''); if (target === 'cover') setCoverFile(file); else setGalleryFiles((current) => [...current, file]) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Некорректный файл.') }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    let uploaded: { bucket: 'portfolio-media' | 'portfolio-models'; path: string }[] = []
    try {
      if (!form.title.trim()) throw new Error('Укажите название проекта.')
      const slug = slugify(form.slug)
      if (!slug) throw new Error('Укажите корректный URL slug (латинские буквы и цифры).')
      if (coverFile) checkFile(coverFile, 'image')
      galleryFiles.forEach((file) => checkFile(file, 'image'))
      if (modelFile) checkFile(modelFile, 'model')
      const client = requireSupabase()
      const newCover = coverFile ? await upload(coverFile, 'portfolio-media') : form.cover_path
      if (coverFile && newCover) uploaded.push({ bucket: 'portfolio-media', path: newCover })
      const newGallery: ProjectImage[] = [...form.images, ...await Promise.all(galleryFiles.map(async (file) => ({ path: await upload(file, 'portfolio-media'), alt: `${form.title} — ${file.name}` })))]
      newGallery.slice(form.images.length).forEach((image) => uploaded.push({ bucket: 'portfolio-media', path: image.path }))
      const modelPath = modelFile ? await upload(modelFile, 'portfolio-models') : form.model_path
      if (modelFile && modelPath) uploaded.push({ bucket: 'portfolio-models', path: modelPath })
      const record = { ...form, title: form.title.trim(), slug, cover_path: newCover, images: newGallery, model_path: modelPath, tools: toolsText.split(',').map((tool) => tool.trim()).filter(Boolean), year: form.year ? Number(form.year) : null }
      const result = id ? await client.from('projects').update(record).eq('id', id) : await client.from('projects').insert(record)
      if (result.error) throw result.error
      setMessage('Проект сохранён.'); navigate('/admin', { replace: true })
    } catch (cause) {
      await Promise.all(uploaded.map(({ bucket, path }) => requireSupabase().storage.from(bucket).remove([path])))
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить проект.')
    } finally { setBusy(false) }
  }
  async function removeExistingImage(image: ProjectImage, index: number) {
    if (!window.confirm('Удалить это изображение из проекта?')) return
    const nextImages = form.images.filter((_, current) => current !== index)
    setForm({ ...form, images: nextImages })
    const { error: removeError } = await requireSupabase().storage.from('portfolio-media').remove([image.path])
    if (removeError) setError(`Не удалось удалить файл: ${removeError.message}`)
  }
  function moveImage(index: number, offset: number) {
    const next = [...form.images]; const target = index + offset
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]; setForm({ ...form, images: next })
  }
  if (!loaded) return <div className="page-loading">Загрузка проекта…</div>
  return <div className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">ПРОЕКТ / {id ? 'РЕДАКТИРОВАНИЕ' : 'НОВАЯ РАБОТА'}</p><h1>{id ? 'Редактировать проект' : 'Добавить проект'}</h1></div><Link className="button button-quiet" to="/admin"><ArrowLeft size={15} /> К списку</Link></div><form className="editor-form" onSubmit={save}><section className="form-section"><h2>Основное</h2><div className="form-grid"><label>Название *<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value, ...(id ? {} : { slug: slugify(event.target.value) }) })} /></label><label>URL slug *<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /><small>Адрес страницы: /projects/{form.slug || 'project-name'}</small></label><label>Категория<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ProjectCategory })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Год<input type="number" min="1900" max="2200" value={form.year ?? ''} onChange={(event) => setForm({ ...form, year: event.target.value ? Number(event.target.value) : null })} /></label><label className="field-full">Краткое описание<input maxLength={220} value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} /></label><label className="field-full">Полное описание<textarea rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="field-full">Инструменты, через запятую<input placeholder="Blender, Substance 3D Painter" value={toolsText} onChange={(event) => setToolsText(event.target.value)} /></label></div></section><section className="form-section"><h2>Изображения</h2><label className="upload-label">Главное изображение *<span className="upload-box">{coverPreview || form.cover_path ? <img src={coverPreview || requireSupabase().storage.from('portfolio-media').getPublicUrl(form.cover_path!).data.publicUrl} alt="Предпросмотр обложки" /> : <><ImagePlus /><span>Выберите обложку</span><small>JPG, PNG, WEBP · до 12 МБ</small></>}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => event.target.files?.[0] && handleImage(event.target.files[0], 'cover')} /></span></label><div className="gallery-upload"><h3>Дополнительные кадры</h3><div className="gallery-thumbs">{form.images.map((image, index) => <div className="gallery-thumb" key={`${image.path}-${index}`}><img src={requireSupabase().storage.from('portfolio-media').getPublicUrl(image.path).data.publicUrl} alt={image.alt} /><div><button type="button" aria-label="Переместить выше" onClick={() => moveImage(index, -1)}><ArrowUp /></button><button type="button" aria-label="Переместить ниже" onClick={() => moveImage(index, 1)}><ArrowDown /></button><button type="button" aria-label="Удалить изображение" onClick={() => void removeExistingImage(image, index)}><Trash2 /></button></div></div>)}{galleryPreviews.map((url, index) => <div className="gallery-thumb" key={url}><img src={url} alt={`Новое изображение ${index + 1}`} /><button type="button" aria-label="Убрать выбранный файл" onClick={() => setGalleryFiles((current) => current.filter((_, i) => i !== index))}><X /></button></div>)}<label className="add-thumb"><ImagePlus /><span>Добавить</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple onChange={(event) => { Array.from(event.target.files ?? []).forEach((file) => handleImage(file, 'gallery')); event.target.value = '' }} /></label></div></div></section><section className="form-section"><h2>3D-модель</h2><label className="upload-model"><Upload size={18} /><span>{modelFile?.name || (form.model_path ? 'GLB-модель добавлена' : 'Загрузить GLB или glTF')}</span><small>До 50 МБ. Экспортируйте модель из Blender в GLB.</small><input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={(event) => { const file = event.target.files?.[0]; if (file) { try { checkFile(file, 'model'); setModelFile(file); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Некорректный файл.') } } }} /></label>{form.model_path && <button className="text-button danger-text" type="button" onClick={() => setForm({ ...form, model_path: null })}>Убрать прикреплённую модель</button>}</section><section className="form-section publish-row"><div><h2>Публикация</h2><p>Опубликованный проект появится на сайте сразу после сохранения.</p></div><label className="switch-label"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /><span>{form.published ? 'Опубликован' : 'Черновик'}</span></label></section>{error && <div className="notice notice-error">{error}</div>}{message && <div className="notice notice-success">{message}</div>}<div className="form-actions"><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Сохранение…' : <><Save size={16} /> Сохранить проект</>}</button><Link className="button button-quiet" to="/admin">Отмена</Link></div></form></div>
}
