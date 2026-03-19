import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, competitors(*), scans(*)')
    .eq('id', id)
    .single()

  if (error || !project) notFound()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <div className="space-x-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              &larr; Back to Dashboard
            </Link>
            <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
              Run New Scan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Project Info</h2>
            <div className="space-y-2">
              <p><span className="font-medium">URL:</span> {project.url}</p>
              <p><span className="font-medium">Focus:</span> {project.focus}</p>
              <p><span className="font-medium">Location:</span> {project.location}</p>
              <p><span className="font-medium">Competitors:</span> {project.has_competitors ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Competitors</h2>
            {project.competitors && project.competitors.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {project.competitors.map((comp: any) => (
                  <li key={comp.id} className="py-2">
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-sm text-gray-500">{comp.url}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No competitors added yet.</p>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Scans</h2>
          {project.scans && project.scans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {project.scans.map((scan: any) => (
                    <tr key={scan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded text-xs ${
                          scan.status === 'completed' ? 'bg-green-100 text-green-800' :
                          scan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">
                        <Link href={`/scans/${scan.id}`}>View Results</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No scans performed yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
