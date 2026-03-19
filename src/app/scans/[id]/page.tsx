import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type ScanResult = {
  id: string
  scan_id: string
  entity_type: 'project' | 'competitor'
  entity_id: string
  ai_visibility_score: number
  geo_technical_score: number
  sentiment_score: number
  local_seo_score: number
  recommendations: string[]
  created_at: string
}

type Scan = {
  id: string
  project_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

type Project = {
  id: string
  name: string
  user_id: string
}

type ScanRow = {
  id: string
  project_id: string
  status: Scan['status']
  created_at: string
  project: Pick<Project, 'id' | 'name' | 'user_id'>
}

export default async function ScanDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch scan with its project to verify ownership
  const { data: scan, error } = await supabase
    .from('scans')
    .select(`
      id,
      project_id,
      status,
      created_at,
      project:projects!inner(id, name, user_id)
    `)
    .eq('id', id)
    .single() as { data: ScanRow | null; error: unknown }

  if (error || !scan) {
    notFound()
  }

  // Ensure current user owns this scan's project
  const project = scan.project
  if (project.user_id !== user.id) {
    notFound()
  }

  // Fetch scan results
  const { data: results } = await supabase
    .from('scan_results')
    .select('*')
    .eq('scan_id', id)
    .order('created_at', { ascending: true }) as { data: ScanResult[] | null }

  const projectResult = results?.find((r) => r.entity_type === 'project')

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link
              href={`/projects/${scan.project_id}`}
              className="text-gray-500 hover:text-gray-700 text-sm mb-1 inline-block"
            >
              &larr; Back to {project.name}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Scan Results</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(scan.created_at).toLocaleString()}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              scan.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : scan.status === 'processing'
                ? 'bg-blue-100 text-blue-800'
                : scan.status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {scan.status}
          </span>
        </div>

        {/* Status: still processing */}
        {scan.status === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🔄</div>
            <h2 className="text-xl font-semibold text-blue-900 mb-1">Scan in Progress</h2>
            <p className="text-blue-700 text-sm">
              The scan is still running. This page will refresh automatically when complete.
            </p>
          </div>
        )}

        {/* Status: failed */}
        {scan.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">❌</div>
            <h2 className="text-xl font-semibold text-red-900 mb-1">Scan Failed</h2>
            <p className="text-red-700 text-sm">
              Something went wrong during the scan. Please try running a new scan.
            </p>
          </div>
        )}

        {/* Status: completed — show results */}
        {scan.status === 'completed' && projectResult && (
          <>
            {/* Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <ScoreCard
                label="AI Visibility"
                score={projectResult.ai_visibility_score}
                color="blue"
              />
              <ScoreCard
                label="GEO Technical"
                score={projectResult.geo_technical_score}
                color="green"
              />
              <ScoreCard
                label="Sentiment"
                score={projectResult.sentiment_score}
                color="purple"
              />
              <ScoreCard
                label="Local SEO"
                score={projectResult.local_seo_score}
                color="orange"
              />
            </div>

            {/* Recommendations */}
            {projectResult.recommendations && projectResult.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📋 Recommendations
                </h2>
                <ul className="space-y-3">
                  {projectResult.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="text-indigo-500 mt-0.5 flex-shrink-0">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitor results */}
            {results && results.filter((r) => r.entity_type === 'competitor').length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🏢 Competitor Analysis
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Entity</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">AI Visibility</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">GEO Technical</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Sentiment</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Local SEO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {results
                        .filter((r) => r.entity_type === 'competitor')
                        .map((r: ScanResult) => (
                          <tr key={r.id}>
                            <td className="px-4 py-2 font-medium text-gray-900">{r.entity_id}</td>
                            <td className="px-4 py-2">
                              <ScoreBadge score={r.ai_visibility_score} />
                            </td>
                            <td className="px-4 py-2">
                              <ScoreBadge score={r.geo_technical_score} />
                            </td>
                            <td className="px-4 py-2">
                              <ScoreBadge score={r.sentiment_score} />
                            </td>
                            <td className="px-4 py-2">
                              <ScoreBadge score={r.local_seo_score} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Completed but no results yet */}
        {scan.status === 'completed' && !projectResult && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No results data found for this scan.</p>
          </div>
        )}

        {/* Run new scan from here */}
        <div className="mt-8 flex justify-end">
          <Link
            href={`/projects/${scan.project_id}`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Run New Scan
          </Link>
        </div>
      </div>
    </div>
  )
}

function ScoreCard({
  label,
  score,
  color,
}: {
  label: string
  score: number
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const clampedScore = Math.min(100, Math.max(0, score))
  const colorClasses: Record<string, { bg: string; text: string; bar: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  }
  const { bg, text, bar } = colorClasses[color] ?? colorClasses.blue

  return (
    <div className={`${bg} rounded-lg p-4`}>
      <p className={`text-xs font-medium mb-1 ${text}`}>{label}</p>
      <p className={`text-2xl font-bold ${text}`}>{clampedScore}</p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full ${bar} rounded-full transition-all`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const clampedScore = Math.min(100, Math.max(0, score))
  const color =
    clampedScore >= 70
      ? 'text-green-700 bg-green-100'
      : clampedScore >= 40
      ? 'text-yellow-700 bg-yellow-100'
      : 'text-red-700 bg-red-100'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {clampedScore}
    </span>
  )
}
