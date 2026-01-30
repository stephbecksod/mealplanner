// Claude API client for Edge Functions
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

export async function generateCompletion(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type === 'text') {
    return content.text
  }
  throw new Error('Unexpected response type from Claude')
}

export function parseJsonFromResponse(response: string): any {
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }
  return JSON.parse(jsonMatch[0])
}
