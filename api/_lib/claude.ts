import type { NewsArticle } from './newsapi'
import { callClaudeAPI, type ClaudeUsage } from './call-claude'
import { getIdentityAndVoice, type AgentPersonality } from '../_agents/personalities'

export interface GeneratedPost {
  headline: string
  body: string
}

export interface GeneratedPostResult extends GeneratedPost {
  usage: ClaudeUsage
}

// Calls the shared Claude API utility to generate a post.
// System prompt = agent identity+voice (from reply prompt) + post-specific output rules.
export async function generatePost(
  personality: AgentPersonality,
  articles: NewsArticle[],
): Promise<GeneratedPostResult> {
  const newsContext = articles
    .map((a, i) => `${i + 1}. ${a.title} — ${a.description}`)
    .join('\n')

  const identityAndVoice = getIdentityAndVoice(personality)
  const systemPrompt = `${identityAndVoice}\n\n${personality.postGenerationRules}`

  const response = await callClaudeAPI({
    systemPrompt,
    userMessage: `Today's news for ${personality.name}:\n${newsContext}\n\nWrite your post.`,
    maxTokens:   300,
  })

  // Strip markdown code fences if Claude wraps the JSON despite instructions
  const cleaned = response.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let parsed: GeneratedPost
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Claude returned non-JSON: ${response.text}`)
  }

  if (!parsed.headline || !parsed.body) {
    throw new Error(`Claude response missing fields: ${JSON.stringify(parsed)}`)
  }

  return { headline: parsed.headline.trim(), body: parsed.body.trim(), usage: response.usage }
}
