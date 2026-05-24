import { useEffect, useMemo, useState } from 'react'
import { getCompanionAvatar } from '../config/personaAssets'
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
  gentle_friend: { name: '温柔朋友型', typeLabel: '轻声陪伴' },
  local_guide: { name: '本地向导型', typeLabel: '城市熟门熟路' },
  photo_buddy: { name: '摄影搭子型', typeLabel: '会看画面' },
  budget_planner: { name: '省心规划型', typeLabel: '稳稳安排' },
  game_sprite: { name: '任务精灵型', typeLabel: '边走边解锁' },
}

const TEXT = {
  now: '刚刚',
  weatherFallback: '今天天气晴，慢慢走也很好',
  weatherShort: '晴',
  locationFallback: '城市中心一带',
  locationSuffix: ' 一带',
  customCompanion: '共创搭子',
}

const formatRecentTime = () => TEXT.now

const buildWeatherHint = (places) => (places[0] ? TEXT.weatherShort : TEXT.weatherFallback)

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
  const activeCompanionId = useMemo(() => getActiveCompanionId() || state.selectedPersona?.id || personas[0].id, [state.selectedPersona])
  const customCompanion = useMemo(() => getActiveCompanionProfile(), [activeCompanionId])
  const fallbackPersona = useMemo(
    () => personas.find((item) => item.id === activeCompanionId) || state.selectedPersona || personas[0],
    [activeCompanionId, state.selectedPersona],
  )

  const displayCompanion = useMemo(() => {
    if (customCompanion) {
      return {
        ...customCompanion,
        avatar: <img className="persona-avatar-image chat-header-avatar-image" src={getCompanionAvatar(customCompanion)} alt={customCompanion.name || TEXT.customCompanion} />,
        typeLabel: customCompanion.typeLabel || TEXT.customCompanion,
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

        <ChatMessageList messages={companionMessages} />

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

        <ChatComposer disabled={false} isSubmitting={isSending} text={text} onChange={setText} onSubmit={() => sendMessage()} onVoiceMessage={sendMessage} />

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
