import type { ArtistProfile, Project } from '../types/portfolio'
import { requireSupabase } from './supabase'

const defaultProfile: ArtistProfile = {
  id: 1, name: 'MUXTAR', subtitle: '3D ARTIST / DIGITAL ART', tagline: 'Crafting digital objects, characters and worlds.', bio: '', specialization: '', skills: [], software: [], interests: [], email: '', artstation: '', behance: '', instagram: '', other_links: [], hero_image_path: null, show_about: true, show_contact: true,
}

export async function getProfile(): Promise<ArtistProfile> {
  const client = requireSupabase()
  const { data, error } = await client.from('artist_profile').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data ? { ...defaultProfile, ...data } : defaultProfile
}

export async function getPublishedProjects(): Promise<Project[]> {
  const { data, error } = await requireSupabase().from('projects').select('*').eq('published', true).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await requireSupabase().from('projects').select('*').eq('slug', slug).eq('published', true).maybeSingle()
  if (error) throw error
  return data
}

export async function getAssetUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  const { data } = requireSupabase().storage.from('portfolio-media').getPublicUrl(path)
  return data.publicUrl
}

export async function saveProfile(profile: Omit<ArtistProfile, 'id'>) {
  const { error } = await requireSupabase().from('artist_profile').upsert({ id: 1, ...profile })
  if (error) throw error
}
