import { useEffect, useState } from 'react'
import { ArrowUpRight, CircleDot, MoveUpRight } from 'lucide-react'
import { Footer, Header, Hero, SectionHeading } from '../components/SiteChrome'
import { ProjectGrid } from '../components/ProjectGrid'
import { getAssetUrl, getProfile, getPublishedProjects } from '../lib/portfolio'
import { hasSupabaseConfig } from '../lib/supabase'
import type { ArtistProfile, Project } from '../types/portfolio'

const emptyProfile: ArtistProfile = { id: 1, name: 'MUXTAR', subtitle: '3D ARTIST / DIGITAL ART', tagline: 'Crafting digital objects, characters and worlds.', bio: '', specialization: '', skills: [], software: [], interests: [], email: '', artstation: '', behance: '', instagram: '', other_links: [], hero_image_path: null, show_about: true, show_contact: true }

export default function HomePage() {
  const [profile, setProfile] = useState(emptyProfile)
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!hasSupabaseConfig) return
    let active = true
    Promise.all([getProfile(), getPublishedProjects()]).then(async ([artist, items]) => {
      if (!active) return
      setProfile(artist); setProjects(items)
      setHeroImage(await getAssetUrl(artist.hero_image_path))
    }).catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : 'Проверьте настройки подключения к Supabase.'))
    return () => { active = false }
  }, [])
  return <><Header /><main><div className="container"><Hero profile={profile} imageUrl={heroImage} /><section id="work" className="work-section"><SectionHeading index="01" title="Работы" detail={`${projects.length.toString().padStart(2, '0')} опубликовано`} /><ProjectGrid projects={projects} error={error} /></section>{profile.show_about && <section id="about" className="about-section"><SectionHeading index="02" title="Обо мне" detail="Автор / процесс / интересы" /><div className="about-layout"><div className="about-intro"><p className="eyebrow">{profile.specialization || 'ПРОФИЛЬ ХУДОЖНИКА'}</p><h3>{profile.name || 'Имя художника'}</h3><p>{profile.bio || 'Здесь появится биография автора. Текст можно добавить в панели управления.'}</p></div><div className="about-details"><div className="about-detail"><h4>Навыки</h4><div className="tag-list">{(profile.skills.length ? profile.skills : ['Добавить в CMS']).map((item) => <span key={item}>{item}</span>)}</div></div><div className="about-detail"><h4>Инструменты</h4><div className="tag-list">{(profile.software.length ? profile.software : ['Blender', 'Добавить в CMS']).map((item) => <span key={item}>{item}</span>)}</div></div><div className="about-detail"><h4>Интересы</h4><p>{profile.interests.length ? profile.interests.join(', ') : 'Профессиональные интересы можно указать в панели управления.'}</p></div></div><div className="about-symbol"><span>X</span><CircleDot size={17} /></div></div></section>}{profile.show_contact && <section id="contact" className="contact-section"><SectionHeading index="03" title="Контакт" detail="Для проектов и сотрудничества" /><div className="contact-layout"><div><p className="eyebrow">ОТКРЫТ К НОВЫМ ИДЕЯМ</p><h3>Есть проект?<br />Давайте обсудим.</h3></div><div className="contact-links">{profile.email && <a href={`mailto:${profile.email}`}><span>Email</span><strong>{profile.email}<MoveUpRight size={16} /></strong></a>}{profile.artstation && <a href={profile.artstation} target="_blank" rel="noreferrer"><span>ArtStation</span><strong>Открыть профиль<ArrowUpRight size={16} /></strong></a>}{profile.behance && <a href={profile.behance} target="_blank" rel="noreferrer"><span>Behance</span><strong>Открыть профиль<ArrowUpRight size={16} /></strong></a>}{profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer"><span>Instagram</span><strong>Открыть профиль<ArrowUpRight size={16} /></strong></a>}{profile.other_links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer"><span>{link.label}</span><strong>Открыть профиль<ArrowUpRight size={16} /></strong></a>)}{![profile.email, profile.artstation, profile.behance, profile.instagram, ...profile.other_links.map((link) => link.url)].some(Boolean) && <p className="muted-note">Контактные ссылки появятся после заполнения профиля.</p>}</div></div></section>}</div></main><Footer profile={profile} /></>
}
