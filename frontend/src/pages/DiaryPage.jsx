import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, HeartPulse, MapPin, Tags, Trophy } from 'lucide-react'
import AchievementToast from '../components/AchievementToast'
import { badges } from '../services/api'
import { getDemoState } from '../store/demoState'
import { dequeueAchievementToast } from '../utils/achievementStorage'
import { dismissAchievementToast, evaluateAchievements } from '../utils/achievementEngine'
import { avoidSameTags, buildMoodChanges, buildTodayTags } from '../utils/diaryUtils'
import { getMergedMemoryTimeline } from '../utils/memoryStorage'

const labelMap = {
  night_market: '夜市街区',
  old_street: '老街入口',
  coffee_stop: '街角咖啡店',
  riverside: '江边步道',
  first_step: '旅行第一步',
  first_voice_task: '旅行第一步',
  firework_photo_task: '烟火气打卡',
  safe_route_task: '安心路线选择',
  local_food_task: '本地味道挑战',
}

const readChatHistory = () => {
  if (typeof window === 'undefined') return []
  try {
    const histories = JSON.parse(window.localStorage.getItem('chatHistories') || '{}')
    return Object.values(histories).flatMap((entry) => (Array.isArray(entry) ? entry : entry?.messages || []))
  } catch {
    return []
  }
}

const toDisplayText = (value) => {
  if (!value) return ''
  if (typeof value === 'object') {
    return value.name || value.title || value.reward_badge || value.rewardBadge || value.label || labelMap[value.id] || ''
  }
  return labelMap[value] || String(value)
}

function DiaryPage() {
  const state = getDemoState()
  const [activeToast, setActiveToast] = useState(null)
  const timeline = useMemo(() => getMergedMemoryTimeline(), [])
  const chatHistory = useMemo(() => readChatHistory(), [])

  useEffect(() => {
    evaluateAchievements()
    setActiveToast((current) => current || dequeueAchievementToast())
  }, [])

  const handleDismissToast = (achievementId) => {
    dismissAchievementToast(achievementId)
    setActiveToast(dequeueAchievementToast())
  }

  const visitedPlaceNames = state.visitedPlaces?.length ? state.visitedPlaces.map(toDisplayText).filter(Boolean) : ['酒店', '老街', '夜市', '咖啡店']
  const unlocked = badges.filter((badge) => state.badges.includes(badge.id))
  const badgeNames = unlocked.length ? unlocked.map((badge) => badge.name || badge.id) : []
  const moodHistory = state.moodHistory?.map((item) => item.mood || item.label).filter(Boolean) || []
  const moodNotes = timeline.filter((item) => ['mood_note', 'text_note', 'moment'].includes(item.type))

  const { todayTags, moodChanges } = useMemo(() => {
    const nextTodayTags = buildTodayTags({
      memoryFragments: timeline,
      badges: badgeNames,
      visitedPlaces: visitedPlaceNames,
      tasks: state.completedTasks || [],
      summaryTags: [],
    })

    const nextMoodChanges = buildMoodChanges({
      moodHistory,
      moodNotes,
      chatHistory,
      memoryTimeline: timeline,
    })

    return avoidSameTags(nextTodayTags, nextMoodChanges)
  }, [timeline, badgeNames, visitedPlaceNames, state.completedTasks, moodHistory, moodNotes, chatHistory])

  return (
    <section className="page diary-page diffuse-bg">
      <AchievementToast achievement={activeToast} onDismiss={handleDismissToast} />

      <div className="page-intro glass-card">
        <p className="eyebrow">今日手账</p>
        <h1 className="page-title">把今天收进一页里</h1>
        <p className="page-subtitle">今天的路、心情和小碎片都在这里。</p>
      </div>

      <div className="summary-list journal-summary">
        <article className="soft-card">
          <MapPin size={20} />
          <div>
            <h2>今日路线</h2>
            <p>{visitedPlaceNames.slice(0, 5).join(' → ')}</p>
          </div>
        </article>

        <article className="soft-card">
          <Trophy size={20} />
          <div>
            <h2>获得徽章</h2>
            {badgeNames.length ? (
              <div className="diary-chip-row">
                {badgeNames.slice(0, 4).map((badgeName) => (
                  <span key={badgeName} className="diary-chip diary-badge-chip">
                    {badgeName}
                  </span>
                ))}
              </div>
            ) : (
              <p>还没有获得徽章</p>
            )}
          </div>
        </article>

        <article className="soft-card">
          <Tags size={20} />
          <div>
            <h2>今日标签</h2>
            <div className="diary-chip-row">
              {todayTags.map((tag) => (
                <span key={tag} className="diary-chip diary-tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="soft-card">
          <HeartPulse size={20} />
          <div>
            <h2>心情变化</h2>
            <div className="diary-chip-row">
              {moodChanges.map((tag) => (
                <span key={tag} className="diary-chip diary-mood-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>

      <Link className="primary-button full" to="/diary/detail">
        一键生成今日日记
        <ArrowRight size={18} />
      </Link>
    </section>
  )
}

export default DiaryPage
