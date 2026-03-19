import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { app } from '@/lib/agents/graph'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { projectId } = await req.json()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, competitors(*)')
    .eq('id', projectId)
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
  // Note: In production, use a background worker or queue
  (async () => {
    try {
      const result = await app.invoke({
        projectId: projectId,
        url: project.url,
        focus: project.focus,
        location: project.location,
        competitors: project.competitors.map((c: any) => c.url),
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

      // Optionally handle competitors...
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
