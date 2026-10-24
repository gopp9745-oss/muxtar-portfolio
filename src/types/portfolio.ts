export type ProjectCategory = 'Characters' | 'Props' | 'Environment' | 'Product Design' | 'Architecture' | 'Other'

export type ProjectImage = { path: string; alt: string }

export type Project = {
  id: string
  title: string
  slug: string
  category: ProjectCategory
  short_description: string
  description: string
  cover_path: string | null
  images: ProjectImage[]
  tools: string[]
  year: number | null
  model_path: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export type ArtistProfile = {
  id: number
  name: string
  subtitle: string
  tagline: string
  bio: string
  specialization: string
  skills: string[]
  software: string[]
  interests: string[]
  email: string
  artstation: string
  behance: string
  instagram: string
  other_links: { label: string; url: string }[]
  hero_image_path: string | null
  show_about: boolean
  show_contact: boolean
}
