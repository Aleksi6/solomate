import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Heart, Sparkles } from 'lucide-react'
import AchievementToast from '../components/AchievementToast'
import HomeTaskCard from '../components/HomeTaskCard'
import { getCompanionAvatar } from '../config/personaAssets'
import { personas } from '../services/api'
import { getDemoState } from '../store/demoState'
import { dequeueAchievementToast } from '../utils/achievementStorage'
import { dismissAchievementToast, evaluateAchievements } from '../utils/achievementEngine'
import { getActiveCompanionId, getActiveCompanionProfile } from '../utils/companionStorage'
import { getHomeTaskProgress } from '../utils/taskProgress'

const personaDisplay = {
  gentle_friend: { name: '温柔朋友型' },
  local_guide: { name: '本地向导型' },
  photo_buddy: { name: '摄影搭子型' },
  budget_planner: { name: '省心规划型' },
  game_sprite: { name: '任务精灵型' },
}

function HomePage() {
  const demoState = getDemoState()
  const activeCompanionId = getActiveCompanionId()
  const customCompanion = getActiveCompanionProfile()
  const fallbackPersona = personas.find((item) => item.id === activeCompanionId) || demoState.selectedPersona || personas[0]
  const homeTasks = getHomeTaskProgress()
  const [activeToast, setActiveToast] = useState(null)

  useEffect(() => {
    evaluateAchievements()
    setActiveToast((current) => current || dequeueAchievementToast())
  }, [])

  const handleDismissToast = (achievementId) => {
    dismissAchievementToast(achievementId)
    setActiveToast(dequeueAchievementToast())
  }

  const activeCompanion = customCompanion
    ? {
        ...customCompanion,
        name: customCompanion.name || 'SoloMate',
        avatar: getCompanionAvatar(customCompanion),
      }
    : {
        ...fallbackPersona,
        ...(personaDisplay[fallbackPersona.id] || {}),
        name: personaDisplay[fallbackPersona.id]?.name || fallbackPersona.name || 'SoloMate',
        avatar: getCompanionAvatar(fallbackPersona),
      }

  return (
    <section className="page home-page diffuse-bg">
      <AchievementToast achievement={activeToast} onDismiss={handleDismissToast} />

      <div className="page-intro home-top-copy">
        <p className="eyebrow">SoloMate</p>
        <h1 className="page-title">今天，我陪你走</h1>
        <p className="page-subtitle">一个人出发，也有人陪你看见世界。</p>
      </div>

      <section className="home-hub-card glass-card">
        <div className="home-hub-orb-wrap" aria-hidden="true">
          <div className="gradient-orb home-hub-glow" />
          <div className="voice-orb home-hub-orb">
            <img className="persona-avatar-image home-hub-avatar-image" src={activeCompanion.avatar} alt={activeCompanion.name} />
          </div>
        </div>

        <div className="home-hub-copy">
          <p className="eyebrow">当前搭子</p>
          <h2>{activeCompanion.name}</h2>
        </div>

        <Link className="primary-button home-main-button" to="/companion-select">
          <Sparkles size={18} />
          选择我的旅行搭子
        </Link>
      </section>

      <section className="home-dual-actions" aria-label="核心入口">
        <Link className="soft-card home-action-card" to="/photo">
          <Camera size={22} />
          <strong>即刻拍照记录</strong>
          <span>把眼前的风景寄给搭子。</span>
        </Link>

        <Link className="soft-card home-action-card" to="/moment">
          <Heart size={22} />
          <strong>记录此刻心情</strong>
          <span>把这一刻收进今天里。</span>
        </Link>
      </section>

      <section className="home-task-section glass-card">
        <div className="page-intro home-task-intro">
          <p className="eyebrow">Today's Tasks</p>
          <h2>今日可解锁任务</h2>
          <p className="page-subtitle">左右滑着看，把今天的小目标慢慢收进记忆里。</p>
        </div>

        <div className="home-task-list" aria-label="今日可解锁任务">
          {homeTasks.map((task) => (
            <HomeTaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>
    </section>
  )
}

export default HomePage
