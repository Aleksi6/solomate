import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import orbitBackground from '../assets/backgrounds/companion-orbit-bg.png'
import CompanionOrbitSelector from '../components/CompanionOrbitSelector'
import { getCompanionAvatar, getPersonaAvatar } from '../config/personaAssets'
import { personas } from '../services/api'
import { getDemoState, setSelectedPersona } from '../store/demoState'
import { getActiveCompanionId, getCompanionMessagePreview, getCustomCompanions, setActiveCompanionId } from '../utils/companionStorage'

const QUIZ_ROUTE = '/persona-quiz'

const fixedCompanionCopy = {
  gentle_friend: {
    shortName: '温柔朋友',
    intro: '会温柔接住你的犹豫，也会轻轻提醒你照顾自己。',
    scene: '适合慢慢散步、第一次独自出发、需要一点安定感的时候。',
    openingLine: '今天想轻松走走吗？',
  },
  local_guide: {
    shortName: '本地向导',
    intro: '更懂路线，也更懂哪里值得停下来看看。',
    scene: '适合逛老街、找路线、想知道附近哪里更安心的时候。',
    openingLine: '我来陪你找一条舒服的路线。',
  },
  photo_buddy: {
    shortName: '摄影搭子',
    intro: '会和你一起看光线、画面和那些值得留住的瞬间。',
    scene: '适合拍照记录、收集纪念物、想留下一点画面感的时候。',
    openingLine: '看到喜欢的光线，记得叫我。',
  },
  budget_planner: {
    shortName: '省钱搭子',
    intro: '帮你少绕路、少耗神，把预算和体力都留给值得的地方。',
    scene: '适合低负担旅行、预算敏感、想轻一点安排行程的时候。',
    openingLine: '今天也可以低负担出发。',
  },
  game_sprite: {
    shortName: '游戏精灵',
    intro: '会把今天变成一点点有趣的小任务和小奖励。',
    scene: '适合想找新鲜感、解锁成就、把旅程过得更轻快的时候。',
    openingLine: '我们去解锁今天的小成就吧。',
  },
}

function CompanionSelectPage() {
  const navigate = useNavigate()
  const demoState = getDemoState()
  const activeId = getActiveCompanionId()

  const companions = useMemo(() => {
    const fixed = personas.map((persona) => ({
      id: persona.id,
      name: fixedCompanionCopy[persona.id]?.shortName || persona.name,
      fullName: fixedCompanionCopy[persona.id]?.shortName || persona.name,
      avatar: getCompanionAvatar(persona),
      intro: fixedCompanionCopy[persona.id]?.intro || persona.tagline || '',
      scene: fixedCompanionCopy[persona.id]?.scene || '适合今天慢慢走、慢慢看。',
      openingLine:
        getCompanionMessagePreview(
          persona.id,
          fixedCompanionCopy[persona.id]?.openingLine || persona.openingLine || '我在，随时可以出发。',
        ) || '我在，随时可以出发。',
      isCustom: false,
    }))

    const custom = getCustomCompanions().map((companion) => ({
      id: companion.id,
      name: companion.name || '自定义搭子',
      fullName: companion.name || '自定义搭子',
      avatar: getCompanionAvatar(companion),
      intro: companion.latestSummary || companion.tagline || '陪你把今天走成更像自己的样子。',
      scene: '适合想要更贴近自己节奏的时候。',
      openingLine: getCompanionMessagePreview(companion.id, companion.latestSummary || companion.tagline || '我在，随时可以出发。'),
      isCustom: true,
    }))

    const customizeNode = {
      id: 'customize_companion',
      name: '定制搭子',
      fullName: '定制我的专属搭子',
      avatar: getPersonaAvatar('custom_companion'),
      intro: '把性格、说话方式、提醒强度和声音风格慢慢定成你喜欢的样子。',
      scene: '适合想拥有一个更贴近自己节奏的长期搭子的时候。',
      openingLine: '我们一起把专属搭子的轮廓慢慢捏出来。',
      isCustom: true,
      isCustomize: true,
    }

    return [...custom, ...fixed, customizeNode].map((item, index) => ({ ...item, index }))
  }, [])

  const defaultIndex = Math.max(
    0,
    companions.findIndex((companion) => companion.id === activeId || companion.id === demoState.selectedPersona?.id),
  )
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex)
  const selectedCompanion = companions[selectedIndex] || companions[0]
  const showSwipeHint = companions.length > 6

  const goToQuiz = () => navigate(QUIZ_ROUTE)

  const goPrevious = () => {
    setSelectedIndex((current) => (current - 1 + companions.length) % companions.length)
  }

  const goNext = () => {
    setSelectedIndex((current) => (current + 1) % companions.length)
  }

  const handleStart = () => {
    if (!selectedCompanion) return
    if (selectedCompanion.isCustomize) {
      goToQuiz()
      return
    }
    setActiveCompanionId(selectedCompanion.id)
    if (!selectedCompanion.isCustom) {
      setSelectedPersona(selectedCompanion.id)
    }
    navigate(`/chat/${selectedCompanion.id}`)
  }

  return (
    <section
      className="page companion-select-page companion-select-scene"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(21, 13, 59, 0.52), rgba(35, 22, 82, 0.78)), url(${orbitBackground})`,
      }}
    >
      <div className="companion-select-topbar">
        <Link className="ghost-button icon-only" to="/">
          <ArrowLeft size={18} />
        </Link>
        <div className="companion-select-title">
          <p>选择今天陪你走的搭子</p>
          <small>轻轻滑动，找到最想开口的那一个。</small>
        </div>
      </div>

      <CompanionOrbitSelector
        companions={companions}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onPrevious={goPrevious}
        onNext={goNext}
        onCustomize={goToQuiz}
        showSwipeHint={showSwipeHint}
      />

      <div className="companion-select-controls">
        <button type="button" className="ghost-button icon-only" onClick={goPrevious} aria-label="上一个搭子">
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="ghost-button icon-only" onClick={goNext} aria-label="下一个搭子">
          <ChevronRight size={18} />
        </button>
      </div>

      <section className="companion-detail-panel glass-card">
        <div className="companion-detail-head">
          <span className="companion-detail-avatar" aria-hidden="true">
            <img
              className="persona-avatar-image companion-detail-avatar-image"
              src={selectedCompanion?.avatar || getPersonaAvatar('gentle_friend')}
              alt={selectedCompanion?.fullName || 'SoloMate'}
            />
          </span>
          <div>
            <h2>{selectedCompanion?.fullName || 'SoloMate'}</h2>
            <p>{selectedCompanion?.intro}</p>
          </div>
        </div>

        <div className="companion-detail-copy">
          <div>
            <strong>适合场景</strong>
            <p>{selectedCompanion?.scene}</p>
          </div>
          <div>
            <strong>开场白</strong>
            <p>{selectedCompanion?.openingLine}</p>
          </div>
        </div>

        <button type="button" className="primary-button full" onClick={handleStart}>
          <Sparkles size={18} />
          {selectedCompanion?.isCustomize ? '开始定制' : '开始陪伴'}
        </button>
        <button type="button" className="ghost-button full" onClick={goToQuiz}>
          定制我的专属搭子
        </button>
      </section>
    </section>
  )
}

export default CompanionSelectPage
