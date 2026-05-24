import { deriveConversationStateFromUserText, initialConversationState } from '../store/demoState'
import { getActiveCompanionId, setChatHistoryForCompanion } from './companionStorage'

const MESSAGE_MAP_KEY = 'solomate_chat_messages_by_companion'
const CONVERSATION_STATE_MAP_KEY = 'solomate_conversation_state_by_companion'
const CONVERSATION_ID_MAP_KEY = 'solomate_conversation_ids_by_companion'
const PROACTIVE_META_MAP_KEY = 'solomate_proactive_meta_by_companion'

const LEGACY_CHAT_MESSAGES_KEY = 'solomate_chat_messages'
const LEGACY_CONVERSATION_STATE_KEY = 'solomate_conversation_state'
const LEGACY_CONVERSATION_ID_KEY = 'solomate_conversation_id'
const LEGACY_LAST_PROACTIVE_AT_KEY = 'solomate_last_proactive_at'
const LEGACY_LAST_USER_MESSAGE_AT_KEY = 'solomate_last_user_message_at'
const LEGACY_PROACTIVE_COUNT_TODAY_KEY = 'solomate_proactive_count_today'

const readJson = (key, fallbackValue) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallbackValue
  } catch {
    return fallbackValue
  }
}

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
  return value
}

const readObject = (key) => {
  const value = readJson(key, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

const resolveCompanionId = (companionId = '', fallbackPersonaId = '') =>
  companionId || getActiveCompanionId() || fallbackPersonaId || 'gentle_friend'

const formatTime = (timestamp = Date.now()) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))

const normalizeMessage = (message = {}, fallbackPersonaId = 'gentle_friend') => {
  const role = message.role === 'user' ? 'user' : 'assistant'
  const timestamp = message.timestamp || new Date().toISOString()
  const text = String(message.text || message.content || message.reply_text || '').trim()

  return {
    id: message.id || `msg-${Date.now()}`,
    role,
    text,
    timestamp,
    time: message.time || formatTime(timestamp),
    persona_id: message.persona_id || fallbackPersonaId,
    reply_type: message.reply_type || '',
    emotion_detected: message.emotion_detected || '',
    message_type: message.message_type || '',
  }
}

const normalizeMessages = (messages = [], fallbackPersonaId = 'gentle_friend') =>
  (Array.isArray(messages) ? messages : [])
    .map((message) => normalizeMessage(message, fallbackPersonaId))
    .filter((message) => message.text)

const normalizeConversationState = (conversationState = {}, sharedBadges = []) => {
  const preferences = conversationState.preferences && typeof conversationState.preferences === 'object' ? conversationState.preferences : {}
  const liveContext = conversationState.live_context && typeof conversationState.live_context === 'object' ? conversationState.live_context : {}
  const weather = liveContext.weather && typeof liveContext.weather === 'object' ? liveContext.weather : {}

  return {
    ...initialConversationState,
    ...conversationState,
    preferences: {
      ...initialConversationState.preferences,
      ...preferences,
    },
    visited_places: Array.isArray(conversationState.visited_places) ? conversationState.visited_places.filter(Boolean) : [],
    badges: Array.isArray(sharedBadges) ? [...sharedBadges] : [],
    live_context: {
      ...initialConversationState.live_context,
      ...liveContext,
      weather: {
        ...initialConversationState.live_context.weather,
        ...weather,
      },
      nearby_places: Array.isArray(liveContext.nearby_places) ? liveContext.nearby_places.filter(Boolean) : [],
    },
  }
}

const createConversationId = () => `demo-${Date.now()}`

const normalizeProactiveMeta = (meta = {}) => ({
  lastProactiveAt: meta.lastProactiveAt || '',
  lastUserMessageAt: meta.lastUserMessageAt || '',
  proactiveCountToday: Number(meta.proactiveCountToday || 0),
})

export const getCompanionMessages = (companionId = '', fallbackPersonaId = '') => {
  const resolvedId = resolveCompanionId(companionId, fallbackPersonaId)
  const messageMap = readObject(MESSAGE_MAP_KEY)

  if (Array.isArray(messageMap[resolvedId])) {
    return normalizeMessages(messageMap[resolvedId], resolvedId)
  }

  if (Object.keys(messageMap).length === 0) {
    return normalizeMessages(readJson(LEGACY_CHAT_MESSAGES_KEY, []), resolvedId)
  }

  return []
}

export const getCompanionConversationState = (companionId = '', sharedBadges = []) => {
  const resolvedId = resolveCompanionId(companionId)
  const stateMap = readObject(CONVERSATION_STATE_MAP_KEY)

  if (stateMap[resolvedId] && typeof stateMap[resolvedId] === 'object') {
    return normalizeConversationState(stateMap[resolvedId], sharedBadges)
  }

  if (Object.keys(stateMap).length === 0) {
    return normalizeConversationState(readJson(LEGACY_CONVERSATION_STATE_KEY, {}), sharedBadges)
  }

  return normalizeConversationState({}, sharedBadges)
}

export const setCompanionConversationState = (companionId = '', conversationState = {}, sharedBadges = []) => {
  const resolvedId = resolveCompanionId(companionId)
  const nextState = normalizeConversationState(conversationState, sharedBadges)

  writeJson(CONVERSATION_STATE_MAP_KEY, {
    ...readObject(CONVERSATION_STATE_MAP_KEY),
    [resolvedId]: nextState,
  })

  return nextState
}

export const setCompanionMessages = (companionId = '', messages = [], fallbackPersonaId = '') => {
  const resolvedId = resolveCompanionId(companionId, fallbackPersonaId)
  const nextMessages = normalizeMessages(messages, resolvedId)

  writeJson(MESSAGE_MAP_KEY, {
    ...readObject(MESSAGE_MAP_KEY),
    [resolvedId]: nextMessages,
  })
  setChatHistoryForCompanion(resolvedId, nextMessages)

  return nextMessages
}

export const addCompanionMessage = (companionId = '', message = {}, options = {}) => {
  const resolvedId = resolveCompanionId(companionId, options.fallbackPersonaId)
  const normalizedMessage = normalizeMessage(message, resolvedId)
  const nextMessages = [...getCompanionMessages(resolvedId, resolvedId), normalizedMessage]
  const currentConversationState = getCompanionConversationState(resolvedId, options.sharedBadges)
  let nextConversationState = currentConversationState

  if (normalizedMessage.role === 'user') {
    nextConversationState = deriveConversationStateFromUserText(normalizedMessage.text, currentConversationState)

    writeJson(PROACTIVE_META_MAP_KEY, {
      ...readObject(PROACTIVE_META_MAP_KEY),
      [resolvedId]: {
        ...getCompanionProactiveMeta(resolvedId),
        lastUserMessageAt: normalizedMessage.timestamp,
      },
    })
    window.localStorage.setItem(LEGACY_LAST_USER_MESSAGE_AT_KEY, normalizedMessage.timestamp)
  }

  if (normalizedMessage.role === 'assistant' && normalizedMessage.emotion_detected) {
    nextConversationState = {
      ...nextConversationState,
      mood: normalizedMessage.emotion_detected,
    }
  }

  setCompanionMessages(resolvedId, nextMessages, resolvedId)
  setCompanionConversationState(resolvedId, nextConversationState, options.sharedBadges)

  return {
    messages: nextMessages,
    conversationState: nextConversationState,
  }
}

export const getCompanionConversationId = (companionId = '') => {
  const resolvedId = resolveCompanionId(companionId)
  const idMap = readObject(CONVERSATION_ID_MAP_KEY)

  if (idMap[resolvedId]) {
    return idMap[resolvedId]
  }

  if (Object.keys(idMap).length === 0) {
    const legacyId = window.localStorage.getItem(LEGACY_CONVERSATION_ID_KEY)
    if (legacyId) {
      writeJson(CONVERSATION_ID_MAP_KEY, {
        ...idMap,
        [resolvedId]: legacyId,
      })
      return legacyId
    }
  }

  const conversationId = createConversationId()
  writeJson(CONVERSATION_ID_MAP_KEY, {
    ...idMap,
    [resolvedId]: conversationId,
  })
  window.localStorage.setItem(LEGACY_CONVERSATION_ID_KEY, conversationId)
  return conversationId
}

export const getCompanionProactiveMeta = (companionId = '') => {
  const resolvedId = resolveCompanionId(companionId)
  const metaMap = readObject(PROACTIVE_META_MAP_KEY)

  if (metaMap[resolvedId]) {
    return normalizeProactiveMeta(metaMap[resolvedId])
  }

  if (Object.keys(metaMap).length === 0) {
    return normalizeProactiveMeta({
      lastProactiveAt: window.localStorage.getItem(LEGACY_LAST_PROACTIVE_AT_KEY) || '',
      lastUserMessageAt: window.localStorage.getItem(LEGACY_LAST_USER_MESSAGE_AT_KEY) || '',
      proactiveCountToday: Number(window.localStorage.getItem(LEGACY_PROACTIVE_COUNT_TODAY_KEY) || '0'),
    })
  }

  return normalizeProactiveMeta()
}

export const markCompanionProactiveMessage = (companionId = '', timestamp = new Date().toISOString()) => {
  const resolvedId = resolveCompanionId(companionId)
  const currentMeta = getCompanionProactiveMeta(resolvedId)

  writeJson(PROACTIVE_META_MAP_KEY, {
    ...readObject(PROACTIVE_META_MAP_KEY),
    [resolvedId]: {
      ...currentMeta,
      lastProactiveAt: timestamp,
      proactiveCountToday: currentMeta.proactiveCountToday + 1,
    },
  })

  window.localStorage.setItem(LEGACY_LAST_PROACTIVE_AT_KEY, timestamp)
  window.localStorage.setItem(LEGACY_PROACTIVE_COUNT_TODAY_KEY, String(Number(window.localStorage.getItem(LEGACY_PROACTIVE_COUNT_TODAY_KEY) || '0') + 1))
}
