// Fetches a random relevant image from Unsplash for a set of keywords.
// Returns the "regular" size URL (~1080px wide) or null if unavailable.
export async function fetchImage(keywords: string[]): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null

  // Rotate through the keyword list to get variety across runs
  const query = keywords[Math.floor(Math.random() * Math.min(3, keywords.length))]

  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '10')
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('content_filter', 'high')

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${key}` },
    })
    if (!res.ok) return null

    const data = await res.json() as { results: any[] }
    if (!data.results?.length) return null

    const pick = data.results[Math.floor(Math.random() * data.results.length)]
    return (pick.urls?.regular as string) ?? null
  } catch {
    return null
  }
}
