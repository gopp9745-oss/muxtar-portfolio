import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, Menu, X as CloseIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ArtistProfile } from '../types/portfolio'

export function BrandMark() {
  return <Link className="brand" to="/" aria-label="MUXTAR — главная"><span className="brand-x">X</span><span>MUXTAR</span></Link>
}

export function Header() {
  const [open, setOpen] = useState(false)
  useEffect(() => { document.body.classList.toggle('nav-open', open); return () => document.body.classList.remove('nav-open') }, [open])
  const close = () => setOpen(false)
  return <header className="site-header"><BrandMark /><button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open}>{open ? <CloseIcon /> : <Menu />}</button><nav className={open ? 'main-nav open' : 'main-nav'} aria-label="Основная навигация"><a href="/#work" onClick={close}>Работы</a><a href="/#about" onClick={close}>Обо мне</a><a href="/#contact" onClick={close}>Контакты</a><a className="nav-x" href="/admin/login" aria-label="Панель управления" onClick={close}>↗</a></nav></header>
}

export function Footer({ profile }: { profile: ArtistProfile }) {
  return <footer className="site-footer"><BrandMark /><span>© {new Date().getFullYear()} MUXTAR</span><span>{profile.subtitle || '3D ARTIST / DIGITAL ART'}</span></footer>
}

export function Hero({ profile, imageUrl }: { profile: ArtistProfile; imageUrl: string | null }) {
  return <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow"><span className="status-dot" /> {profile.subtitle}</p><h1>{profile.name || 'MUXTAR'}<span className="hero-period">.</span></h1><p className="hero-tagline">{profile.tagline}</p><div className="hero-actions"><a className="button button-primary" href="#work">Смотреть работы <ArrowDown size={16} /></a><a className="button button-quiet" href="#contact">Связаться <ArrowUpRight size={16} /></a></div><p className="hero-note">Независимый 3D-художник<br />Цифровые объекты и миры</p></div><div className="hero-art" aria-label={imageUrl ? 'Главное изображение художника' : 'Геометрический знак MUXTAR'}>{imageUrl ? <img src={imageUrl} alt="Главная работа" fetchPriority="high" /> : <div className="x-sculpture"><span className="x-plane plane-one" /><span className="x-plane plane-two" /><span className="x-core" /></div>}<span className="art-corner corner-tl" /><span className="art-corner corner-br" /><span className="art-index">{imageUrl ? 'FEATURED IMAGE' : 'FORM STUDY / X-01'}</span><span className="art-coordinate">M — 01</span></div><span className="hero-side-label">OBJECTS / CHARACTERS / WORLDS</span></section>
}

export function SectionHeading({ index, title, detail }: { index: string; title: string; detail?: string }) {
  return <div className="section-heading"><div className="section-title"><span className="section-index">{index}</span><h2>{title}</h2></div>{detail && <p>{detail}</p>}</div>
}

export function SectionNavigation() { return <a className="back-top" href="#top" aria-label="Наверх"><ArrowDown size={15} /></a> }

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={15} /></a> }

export function MobileMenuIcon() { return <Menu size={18} /> }
