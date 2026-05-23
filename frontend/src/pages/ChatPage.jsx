import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, MapPin, Send, Shield, Sparkles, Trophy } from 'lucide-react'
import ChatBubble from '../components/ChatBubble'
import PlaceCard from '../components/PlaceCard'
import TaskCard from '../components/TaskCard'
import VoiceButton from '../components/VoiceButton'
import VoiceCallPanel from '../components/VoiceCallPanel'
import { getMockPlaces, personas, sendChatMessage, tasks } from '../services/api'
import {
  addMessage,
  addVisitedPlace,
  completeTask as markTaskComplete,
  getConversationId,
  getDemoState,
  initialConversationState,
  setConversationState,
} from '../store/demoState'
import { getInitialChatGreeting, shouldShowInitialGreeting } from '../utils/greetingHelpers'

const GEOLOCATION_TIMEOUT_MS = 2500

const personaDisplay = {
  gentle_friend: { name: '温柔朋友型', avatar: '🌤️' },
  local_guide: { name: '本地向导型', avatar: '🧭' },
  photo_buddy: { name: '摄影搭子型', avatar: '📸' },
  budget_planner: { name: '省钱规划型', avatar: '💸' },
  game_sprite: { name: '城市精灵型', avatar: '✨' },
}

const formatTime = (timestamp = Date.now()) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))

const toLocalIsoString = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60))
  const offsetRestMinutes = pad(Math.abs(offsetMinutes) % 60)

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${offsetHours}:${offsetRestMinutes}`
}

const getTimeOfDay = (date = new Date()) => {
  const hour = date.getHours()

  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 14) return 'noon'
  if (hour >= 14 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

const buildHistoryPayload = (messages = []) =>
  messages.slice(-12).map((message) => ({
    role: message.role,
    text: message.text,
    timestamp: message.timestamp,
    persona_id: message.persona_id,
  }))

const buildMockWeather = (timeOfDay = 'afternoon') => {
  switch (timeOfDay) {
    case 'morning':
      return { condition: 'partly_cloudy', temperature_c: 22, rain_probability: 15, uv_index: 4, source: 'mock' }
    case 'noon':
      return { condition: 'sunny', temperature_c: 28, rain_probability: 10, uv_index: 7, source: 'mock' }
    case 'evening':
      return { condition: 'cloudy', temperature_c: 24, rain_probability: 25, uv_index: 1, source: 'mock' }
    case 'night':
      return { condition: 'cloudy', temperature_c: 21, rain_probability: 20, uv_index: 0, source: 'mock' }
    default:
      return { condition: 'cloudy', temperature_c: 26, rain_probability: 20, uv_index: 3, source: 'mock' }
  }
}

const buildMockLocation = (conversationState = {}) => ({
  city: conversationState.live_context?.city || conversationState.current_city || '',
  place_name: conversationState.live_context?.place_name || conversationState.current_place || '',
  latitude: conversationState.live_context?.latitude ?? null,
  longitude: conversationState.live_context?.longitude ?? null,
})

const selectLiveNearbyPlaces = (places = [], conversationState = {}) => {
  const pendingQuestion = conversationState.pending_question || conversationState.last_intent || ''
  const source = Array.isArray(places) ? places : []

  const scored = source.map((place) => {
    let score = 0

    if (pendingQuestion === 'food' && ['food', 'rest'].includes(place.type)) score += 4
    if (pendingQuestion === 'photo' && ['culture', 'view'].includes(place.type)) score += 4
    if (pendingQuestion === 'crowd' && place.safety_level === 'high') score += 3
    if (place.safety_level === 'high') score += 2
    score -= Number(place.distance || 0) / 1000

    return { place, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.place)
    .slice(0, 6)
}

const buildLocationPayload = (conversationState = initialConversationState) => {
  const liveContext = conversationState.live_context || {}
  const city = liveContext.city || conversationState.current_city || ''
  const placeName = liveContext.place_name || conversationState.current_place || ''
  const latitude = liveContext.latitude
  const longitude = liveContext.longitude

  if (!city && !placeName && latitude == null && longitude == null) {
    return {}
  }

  return {
    city,
    place_name: placeName,
    lat: latitude,
    lng: longitude,
  }
}

const readBrowserLocation = () =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }

    let settled = false
    const done = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const timeoutId = window.setTimeout(() => done(null), GEOLOCATION_TIMEOUT_MS)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timeoutId)
        done({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        window.clearTimeout(timeoutId)
        done(null)
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 60_000,
      },
    )
  })

function ChatPage() {
  const [state, setState] = useState(() => getDemoState())
  const [places, setPlaces] = useState([])
  const [inputText, setInputText] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [lastVoiceReply, setLastVoiceReply] = useState(null)
  const [replyMeta, setReplyMeta] = useState(null)

  const persona = useMemo(() => state.selectedPersona || personas[0], [state.selectedPersona])
  const displayPersona = useMemo(() => ({ ...persona, ...(personaDisplay[persona.id] || {}) }), [persona])
  const initialGreeting = useMemo(() => getInitialChatGreeting({ persona, places }), [persona, places])
  const showInitialGreeting = useMemo(() => shouldShowInitialGreeting(state.messages), [state.messages])
  const activeTask = tasks[0]

  const refreshState = () => {
    const nextState = getDemoState()
    setState(nextState)
    return nextState
  }

  const enrichConversationStateForSend = async (conversationState, options = {}) => {
    const baseState = conversationState || initialConversationState
    const now = new Date()
    const localTime = toLocalIsoString(now)
    const timeOfDay = getTimeOfDay(now)
    const fallbackLocation = buildMockLocation(baseState)
    const shouldTryLocation =
      options.requestLocation === true ||
      (!baseState.live_context?.place_name && !baseState.live_context?.city && !baseState.live_context?.latitude)
    const browserLocation = shouldTryLocation ? await readBrowserLocation() : null
    const nearbyPlaces = selectLiveNearbyPlaces(options.availablePlaces || places, baseState)

    const liveContext = {
      ...(baseState.live_context || {}),
      local_time: localTime,
      time_of_day: timeOfDay,
      source:
        browserLocation?.latitude != null
          ? 'browser'
          : baseState.live_context?.source || (baseState.current_place ? 'user_text' : 'unavailable'),
      latitude: browserLocation?.latitude ?? baseState.live_context?.latitude ?? fallbackLocation.latitude,
      longitude: browserLocation?.longitude ?? baseState.live_context?.longitude ?? fallbackLocation.longitude,
      city: baseState.live_context?.city || baseState.current_city || fallbackLocation.city,
      place_name:
        baseState.live_context?.place_name ||
        baseState.current_place ||
        fallbackLocation.place_name,
      weather: {
        ...(baseState.live_context?.weather || {}),
        ...buildMockWeather(timeOfDay),
        ...(baseState.live_context?.weather?.condition ? baseState.live_context.weather : {}),
      },
      nearby_places: nearbyPlaces,
    }

    return {
      ...baseState,
      current_city: baseState.current_city || liveContext.city || '',
      live_context: liveContext,
      history_summary: baseState.history_summary || '',
    }
  }

  useEffect(() => {
    let cancelled = false

    getMockPlaces().then(async (data) => {
      if (cancelled) return

      const nextPlaces = Array.isArray(data) ? data : []
      setPlaces(nextPlaces)

      const currentState = getDemoState().conversationState
      const enrichedState = await enrichConversationStateForSend(
        {
          ...currentState,
          live_context: {
            ...(currentState.live_context || {}),
            nearby_places: nextPlaces,
          },
        },
        { requestLocation: true, availablePlaces: nextPlaces },
      )

      if (!cancelled) {
        setConversationState(enrichedState)
        refreshState()
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const sendMessage = async (userText = inputText, options = {}) => {
    if (isSending) {
      return null
    }

    const cleanText = String(userText || '').trim()
    if (!cleanText) {
      return null
    }

    const conversationId = getConversationId()
    const timestamp = new Date().toISOString()
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: cleanText,
      timestamp,
      time: formatTime(timestamp),
      persona_id: persona.id,
    }

    addMessage(userMessage)
    const stateAfterUser = refreshState()
    setInputText('')
    setIsSending(true)

    try {
      const enrichedConversationState = await enrichConversationStateForSend(stateAfterUser.conversationState, options)
      setConversationState(enrichedConversationState)

      const payload = {
        conversation_id: conversationId,
        user_text: cleanText,
        persona_id: persona.id,
        mode: options.mode || 'chat',
        location: buildLocationPayload(enrichedConversationState),
        context: {
          travel_mode: enrichedConversationState.travel_mode || 'solo',
          mood: enrichedConversationState.mood || 'uncertain',
          source: options.source || 'text',
          local_time: enrichedConversationState.live_context.local_time,
          time_of_day: enrichedConversationState.live_context.time_of_day,
        },
        nearby_places:
          enrichedConversationState.live_context.nearby_places?.length > 0
            ? enrichedConversationState.live_context.nearby_places
            : places,
        history: buildHistoryPayload(stateAfterUser.messages),
        conversation_state: enrichedConversationState,
        live_context: enrichedConversationState.live_context,
      }

      const reply = await sendChatMessage(payload)
      const safeReply = reply && typeof reply === 'object' ? reply : {}

      const assistantTimestamp = new Date().toISOString()
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: safeReply.reply_text || '我在，刚刚这条消息没有接稳。你再发一句，我继续陪你接上。',
        timestamp: assistantTimestamp,
        time: formatTime(assistantTimestamp),
        persona_id: persona.id,
        reply_type: safeReply.reply_type || '',
        emotion_detected: safeReply.emotion_detected || '',
      }

      addMessage(assistantMessage)
      markTaskComplete('first_voice_task', activeTask.rewardBadge)

      const latestConversationState = getDemoState().conversationState
      setConversationState({
        ...latestConversationState,
        last_intent: safeReply.reply_type || latestConversationState.last_intent || '',
        mood: safeReply.emotion_detected || latestConversationState.mood || '',
        pending_question: '',
        live_context: enrichedConversationState.live_context,
      })

      setReplyMeta({
        nextOptions: safeReply.next_options || [],
        safetyTip: safeReply.safety_tip || '',
        taskTriggered: safeReply.task_triggered || '',
        emotionDetected: safeReply.emotion_detected || '',
      })

      if (options.source === 'voice') {
        setLastVoiceReply(assistantMessage)
      }

      refreshState()
      return assistantMessage
    } finally {
      setIsSending(false)
    }
  }

  const triggeredTask = tasks.find((task) => task.id === replyMeta?.taskTriggered)

  return (
    <section className="page chat-page companion-call-page diffuse-bg">
      <header className="chat-header call-header">
        <span className="avatar-bubble">{displayPersona.avatar}</span>
        <div>
          <p className="eyebrow">陪伴通话</p>
          <h1>{displayPersona.name}</h1>
        </div>
      </header>

      {showInitialGreeting && (
        <section className="chat-greeting-panel glass-card" aria-label="聊天欢迎区">
          <p className="eyebrow">{initialGreeting.weatherHint}</p>
          <h2>{initialGreeting.welcome}</h2>
          <div className="suggestion-row">
            {initialGreeting.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="pill-button"
                onClick={() => sendMessage(suggestion, { source: 'quick-action' })}
                disabled={isSending}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      )}

      <VoiceCallPanel
        isSending={isSending}
        lastReply={lastVoiceReply}
        onSendMessage={(text) => sendMessage(text, { source: 'voice', requestLocation: true })}
        persona={displayPersona}
      />

      {replyMeta && (
        <section className="call-assistant-stack" aria-label="搭子建议">
          {replyMeta.safetyTip && (
            <article className="call-safety-card glass-card">
              <div className="call-card-icon">
                <Shield size={18} />
              </div>
              <div>
                <p className="eyebrow">安全提醒</p>
                <p>{replyMeta.safetyTip}</p>
              </div>
            </article>
          )}

          {replyMeta.nextOptions?.length > 0 && (
            <article className="call-next-card glass-card">
              <div className="call-card-heading">
                <Sparkles size={18} />
                <h2>下一步建议</h2>
              </div>
              <div className="suggestion-row">
                {replyMeta.nextOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="pill-button"
                    onClick={() => sendMessage(option, { source: 'quick-action' })}
                    disabled={isSending}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </article>
          )}

          {triggeredTask && (
            <article className="call-task-card glass-card">
              <div className="call-card-heading">
                <MapPin size={18} />
                <h2>这段路的小任务</h2>
              </div>
              <p>{triggeredTask.title}</p>
              <span>{triggeredTask.description}</span>
            </article>
          )}
        </section>
      )}

      <div className="chat-window call-transcript glass-card">
        {state.messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage()
        }}
      >
        <textarea
          className="composer-input"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !isComposing) {
              event.preventDefault()
              sendMessage()
            }
          }}
          rows={1}
          placeholder="说说你现在在哪，或者想去哪。"
          aria-label="聊天输入框"
          disabled={isSending}
        />
        <button type="submit" aria-label="发送" disabled={isSending}>
          <Send size={19} />
        </button>
      </form>

      <div className="action-row">
        <VoiceButton
          label="说出当前位置"
          onClick={() => sendMessage('我在这里，看看附近有什么。', { source: 'quick-action', requestLocation: true })}
        />
        <Link className="icon-link" to="/photo">
          <Camera size={18} />
          拍照发给搭子
        </Link>
        <Link className="icon-link" to="/badges">
          <Trophy size={18} />
          看看徽章
        </Link>
      </div>

      <h2>附近适合停一停</h2>
      <div className="card-stack">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onVisit={(placeId) => {
              addVisitedPlace(placeId)
              refreshState()
            }}
          />
        ))}
      </div>

      <TaskCard
        task={activeTask}
        done={state.completedTasks.includes(activeTask.id)}
        onComplete={(task) => {
          markTaskComplete(task.id, task.rewardBadge)
          refreshState()
        }}
      />
    </section>
  )
}

export default ChatPage
