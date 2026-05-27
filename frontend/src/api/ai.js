import { post } from './client'
import { getAuthStore } from '@store/authStore'

const STORAGE_USER_KEY = 'ai.userId'
const STORAGE_SESSION_KEY = 'ai.sessionId'

function ensureAnonymousUserId() {
  let id = localStorage.getItem(STORAGE_USER_KEY)
  if (!id) {
    // simple uuid fallback
    id = 'anon-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
    localStorage.setItem(STORAGE_USER_KEY, id)
  }
  return id
}

export async function chat(message) {
  const { isAuthenticated, user } = getAuthStore.getState()
  const body = { message }
  if (!isAuthenticated) {
    body.userId = ensureAnonymousUserId()
  }

  const res = await post('/api/ai/chat', body)
  // Expect ApiResponseDto wrapper: { success: true, data: { reply, sessionId } }
  const payload = res?.data || res
  if (payload?.sessionId) {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, payload.sessionId)
    } catch (e) {}
  }
  return payload?.reply || payload
}

export function clearAiSession() {
  try { localStorage.removeItem(STORAGE_SESSION_KEY); localStorage.removeItem(STORAGE_USER_KEY) } catch (e) {}
}

export function getAiSessionId() {
  return localStorage.getItem(STORAGE_SESSION_KEY)
}
