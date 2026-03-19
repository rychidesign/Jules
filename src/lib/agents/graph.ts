import { StateGraph, Annotation, END, START } from "@langchain/langgraph";

// Define the state of the graph
const AgentState = Annotation.Root({
  projectId: Annotation<string>,
  url: Annotation<string>,
  focus: Annotation<string>,
  location: Annotation<string>,
  targetKeywords: Annotation<string[]>,
  brandVariations: Annotation<string[]>,
  selectedModels: Annotation<string[]>,
  competitors: Annotation<string[]>,
  technicalMetrics: Annotation<{
    score: number
    hasSchema: boolean
    markdownFriendly: boolean
    pageSpeed: number
    entityDensity: number
    recommendations: string[]
  }>,
  aiVisibilityMetrics: Annotation<{
    score: number
    sentimentScore: number
    citations: number
    queriesSent: string[]
    responses: string[]
  }>,
  recommendations: Annotation<string[]>,
  status: Annotation<string>,
});

// --- Real agent imports ---
import { websiteAuditor } from './website-auditor'
import { llmVisibilityTester } from './llm-tester'
import { reportGenerator } from './report-generator'

// --- Node implementations ---

const competitorDiscoveryNode = async (state: typeof AgentState.State) => {
  console.log("[Graph] competitor_discovery for:", state.url)

  // Build competitor discovery prompt
  const prompt = `Find 5 direct competitors for a business with:
URL: ${state.url}
Focus: ${state.focus}
Location: ${state.location}
${state.targetKeywords.length > 0 ? `Target keywords: ${state.targetKeywords.join(', ')}` : ''}

Return a JSON array with objects containing 'name' and 'url' properties only.`

  // Simulate by querying OpenAI directly (competitor-discovery.ts is not wired yet)
  // For now return an empty array so the graph continues without failing
  console.log("[Graph] Competitor discovery prompt:", prompt.slice(0, 200))
  return { competitors: state.competitors }
}

const technicalAuditNode = async (state: typeof AgentState.State) => {
  console.log("[Graph] technical_audit for:", state.url)
  try {
    const result = await websiteAuditor(state.url)
    console.log("[Graph] Technical audit result:", JSON.stringify(result).slice(0, 200))
    return { technicalMetrics: result }
  } catch (e) {
    console.error("[Graph] Technical audit failed:", e)
    return {
      technicalMetrics: {
        score: 0,
        hasSchema: false,
        markdownFriendly: false,
        pageSpeed: 0,
        entityDensity: 0,
        recommendations: ["Technical audit could not be completed."],
      },
    }
  }
}

const aiVisibilityNode = async (state: typeof AgentState.State) => {
  console.log("[Graph] ai_visibility for:", state.url)
  try {
    const queriesSent = state.targetKeywords.length > 0
      ? state.targetKeywords.slice(0, 5).map(k => `${k} ${state.focus} ${state.location}`)
      : [`${state.focus} ${state.location}`]

    const result = await llmVisibilityTester(state.url, queriesSent)
    console.log("[Graph] AI visibility result:", JSON.stringify(result).slice(0, 200))
    return {
      aiVisibilityMetrics: {
        ...result,
        queriesSent,
        responses: [],
      },
    }
  } catch (e) {
    console.error("[Graph] AI visibility failed:", e)
    return {
      aiVisibilityMetrics: {
        score: 0,
        sentimentScore: 0,
        citations: 0,
        queriesSent: [],
        responses: [],
      },
    }
  }
}

const reportGeneratorNode = async (state: typeof AgentState.State) => {
  console.log("[Graph] report_generator")
  try {
    const result = reportGenerator(state)
    console.log("[Graph] Report generated, recommendations:", result.recommendations?.length ?? 0)
    return { recommendations: result.recommendations ?? [] }
  } catch (e) {
    console.error("[Graph] Report generation failed:", e)
    return {
      recommendations: [
        "An error occurred while generating recommendations.",
        "Please try running the scan again.",
      ],
    }
  }
}

// Create the graph
const workflow = new StateGraph(AgentState)
  .addNode("competitor_discovery", competitorDiscoveryNode)
  .addNode("technical_audit", technicalAuditNode)
  .addNode("ai_visibility", aiVisibilityNode)
  .addNode("report_generator", reportGeneratorNode)
  .addEdge(START, "competitor_discovery")
  .addEdge("competitor_discovery", "technical_audit")
  .addEdge("technical_audit", "ai_visibility")
  .addEdge("ai_visibility", "report_generator")
  .addEdge("report_generator", END);

export const app = workflow.compile();
