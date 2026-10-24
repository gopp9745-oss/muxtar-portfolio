import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { ArrowLeft, Boxes, LogOut, Settings2 } from 'lucide-react'
import { requireSupabase, supabase } from '../../lib/supabase'

export function AdminLayout() {
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    if (!supabase) { setChecking(false); return }
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) { setAllowed(data.session?.user.app_metadata.role === 'admin'); setChecking(false) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAdmin = session?.user.app_metadata.role === 'admin'
      setAllowed(isAdmin); setChecking(false)
      if (!isAdmin) navigate('/admin/login', { replace: true })
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [navigate])
  if (checking) return <div className="page-loading">Проверка доступа<span className="loading-bar" /></div>
  if (!supabase) return <main className="system-message"><p>CMS не подключена. Настройте Supabase согласно README.</p><Link to="/">На сайт</Link></main>
  if (!allowed) return <main className="system-message"><p>Необходим вход администратора.</p><Link to="/admin/login">Войти</Link></main>
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="admin-brand" to="/"><span className="brand-x">X</span> MUXTAR</Link><p className="eyebrow">УПРАВЛЕНИЕ</p><nav><Link to="/admin"><Boxes size={17} /> Проекты</Link><Link to="/admin/profile"><Settings2 size={17} /> Профиль сайта</Link></nav><div className="admin-sidebar-bottom"><Link to="/"><ArrowLeft size={16} /> На сайт</Link><button onClick={async () => { await requireSupabase().auth.signOut(); navigate('/admin/login') }}><LogOut size={16} /> Выйти</button></div></aside><main className="admin-main"><Outlet /></main></div>
}
