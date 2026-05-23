import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Send, Trophy } from 'lucide-react'
import ChatBubble from '../components/ChatBubble'
import PlaceCard from '../components/PlaceCard'
import TaskCard from '../components/TaskCard'
import VoiceButton from '../components/VoiceButton'
import VoiceCallPanel from '../components/VoiceCallPanel'
import { getMockPlaces, personas, sendChatMessage, tasks } from '../services/api'
import { addMessage, addVisitedPlace, completeTask, getDemoState } from '../store/demoState'
import { getInitialChatGreeting, shouldShowInitialGreeting } from '../utils/greetingHelpers'

const personaDisplay = {
  gentle_friend: { name: '温柔朋友型', avatar: '🧡' },
  local_guide: { name: '本地向导型', avatar: '🧭' },
  photo_buddy: { name: '摄影搭子型', avatar: '📷' },
  budget_planner: { name: '省钱规划型', avatar: '☘️' },
  game_sprite: { name: '城市精灵型', avatar: '✨' },
}

function ChatPage() {
  const [state, setState] = useState(getDemoState())
  const [places, setPlaces] = useState([])
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [lastVoiceReply, setLastVoiceReply] = useState(null)
  const persona = useMemo(() => state.selectedPersona || personas[0], [state.selectedPersona])
  const displayPersona = useMemo(() => ({ ...persona, ...(personaDisplay[persona.id] || {}) }), [persona])
  const initialGreeting = useMemo(() => getInitialChatGreeting({ persona, places }), [persona, places])
  const showInitialGreeting = useMemo(() => shouldShowInitialGreeting(state.messages), [state.messages])
  const activeTask = tasks[0]

  useEffect(() => {
    getMockPlaces().then(setPlaces)
  }, [])

  const sendMessage = async (input = text) => {
    if (isSending) return null

    const clean = input.trim()
    if (!clean) return null

    const userMessage = { id: crypto.randomUUID(), role: 'user', text: clean, time: '刚刚' }
    addMessage(userMessage)
    setText('')
    setState(getDemoState())
    setIsSending(true)

    try {
      const reply = await sendChatMessage({
        user_text: clean,
        persona_id: persona.id,
        mode: 'decision',
        context: {
          travel_mode: 'solo',
          mood: 'uncertain',
        },
        nearby_places: places,
        history: state.messages,
      })
      const buddyMessage = { id: crypto.randomUUID(), role: 'buddy', text: reply.reply_text, time: '刚刚' }
      addMessage(buddyMessage)
      completeTask('first_voice_task', activeTask.rewardBadge)
      setState(getDemoState())
      return buddyMessage
    } finally {
      setIsSending(false)
    }
  }

  const sendVoiceMessage = async (input) => {
    const buddyMessage = await sendMessage(input)
    if (buddyMessage) setLastVoiceReply(buddyMessage)
  }

  return (
    <section className="page chat-page companion-call-page">
      <header className="chat-header call-header">
        <span className="avatar-bubble">{displayPersona.avatar}</span>
        <div>
          <p className="eyebrow">{displayPersona.name}</p>
          <h1>我在，慢慢说</h1>
        </div>
      </header>

      {showInitialGreeting && (
        <section className="chat-greeting-panel" aria-label="聊天欢迎语">
          <p className="eyebrow">{initialGreeting.weatherHint}</p>
          <h2>{initialGreeting.welcome}</h2>
          <div className="suggestion-row">
            {initialGreeting.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="suggestion-chip"
                onClick={() => sendMessage(suggestion)}
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
        onVoiceMessage={sendVoiceMessage}
        persona={displayPersona}
      />

      <div className="chat-window call-transcript">
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
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="也可以打字告诉搭子你的心情或位置" />
        <button type="submit" aria-label="发送">
          <Send size={19} />
        </button>
      </form>

      <div className="action-row">
        <VoiceButton label="说出当前位置" onClick={() => sendMessage('我现在想找一个安心又有旅行感的下一站')} />
        <Link className="icon-link" to="/photo">
          <Camera size={18} />
          寄照片
        </Link>
        <Link className="icon-link" to="/badges">
          <Trophy size={18} />
          碎片册
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
              setState(getDemoState())
            }}
          />
        ))}
      </div>

      <TaskCard
        task={activeTask}
        done={state.completedTasks.includes(activeTask.id)}
        onComplete={(task) => {
          completeTask(task.id, task.rewardBadge)
          setState(getDemoState())
        }}
      />
    </section>
  )
}

export default ChatPage
