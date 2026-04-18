export interface NewsArticle {
  title: string
  description: string
  url: string
}

async function queryNewsAPI(query: string, key: string): Promise<NewsArticle[]> {
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

// Extracts the first word of a query as a simple fallback term.
function fallbackQuery(query: string): string {
  return query.trim().split(/\s+/)[0]
}

// Fetches the top 3 recent headlines for a query.
// If the primary query returns nothing, retries with a single-word fallback.
export async function fetchTopHeadlines(query: string): Promise<NewsArticle[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) throw new Error('Missing NEWS_API_KEY')

  const results = await queryNewsAPI(query, key)
  if (results.length > 0) return results

  // Primary query returned nothing — retry with the first word only
  const simple = fallbackQuery(query)
  if (simple === query) return results  // already a single word, no point retrying

  console.log(`[newsapi] No results for "${query}", retrying with "${simple}"`)
  return queryNewsAPI(simple, key)
}
