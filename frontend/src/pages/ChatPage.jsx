import { useEffect, useMemo, useState } from 'react'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import ChatComposer from '../components/ChatComposer'
import ChatHeader from '../components/ChatHeader'
import ChatMessageList from '../components/ChatMessageList'
import NearbyRecommendPanel from '../components/NearbyRecommendPanel'
import QuickActionBar from '../components/QuickActionBar'
import { getMockPlaces, personas, sendChatMessage, tasks } from '../services/api'
import { addMessage, addVisitedPlace, completeTask, getDemoState } from '../store/demoState'
import {
  appendChatMessageForCompanion,
  getActiveCompanionId,
  getActiveCompanionProfile,
  getChatHistoryForCompanion,
  setActiveCompanionId,
  setChatHistoryForCompanion,
} from '../utils/companionStorage'

const personaDisplay = {
  gentle_friend: {
    name: '\u6e29\u67d4\u670b\u53cb\u578b',
    avatar: '\ud83c\udf37',
    typeLabel: '\u8f7b\u58f0\u966a\u4f34',
  },
  local_guide: {
    name: '\u672c\u5730\u5411\u5bfc\u578b',
    avatar: '\ud83e\udded',
    typeLabel: '\u57ce\u5e02\u719f\u95e8\u719f\u8def',
  },
  photo_buddy: {
    name: '\u6444\u5f71\u642d\u5b50\u578b',
    avatar: '\ud83d\udcf7',
    typeLabel: '\u4f1a\u770b\u753b\u9762',
  },
  budget_planner: {
    name: '\u7701\u5fc3\u89c4\u5212\u578b',
    avatar: '\u2601\ufe0f',
    typeLabel: '\u7a33\u7a33\u5b89\u6392',
  },
  game_sprite: {
    name: '\u4efb\u52a1\u7cbe\u7075\u578b',
    avatar: '\u2728',
    typeLabel: '\u8fb9\u8d70\u8fb9\u89e3\u9501',
  },
}

const TEXT = {
  now: '\u521a\u521a',
  weatherFallback: '\u4eca\u5929\u5929\u6c14\u6674\uff0c\u6162\u6162\u8d70\u4e5f\u5f88\u597d',
  weatherShort: '\u6674',
  locationFallback: '\u57ce\u5e02\u4e2d\u5fc3\u4e00\u5e26',
  locationSuffix: ' \u4e00\u5e26',
  customCompanion: '\u5171\u521b\u642d\u5b50',
}

const formatRecentTime = () => TEXT.now

const buildWeatherHint = (places) => {
  return places[0] ? TEXT.weatherShort : TEXT.weatherFallback
}

const buildLocationHint = (places) => {
  const firstPlace = places[0]
  if (!firstPlace) return TEXT.locationFallback
  return `${firstPlace.name}${TEXT.locationSuffix}`
}

function ChatPage() {
  const [state, setState] = useState(getDemoState())
  const [places, setPlaces] = useState([])
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [replyMeta, setReplyMeta] = useState(null)
  const [isVoiceReplyEnabled, setIsVoiceReplyEnabled] = useState(true)

  const speechSynthesis = useSpeechSynthesis()
  const activeCompanionId = useMemo(
    () => getActiveCompanionId() || state.selectedPersona?.id || personas[0].id,
    [state.selectedPersona],
  )
  const customCompanion = useMemo(() => getActiveCompanionProfile(), [activeCompanionId])
  const fallbackPersona = useMemo(
    () => personas.find((item) => item.id === activeCompanionId) || state.selectedPersona || personas[0],
    [activeCompanionId, state.selectedPersona],
  )
  const displayCompanion = useMemo(() => {
    if (customCompanion) {
      return {
        ...customCompanion,
        avatar: customCompanion.avatar || '\u2728',
        typeLabel: customCompanion.typeLabel || TEXT.customCompanion,
      }
    }

    return {
      ...fallbackPersona,
      ...(personaDisplay[fallbackPersona.id] || {}),
    }
  }, [customCompanion, fallbackPersona])

  const companionMessages = useMemo(() => {
    const storedMessages = getChatHistoryForCompanion(activeCompanionId)
    if (storedMessages.length > 0) return storedMessages
    return state.messages || []
  }, [activeCompanionId, state.messages])
  const weatherHint = useMemo(() => buildWeatherHint(places), [places])
  const locationHint = useMemo(() => buildLocationHint(places), [places])
  const activeTask = tasks[0]

  useEffect(() => {
    setActiveCompanionId(activeCompanionId)
  }, [activeCompanionId])

  useEffect(() => {
    getMockPlaces().then(setPlaces)
  }, [])

  useEffect(() => {
    if (getChatHistoryForCompanion(activeCompanionId).length === 0 && state.messages?.length) {
      setChatHistoryForCompanion(activeCompanionId, state.messages)
    }
  }, [activeCompanionId, state.messages])

  const sendMessage = async (input = text) => {
    if (isSending) return null

    const clean = input.trim()
    if (!clean) return null

    const userMessage = { id: crypto.randomUUID(), role: 'user', text: clean, time: formatRecentTime() }
    const nextHistory = [...companionMessages, userMessage]

    addMessage(userMessage)
    appendChatMessageForCompanion(activeCompanionId, userMessage)
    setText('')
    setState(getDemoState())
    setIsSending(true)

    try {
      const reply = await sendChatMessage({
        user_text: clean,
        persona_id: fallbackPersona.id,
        mode: 'decision',
        context: {
          travel_mode: 'solo',
          mood: 'uncertain',
        },
        nearby_places: places,
        history: nextHistory,
      })

      const buddyMessage = {
        id: crypto.randomUUID(),
        role: 'buddy',
        text: reply.reply_text,
        time: formatRecentTime(),
      }

      addMessage(buddyMessage)
      appendChatMessageForCompanion(activeCompanionId, buddyMessage)
      completeTask('first_voice_task', activeTask.rewardBadge)
      setReplyMeta({
        nextOptions: reply.next_options || [],
        safetyTip: reply.safety_tip || '',
        taskTriggered: reply.task_triggered || '',
      })
      setState(getDemoState())

      if (isVoiceReplyEnabled) {
        speechSynthesis.speak(reply.reply_text)
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

        <ChatMessageList
          messages={companionMessages}
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
                    <button key={option} type="button" className="pill-button" onClick={() => sendMessage(option)}>
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

        <ChatComposer
          disabled={false}
          isSubmitting={isSending}
          text={text}
          onChange={setText}
          onSubmit={() => sendMessage()}
          onVoiceMessage={sendMessage}
        />

        <QuickActionBar />

        <NearbyRecommendPanel
          places={places}
          activeTask={activeTask}
          done={state.completedTasks.includes(activeTask.id)}
          onVisit={(placeId) => {
            addVisitedPlace(placeId)
            setState(getDemoState())
          }}
          onComplete={(task) => {
            completeTask(task.id, task.rewardBadge)
            setState(getDemoState())
          }}
        />
      </div>
    </section>
  )
}

export default ChatPage
