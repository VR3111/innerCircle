export interface NewsArticle {
  title: string
  description: string
  url: string
}

// Fetches the top 3 recent headlines for a search query from NewsAPI.
export async function fetchTopHeadlines(query: string): Promise<NewsArticle[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) throw new Error('Missing NEWS_API_KEY')

  const url = new URL('https://newsapi.org/v2/everything')
  url.searchParams.set('q', query)
  url.searchParams.set('sortBy', 'publishedAt')
  url.searchParams.set('pageSize', '10')
  url.searchParams.set('language', 'en')
  url.searchParams.set('apiKey', key)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`NewsAPI ${res.status}: ${body}`)
  }

  const data = await res.json() as { articles: any[] }

  return (data.articles ?? [])
    .filter(a => a.title && a.title !== '[Removed]' && a.description && a.description !== '[Removed]')
    .slice(0, 3)
    .map(a => ({
      title: a.title as string,
      description: a.description as string,
      url: a.url as string,
    }))
}
