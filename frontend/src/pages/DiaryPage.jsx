import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, HeartPulse, MapPin, Tags, Trophy } from 'lucide-react'
import { badges, generateDiary } from '../services/api'
import { getDemoState } from '../store/demoState'

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
  '不孤单徽章': '不孤单徽章',
  '城市烟火徽章': '城市烟火徽章',
  '本地味道徽章': '本地味道徽章',
  '安心探索徽章': '安心探索徽章',
}

const fallbackDiary = {
  diary:
    '今天你一个人走过了老街入口、夜市街区。起初有一点犹豫，但你还是慢慢做出了下一步选择，也把这趟旅程认真记录了下来。',
  share_caption: '一个人的旅行，也会遇到刚刚好的热闹。',
  summary_tags: ['单人旅行', 'AI搭子', '城市探索'],
}

const toDisplayText = (value) => {
  if (!value) return ''
  if (typeof value === 'object') {
    return value.name || value.title || value.reward_badge || value.rewardBadge || value.label || labelMap[value.id] || ''
  }
  return labelMap[value] || String(value)
}

const replaceInternalIds = (text) =>
  Object.entries(labelMap).reduce((next, [id, label]) => next.replaceAll(id, label), String(text || ''))

const normalizeDiary = (data) => ({
  diary: replaceInternalIds(data?.diary || fallbackDiary.diary),
  share_caption: replaceInternalIds(data?.share_caption || fallbackDiary.share_caption),
  summary_tags:
    Array.isArray(data?.summary_tags) && data.summary_tags.length > 0
      ? data.summary_tags.map((tag) => replaceInternalIds(tag))
      : fallbackDiary.summary_tags,
})

const getMoodText = (item) => {
  if (!item) return ''
  if (typeof item === 'object') return item.mood || item.label || ''
  return String(item)
}

function DiaryPage() {
  const [state] = useState(getDemoState)
  const [diaryData, setDiaryData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const visitedPlaceNames = useMemo(
    () => (state.visitedPlaces?.length ? state.visitedPlaces.map(toDisplayText).filter(Boolean) : ['老街入口', '夜市街区']),
    [state.visitedPlaces],
  )

  const badgeNames = useMemo(
    () => (state.badges?.length ? state.badges.map(toDisplayText).filter(Boolean) : ['城市烟火徽章']),
    [state.badges],
  )

  const moodNames = useMemo(
    () =>
      state.moodHistory?.length
        ? state.moodHistory.map(getMoodText).filter(Boolean).map(replaceInternalIds)
        : ['uncertain', 'relaxed'],
    [state.moodHistory],
  )

  useEffect(() => {
    let cancelled = false

    const loadDiary = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await generateDiary({
          visited_places: visitedPlaceNames,
          badges: badgeNames,
          mood_history: moodNames,
          chat_summary: '用户完成了 SoloMate Demo 主线，生成今日旅行日记。',
        })

        if (!cancelled) {
          setDiaryData(normalizeDiary(data))
        }
      } catch {
        if (!cancelled) {
          setDiaryData(fallbackDiary)
          setError('接口暂时没有返回可用日记，已展示本地 fallback。')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDiary()

    return () => {
      cancelled = true
    }
  }, [badgeNames, moodNames, visitedPlaceNames])

  const unlocked = badges.filter((badge) => state.badges.includes(badge.id))

  return (
    <section className="page diary-page diffuse-bg">
      <div className="page-intro glass-card">
        <p className="eyebrow">今日旅行手账</p>
        <h1 className="page-title">把今天收进一页里</h1>
        <p className="page-subtitle">路线、心情、徽章和小碎片，都可以变成一页柔软的旅行记录。</p>
      </div>

      <div className="summary-list journal-summary">
        <article className="soft-card">
          <MapPin size={20} />
          <div>
            <h2>今日路线</h2>
            <p>{visitedPlaceNames.join(' → ')}</p>
          </div>
        </article>
        <article className="soft-card">
          <Trophy size={20} />
          <div>
            <h2>获得徽章</h2>
            <p>{unlocked.length ? `已收集 ${unlocked.length} 枚徽章` : '今天还没有解锁徽章'}</p>
          </div>
        </article>
        <article className="soft-card">
          <HeartPulse size={20} />
          <div>
            <h2>心情变化</h2>
            <p>{state.moodHistory.length ? state.moodHistory.map((item) => item.mood).join(' / ') : '慢慢出发，慢慢安定'}</p>
          </div>
        </article>
      </div>

      <article className="diary-card journal-page-card glass-card">
        <BookOpen size={22} />
        <h2>{isLoading ? '正在整理今天的故事...' : '今日旅行日记'}</h2>
        <p>{isLoading ? '搭子正在把路线、徽章和心情整理成一段轻轻的旅行日记。' : diaryData?.diary}</p>
      </article>

      {!isLoading && diaryData?.share_caption ? (
        <article className="diary-card glass-card">
          <BookOpen size={22} />
          <h2>分享文案</h2>
          <p>{diaryData.share_caption}</p>
        </article>
      ) : null}

      {!isLoading && diaryData?.summary_tags?.length ? (
        <article className="diary-card glass-card">
          <Tags size={22} />
          <h2>今日标签</h2>
          <div className="suggestion-row">
            {diaryData.summary_tags.map((tag) => (
              <span key={tag} className="pill-button">
                {tag}
              </span>
            ))}
          </div>
        </article>
      ) : null}

      {error ? <p className="page-subtitle">{error}</p> : null}

      <Link className="primary-button full" to="/">
        回到首页
      </Link>
    </section>
  )
}

export default DiaryPage
