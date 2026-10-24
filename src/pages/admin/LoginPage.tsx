import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { BrandMark } from '../../components/SiteChrome'
import { hasSupabaseConfig, requireSupabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const { data, error: authError } = await requireSupabase().auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (data.user.app_metadata.role !== 'admin') { await requireSupabase().auth.signOut(); throw new Error('У этой учётной записи нет прав администратора.') }
      navigate('/admin', { replace: true })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось войти.') }
    finally { setBusy(false) }
  }
  return <main className="login-page"><header><BrandMark /><Link to="/"><ArrowLeft size={15} /> На сайт</Link></header><section className="login-panel"><div className="login-icon"><LockKeyhole /></div><p className="eyebrow">ПАНЕЛЬ УПРАВЛЕНИЯ</p><h1>Вход владельца</h1><p className="login-description">Авторизуйтесь, чтобы управлять опубликованными работами и профилем.</p>{!hasSupabaseConfig && <div className="notice notice-error">Добавьте ключи Supabase в .env.local, чтобы включить вход.</div>}<form onSubmit={submit}><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Пароль<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <div className="notice notice-error">{error}</div>}<button className="button button-primary full-width" disabled={busy || !hasSupabaseConfig}>{busy ? 'Вход…' : 'Войти'}</button></form><p className="login-footnote">Администратор создаётся в Supabase Dashboard. Публичной регистрации нет.</p></section></main>
}
