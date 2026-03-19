import { ChatOpenAI } from "@langchain/openai";

interface WebsiteAuditResult {
  score: number;
  hasSchema: boolean;
  markdownFriendly: boolean;
  pageSpeed: number;
  entityDensity: number;
  recommendations: string[];
}

const scoringPrompt = (url: string) => `Analyze the technical aspects of the website at ${url} for GEO (Generative Engine Optimization) and SEO.

Respond ONLY with valid JSON in this exact format, no markdown or extra text:
{
  "score": number between 0-100,
  "hasSchema": boolean,
  "markdownFriendly": boolean,
  "pageSpeed": number 0-100,
  "entityDensity": number (how many named entities per 100 words, typical range 1-10),
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Consider: Schema.org structured data, machine-readable content, header hierarchy, entity mentions, page load indicators.`;

export const websiteAuditor = async (url: string): Promise<WebsiteAuditResult> => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[websiteAuditor] OPENAI_API_KEY not set, returning fallback")
    return {
      score: 60,
      hasSchema: false,
      markdownFriendly: true,
      pageSpeed: 70,
      entityDensity: 2.0,
      recommendations: [
        "Add JSON-LD structured data for your business.",
        "Ensure content uses clear heading hierarchy (H1 → H2 → H3).",
      ],
    }
  }

  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
  })

  const response = await model.invoke(scoringPrompt(url))
  const content = (response.content as string).trim()

  try {
    // Strip markdown code blocks if present
    const jsonStr = content.replace(/^```json\s*|```\s*$/gi, '')
    const parsed = JSON.parse(jsonStr)
    return {
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 60,
      hasSchema: Boolean(parsed.hasSchema),
      markdownFriendly: Boolean(parsed.markdownFriendly),
      pageSpeed: typeof parsed.pageSpeed === 'number' ? Math.max(0, Math.min(100, parsed.pageSpeed)) : 50,
      entityDensity: typeof parsed.entityDensity === 'number' ? parsed.entityDensity : 2.0,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [],
    }
  } catch (e) {
    console.error("[websiteAuditor] Failed to parse LLM response:", e)
    console.error("[websiteAuditor] Raw response:", content.slice(0, 300))
    return {
      score: 50,
      hasSchema: false,
      markdownFriendly: false,
      pageSpeed: 50,
      entityDensity: 1.5,
      recommendations: ["Could not analyze website — please try again."],
    }
  }
};
