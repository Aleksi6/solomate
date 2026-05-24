import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCompanionAvatar } from '../config/personaAssets'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import ChatComposer from '../components/ChatComposer'
import ChatHeader from '../components/ChatHeader'
import ChatMessageList from '../components/ChatMessageList'
import NearbyRecommendPanel from '../components/NearbyRecommendPanel'
import QuickActionBar from '../components/QuickActionBar'
import { getMockPlaces, personas, requestProactiveCare, sendChatMessage, tasks } from '../services/api'
import {
  addVisitedPlace,
  completeTask,
  getDemoState,
} from '../store/demoState'
import {
  addCompanionMessage,
  getCompanionConversationId,
  getCompanionConversationState,
  getCompanionMessages,
  getCompanionProactiveMeta,
  markCompanionProactiveMessage,
  setCompanionConversationState,
} from '../utils/companionConversationStorage'
import { getActiveCompanionId, getCompanionById, setActiveCompanionId } from '../utils/companionStorage'

const PROACTIVE_COOLDOWN_MS = 180 * 1000
const PROACTIVE_AFTER_USER_MS = 60 * 1000
const PROACTIVE_MAX_PER_DAY = 5

const personaDisplay = {
  gentle_friend: { name: '温柔朋友型' },
  local_guide: { name: '本地向导型' },
  photo_buddy: { name: '摄影搭子型' },
  budget_planner: { name: '省心规划型' },
  game_sprite: { name: '任务精灵型' },
}

const formatRecentTime = (timestamp = Date.now()) =>
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

const buildLocationPayload = (conversationState = {}) => {
  const liveContext = conversationState.live_context || {}
  const city = liveContext.city || conversationState.current_city || ''
  const placeName = liveContext.place_name || conversationState.current_place || ''

  if (!city && !placeName) {
    return {}
  }

  return {
    city,
    place_name: placeName,
  }
}

const buildWeatherHint = (conversationState = {}) => {
  const weather = conversationState.live_context?.weather || {}
  if (weather.temperature_c != null && weather.condition) {
    return `${weather.temperature_c}° ${weather.condition}`
  }
  return '天气会一起看'
}

const buildLocationHint = (conversationState = {}, places = []) => {
  const liveContext = conversationState.live_context || {}
  return (
    liveContext.place_name ||
    conversationState.current_place ||
    conversationState.target_place ||
    conversationState.current_city ||
    places[0]?.name ||
    '地点可以随时告诉我'
  )
}

const buildConversationStateForSend = (conversationState = {}, places = []) => {
  const now = new Date()
  const localTime = toLocalIsoString(now)
  const timeOfDay = getTimeOfDay(now)
  const currentPlace = conversationState.current_place || conversationState.live_context?.place_name || ''
  const currentCity = conversationState.current_city || conversationState.live_context?.city || ''
  const targetPlace = conversationState.target_place || ''
  const locationSource =
    conversationState.live_context?.location_source ||
    conversationState.live_context?.source ||
    (currentPlace || currentCity ? 'user_declared' : 'none')

  return {
    ...conversationState,
    live_context: {
      ...(conversationState.live_context || {}),
      local_time: localTime,
      time_of_day: timeOfDay,
      location_source: locationSource,
      source: locationSource,
      city: conversationState.live_context?.city || currentCity,
      place_name: conversationState.live_context?.place_name || currentPlace || targetPlace,
      nearby_places: Array.isArray(places) ? places.slice(0, 6) : [],
      weather: conversationState.live_context?.weather || {},
    },
  }
}

const applySharedJourneyContext = (conversationState = {}, sharedState = {}) => ({
  ...conversationState,
  badges: Array.isArray(sharedState.badges) ? [...sharedState.badges] : conversationState.badges || [],
  visited_places: Array.isArray(sharedState.visitedPlaces) ? [...sharedState.visitedPlaces] : conversationState.visited_places || [],
})

function ChatPage() {
  const { companionId: routeCompanionId = '' } = useParams()
  const [, setRefreshToken] = useState(0)
  const [places, setPlaces] = useState([])
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [replyMeta, setReplyMeta] = useState(null)
  const [isVoiceReplyEnabled, setIsVoiceReplyEnabled] = useState(true)

  const speechSynthesis = useSpeechSynthesis()
  const baseSharedState = getDemoState()
  const activeCompanionId = routeCompanionId || getActiveCompanionId() || baseSharedState.selectedPersona?.id || personas[0].id
  const customCompanion = getCompanionById(activeCompanionId)
  const fallbackPersona = personas.find((item) => item.id === activeCompanionId) || baseSharedState.selectedPersona || personas[0]
  const servicePersonaId = customCompanion?.persona_id || fallbackPersona.id
  const readCurrentState = () => {
    const sharedState = getDemoState()
    return {
      sharedState,
      messages: getCompanionMessages(activeCompanionId, servicePersonaId),
      conversationState: applySharedJourneyContext(getCompanionConversationState(activeCompanionId, sharedState.badges), sharedState),
    }
  }
  const state = readCurrentState()
  const refreshView = () => setRefreshToken((current) => current + 1)

  const displayCompanion = useMemo(() => {
    if (customCompanion) {
      return {
        ...customCompanion,
        avatar: <img className="persona-avatar-image chat-header-avatar-image" src={getCompanionAvatar(customCompanion)} alt={customCompanion.name || 'SoloMate'} />,
      }
    }

    return {
      ...fallbackPersona,
      ...(personaDisplay[fallbackPersona.id] || {}),
      avatar: (
        <img
          className="persona-avatar-image chat-header-avatar-image"
          src={getCompanionAvatar(fallbackPersona)}
          alt={personaDisplay[fallbackPersona.id]?.name || fallbackPersona.name || 'SoloMate'}
        />
      ),
    }
  }, [customCompanion, fallbackPersona])

  const messages = state.messages || []
  const weatherHint = useMemo(() => buildWeatherHint(state.conversationState), [state.conversationState])
  const locationHint = useMemo(() => buildLocationHint(state.conversationState, places), [state.conversationState, places])
  const activeTask = tasks[0]

  const checkProactiveCare = useEffectEvent(async (force = false) => {
    if (isSending) return

    const currentState = readCurrentState()
    if (!currentState.messages?.length) return

    const meta = getCompanionProactiveMeta(activeCompanionId)
    const now = Date.now()
    const lastProactiveAt = meta.lastProactiveAt ? new Date(meta.lastProactiveAt).getTime() : 0
    const lastUserMessageAt = meta.lastUserMessageAt ? new Date(meta.lastUserMessageAt).getTime() : 0

    if (!force) {
      if (meta.proactiveCountToday >= PROACTIVE_MAX_PER_DAY) return
      if (lastProactiveAt && now - lastProactiveAt < PROACTIVE_COOLDOWN_MS) return
      if (lastUserMessageAt && now - lastUserMessageAt < PROACTIVE_AFTER_USER_MS) return
    }

    const enrichedConversationState = buildConversationStateForSend(currentState.conversationState, places)

    const response = await requestProactiveCare({
      conversation_id: getCompanionConversationId(activeCompanionId),
      persona_id: servicePersonaId,
      conversation_state: enrichedConversationState,
      history: buildHistoryPayload(currentState.messages),
      live_context: enrichedConversationState.live_context,
    })

    if (!response?.should_send || !response?.message) return

    const timestamp = new Date().toISOString()
    addCompanionMessage(
      activeCompanionId,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response.message,
        time: formatRecentTime(timestamp),
        timestamp,
        persona_id: servicePersonaId,
        message_type: 'proactive',
        reply_type: 'proactive',
        emotion_detected: enrichedConversationState.mood || 'uncertain',
      },
      {
        fallbackPersonaId: servicePersonaId,
        sharedBadges: currentState.sharedState.badges,
      },
    )
    markCompanionProactiveMessage(activeCompanionId, timestamp)
    refreshView()
  })

  useEffect(() => {
    setActiveCompanionId(activeCompanionId)
  }, [activeCompanionId])

  useEffect(() => {
    let cancelled = false
    getMockPlaces().then((data) => {
      if (cancelled) return
      setPlaces(Array.isArray(data) ? data : [])
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      checkProactiveCare(false)
    }, PROACTIVE_COOLDOWN_MS)

    window.solomateCheckProactiveCare = () => checkProactiveCare(true)

    return () => {
      window.clearInterval(intervalId)
      delete window.solomateCheckProactiveCare
    }
  }, [places, isSending, servicePersonaId, state.messages, state.conversationState])

  const sendMessage = async (input = text, options = {}) => {
    if (isSending) return null

    const clean = String(input || '').trim()
    if (!clean) return null

    const timestamp = new Date().toISOString()
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: clean,
      time: formatRecentTime(timestamp),
      timestamp,
      persona_id: servicePersonaId,
    }

    addCompanionMessage(activeCompanionId, userMessage, {
      fallbackPersonaId: servicePersonaId,
      sharedBadges: state.sharedState.badges,
    })
    setText('')
    const stateAfterUser = readCurrentState()
    refreshView()
    setIsSending(true)

    try {
      const enrichedConversationState = buildConversationStateForSend(stateAfterUser.conversationState, places)
      setCompanionConversationState(activeCompanionId, enrichedConversationState, stateAfterUser.sharedState.badges)

      const payload = {
        conversation_id: getCompanionConversationId(activeCompanionId),
        user_text: clean,
        persona_id: servicePersonaId,
        mode: options.mode || 'chat',
        location: buildLocationPayload(enrichedConversationState),
        context: {
          travel_mode: enrichedConversationState.travel_mode || 'solo',
          mood: enrichedConversationState.mood || 'uncertain',
          source: options.source || 'text',
        },
        nearby_places: places,
        history: buildHistoryPayload(stateAfterUser.messages),
        conversation_state: enrichedConversationState,
        live_context: enrichedConversationState.live_context,
      }

      const reply = await sendChatMessage(payload)
      const safeReply = reply && typeof reply === 'object' ? reply : {}
      const assistantTimestamp = new Date().toISOString()

      const buddyMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: safeReply.reply_text || '我接住你这句话了，不过这次回复没有顺利回来。你再发一句，我继续陪你。',
        time: formatRecentTime(assistantTimestamp),
        timestamp: assistantTimestamp,
        persona_id: servicePersonaId,
        reply_type: safeReply.reply_type || '',
        emotion_detected: safeReply.emotion_detected || '',
      }

      addCompanionMessage(activeCompanionId, buddyMessage, {
        fallbackPersonaId: servicePersonaId,
        sharedBadges: stateAfterUser.sharedState.badges,
      })
      completeTask('first_voice_task', activeTask.rewardBadge)
      setReplyMeta({
        nextOptions: safeReply.next_options || [],
        safetyTip: safeReply.safety_tip || '',
        taskTriggered: safeReply.task_triggered || '',
      })
      refreshView()

      if (isVoiceReplyEnabled && buddyMessage.text) {
        speechSynthesis.speak(buddyMessage.text)
      } else {
        speechSynthesis.cancel()
      }

      return buddyMessage
    } finally {
      setIsSending(false)
    }
  }

  const triggeredTask = tasks.find((task) => task.id === replyMeta?.taskTriggered)

  return (
    <section className="page chat-page mobile-chat-page diffuse-bg">
      <div className="chat-mobile-layout">
        <ChatHeader
          companion={displayCompanion}
          isVoiceReplyEnabled={isVoiceReplyEnabled}
          weatherHint={weatherHint}
          locationHint={locationHint}
          onToggleVoiceReply={() => {
            if (isVoiceReplyEnabled) speechSynthesis.cancel()
            setIsVoiceReplyEnabled((current) => !current)
          }}
        />

        <ChatMessageList messages={messages} />

        <p className="chat-proactive-note">你停下来一会儿时，搭子会像微信好友一样主动问你一句。</p>

        <ChatComposer
          disabled={false}
          isSubmitting={isSending}
          text={text}
          onChange={setText}
          onSubmit={() => sendMessage()}
          onVoiceMessage={(value) => sendMessage(value, { source: 'voice' })}
        />

        {(replyMeta?.safetyTip || replyMeta?.nextOptions?.length > 0 || triggeredTask) && (
          <section className="chat-meta-strip" aria-label="搭子提示">
            {replyMeta?.safetyTip ? (
              <article className="chat-meta-card glass-card">
                <p className="eyebrow">安全提醒</p>
                <p>{replyMeta.safetyTip}</p>
              </article>
            ) : null}

            {replyMeta?.nextOptions?.length > 0 ? (
              <article className="chat-meta-card glass-card">
                <p className="eyebrow">下一步建议</p>
                <div className="chat-inline-actions">
                  {replyMeta.nextOptions.map((option) => (
                    <button key={option} type="button" className="pill-button" onClick={() => sendMessage(option, { source: 'quick-action' })}>
                      {option}
                    </button>
                  ))}
                </div>
              </article>
            ) : null}

            {triggeredTask ? (
              <article className="chat-meta-card glass-card">
                <p className="eyebrow">任务触发</p>
                <p>{triggeredTask.title}</p>
              </article>
            ) : null}
          </section>
        )}

        <QuickActionBar />

        <NearbyRecommendPanel
          places={places}
          activeTask={activeTask}
          done={state.sharedState.completedTasks.includes(activeTask.id)}
          onVisit={(placeId) => {
            addVisitedPlace(placeId)
            refreshView()
          }}
          onComplete={(task) => {
            completeTask(task.id, task.rewardBadge)
            refreshView()
          }}
        />
      </div>
    </section>
  )
}

export default ChatPage
