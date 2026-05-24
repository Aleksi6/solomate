import { personas } from '../services/api'

export const CONVERSATION_ID_KEY = 'solomate_conversation_id'
export const SESSION_DATE_KEY = 'solomate_session_date'
export const CHAT_MESSAGES_KEY = 'solomate_chat_messages'
export const CONVERSATION_STATE_KEY = 'solomate_conversation_state'
export const MEMORY_FRAGMENTS_KEY = 'solomate_memory_fragments'
export const BADGES_KEY = 'solomate_badges'
export const COMPLETED_TASKS_KEY = 'solomate_completed_tasks'
export const DIARY_KEY = 'solomate_diary'

const SELECTED_PERSONA_KEY = 'selectedPersona'
const PERSONA_ID_KEY = 'persona_id'
const VISITED_PLACES_KEY = 'visitedPlaces'
const MOOD_HISTORY_KEY = 'moodHistory'
const LEGACY_BADGES_KEY = 'badges'
const LEGACY_COMPLETED_TASKS_KEY = 'completedTasks'
const LEGACY_MEMORY_FRAGMENT_KEY = 'memoryFragments'
const LEGACY_MEMORY_DROP_STATE_KEY = 'memoryDropState'
const LEGACY_CHAT_SUMMARY_KEY = 'solomate_chat_summary'

const LEGACY_BADGE_MAP = {
  first_step: '不孤单徽章',
}

const DEFAULT_MOOD_HISTORY = [
  { label: '出发前', mood: '有点犹豫' },
  { label: '路上', mood: '慢慢放松' },
]

const initialLiveContext = {
  local_time: '',
  time_of_day: '',
  location_source: 'none',
  source: 'none',
  latitude: null,
  longitude: null,
  city: '',
  place_name: '',
  weather: {
    condition: '',
    temperature_c: null,
    rain_probability: null,
    uv_index: null,
    source: 'mock',
  },
  nearby_places: [],
}

export const initialConversationState = {
  current_city: '',
  current_place: '',
  origin_place: '',
  target_place: '',
  last_place: '',
  last_intent: '',
  last_user_goal: '',
  pending_question: '',
  mood: '',
  travel_mode: 'solo',
  preferences: {
    crowd: '',
    pace: '',
    budget: '',
    food_preference: '',
  },
  history_summary: '',
  visited_places: [],
  badges: [],
  live_context: initialLiveContext,
}

const initialState = {
  selectedPersona: personas[0],
  messages: [],
  badges: [],
  badgeRecords: [],
  completedTasks: [],
  visitedPlaces: [],
  moodHistory: DEFAULT_MOOD_HISTORY,
  memoryFragments: [],
  diary: null,
  conversationState: initialConversationState,
}

const PLACE_STOP_WORDS = new Set([
  '这里',
  '那里',
  '这边',
  '那边',
  '附近',
  '一个',
  '我们',
  '现在',
  '今天',
  '晚上',
  '白天',
  '一个人',
  'solo',
])

const CONTINUATION_PATTERNS = /继续聊|继续说|展开讲|然后呢|再讲讲|多说点|细说说|继续吧|接着聊|好的，继续聊吧|好啊继续/

const formatTime = (timestamp = Date.now()) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))

const getTodaySessionDate = () => {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const createConversationId = () => `demo-${Date.now()}`

const readJson = (key, fallbackValue) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallbackValue
  } catch {
    return fallbackValue
  }
}

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

const normalizeBadgeName = (badge) => {
  if (!badge) return ''
  if (typeof badge === 'object') {
    return LEGACY_BADGE_MAP[badge.name] || badge.name || badge.id || ''
  }
  return LEGACY_BADGE_MAP[badge] || String(badge)
}

const normalizeNumber = (value, fallback = null) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const normalizeWeather = (weather = {}) => ({
  condition: weather.condition || '',
  temperature_c: normalizeNumber(weather.temperature_c),
  rain_probability: normalizeNumber(weather.rain_probability),
  uv_index: normalizeNumber(weather.uv_index),
  source: weather.source || 'mock',
})

const normalizeLiveContext = (liveContext = {}) => {
  const locationSource = liveContext.location_source || liveContext.source || 'none'

  return {
    ...initialLiveContext,
    ...liveContext,
    location_source: locationSource,
    source: locationSource,
    latitude: normalizeNumber(liveContext.latitude),
    longitude: normalizeNumber(liveContext.longitude),
    weather: normalizeWeather(liveContext.weather || {}),
    nearby_places: Array.isArray(liveContext.nearby_places) ? liveContext.nearby_places.filter(Boolean) : [],
  }
}

const normalizeMessage = (message = {}, selectedPersonaId = personas[0].id) => {
  const role = message.role === 'user' ? 'user' : 'assistant'
  const timestamp = message.timestamp || new Date().toISOString()
  const text = String(message.text || message.content || message.reply_text || '').trim()

  return {
    id: message.id || `msg-${Date.now()}`,
    role,
    text,
    timestamp,
    time: message.time || formatTime(timestamp),
    persona_id: message.persona_id || selectedPersonaId,
    reply_type: message.reply_type || '',
    emotion_detected: message.emotion_detected || '',
  }
}

const normalizeMessages = (messages = [], selectedPersonaId = personas[0].id) =>
  (Array.isArray(messages) ? messages : [])
    .map((message) => normalizeMessage(message, selectedPersonaId))
    .filter((message) => message.text)

const normalizeConversationState = (state = {}) => {
  const preferences = state.preferences && typeof state.preferences === 'object' ? state.preferences : {}

  return {
    ...initialConversationState,
    ...state,
    preferences: {
      ...initialConversationState.preferences,
      ...preferences,
    },
    visited_places: Array.isArray(state.visited_places) ? state.visited_places.filter(Boolean) : [],
    badges: Array.isArray(state.badges) ? state.badges.map(normalizeBadgeName).filter(Boolean) : [],
    live_context: normalizeLiveContext(state.live_context || {}),
  }
}

const normalizeBadgeRecord = (badge = {}) => {
  const name = normalizeBadgeName(badge)
  if (!name) return null

  return {
    id: badge.id || name,
    name,
    unlocked_at: badge.unlocked_at || badge.unlockedAt || new Date().toISOString(),
    source_fragments: Array.isArray(badge.source_fragments)
      ? [...new Set(badge.source_fragments.filter(Boolean))]
      : Array.isArray(badge.sourceFragments)
        ? [...new Set(badge.sourceFragments.filter(Boolean))]
        : [],
    count: Number.isFinite(Number(badge.count)) && Number(badge.count) > 0 ? Number(badge.count) : 1,
  }
}

const mergeBadgeRecords = (records = []) => {
  const merged = new Map()

  for (const record of records.map(normalizeBadgeRecord).filter(Boolean)) {
    const existing = merged.get(record.id)
    if (!existing) {
      merged.set(record.id, record)
      continue
    }

    merged.set(record.id, {
      ...existing,
      unlocked_at: record.unlocked_at || existing.unlocked_at,
      count: Math.max(existing.count, record.count),
      source_fragments: [...new Set([...(existing.source_fragments || []), ...(record.source_fragments || [])])],
    })
  }

  return Array.from(merged.values())
}

const buildBadgeNames = (records = []) => mergeBadgeRecords(records).map((record) => record.name)

const normalizeFragment = (fragment = {}, selectedPersonaId = personas[0].id) => {
  const imageDataUrl = fragment.image_data_url || fragment.image || ''
  const taskResult = fragment.task_result && typeof fragment.task_result === 'object' ? fragment.task_result : {}
  const badgesUnlocked = Array.isArray(fragment.badges_unlocked)
    ? fragment.badges_unlocked.map(normalizeBadgeName).filter(Boolean)
    : taskResult.reward_badge
      ? [normalizeBadgeName(taskResult.reward_badge)]
      : []

  return {
    id: fragment.id || `fragment-${Date.now()}`,
    type: fragment.type || (imageDataUrl ? 'photo' : 'souvenir'),
    image_data_url: imageDataUrl,
    thumbnail: fragment.thumbnail || imageDataUrl,
    created_at: fragment.created_at || fragment.collectedAt || new Date().toISOString(),
    place_name: fragment.place_name || fragment.location || '',
    city: fragment.city || '',
    persona_id: fragment.persona_id || selectedPersonaId,
    scene_summary: fragment.scene_summary || fragment.title || '',
    safety_observation: fragment.safety_observation || '',
    photo_advice: fragment.photo_advice || fragment.description || '',
    reply_text: fragment.reply_text || '',
    visual_tags: Array.isArray(fragment.visual_tags) ? fragment.visual_tags.filter(Boolean) : [],
    detected_scene_type: fragment.detected_scene_type || '',
    task_result: {
      passed: typeof taskResult.passed === 'boolean' ? taskResult.passed : false,
      reward_badge: normalizeBadgeName(taskResult.reward_badge || ''),
      reason: taskResult.reason || '',
    },
    badges_unlocked: [...new Set(badgesUnlocked)],
    is_rare: Boolean(fragment.is_rare || fragment.rarity === 'rare'),
    title: fragment.title || fragment.scene_summary || fragment.reply_text || '寄给搭子的这一张',
    description: fragment.description || fragment.photo_advice || fragment.scene_summary || '',
    location: fragment.location || [fragment.city, fragment.place_name].filter(Boolean).join(' '),
    image: imageDataUrl,
    rarity: fragment.rarity || (fragment.is_rare ? 'rare' : 'common'),
    dropKind: fragment.dropKind || (fragment.type === 'photo' ? 'souvenir_card' : 'random_drop'),
    source: fragment.source || (fragment.type === 'photo' ? 'photo_analysis' : 'souvenir_card'),
  }
}

const normalizeFragments = (fragments = [], selectedPersonaId = personas[0].id) =>
  (Array.isArray(fragments) ? fragments : []).map((fragment) => normalizeFragment(fragment, selectedPersonaId))

const ensureSessionFresh = () => {
  const today = getTodaySessionDate()
  const sessionDate = localStorage.getItem(SESSION_DATE_KEY)

  if (sessionDate === today) {
    return
  }

  localStorage.setItem(SESSION_DATE_KEY, today)
  localStorage.setItem(CONVERSATION_ID_KEY, createConversationId())
  localStorage.removeItem(CHAT_MESSAGES_KEY)
  localStorage.removeItem(CONVERSATION_STATE_KEY)
  localStorage.removeItem(COMPLETED_TASKS_KEY)
  localStorage.removeItem(LEGACY_COMPLETED_TASKS_KEY)
  localStorage.removeItem(DIARY_KEY)
}

const readBadgeRecords = () => {
  const stored = readJson(BADGES_KEY, null)
  if (Array.isArray(stored) && stored.length > 0 && typeof stored[0] === 'object') {
    return mergeBadgeRecords(stored)
  }

  const legacyBadges = readJson(LEGACY_BADGES_KEY, [])
  return mergeBadgeRecords((Array.isArray(stored) ? stored : []).concat(legacyBadges))
}

const readMemoryFragments = (selectedPersonaId = personas[0].id) => {
  const stored = readJson(MEMORY_FRAGMENTS_KEY, null)
  const legacy = readJson(LEGACY_MEMORY_FRAGMENT_KEY, [])
  return normalizeFragments(Array.isArray(stored) && stored.length > 0 ? stored : legacy, selectedPersonaId)
}

const normalizeState = (state = {}) => {
  ensureSessionFresh()

  const selectedPersona =
    state.selectedPersona ||
    personas.find((item) => item.id === state.personaId || item.id === localStorage.getItem(PERSONA_ID_KEY)) ||
    personas[0]

  const messagesSource = Array.isArray(state.messages) ? state.messages : readJson(CHAT_MESSAGES_KEY, [])
  const badgeRecords = Array.isArray(state.badgeRecords) ? mergeBadgeRecords(state.badgeRecords) : readBadgeRecords()
  const completedTasks = Array.isArray(state.completedTasks)
    ? [...new Set(state.completedTasks.filter(Boolean))]
    : [...new Set(readJson(COMPLETED_TASKS_KEY, readJson(LEGACY_COMPLETED_TASKS_KEY, [])))]
  const visitedPlaces = Array.isArray(state.visitedPlaces) ? state.visitedPlaces : readJson(VISITED_PLACES_KEY, [])
  const moodHistory = Array.isArray(state.moodHistory) ? state.moodHistory : readJson(MOOD_HISTORY_KEY, DEFAULT_MOOD_HISTORY)
  const conversationStateSource =
    state.conversationState && typeof state.conversationState === 'object'
      ? state.conversationState
      : readJson(CONVERSATION_STATE_KEY, initialConversationState)
  const diary = state.diary !== undefined ? state.diary : readJson(DIARY_KEY, null)
  const memoryFragments = Array.isArray(state.memoryFragments)
    ? normalizeFragments(state.memoryFragments, selectedPersona.id)
    : readMemoryFragments(selectedPersona.id)

  return {
    ...initialState,
    ...state,
    selectedPersona,
    messages: normalizeMessages(messagesSource, selectedPersona.id),
    badgeRecords,
    badges: buildBadgeNames(badgeRecords),
    completedTasks,
    visitedPlaces,
    moodHistory,
    memoryFragments,
    diary,
    conversationState: normalizeConversationState({
      ...conversationStateSource,
      badges: buildBadgeNames(badgeRecords),
    }),
  }
}

const persistState = (state) => {
  const next = normalizeState(state)

  writeJson(CHAT_MESSAGES_KEY, next.messages)
  writeJson(CONVERSATION_STATE_KEY, next.conversationState)
  writeJson(COMPLETED_TASKS_KEY, next.completedTasks)
  writeJson(BADGES_KEY, next.badgeRecords)
  writeJson(MEMORY_FRAGMENTS_KEY, next.memoryFragments)
  writeJson(DIARY_KEY, next.diary)

  writeJson(LEGACY_COMPLETED_TASKS_KEY, next.completedTasks)
  writeJson(LEGACY_BADGES_KEY, next.badges)
  writeJson(LEGACY_MEMORY_FRAGMENT_KEY, next.memoryFragments)
  writeJson(VISITED_PLACES_KEY, next.visitedPlaces)
  writeJson(MOOD_HISTORY_KEY, next.moodHistory)
  localStorage.setItem(SELECTED_PERSONA_KEY, JSON.stringify(next.selectedPersona))
  localStorage.setItem(PERSONA_ID_KEY, next.selectedPersona.id)
  localStorage.setItem(SESSION_DATE_KEY, getTodaySessionDate())

  if (!localStorage.getItem(CONVERSATION_ID_KEY)) {
    localStorage.setItem(CONVERSATION_ID_KEY, createConversationId())
  }

  return next
}

const readState = () =>
  normalizeState({
    selectedPersona: readJson(SELECTED_PERSONA_KEY, null),
  })

const cleanPlaceCandidate = (value = '') => {
  let place = String(value || '').trim()
  if (!place) return ''

  place = place.split(/[\s，。？?！!、\n]/)[0] || ''
  place = place.replace(/^(那个|这个|这家|这里的|那家的|这边的|那边的|从这里|从那边)/, '')
  place = place.replace(/(啊|呀|呢|了|吧|嘛)+$/g, '')
  place = place.replace(/(玩|逛|看看|拍照|打卡|吃饭|喝咖啡|喝点东西)+$/g, '')
  place = place.replace(/(附近|周边)+$/g, '')
  place = place.trim()

  if (!place || place.length > 16 || PLACE_STOP_WORDS.has(place)) {
    return ''
  }

  return place
}

export const extractExplicitPlace = (userText = '') => {
  const text = String(userText || '').trim()
  if (!text) return ''

  const patterns = [
    /(?:我又想去|我想去|我要去|准备去|想去)([^，。？?！!、\s\n]{1,16})/,
    /(?:去)([^，。？?！!、\s\n]{1,16})(?:玩|逛|看看|打卡)?/,
    /(?:到)([^，。？?！!、\s\n]{1,16})了/,
    /(?:我在)([^，。？?！!、\s\n]{1,16})/,
    /(?:想找|想吃|想喝)([^，。？?！!、\s\n]{1,16})/,
    /([^，。？?！!、\s\n]{1,16})(?:哪里好拍照|哪儿好拍|怎么拍|好拍吗|有什么好吃的|有啥好吃的|人好多|好多人)/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    const place = cleanPlaceCandidate(match?.[1] || '')
    if (place) {
      return place
    }
  }

  return ''
}

export const extractRouteIntent = (userText = '', conversationState = initialConversationState) => {
  const text = String(userText || '').trim()
  const state = normalizeConversationState(conversationState)
  const result = {
    origin_place: '',
    target_place: '',
    is_route_question: false,
  }

  if (!text) return result

  const fullRoutePatterns = [
    /(?:怎么|如何)?从([^，。？?！!、\s\n]{1,16})去([^，。？?！!、\s\n]{1,16})/,
    /([^，。？?！!、\s\n]{1,16})到([^，。？?！!、\s\n]{1,16})(?:怎么走|怎么去|怎么过去|路线|咋走|咋去)/,
  ]

  for (const pattern of fullRoutePatterns) {
    const match = text.match(pattern)
    const originPlace = cleanPlaceCandidate(match?.[1] || '')
    const targetPlace = cleanPlaceCandidate(match?.[2] || '')
    if (originPlace || targetPlace) {
      return {
        origin_place: originPlace,
        target_place: targetPlace,
        is_route_question: true,
      }
    }
  }

  const originOnlyMatch = text.match(/(?:怎么|如何)?从([^，。？?！!、\s\n]{1,16})去(?:呢|呀|吧)?$/)
  if (originOnlyMatch) {
    return {
      origin_place: cleanPlaceCandidate(originOnlyMatch[1] || ''),
      target_place: cleanPlaceCandidate(state.target_place || state.current_place || state.last_place || ''),
      is_route_question: true,
    }
  }

  if (/从这里去|怎么从这里去|怎么从这边去|怎么从那边去|怎么去那里|怎么过去|怎么去|怎么走|回酒店|回去|回住的地方/.test(text)) {
    return {
      origin_place: cleanPlaceCandidate(state.current_place || state.origin_place || state.live_context.place_name || ''),
      target_place: cleanPlaceCandidate(state.target_place || state.last_place || ''),
      is_route_question: true,
    }
  }

  return result
}

const isContinuationPrompt = (userText = '') => CONTINUATION_PATTERNS.test(String(userText || '').trim())

const inferIntentFromGoal = (goal = '') => {
  const text = String(goal || '')
  if (!text) return ''
  if (/故事|来历|记忆/.test(text)) return 'story'
  if (/找吃的|吃什么|喝/.test(text)) return 'food'
  if (/拍照|出片/.test(text)) return 'photo'
  if (/去/.test(text) && /从/.test(text)) return 'route'
  if (/天气|出门/.test(text)) return 'weather'
  return ''
}

const inferIntentFromUserText = (userText = '', explicitPlace = '', routeInfo = {}) => {
  const text = String(userText || '')

  if (isContinuationPrompt(text)) return 'continue'
  if (/你怎么知道|定位|位置怎么来的|你有我定位吗/.test(text)) return 'identity'
  if (/危险|害怕|不安全|有人跟着|迷路|救命/.test(text)) return 'safety'
  if (/我的位置|我在哪|我现在在哪|现在在哪/.test(text)) return 'location_status'
  if (/现在几点|几点了|现在几号|今天几号/.test(text)) return 'time'
  if (routeInfo.is_route_question || /怎么去|怎么走|怎么从|从哪里去|从.+到.+|过去|回酒店|回去/.test(text)) return 'route'
  if (/天气|下雨|冷不冷|热不热|带伞|防晒|穿什么/.test(text)) return 'weather'
  if (/有什么故事吗|有什么来历|为什么有名|历史|典故/.test(text)) return 'story'
  if (/有啥好吃的|有什么好吃的|吃什么|想吃|餐厅|小吃|夜宵|火锅|咖啡|喝点什么/.test(text)) return 'food'
  if (/哪里好拍照|哪儿好拍|怎么拍|拍哪里|机位|角度|出片|打卡照|拍照|照片|好拍吗/.test(text)) return 'photo'
  if (/好多人|人好多|太挤|人挤人|排队|人山人海|热闹/.test(text)) return 'crowd'
  if (explicitPlace) return 'place_specific'
  if (/任务|徽章|打卡|解锁/.test(text)) return 'game'
  if (/不知道去哪|附近有什么|推荐一下|去哪里|想去玩|我要去玩/.test(text)) return 'decision'
  if (/你好|嗨|hello|hi|在吗/.test(text)) return 'greeting'
  return 'chat'
}

const deriveUserGoal = ({ inferredIntent = '', originPlace = '', targetPlace = '', effectivePlace = '', userText = '' } = {}) => {
  if (inferredIntent === 'route' && originPlace && targetPlace) return `从${originPlace}去${targetPlace}`
  if (inferredIntent === 'route' && targetPlace) return `去${targetPlace}`
  if (inferredIntent === 'food' && effectivePlace) return `在${effectivePlace}附近找吃的`
  if (inferredIntent === 'photo' && effectivePlace) return `在${effectivePlace}附近拍照`
  if (inferredIntent === 'weather') return '根据天气决定出门安排'
  if (inferredIntent === 'story' && effectivePlace) return `了解${effectivePlace}的故事`
  if (inferredIntent === 'place_specific' && targetPlace) return `把目标切到${targetPlace}`
  return String(userText || '').trim()
}

export const deriveConversationStateFromUserText = (userText = '', previousState = initialConversationState) => {
  const text = String(userText || '').trim()
  const nextState = normalizeConversationState(previousState)
  const explicitPlace = extractExplicitPlace(text)
  const routeInfo = extractRouteIntent(text, nextState)
  const inferredIntent = inferIntentFromUserText(text, explicitPlace, routeInfo)
  const isCurrentPlace = /我在|到.+了|已经到/.test(text)

  if (inferredIntent === 'continue') {
    nextState.last_intent = inferIntentFromGoal(nextState.last_user_goal) || nextState.last_intent || ''
    nextState.pending_question = nextState.last_intent || nextState.pending_question || ''
    return nextState
  }

  nextState.last_intent = inferredIntent
  nextState.pending_question = ['route', 'food', 'photo', 'weather', 'crowd', 'story'].includes(inferredIntent) ? inferredIntent : ''

  if (/累|疲惫|走不动|困/.test(text)) {
    nextState.mood = 'tired'
  } else if (/害怕|不安|危险/.test(text)) {
    nextState.mood = 'nervous'
  } else if (/开心|放松|舒服/.test(text)) {
    nextState.mood = 'relaxed'
  }

  if (/想吃|小吃|夜宵|火锅/.test(text)) {
    nextState.preferences.food_preference = 'meal'
  } else if (/咖啡|喝点什么|奶茶|饮料/.test(text)) {
    nextState.preferences.food_preference = 'drink'
  }

  if (routeInfo.origin_place) {
    nextState.origin_place = routeInfo.origin_place
  }

  if (routeInfo.target_place) {
    nextState.target_place = routeInfo.target_place
    nextState.last_place = routeInfo.target_place
  } else if (explicitPlace) {
    if (isCurrentPlace) {
      nextState.current_place = explicitPlace
    } else {
      nextState.target_place = explicitPlace
    }
    nextState.last_place = explicitPlace
  }

  const effectivePlace = routeInfo.target_place || explicitPlace || nextState.target_place || nextState.current_place || nextState.last_place || ''

  nextState.last_user_goal = deriveUserGoal({
    inferredIntent,
    originPlace: routeInfo.origin_place || nextState.origin_place,
    targetPlace: routeInfo.target_place || nextState.target_place,
    effectivePlace,
    userText: text,
  })

  return nextState
}

export const getConversationId = () => {
  ensureSessionFresh()
  const existing = localStorage.getItem(CONVERSATION_ID_KEY)
  if (existing) {
    return existing
  }

  const conversationId = createConversationId()
  localStorage.setItem(CONVERSATION_ID_KEY, conversationId)
  return conversationId
}

export const getDemoState = () => {
  const state = readState()
  getConversationId()
  return state
}

export const setSelectedPersona = (persona) => {
  const selectedPersona =
    typeof persona === 'string' ? personas.find((item) => item.id === persona) || personas[0] : persona || personas[0]

  return persistState({
    ...readState(),
    selectedPersona,
  })
}

export const setPersonaId = (personaId) => setSelectedPersona(personaId)

export const setConversationState = (conversationState) =>
  persistState({
    ...readState(),
    conversationState: normalizeConversationState(conversationState),
  })

export const addMessage = (message) => {
  const state = readState()
  const normalizedMessage = normalizeMessage(message, state.selectedPersona.id)
  let conversationState = state.conversationState

  if (normalizedMessage.role === 'user') {
    conversationState = deriveConversationStateFromUserText(normalizedMessage.text, conversationState)
  }

  if (normalizedMessage.role === 'assistant' && normalizedMessage.emotion_detected) {
    conversationState = {
      ...conversationState,
      mood: normalizedMessage.emotion_detected,
    }
  }

  return persistState({
    ...state,
    messages: [...state.messages, normalizedMessage],
    conversationState,
  })
}

export const addMood = (mood) => {
  const state = readState()
  return persistState({
    ...state,
    moodHistory: [...state.moodHistory, { label: '此刻', mood }],
    conversationState: {
      ...state.conversationState,
      mood,
    },
  })
}

export const getMemoryFragments = () => readState().memoryFragments

export const saveMemoryFragment = (fragment) => {
  const state = readState()
  const normalizedFragment = normalizeFragment(fragment, state.selectedPersona.id)
  return persistState({
    ...state,
    memoryFragments: [normalizedFragment, ...state.memoryFragments.filter((item) => item.id !== normalizedFragment.id)],
  })
}

const upsertBadgeRecord = (records = [], badgeId, sourceFragmentId = '') => {
  const name = normalizeBadgeName(badgeId)
  if (!name) return mergeBadgeRecords(records)

  const current = mergeBadgeRecords(records)
  const existing = current.find((record) => record.id === name || record.name === name)

  if (!existing) {
    return mergeBadgeRecords([
      ...current,
      {
        id: name,
        name,
        unlocked_at: new Date().toISOString(),
        source_fragments: sourceFragmentId ? [sourceFragmentId] : [],
        count: 1,
      },
    ])
  }

  return mergeBadgeRecords(
    current.map((record) =>
      record.id === existing.id
        ? {
            ...record,
            unlocked_at: record.unlocked_at || new Date().toISOString(),
            count: record.count || 1,
            source_fragments: [...new Set([...(record.source_fragments || []), ...(sourceFragmentId ? [sourceFragmentId] : [])])],
          }
        : record,
    ),
  )
}

export const unlockBadge = (badgeId, sourceFragmentId = '') => {
  const state = readState()
  const badgeRecords = upsertBadgeRecord(state.badgeRecords, badgeId, sourceFragmentId)

  return persistState({
    ...state,
    badgeRecords,
    conversationState: {
      ...state.conversationState,
      badges: buildBadgeNames(badgeRecords),
    },
  })
}

export const completeTask = (taskId, badgeId, sourceFragmentId = '') => {
  const state = readState()
  const badgeRecords = badgeId ? upsertBadgeRecord(state.badgeRecords, badgeId, sourceFragmentId) : state.badgeRecords

  return persistState({
    ...state,
    completedTasks: [...new Set([...state.completedTasks, taskId])],
    badgeRecords,
    conversationState: {
      ...state.conversationState,
      badges: buildBadgeNames(badgeRecords),
    },
  })
}

export const addVisitedPlace = (placeId) => {
  const state = readState()
  const nextVisited = [...new Set([...state.visitedPlaces, placeId])]

  return persistState({
    ...state,
    visitedPlaces: nextVisited,
    conversationState: {
      ...state.conversationState,
      visited_places: [...new Set([...state.conversationState.visited_places, placeId])],
    },
  })
}

export const setDiary = (diary) =>
  persistState({
    ...readState(),
    diary,
  })

export const resetDemoState = () => {
  ;[
    CONVERSATION_ID_KEY,
    SESSION_DATE_KEY,
    CHAT_MESSAGES_KEY,
    CONVERSATION_STATE_KEY,
    MEMORY_FRAGMENTS_KEY,
    BADGES_KEY,
    COMPLETED_TASKS_KEY,
    DIARY_KEY,
    SELECTED_PERSONA_KEY,
    PERSONA_ID_KEY,
    VISITED_PLACES_KEY,
    MOOD_HISTORY_KEY,
    LEGACY_BADGES_KEY,
    LEGACY_COMPLETED_TASKS_KEY,
    LEGACY_MEMORY_FRAGMENT_KEY,
    LEGACY_MEMORY_DROP_STATE_KEY,
    LEGACY_CHAT_SUMMARY_KEY,
  ].forEach((key) => localStorage.removeItem(key))

  localStorage.setItem(SESSION_DATE_KEY, getTodaySessionDate())
  localStorage.setItem(CONVERSATION_ID_KEY, createConversationId())

  return persistState(initialState)
}
