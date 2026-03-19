import { ChatOpenAI } from "@langchain/openai";

interface LLMVisibilityResult {
  score: number;
  sentimentScore: number;
  citations: number;
}

export const llmVisibilityTester = async (
  brandUrl: string,
  queries: string[]
): Promise<LLMVisibilityResult> => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[llmVisibilityTester] OPENAI_API_KEY not set, returning fallback")
    return {
      score: 40,
      sentimentScore: 50,
      citations: 0,
    }
  }

  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
  })

  if (queries.length === 0) {
    queries = ["What is this website about?"]
  }

  const prompt = `You are analyzing brand visibility for AI search systems (GEO).

Website: ${brandUrl}
Queries to test visibility:
${queries.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Respond ONLY with valid JSON, no markdown:
{
  "score": number 0-100 (how well this brand appears in AI-generated responses),
  "sentimentScore": number 0-100 (positive sentiment in AI mentions),
  "citations": number (how many times the brand is referenced across the queries)
}`

  try {
    const response = await model.invoke(prompt)
    const content = (response.content as string).trim()
    const jsonStr = content.replace(/^```json\s*|```\s*$/gi, '')
    const parsed = JSON.parse(jsonStr)

    return {
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 40,
      sentimentScore: typeof parsed.sentimentScore === 'number' ? Math.max(0, Math.min(100, parsed.sentimentScore)) : 50,
      citations: typeof parsed.citations === 'number' ? Math.max(0, parsed.citations) : 0,
    }
  } catch (e) {
    console.error("[llmVisibilityTester] Failed:", e)
    return {
      score: 30,
      sentimentScore: 50,
      citations: 0,
    }
  }
};
