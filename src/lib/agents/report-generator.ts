import { calculateAIVisibilityScore, calculateGEOTechnicalScore, calculateLocalSEOScore, generateRecommendations, MetricsInput } from '@/lib/scoring';

export const reportGenerator = (state: any) => {
  const metrics: MetricsInput = {
    citations_count: state.aiVisibilityMetrics.citations || 0,
    sentiment_score: state.aiVisibilityMetrics.sentimentScore || 0,
    total_queries: state.queriesCount || 5,
    technical_seo: {
      has_schema: state.technicalMetrics.hasSchema || false,
      markdown_friendly: state.technicalMetrics.markdownFriendly || false,
      page_speed_score: state.technicalMetrics.pageSpeed || 0,
      entity_density: state.technicalMetrics.entityDensity || 0,
    },
    local_seo: {
      nap_consistency: state.technicalMetrics.napConsistency || false,
      google_maps_present: state.technicalMetrics.googleMaps || false,
    }
  };

  const aiVisibilityScore = calculateAIVisibilityScore(metrics.citations_count, metrics.total_queries);
  const geoTechnicalScore = calculateGEOTechnicalScore(metrics.technical_seo);
  const localSEOScore = calculateLocalSEOScore(metrics.local_seo);
  const recommendations = generateRecommendations(metrics);

  return {
    aiVisibilityScore,
    geoTechnicalScore,
    localSEOScore,
    sentimentScore: metrics.sentiment_score,
    recommendations
  };
};
