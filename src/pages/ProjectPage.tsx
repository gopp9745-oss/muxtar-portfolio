
import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowUpRight, Download, Wrench } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Footer, Header } from '../components/SiteChrome'
import {
  getAssetUrl,
  getProfile,
  getProjectBySlug,
  getPublishedProjects,
} from '../lib/portfolio'
import { hasSupabaseConfig } from '../lib/supabase'
import type { Project, ArtistProfile } from '../types/portfolio'

const ModelViewer = lazy(() => import('../components/ModelViewer'))

export default function ProjectPage() {
  const { slug = '' } = useParams()

  const [project, setProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [media, setMedia] = useState<string[]>([])
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  )

  useEffect(() => {
    let active = true

    if (!hasSupabaseConfig) {
      setState('error')
      return
    }

    Promise.all([
      getProjectBySlug(slug),
      getPublishedProjects(),
      getProfile(),
    ])
      .then(async ([item, list, artist]) => {
        if (!active) return

        if (!item) {
          setProject(null)
          setState('ready')
          return
        }

        setProject(item)
        setProjects(list)
        setProfile(artist)

        const [cover, ...rest] = await Promise.all(
          [item.cover_path, ...item.images.map((image) => image.path)].map(
            getAssetUrl,
          ),
        )

        const model = await getAssetUrl(item.model_path)

        if (active) {
          setMedia(
            [cover, ...rest].filter(
              (url): url is string => Boolean(url),
            ),
          )
          setModelUrl(model)
          setState('ready')
        }
      })
      .catch(() => {
        if (active) setState('error')
      })

    return () => {
      active = false
    }
  }, [slug])

  if (state === 'loading') {
    return (
      <div className="page-loading">
        Загрузка проекта
        <span className="loading-bar" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <main className="system-message">
        <p>Не удалось загрузить проект. Проверьте подключение к CMS.</p>
        <Link to="/">На главную</Link>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="system-message">
        <p>Проект не найден или не опубликован.</p>
        <Link to="/">Вернуться к работам</Link>
      </main>
    )
  }

  const currentIndex = projects.findIndex(
    (item) => item.id === project.id,
  )

  const previous =
    projects.length > 1
      ? projects[
          (currentIndex - 1 + projects.length) % projects.length
        ]
      : null

  const next =
    projects.length > 1
      ? projects[(currentIndex + 1) % projects.length]
      : null

  return (
    <>
      <Header />

      <main className="project-detail container">
        <Link className="back-link" to="/#work">
          ← Все работы
        </Link>

        <div className="detail-heading">
          <div>
            <p className="eyebrow">
              {project.category}
              {project.year ? ` / ${project.year}` : ''}
            </p>
            <h1>{project.title}</h1>
          </div>

          <p>{project.short_description}</p>
        </div>

        {media[0] && (
          <img
            className="detail-cover"
            src={media[0]}
            alt={project.title}
          />
        )}

        {project.description && (
          <section className="detail-description">
            <p className="eyebrow">О ПРОЕКТЕ</p>
            <p>{project.description}</p>
          </section>
        )}

        {media.length > 1 && (
          <div className="detail-gallery">
            {media.slice(1).map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`${project.title}, кадр ${index + 2}`}
                loading="lazy"
              />
            ))}
          </div>
        )}

        {modelUrl && (
          <section className="detail-model">
            <div className="detail-subhead">
              <p className="eyebrow">ИНТЕРАКТИВНАЯ МОДЕЛЬ</p>

              <a href={modelUrl} download>
                <Download size={15} />
                GLB-файл
              </a>
            </div>

            <Suspense
              fallback={
                <div className="system-message">
                  Загрузка 3D-модели...
                </div>
              }
            >
              <ModelViewer
                src={modelUrl}
                fallback={media[0] ?? null}
              />
            </Suspense>
          </section>
        )}

        <div className="detail-bottom">
          <div>
            <p className="eyebrow">
              <Wrench size={13} />
              ИНСТРУМЕНТЫ
            </p>

            <div className="tool-list">
              {project.tools.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
          </div>

          <span className="detail-credit">
            {profile?.name || 'MUXTAR'}
          </span>
        </div>

        {projects.length > 1 && previous && next && (
          <nav className="project-pager">
            <Link to={`/projects/${previous.slug}`}>
              <span>Предыдущий проект</span>
              <strong>
                {previous.title}
                <ArrowUpRight size={16} />
              </strong>
            </Link>

            <Link to={`/projects/${next.slug}`}>
              <span>Следующий проект</span>
              <strong>
                {next.title}
                <ArrowUpRight size={16} />
              </strong>
            </Link>
          </nav>
        )}
      </main>

      {profile && <Footer profile={profile} />}
    </>
  )
}
