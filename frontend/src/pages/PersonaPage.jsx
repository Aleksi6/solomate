import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Sparkles } from 'lucide-react'
import CompanionChatItem from '../components/CompanionChatItem'
import { getCompanionAvatar } from '../config/personaAssets'
import { personas } from '../services/api'
import { getDemoState, setSelectedPersona } from '../store/demoState'
import {
  getActiveCompanionId,
  getCompanionBadgeCount,
  getCompanionChatMeta,
  getCompanionMessagePreview,
  getCustomCompanions,
  setActiveCompanionId,
} from '../utils/companionStorage'

const fixedCompanionCopy = {
  gentle_friend: { name: '温柔朋友型', starterText: '今天想去哪里走走？' },
  local_guide: { name: '本地向导型', starterText: '我在，随时可以带你找下一站。' },
  photo_buddy: { name: '摄影搭子型', starterText: '有想拍下来的风景吗？' },
  budget_planner: { name: '省心规划型', starterText: '今天我们也能轻轻松松出发。' },
  game_sprite: { name: '任务精灵型', starterText: '要不要先解锁一个小任务？' },
}

const getCompanionTimeLabel = (recentTime) => {
  if (!recentTime) return '刚刚'
  if (recentTime.includes('T')) {
    return new Date(recentTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
  return recentTime
}

function PersonaPage() {
  const navigate = useNavigate()
  const demoState = getDemoState()
  const [activeId, setActiveId] = useState(getActiveCompanionId() || demoState.selectedPersona.id)

  const companions = useMemo(() => {
    const fixedCompanions = personas.map((persona) => {
      const meta = getCompanionChatMeta(persona.id)
      return {
        id: persona.id,
        avatarSrc: getCompanionAvatar(persona),
        name: fixedCompanionCopy[persona.id]?.name || persona.name,
        latestMessage: getCompanionMessagePreview(persona.id, fixedCompanionCopy[persona.id]?.starterText || persona.openingLine || '我在，随时可以出发。'),
        starterText: fixedCompanionCopy[persona.id]?.starterText || persona.openingLine || '我在，随时可以出发。',
        recentTime: getCompanionTimeLabel(meta.recentTime),
        unreadCount: getCompanionBadgeCount(persona.id),
        newMemoryCount: 0,
        isCustom: false,
        persona_id: persona.id,
      }
    })

    const customCompanions = getCustomCompanions().map((companion) => {
      const meta = getCompanionChatMeta(companion.id)
      return {
        ...companion,
        id: companion.id,
        avatarSrc: getCompanionAvatar(companion),
        name: companion.name || '自定义搭子',
        latestMessage: getCompanionMessagePreview(companion.id, companion.latestSummary || companion.tagline || '我在，随时可以出发。'),
        starterText: companion.latestSummary || companion.tagline || '我在，随时可以出发。',
        recentTime: getCompanionTimeLabel(meta.recentTime || companion.created_at || ''),
        unreadCount: getCompanionBadgeCount(companion.id),
        newMemoryCount: 0,
        isCustom: true,
      }
    })

    return [...customCompanions, ...fixedCompanions]
  }, [])

  const handleSelect = (companion) => {
    setActiveCompanionId(companion.id)
    setActiveId(companion.id)
    if (!companion.isCustom) {
      setSelectedPersona(companion.id)
    }
    navigate(`/chat/${companion.id}`)
  }

  return (
    <section className="page companion-list-page diffuse-bg">
      <div className="page-intro companion-list-intro">
        <p className="eyebrow">Companions</p>
        <h1 className="page-title">我的旅行搭子</h1>
      </div>

      <div className="companion-list-toolbar glass-card">
        <Link className="ghost-button" to="/companion-select">
          星球选择
        </Link>
        <Link className="ghost-button" to="/persona/quiz">
          <Plus size={16} />
          定制新搭子
        </Link>
      </div>

      <div className="companion-chat-list glass-card">
        {companions.map((companion) => (
          <CompanionChatItem key={companion.id} companion={companion} active={activeId === companion.id} onSelect={handleSelect} />
        ))}
      </div>

      <div className="companion-list-footer">
        <Sparkles size={16} />
        <p>点开一个搭子，就会继续你们各自的聊天记录。</p>
      </div>
    </section>
  )
}

export default PersonaPage
