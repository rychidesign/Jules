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

  // Run the graph (asynchronously)
  (async () => {
    try {
      const result = await app.invoke({
        projectId: projectId,
        url: project.url,
        focus: project.focus,
        location: project.location,
        targetKeywords: project.target_keywords || [],
        brandVariations: project.brand_variations || [],
        selectedModels: project.selected_models || ['gpt-4o'],
        competitors: (project.competitors || []).map((c: { url: string }) => c.url),
      });

      // Update scan record and store results
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
          ai_visibility_score: result.aiVisibilityMetrics.score,
          geo_technical_score: result.technicalMetrics.score,
          sentiment_score: result.aiVisibilityMetrics.sentimentScore || 0,
          recommendations: result.recommendations,
        }
      ])
    } catch (e) {
      console.error("Scan failed:", e);
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', scan.id)
    }
  })();

  return NextResponse.json({ scanId: scan.id, status: 'processing' })
}
