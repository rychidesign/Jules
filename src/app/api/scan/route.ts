import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { app } from '@/lib/agents/graph'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { projectId } = await req.json()

  if (!projectId || typeof projectId !== 'string') {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, competitors(*)')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Create a new scan record
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .insert([{ project_id: projectId, status: 'processing' }])
    .select()
    .single()

  if (scanError) {
    return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 })
  }

  // Run the graph asynchronously
  ;(async () => {
    try {
      console.log(`[Scan ${scan.id}] Starting graph for project ${projectId}`)

      const result = await app.invoke({
        projectId: projectId,
        url: project.url,
        focus: project.focus,
        location: project.location,
        targetKeywords: project.target_keywords || [],
        brandVariations: project.brand_variations || [],
        selectedModels: project.selected_models || ['gpt-4o'],
        competitors: (project.competitors || []).map((c: { url: string }) => c.url),
        technicalMetrics: { score: 0, hasSchema: false, markdownFriendly: false, pageSpeed: 0, entityDensity: 0, recommendations: [] },
        aiVisibilityMetrics: { score: 0, sentimentScore: 0, citations: 0, queriesSent: [], responses: [] },
        recommendations: [],
        status: 'processing',
      })

      console.log(`[Scan ${scan.id}] Graph complete, scores:`, {
        technical: result.technicalMetrics?.score,
        aiVisibility: result.aiVisibilityMetrics?.score,
        sentiment: result.aiVisibilityMetrics?.sentimentScore,
        recommendations: result.recommendations?.length ?? 0,
      })

      // Update scan to completed
      await supabase
        .from('scans')
        .update({ status: 'completed' })
        .eq('id', scan.id)

      // Insert results for project
      await supabase.from('scan_results').insert([
        {
          scan_id: scan.id,
          entity_type: 'project',
          entity_id: project.id,
          ai_visibility_score: result.aiVisibilityMetrics?.score ?? 0,
          geo_technical_score: result.technicalMetrics?.score ?? 0,
          sentiment_score: result.aiVisibilityMetrics?.sentimentScore ?? 0,
          local_seo_score: 0,
          recommendations: result.recommendations ?? [],
          raw_data: {
            technicalMetrics: result.technicalMetrics,
            aiVisibilityMetrics: result.aiVisibilityMetrics,
            queriesSent: result.aiVisibilityMetrics?.queriesSent ?? [],
          },
        }
      ])

      console.log(`[Scan ${scan.id}] Results stored successfully`)

    } catch (e) {
      console.error(`[Scan ${scan.id}] Graph failed:`, e)
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', scan.id)
    }
  })()

  return NextResponse.json({ scanId: scan.id, status: 'processing' })
}
