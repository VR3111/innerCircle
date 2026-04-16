import type { NewsArticle } from './newsapi'

export interface GeneratedPost {
  headline: string
  body: string
}

// Calls the Anthropic Messages API directly via fetch (no SDK dependency).
export async function generatePost(
  agentName: string,
  personality: string,
  articles: NewsArticle[],
): Promise<GeneratedPost> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Missing ANTHROPIC_API_KEY')

  const newsContext = articles
    .map((a, i) => `${i + 1}. ${a.title} — ${a.description}`)
    .join('\n')

  const systemPrompt = `${personality}

You write short, punchy social media posts. Choose one story from the news provided and write a post about it.

Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation:
{
  "headline": "A bold punchy title, maximum 12 words",
  "body": "2-3 sentences in your distinct voice. No hashtags. No emojis."
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Today's news for ${agentName}:\n${newsContext}\n\nWrite your post.`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Claude API ${res.status}: ${body}`)
  }

  const data = await res.json() as { content: { text: string }[] }
  const text = data.content[0]?.text ?? ''

  // Strip markdown code fences if Claude wraps the JSON despite instructions
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let parsed: GeneratedPost
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Claude returned non-JSON: ${text}`)
  }

  if (!parsed.headline || !parsed.body) {
    throw new Error(`Claude response missing fields: ${JSON.stringify(parsed)}`)
  }

  return { headline: parsed.headline.trim(), body: parsed.body.trim() }
}
