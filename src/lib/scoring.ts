export interface MetricsInput {
  citations_count: number;
  sentiment_score: number;
  total_queries: number;
  technical_seo: {
    has_schema: boolean;
    markdown_friendly: boolean;
    page_speed_score: number;
    entity_density: number;
  };
  local_seo: {
    nap_consistency: boolean;
    google_maps_present: boolean;
  }
}

export const calculateAIVisibilityScore = (citations: number, total: number) => {
  if (total === 0) return 0;
  return Math.min(100, (citations / total) * 100);
};

export const calculateGEOTechnicalScore = (technical: MetricsInput['technical_seo']) => {
  let score = 0;
  if (technical.has_schema) score += 40;
  if (technical.markdown_friendly) score += 30;
  score += (technical.page_speed_score / 100) * 20;
  score += Math.min(10, technical.entity_density * 5);
  return Math.min(100, score);
};

export const calculateLocalSEOScore = (local: MetricsInput['local_seo']) => {
  let score = 0;
  if (local.nap_consistency) score += 60;
  if (local.google_maps_present) score += 40;
  return score;
};

export const generateRecommendations = (metrics: MetricsInput) => {
  const recommendations: string[] = [];
  if (!metrics.technical_seo.has_schema) {
    recommendations.push("Implement JSON-LD structured data (Schema.org) for your business entities.");
  }
  if (!metrics.technical_seo.markdown_friendly) {
    recommendations.push("Restructure your content to be more machine-readable (e.g., using proper header hierarchy).");
  }
  if (metrics.sentiment_score < 60) {
    recommendations.push("Work on improving brand sentiment in authoritative sources used by LLMs (Wikipedia, news portals).");
  }
  if (!metrics.local_seo.nap_consistency) {
    recommendations.push("Ensure your Business Name, Address, and Phone (NAP) are consistent across all local directories.");
  }
  return recommendations;
};
