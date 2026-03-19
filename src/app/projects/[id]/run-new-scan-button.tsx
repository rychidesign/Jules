'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type RunNewScanButtonProps = {
  projectId: string
}

type ScanApiSuccess = {
  scanId: string
  status: 'processing'
}

type ScanApiError = {
  error: string
}

export function RunNewScanButton({ projectId }: RunNewScanButtonProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleRunNewScan = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      })

      const payload = (await response.json()) as ScanApiSuccess | ScanApiError

      if (!response.ok) {
        const apiError = 'error' in payload ? payload.error : 'Failed to start scan.'
        throw new Error(apiError)
      }

      if ('scanId' in payload) {
        setSuccessMessage(`Scan started (ID: ${payload.scanId.slice(0, 8)}...).`)
      } else {
        setSuccessMessage('Scan started successfully.')
      }

      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start scan.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRunNewScan}
        disabled={isSubmitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Starting scan...' : 'Run New Scan'}
      </button>

      <div aria-live="polite" className="min-h-5 text-right text-xs">
        {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
        {successMessage ? <p className="text-green-600">{successMessage}</p> : null}
      </div>
    </div>
  )
}
