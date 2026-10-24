import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Project, ProjectCategory } from '../types/portfolio'
import { getAssetUrl } from '../lib/portfolio'

const categories: ProjectCategory[] = ['Characters', 'Props', 'Environment', 'Product Design', 'Architecture', 'Other']

export function ProjectGrid({ projects, error }: { projects: Project[]; error: string | null }) {
  const [filter, setFilter] = useState('All')
  const [covers, setCovers] = useState<Record<string, string>>({})
  useEffect(() => {
    let active = true
    Promise.all(projects.map(async (project) => [project.id, await getAssetUrl(project.cover_path)] as const)).then((entries) => {
      if (active) setCovers(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))))
    }).catch(() => undefined)
    return () => { active = false }
  }, [projects])
  const visible = useMemo(() => filter === 'All' ? projects : projects.filter((project) => project.category === filter), [filter, projects])
  return <div className="work-content"><div className="filter-row" aria-label="Фильтр проектов"><span className="filter-label"><SlidersHorizontal size={14} /> ФИЛЬТР</span><div className="filters"><button className={filter === 'All' ? 'filter active' : 'filter'} onClick={() => setFilter('All')}>Все <span>{projects.length}</span></button>{categories.map((category) => <button key={category} className={filter === category ? 'filter active' : 'filter'} onClick={() => setFilter(category)}>{category}</button>)}</div></div>
    {error ? <div className="empty-state"><span className="empty-mark">×</span><h3>Не удалось загрузить работы</h3><p>{error}</p></div> : visible.length ? <div className="project-grid">{visible.map((project, index) => <Link className={`project-card project-card-${index % 4}`} to={`/projects/${project.slug}`} key={project.id}><div className="project-image">{covers[project.id] ? <img src={covers[project.id]} alt={project.title} loading="lazy" /> : <div className="project-no-image"><span className="brand-x">X</span><span>Изображение не добавлено</span></div>}<span className="project-open"><ArrowUpRight size={18} /></span></div><div className="project-meta"><div><p className="project-category">{project.category}{project.year ? ` / ${project.year}` : ''}</p><h3>{project.title}</h3></div><p className="project-description">{project.short_description}</p></div></Link>)}</div> : <div className="empty-state"><span className="empty-mark">×</span><p className="eyebrow">ПОРТФОЛИО ПОКА ПУСТО</p><h3>{filter === 'All' ? 'Здесь появятся работы' : 'В этой категории пока нет работ'}</h3><p>{filter === 'All' ? 'Когда автор опубликует первые проекты, они появятся здесь.' : 'Выберите другую категорию или вернитесь ко всем работам.'}</p>{filter !== 'All' && <button className="button button-quiet" onClick={() => setFilter('All')}>Показать все</button>}</div>}</div>
}
