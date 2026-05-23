import { personas } from '../services/api'

export const CONVERSATION_ID_KEY = 'solomate_conversation_id'
export const CHAT_MESSAGES_KEY = 'solomate_chat_messages'
export const CONVERSATION_STATE_KEY = 'solomate_conversation_state'

const SELECTED_PERSONA_KEY = 'selectedPersona'
const PERSONA_ID_KEY = 'persona_id'
const COMPLETED_TASKS_KEY = 'completedTasks'
const BADGES_KEY = 'badges'
const VISITED_PLACES_KEY = 'visitedPlaces'
const MOOD_HISTORY_KEY = 'moodHistory'
const CHAT_SUMMARY_KEY = 'solomate_chat_summary'
const MEMORY_FRAGMENT_KEY = 'memoryFragments'
const MEMORY_DROP_STATE_KEY = 'memoryDropState'

const LEGACY_BADGE_MAP = {
  first_step: '不孤单徽章',
}

const initialLiveContext = {
  local_time: '',
  time_of_day: '',
  source: 'unavailable',
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
  completedTasks: [],
  visitedPlaces: [],
  moodHistory: [
    { label: '出发前', mood: '有点犹豫' },
    { label: '路上', mood: '慢慢放松' },
  ],
  conversationState: initialConversationState,
}

const PLACE_STOP_WORDS = new Set([
  '这里',
  '那里',
  '这边',
  '那边',
  '附近',
  '一下',
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

const normalizeBadge = (badge) => LEGACY_BADGE_MAP[badge] || badge

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

const normalizeLiveContext = (liveContext = {}) => ({
  ...initialLiveContext,
  ...liveContext,
  source: liveContext.source || 'unavailable',
  latitude: normalizeNumber(liveContext.latitude),
  longitude: normalizeNumber(liveContext.longitude),
  weather: normalizeWeather(liveContext.weather || {}),
  nearby_places: Array.isArray(liveContext.nearby_places) ? liveContext.nearby_places.filter(Boolean) : [],
})

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
    badges: Array.isArray(state.badges) ? state.badges.map(normalizeBadge).filter(Boolean) : [],
    live_context: normalizeLiveContext(state.live_context || {}),
  }
}

const normalizeState = (state = {}) => {
  const selectedPersona =
    state.selectedPersona ||
    personas.find((item) => item.id === state.personaId || item.id === localStorage.getItem(PERSONA_ID_KEY)) ||
    personas[0]

  const messagesSource = Array.isArray(state.messages) ? state.messages : readJson(CHAT_MESSAGES_KEY, [])
  const badgesSource = Array.isArray(state.badges) ? state.badges : readJson(BADGES_KEY, [])
  const completedTasks = Array.isArray(state.completedTasks) ? state.completedTasks : readJson(COMPLETED_TASKS_KEY, [])
  const visitedPlaces = Array.isArray(state.visitedPlaces) ? state.visitedPlaces : readJson(VISITED_PLACES_KEY, [])
  const moodHistory = Array.isArray(state.moodHistory) ? state.moodHistory : readJson(MOOD_HISTORY_KEY, initialState.moodHistory)
  const conversationStateSource =
    state.conversationState && typeof state.conversationState === 'object'
      ? state.conversationState
      : readJson(CONVERSATION_STATE_KEY, initialConversationState)

  return {
    ...initialState,
    ...state,
    selectedPersona,
    messages: normalizeMessages(messagesSource, selectedPersona.id),
    badges: badgesSource.map(normalizeBadge),
    completedTasks,
    visitedPlaces,
    moodHistory,
    conversationState: normalizeConversationState(conversationStateSource),
  }
}

const persistState = (state) => {
  const next = normalizeState(state)

  writeJson(CHAT_MESSAGES_KEY, next.messages)
  writeJson(CONVERSATION_STATE_KEY, next.conversationState)
  writeJson(COMPLETED_TASKS_KEY, next.completedTasks)
  writeJson(BADGES_KEY, next.badges)
  writeJson(VISITED_PLACES_KEY, next.visitedPlaces)
  writeJson(MOOD_HISTORY_KEY, next.moodHistory)
  localStorage.setItem(SELECTED_PERSONA_KEY, JSON.stringify(next.selectedPersona))
  localStorage.setItem(PERSONA_ID_KEY, next.selectedPersona.id)

  return next
}

const readState = () =>
  normalizeState({
    selectedPersona: readJson(SELECTED_PERSONA_KEY, null),
    completedTasks: readJson(COMPLETED_TASKS_KEY, []),
    badges: readJson(BADGES_KEY, []),
    visitedPlaces: readJson(VISITED_PLACES_KEY, []),
    moodHistory: readJson(MOOD_HISTORY_KEY, initialState.moodHistory),
  })

const cleanPlaceCandidate = (value = '') => {
  let place = String(value || '').trim()
  if (!place) return ''

  place = place.split(/[\s，。？！!?,、\n]/)[0] || ''
  place = place.replace(/^(那个|这个|这家|这里的|那家的|这边的|那边的|从这里|从那边)/, '')
  place = place.replace(/(啊|呀|呢|了|吧|嘛|哦|呐)+$/g, '')
  place = place.replace(/(玩|逛|看看|看一看|拍照|打卡|吃饭|喝咖啡|喝点东西)+$/g, '')
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
    /(?:我又想去|我想去|我要去|准备去|想去)([^，。？！!?,、\s\n]{1,16})/,
    /(?:去)([^，。？！!?,、\s\n]{1,16})(?:玩|逛|看看|打卡)?/,
    /(?:到)([^，。？！!?,、\s\n]{1,16})了/,
    /(?:我在)([^，。？！!?,、\s\n]{1,16})/,
    /(?:想找|想吃|想喝)([^，。？！!?,、\s\n]{1,16})/,
    /([^，。？！!?,、\s\n]{1,16})(?:哪里好拍照|哪儿好拍|怎么拍|好拍吗|有什么好吃的|有啥好吃的|人好多|好多人)/,
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
    /(?:怎么|如何)?从([^，。？！!?,、\s\n]{1,16})去([^，。？！!?,、\s\n]{1,16})/,
    /([^，。？！!?,、\s\n]{1,16})到([^，。？！!?,、\s\n]{1,16})(?:怎么走|怎么去|怎么过去|路线|咋走|咋去)/,
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

  const originOnlyMatch = text.match(/(?:怎么|如何)?从([^，。？！!?,、\s\n]{1,16})去(?:呢|呀|啊|嘛)?$/)
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
  if (/你怎么知道|定位|位置怎么来的|你有我定位/.test(text)) return 'identity'
  if (/危险|害怕|不安全|有人跟着|迷路|救命/.test(text)) return 'safety'
  if (/我的位置|我在哪|我现在在哪|现在在哪/.test(text)) return 'location_status'
  if (/现在几点|几点了|现在几号|今天几号|几点啦/.test(text)) return 'time'
  if (routeInfo.is_route_question || /怎么去|怎么走|怎么从|从哪里去|从.+到.+|过去|回酒店|回去/.test(text)) return 'route'
  if (/天气|下雨|冷不冷|热不热|带伞|防晒|穿什么/.test(text)) return 'weather'
  if (/有什么故事|有什么来历|为什么有名|历史|典故/.test(text)) return 'story'
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

  const effectivePlace =
    routeInfo.target_place ||
    explicitPlace ||
    nextState.target_place ||
    nextState.current_place ||
    nextState.last_place ||
    ''

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
  const existing = localStorage.getItem(CONVERSATION_ID_KEY)
  if (existing) {
    return existing
  }

  const conversationId = `demo-${Date.now()}`
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

export const unlockBadge = (badgeId) => {
  const state = readState()
  const badge = normalizeBadge(badgeId)
  if (state.badges.includes(badge)) {
    return state
  }

  return persistState({
    ...state,
    badges: [...state.badges, badge],
    conversationState: {
      ...state.conversationState,
      badges: [...new Set([...state.conversationState.badges, badge])],
    },
  })
}

export const completeTask = (taskId, badgeId) => {
  const state = readState()
  const badge = badgeId ? normalizeBadge(badgeId) : ''
  const nextBadges = badge ? [...new Set([...state.badges, badge])] : state.badges

  return persistState({
    ...state,
    completedTasks: [...new Set([...state.completedTasks, taskId])],
    badges: nextBadges,
    conversationState: {
      ...state.conversationState,
      badges: [...new Set([...state.conversationState.badges, ...nextBadges])],
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

export const resetDemoState = () => {
  ;[
    CONVERSATION_ID_KEY,
    CHAT_MESSAGES_KEY,
    CONVERSATION_STATE_KEY,
    SELECTED_PERSONA_KEY,
    PERSONA_ID_KEY,
    COMPLETED_TASKS_KEY,
    BADGES_KEY,
    VISITED_PLACES_KEY,
    MOOD_HISTORY_KEY,
    CHAT_SUMMARY_KEY,
    MEMORY_FRAGMENT_KEY,
    MEMORY_DROP_STATE_KEY,
  ].forEach((key) => localStorage.removeItem(key))

  return persistState(initialState)
}
