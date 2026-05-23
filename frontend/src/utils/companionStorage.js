const STORAGE_KEYS = {
  activeCompanionId: 'activeCompanionId',
  chatHistories: 'chatHistories',
  customCompanions: 'customCompanions',
  memoryFragments: 'memoryFragments',
  selectedPersona: 'selectedPersona',
  travelMemorySummary: 'travelMemorySummary',
  userPreferenceProfile: 'userPreferenceProfile',
  voiceSettingsByCompanion: 'voiceSettingsByCompanion',
}

const readJson = (key, fallbackValue) => {
  if (typeof window === 'undefined') return fallbackValue

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallbackValue
  } catch {
    return fallbackValue
  }
}

const writeJson = (key, value) => {
  if (typeof window === 'undefined') return value
  window.localStorage.setItem(key, JSON.stringify(value))
  return value
}

const readObject = (key) => {
  const value = readJson(key, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

const readArray = (key) => {
  const value = readJson(key, [])
  return Array.isArray(value) ? value : []
}

const toCompanionArray = (companions) => (Array.isArray(companions) ? companions.filter(Boolean) : [])

export const getCustomCompanions = () => readArray(STORAGE_KEYS.customCompanions)

export const setCustomCompanions = (companions) => writeJson(STORAGE_KEYS.customCompanions, toCompanionArray(companions))

export const addCustomCompanion = (companion) => {
  const existing = getCustomCompanions()
  const next = [companion, ...existing.filter((item) => item?.id !== companion?.id)]
  setCustomCompanions(next)
  return companion
}

export const getActiveCompanionId = () => {
  if (typeof window === 'undefined') return ''

  const activeCompanionId = window.localStorage.getItem(STORAGE_KEYS.activeCompanionId)
  if (activeCompanionId) return activeCompanionId

  const personaId = window.localStorage.getItem('persona_id')
  if (personaId) return personaId

  const selectedPersona = readJson(STORAGE_KEYS.selectedPersona, null)
  return selectedPersona?.id || ''
}

export const setActiveCompanionId = (companionId) => {
  if (typeof window === 'undefined') return companionId || ''
  if (!companionId) {
    window.localStorage.removeItem(STORAGE_KEYS.activeCompanionId)
    return ''
  }

  window.localStorage.setItem(STORAGE_KEYS.activeCompanionId, companionId)
  return companionId
}

export const getActiveCompanionProfile = () => {
  const activeCompanionId = getActiveCompanionId()
  if (!activeCompanionId) return null

  return getCustomCompanions().find((companion) => companion?.id === activeCompanionId) || null
}

export const getChatHistories = () => readObject(STORAGE_KEYS.chatHistories)

export const setChatHistories = (histories) => writeJson(STORAGE_KEYS.chatHistories, histories && typeof histories === 'object' ? histories : {})

const buildHistoryRecord = (messages = [], currentRecord = {}) => {
  const normalizedMessages = Array.isArray(messages) ? messages.filter(Boolean) : []
  const lastMessage = normalizedMessages[normalizedMessages.length - 1] || null

  return {
    ...currentRecord,
    messages: normalizedMessages,
    updatedAt: new Date().toISOString(),
    lastMessageText: lastMessage?.text || currentRecord?.lastMessageText || '',
    recentTime: lastMessage?.time || currentRecord?.recentTime || '',
    unreadCount: Number(currentRecord?.unreadCount || 0),
    newMemoryCount: Number(currentRecord?.newMemoryCount || 0),
  }
}

export const getChatHistoryForCompanion = (companionId = getActiveCompanionId()) => {
  if (!companionId) return []
  const histories = getChatHistories()
  const history = histories[companionId]

  if (Array.isArray(history)) return history
  if (Array.isArray(history?.messages)) return history.messages
  return []
}

export const setChatHistoryForCompanion = (companionId, messages) => {
  if (!companionId) return []

  const histories = getChatHistories()
  const nextRecord = buildHistoryRecord(messages, histories[companionId])
  setChatHistories({
    ...histories,
    [companionId]: nextRecord,
  })

  return nextRecord.messages
}

export const appendChatMessageForCompanion = (companionId, message) => {
  if (!companionId || !message) return []
  const currentMessages = getChatHistoryForCompanion(companionId)
  return setChatHistoryForCompanion(companionId, [...currentMessages, message])
}

export const getCompanionChatMeta = (companionId = getActiveCompanionId()) => {
  const histories = getChatHistories()
  const history = histories[companionId]
  const messages = getChatHistoryForCompanion(companionId)
  const lastMessage = messages[messages.length - 1] || null

  return {
    lastMessageText: history?.lastMessageText || lastMessage?.text || '',
    recentTime: history?.recentTime || history?.updatedAt || lastMessage?.time || '',
    unreadCount: Number(history?.unreadCount || 0),
    newMemoryCount: Number(history?.newMemoryCount || 0),
  }
}

export const getRecentChatSummary = (companionId = getActiveCompanionId()) => {
  const recentMessages = getChatHistoryForCompanion(companionId)
    .filter((message) => message?.text)
    .slice(-6)

  if (recentMessages.length === 0) return ''

  return recentMessages
    .map((message) => `${message.role || 'message'}: ${String(message.text).trim()}`)
    .join('\n')
}

export const getUserPreferenceProfile = () => {
  const profile = readJson(STORAGE_KEYS.userPreferenceProfile, null)
  return profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : null
}

export const setUserPreferenceProfile = (profile) =>
  writeJson(STORAGE_KEYS.userPreferenceProfile, profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {})

export const getTravelMemorySummary = () => {
  const summary = readJson(STORAGE_KEYS.travelMemorySummary, null)
  if (typeof summary === 'string') return summary.trim()
  return summary && typeof summary === 'object' && !Array.isArray(summary) ? summary : null
}

export const setTravelMemorySummary = (summary) => writeJson(STORAGE_KEYS.travelMemorySummary, summary || '')

export const getVoiceSettingsByCompanion = () => readObject(STORAGE_KEYS.voiceSettingsByCompanion)

export const setVoiceSettingsByCompanion = (settings) =>
  writeJson(STORAGE_KEYS.voiceSettingsByCompanion, settings && typeof settings === 'object' ? settings : {})

export const getVoiceSettingsForCompanion = (companionId = getActiveCompanionId()) => {
  if (!companionId) return null
  const allSettings = getVoiceSettingsByCompanion()
  const settings = allSettings[companionId]
  return settings && typeof settings === 'object' ? settings : null
}

export const setVoiceSettingsForCompanion = (companionId, settings) => {
  if (!companionId || !settings || typeof settings !== 'object') return null
  const next = {
    ...getVoiceSettingsByCompanion(),
    [companionId]: settings,
  }
  setVoiceSettingsByCompanion(next)
  return next[companionId]
}

export const getMemoryFragments = () => readArray(STORAGE_KEYS.memoryFragments)

export const getCompanionMemoryCount = (companionId = getActiveCompanionId()) => {
  const fragments = getMemoryFragments()
  if (!companionId) return 0
  return fragments.filter((fragment) => fragment?.companionId === companionId || fragment?.companion_id === companionId).length
}
