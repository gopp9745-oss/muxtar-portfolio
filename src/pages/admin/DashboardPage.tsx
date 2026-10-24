import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, FilePlus2, ImageOff, Trash2 } from 'lucide-react'
import { requireSupabase } from '../../lib/supabase'
import type { Project } from '../../types/portfolio'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: queryError } = await requireSupabase().from('projects').select('*').order('updated_at', { ascending: false })
    if (queryError) setError(queryError.message); else setProjects(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  async function remove(project: Project) {
    if (!window.confirm(`Удалить проект «${project.title}»? Это действие нельзя отменить.`)) return
    const client = requireSupabase()
    const paths = [project.cover_path, project.model_path, ...project.images.map((image) => image.path)].filter((path): path is string => Boolean(path))
    const { error: removeError } = await client.from('projects').delete().eq('id', project.id)
    if (removeError) { setError(removeError.message); return }
    if (paths.length) await client.storage.from('portfolio-media').remove(paths)
    if (project.model_path) await client.storage.from('portfolio-models').remove([project.model_path])
    await load()
  }
  return <div className="admin-content"><div className="admin-page-head"><div><p className="eyebrow">КОНТЕНТ / ПОРТФОЛИО</p><h1>Проекты</h1><p>Всего: {projects.length} / опубликовано: {projects.filter((project) => project.published).length}</p></div><Link className="button button-primary" to="/admin/projects/new"><FilePlus2 size={16} /> Добавить проект</Link></div>{error && <div className="notice notice-error">{error}</div>}{loading ? <div className="admin-empty">Загрузка проектов…</div> : projects.length ? <div className="admin-project-list">{projects.map((project) => <article key={project.id} className="admin-project-row"><div className="admin-thumb">{project.cover_path ? <img src={requireSupabase().storage.from('portfolio-media').getPublicUrl(project.cover_path).data.publicUrl} alt="" /> : <ImageOff />}</div><div className="admin-project-info"><h2>{project.title}</h2><p>{project.category}{project.year ? ` / ${project.year}` : ''}</p></div><span className={project.published ? 'status-pill published' : 'status-pill'}>{project.published ? 'Опубликован' : 'Черновик'}</span><div className="admin-row-actions"><Link to={`/admin/projects/${project.id}/edit`}>Редактировать <ArrowUpRight size={14} /></Link><button aria-label={`Удалить ${project.title}`} onClick={() => void remove(project)}><Trash2 size={16} /></button></div></article>)}</div> : <div className="admin-empty"><span className="empty-mark">×</span><h2>Проектов пока нет</h2><p>Создайте первую запись, чтобы добавить работу в портфолио.</p><Link className="button button-primary" to="/admin/projects/new">Добавить проект</Link></div>}</div>
}
