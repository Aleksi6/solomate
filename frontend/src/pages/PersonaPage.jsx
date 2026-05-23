import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import PersonaCard from '../components/PersonaCard'
import PersonaQuizPage from './PersonaQuizPage'
import { personas } from '../services/api'
import { getDemoState, setSelectedPersona } from '../store/demoState'

const personaCopy = {
  gentle_friend: {
    name: '温柔朋友型',
    tagline: '陪你慢慢说话，也提醒你照顾自己',
    tone: '温柔、自然、像熟悉的朋友',
    avatar: '🧡',
  },
  local_guide: {
    name: '本地向导型',
    tagline: '帮你读懂街区，也选更安心的路线',
    tone: '清楚、亲切、懂城市',
    avatar: '🧭',
  },
  photo_buddy: {
    name: '摄影搭子型',
    tagline: '一起找光线、角度和旅行感画面',
    tone: '审美、鼓励、轻松',
    avatar: '📷',
  },
  budget_planner: {
    name: '省钱规划型',
    tagline: '少绕路，帮你把预算和体力都算清楚',
    tone: '实用、清楚、低废话',
    avatar: '☘️',
  },
  game_sprite: {
    name: '城市精灵型',
    tagline: '把今天变成轻量任务和小成就',
    tone: '活泼、有任务感、不幼稚',
    avatar: '✨',
  },
}

function PersonaPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(getDemoState().selectedPersona.id)
  const [showQuiz, setShowQuiz] = useState(false)

  const handleSelect = (personaId) => {
    const persona = personas.find((item) => item.id === personaId) || personas[0]
    setSelectedPersona(persona)
    setSelected(personaId)
    navigate('/chat')
  }

  if (showQuiz) {
    return <PersonaQuizPage onBack={() => setShowQuiz(false)} onUsePersona={handleSelect} />
  }

  return (
    <section className="page persona-page diffuse-bg">
      <div className="page-intro glass-card">
        <p className="eyebrow">选择旅行伙伴</p>
        <h1 className="page-title">今天想被怎样陪伴？</h1>
        <p className="page-subtitle">挑一个最贴近当前心情的搭子。之后聊天、拍照和手账，都会沿用这位伙伴的语气。</p>
      </div>

      <button type="button" className="quiz-entry-card" onClick={() => setShowQuiz(true)}>
        <span className="quiz-entry-icon">
          <Sparkles size={22} />
        </span>
        <span>
          <strong>做一个搭子风格测试</strong>
          <small>四道轻松小题，帮你挑今天最合拍的旅行伙伴。</small>
        </span>
      </button>

      <div className="persona-list travel-companion-list">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={{ ...persona, ...(personaCopy[persona.id] || {}) }}
            active={selected === persona.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  )
}

export default PersonaPage
