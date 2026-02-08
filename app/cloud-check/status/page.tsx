'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HealthCheckResult {
  ok: boolean
  message?: string
  error?: string
  latency_ms?: number
  build?: string
  env?: string
  bucket?: string
  objects_count?: number
  path?: string
}

interface CheckStatus {
  loading: boolean
  result: HealthCheckResult | null
  latency: number
}

export default function StatusPage() {
  const [healthCheck, setHealthCheck] = useState<CheckStatus>({
    loading: false,
    result: null,
    latency: 0,
  })
  const [supabaseCheck, setSupabaseCheck] = useState<CheckStatus>({
    loading: false,
    result: null,
    latency: 0,
  })
  const [storageCheck, setStorageCheck] = useState<CheckStatus>({
    loading: false,
    result: null,
    latency: 0,
  })
  const [uploadCheck, setUploadCheck] = useState<CheckStatus>({
    loading: false,
    result: null,
    latency: 0,
  })
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const runHealthCheck = async () => {
    const start = Date.now()
    setHealthCheck({ loading: true, result: null, latency: 0 })
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      const latency = Date.now() - start
      setHealthCheck({ loading: false, result: data, latency })
    } catch (error) {
      const latency = Date.now() - start
      setHealthCheck({
        loading: false,
        result: { ok: false, error: (error as Error).message },
        latency,
      })
    }
  }

  const runSupabaseCheck = async () => {
    const start = Date.now()
    setSupabaseCheck({ loading: true, result: null, latency: 0 })
    try {
      const response = await fetch('/api/supabase/health')
      const data = await response.json()
      const latency = Date.now() - start
      setSupabaseCheck({ loading: false, result: data, latency })
    } catch (error) {
      const latency = Date.now() - start
      setSupabaseCheck({
        loading: false,
        result: { ok: false, error: (error as Error).message },
        latency,
      })
    }
  }

  const runStorageCheck = async () => {
    const start = Date.now()
    setStorageCheck({ loading: true, result: null, latency: 0 })
    try {
      const response = await fetch('/api/storage/health')
      const data = await response.json()
      const latency = Date.now() - start
      setStorageCheck({ loading: false, result: data, latency })
    } catch (error) {
      const latency = Date.now() - start
      setStorageCheck({
        loading: false,
        result: { ok: false, error: (error as Error).message },
        latency,
      })
    }
  }

  const runUploadCheck = async () => {
    const start = Date.now()
    setUploadCheck({ loading: true, result: null, latency: 0 })
    try {
      const response = await fetch('/api/storage/test-upload', {
        method: 'POST',
      })
      const data = await response.json()
      const latency = Date.now() - start
      setUploadCheck({ loading: false, result: data, latency })
    } catch (error) {
      const latency = Date.now() - start
      setUploadCheck({
        loading: false,
        result: { ok: false, error: (error as Error).message },
        latency,
      })
    }
  }

  const runAllChecks = async () => {
    setLastChecked(new Date())
    await Promise.all([
      runHealthCheck(),
      runSupabaseCheck(),
      runStorageCheck(),
      runUploadCheck(),
    ])
  }

  useEffect(() => {
    runAllChecks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderCheckStatus = (check: CheckStatus, title: string) => {
    const { loading, result, latency } = check

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          ) : result ? (
            <span
              className={`text-2xl ${
                result.ok ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {result.ok ? '✓' : '✗'}
            </span>
          ) : null}
        </div>

        {result && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-semibold ${
                    result.ok ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {result.ok ? 'OK' : 'FAIL'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-mono text-gray-900">{latency}ms</span>
              </div>
              {result.build && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Build:</span>
                  <span className="font-mono text-gray-900 text-xs">
                    {result.build}
                  </span>
                </div>
              )}
              {result.env && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-semibold text-gray-900">
                    {result.env}
                  </span>
                </div>
              )}
              {result.message && (
                <div className="text-sm">
                  <span className="text-gray-600">Message:</span>
                  <p className="text-gray-900 mt-1">{result.message}</p>
                </div>
              )}
              {result.bucket && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bucket:</span>
                  <span className="font-mono text-gray-900">
                    {result.bucket}
                  </span>
                </div>
              )}
              {typeof result.objects_count === 'number' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Objects:</span>
                  <span className="font-mono text-gray-900">
                    {result.objects_count}
                  </span>
                </div>
              )}
              {result.path && (
                <div className="text-sm">
                  <span className="text-gray-600">Path:</span>
                  <p className="font-mono text-gray-900 text-xs mt-1 break-all">
                    {result.path}
                  </p>
                </div>
              )}
              {result.error && (
                <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              System Status
            </h1>
            <p className="text-gray-600">
              Real-time health monitoring for Adapt MVP
            </p>
            {lastChecked && (
              <p className="text-sm text-gray-500 mt-2">
                Last checked: {lastChecked.toLocaleString()}
              </p>
            )}
          </div>

          <div className="mb-6">
            <button
              onClick={runAllChecks}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              disabled={
                healthCheck.loading ||
                supabaseCheck.loading ||
                storageCheck.loading ||
                uploadCheck.loading
              }
            >
              Refresh All Checks
            </button>
            <Link
              href="/cloud-check"
              className="ml-4 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-block"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {renderCheckStatus(healthCheck, 'API Health')}
            {renderCheckStatus(supabaseCheck, 'Database Connectivity')}
            {renderCheckStatus(storageCheck, 'Storage Bucket')}
            {renderCheckStatus(uploadCheck, 'Test Upload')}
          </div>
        </div>
      </div>
    </main>
  )
}
