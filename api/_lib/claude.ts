import { callClaudeAPI, type ClaudeUsage } from './call-claude'
import { getIdentityAndVoice, type AgentPersonality } from '../_agents/personalities'

// ── Types ────────────────────────────────────────────────────

export interface PostCandidate {
  title:            string
  summary:          string
  source_url:       string
  importance_score: number
}

export interface GeneratedPost {
  headline: string
  body:     string
}

export interface PostGenerationResult {
  candidates:          PostCandidate[]
  selectedIndex:       number | null
  selectionReasoning:  string
  post:                GeneratedPost | null
  usage:              ClaudeUsage
}

// ── Structured JSON schema for Claude's response ─────────────

interface ClaudePostResponse {
  candidates:           { title: string; summary: string; source_url: string; importance_score: number }[]
  selected_index:       number | null
  selection_reasoning:  string
  post:                 { headline: string; body: string } | null
}

// ── Post generation ──────────────────────────────────────────
// Builds the full system prompt from personality fields, injects
// recent-post memory for dedup, enables web_search, and parses
// the structured JSON response.

export async function generatePost(
  personality: AgentPersonality,
  recentHeadlines: string[],
): Promise<PostGenerationResult> {
  const identityAndVoice = getIdentityAndVoice(personality)

  // Build system prompt sections
  const sections: string[] = [
    // 1. Identity and voice
    identityAndVoice,

    // 2. Domain scope
    `[DOMAIN]\nYou cover ${personality.domain}. You do NOT cover topics outside this domain.`,

    // 3. Source whitelist
    `[SOURCE WHITELIST]\nWhen searching for news, only consider sources from this whitelist: ${personality.sourceWhitelist.join(', ')}. If a story's primary coverage is outside this whitelist, do not select it.`,

    // 4. Top news rubric
    `[TOP NEWS CRITERIA]\n${personality.topNewsRubric}`,

    // 5. Recent-post memory
    buildRecentPostsSection(recentHeadlines),

    // 6. Output format (from personality.postGenerationRules)
    `[OUTPUT FORMAT]\n${personality.postGenerationRules}`,

    // 7. Refuse-to-post path
    `[REFUSE-TO-POST]\nIf no story you find meets the criteria above, OR if every story meaningfully overlaps with the recent posts listed above, return null for selected_index and post, and explain why in selection_reasoning. Do not force a post.`,
  ]

  const systemPrompt = sections.join('\n\n')

  const response = await callClaudeAPI({
    systemPrompt,
    userMessage: `Find the most important ${personality.domain} news from the last 24 hours and write a post about it following your instructions.`,
    maxTokens:   2048,
    tools:       [{ type: 'web_search_20250305', name: 'web_search' }],
  })

  // Strip markdown code fences if Claude wraps the JSON despite instructions
  const cleaned = response.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let parsed: ClaudePostResponse
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Claude returned non-JSON: ${response.text}`)
  }

  // Validate candidates array
  if (!Array.isArray(parsed.candidates) || parsed.candidates.length === 0) {
    throw new Error(`Claude response missing candidates: ${JSON.stringify(parsed)}`)
  }

  // Validate post fields when a selection was made
  if (parsed.selected_index !== null && parsed.post) {
    if (!parsed.post.headline || !parsed.post.body) {
      throw new Error(`Claude response has selected_index but post is incomplete: ${JSON.stringify(parsed)}`)
    }
  }

  return {
    candidates: parsed.candidates.map(c => ({
      title:            c.title ?? '',
      summary:          c.summary ?? '',
      source_url:       c.source_url ?? '',
      importance_score: c.importance_score ?? 0,
    })),
    selectedIndex:      parsed.selected_index,
    selectionReasoning: parsed.selection_reasoning ?? '',
    post: parsed.post ? {
      headline: parsed.post.headline.trim(),
      body:     parsed.post.body.trim(),
    } : null,
    usage: response.usage,
  }
}

// ── Helper: build recent posts section ───────────────────────

function buildRecentPostsSection(headlines: string[]): string {
  if (headlines.length === 0) {
    return '[RECENT POSTS]\nNo recent posts found for this agent. This is either the first run or the history is empty.'
  }

  const list = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
  return `[RECENT POSTS]\nHere are the last ${headlines.length} headlines this agent has posted in chronological order, most recent first:\n${list}\n\nDo NOT pick a story that covers the same topic as any of these. If today's most important story is an extension or follow-up to one of these, either find a fresh angle or skip.`
}
