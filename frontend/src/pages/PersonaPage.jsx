import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles } from 'lucide-react'
import CompanionChatItem from '../components/CompanionChatItem'
import PersonaQuizPage from './PersonaQuizPage'
import { personas } from '../services/api'
import { getDemoState, setSelectedPersona } from '../store/demoState'
import {
  getActiveCompanionId,
  getCompanionChatMeta,
  getCompanionMemoryCount,
  getCustomCompanions,
  setActiveCompanionId,
} from '../utils/companionStorage'

const fixedCompanionCopy = {
  gentle_friend: {
    name: '温柔朋友型',
    tagline: '陪你慢慢说，也会温柔提醒你照顾自己',
    typeLabel: '温柔陪伴',
    avatar: '🧡',
  },
  local_guide: {
    name: '本地向导型',
    tagline: '更懂路线，也更懂哪里值得停下来',
    typeLabel: '路线引导',
    avatar: '🧭',
  },
  photo_buddy: {
    name: '摄影搭子型',
    tagline: '一起找光线、画面和想留下的瞬间',
    typeLabel: '画面感',
    avatar: '📷',
  },
  budget_planner: {
    name: '省钱规划型',
    tagline: '少绕路，帮你把预算和体力都照顾好',
    typeLabel: '清醒规划',
    avatar: '☘️',
  },
  game_sprite: {
    name: '城市精灵型',
    tagline: '把今天变成轻量任务和小成就',
    typeLabel: '任务感',
    avatar: '✨',
  },
}

const getCompanionTimeLabel = (recentTime) => recentTime || '刚刚'

function PersonaPage() {
  const navigate = useNavigate()
  const [showQuiz, setShowQuiz] = useState(false)
  const [activeId, setActiveId] = useState(getActiveCompanionId() || getDemoState().selectedPersona.id)
  const demoState = getDemoState()

  const fixedCompanions = useMemo(
    () =>
      personas.map((persona) => {
        const meta = getCompanionChatMeta(persona.id)
        return {
          ...persona,
          ...(fixedCompanionCopy[persona.id] || {}),
          id: persona.id,
          isCustom: false,
          latestMessage:
            meta.lastMessageText || (demoState.selectedPersona?.id === persona.id ? demoState.messages?.[demoState.messages.length - 1]?.text || '' : ''),
          latestSummary: persona.tone,
          recentTime: getCompanionTimeLabel(meta.recentTime),
          unreadCount: meta.unreadCount,
          newMemoryCount: meta.newMemoryCount || getCompanionMemoryCount(persona.id),
        }
      }),
    [demoState.messages, demoState.selectedPersona?.id],
  )

  const customCompanions = useMemo(
    () =>
      getCustomCompanions().map((companion) => {
        const meta = getCompanionChatMeta(companion.id)
        return {
          ...companion,
          isCustom: true,
          latestMessage: meta.lastMessageText || companion.latestSummary || companion.tagline || '',
          latestSummary: companion.latestSummary || companion.speaking_style || '自定义长期搭子',
          recentTime: getCompanionTimeLabel(meta.recentTime || companion.created_at?.slice(0, 10)),
          unreadCount: meta.unreadCount,
          newMemoryCount: meta.newMemoryCount || getCompanionMemoryCount(companion.id),
        }
      }),
    [],
  )

  const companions = [...customCompanions, ...fixedCompanions]

  const handleSelect = (companion) => {
    setActiveCompanionId(companion.id)
    setActiveId(companion.id)

    if (!companion.isCustom) {
      setSelectedPersona(companion.id)
    }

    navigate('/chat')
  }

  if (showQuiz) {
    return (
      <PersonaQuizPage
        fixedCompanions={fixedCompanions}
        onBack={() => setShowQuiz(false)}
        onComplete={(profile) => {
          setActiveId(profile.id)
          setShowQuiz(false)
          navigate('/chat')
        }}
      />
    )
  }

  return (
    <section className="page persona-page diffuse-bg">
      <div className="page-intro glass-card">
        <p className="eyebrow">我的旅行搭子</p>
        <h1 className="page-title">我的旅行搭子</h1>
        <p className="page-subtitle">固定搭子会一直在，自定义搭子会慢慢长成更懂你的长期旅伴。</p>
      </div>

      <button type="button" className="quiz-entry-card" onClick={() => setShowQuiz(true)}>
        <span className="quiz-entry-icon">
          <Plus size={22} />
        </span>
        <span>
          <strong>开启搭子共创向导</strong>
          <small>把性格、提醒强度、任务偏好和声音风格慢慢定下来。</small>
        </span>
      </button>

      <div className="companion-list">
        {companions.map((companion) => (
          <CompanionChatItem
            key={companion.id}
            companion={companion}
            active={activeId === companion.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="persona-list-caption soft-card">
        <Sparkles size={18} />
        <p>固定 persona 仍然保留为 fallback。没有长期记忆时，SoloMate 也会从这里继续陪你出发。</p>
      </div>
    </section>
  )
}

export default PersonaPage
