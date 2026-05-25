import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import * as complaintService from '@/api/complaints'
import { useComplaints } from '@/hooks/useComplaints'
import { act } from 'react-dom/test-utils'

vi.mock('@/api/complaints')

describe('useComplaints hook', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('fetches detail and sets currentComplaint', async () => {
    const fakeComplaint = { id: 1, title: 'Road damage' }
    complaintService.fetchComplaint = vi.fn().mockResolvedValue(fakeComplaint)

    const { result } = renderHook(() => useComplaints())

    await act(async () => {
      const ok = await result.current.fetchDetail(1)
      expect(ok).toBe(true)
    })

    expect(result.current.currentComplaint).toEqual(fakeComplaint)
  })
})
