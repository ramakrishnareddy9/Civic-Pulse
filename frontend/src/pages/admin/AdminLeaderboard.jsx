import React, { useEffect, useState } from 'react'
import { fetchOfficerLeaderboard } from '@api/admin'

export default function AdminLeaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchOfficerLeaderboard().then(res => {
      const data = res?.data || res
      if (mounted) setRows(data || [])
    }).catch(console.error).finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <div style={{ background: 'var(--gov-surface)', minHeight: 'calc(100vh - 56px)' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--gov-navy)' }}>Officer Leaderboard</h1>
        <p className="text-sm text-gray-500 mb-6">Shows officer assignment counts, resolution rate, and avg resolution time.</p>

        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'var(--gov-border)' }}>
          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="p-3">Officer</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Ward</th>
                    <th className="p-3">Assigned</th>
                    <th className="p-3">Resolved</th>
                    <th className="p-3">Resolution Rate</th>
                    <th className="p-3">Avg Resolution (h)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} className="border-t" style={{ borderColor: 'var(--gov-border)' }}>
                      <td className="p-3 font-semibold">{r.fullName}</td>
                      <td className="p-3">{r.departmentName || '—'}</td>
                      <td className="p-3">{r.wardName || '—'}</td>
                      <td className="p-3">{r.totalAssigned ?? '—'}</td>
                      <td className="p-3">{r.totalResolved ?? '—'}</td>
                      <td className="p-3">{r.resolutionRate ?? '—'}</td>
                      <td className="p-3">{r.avgResolutionHours ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
