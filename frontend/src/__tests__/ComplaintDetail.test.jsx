import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ComplaintDetail } from '@/pages/ComplaintDetail'
import * as useComplaintsHook from '@/hooks/useComplaints'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('@/hooks/useComplaints')
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { email: 'me@example.com', role: 'CITIZEN' } }) }))
vi.mock('@/hooks/useNotification', () => ({ useNotification: () => ({ success: () => {}, error: () => {} }) }))

describe('ComplaintDetail page', () => {
  it('shows loading when loading', () => {
    useComplaintsHook.useComplaints = () => ({ currentComplaint: null, loading: true, error: null, fetchDetail: () => {} })

    render(
      <MemoryRouter initialEntries={["/citizen/complaints/1"]}>
        <Routes>
          <Route path="/citizen/complaints/:id" element={<ComplaintDetail />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/Loading complaint details/i)).toBeInTheDocument()
  })
})
