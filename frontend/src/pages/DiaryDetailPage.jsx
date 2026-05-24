import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, HeartPulse, Image, MapPin, Tags } from 'lucide-react'
import { generateDiary } from '../services/api'
import { getDemoState } from '../store/demoState'
import { evaluateAchievements } from '../utils/achievementEngine'
import { getMergedMemoryTimeline } from '../utils/memoryStorage'

const DIARY_CACHE_KEY = 'todayDiary'

const fallbackDiary = {
  diary: '今天你一个人走过了老街和夜市，也在一些犹豫之后，慢慢找到更适合自己的步调。那些被你收进时间线里的碎片，正在把这一整天拼成更完整的一页。',
  share_caption: '一个人的旅行，也会遇到刚刚好的热闹。',
  summary_tags: ['独自出发', '夜市', '慢慢放松'],
}

const routeMap = {
  night_market: '夜市街区',
  old_street: '老街入口',
  riverside: '江边步道',
}

const toLabel = (value) => routeMap[value] || String(value || '')

const getTodayKey = () => new Date().toISOString().slice(0, 10)

const readCachedDiary = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DIARY_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.date !== getTodayKey()) return null
    return parsed?.data || null
  } catch {
    return null
  }
}

const writeCachedDiary = (data) => {
  if (typeof window === 'undefined' || !data) return
  window.localStorage.setItem(
    DIARY_CACHE_KEY,
    JSON.stringify({
      date: getTodayKey(),
      data,
    }),
  )
}

function DiaryDetailPage() {
  const state = getDemoState()
  const [diaryData, setDiaryData] = useState(() => readCachedDiary() || null)
  const [isLoading, setIsLoading] = useState(() => !readCachedDiary())
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const hasGeneratedRef = useRef(false)

  const timeline = useMemo(() => getMergedMemoryTimeline(), [])
  const visitedPlaces = useMemo(
    () => (state.visitedPlaces?.length ? state.visitedPlaces.map(toLabel) : ['酒店', '老街入口', '夜市街区']),
    [state.visitedPlaces],
  )
  const moodHistory = useMemo(
    () => (state.moodHistory?.length ? state.moodHistory.map((item) => item.mood || item.label).filter(Boolean) : ['有点紧张', '慢慢放松']),
    [state.moodHistory],
  )
  const memoryImages = useMemo(() => timeline.filter((item) => item.hasImage).slice(0, 6), [timeline])
  const memorySummary = useMemo(
    () =>
      timeline
        .slice(0, 8)
        .map((item) => [item.title, item.mainText || item.description, (item.tags || []).join('/')].filter(Boolean).join('：'))
        .filter(Boolean)
        .join('\n'),
    [timeline],
  )

  const visitedPlacesKey = useMemo(() => JSON.stringify(visitedPlaces), [visitedPlaces])
  const moodHistoryKey = useMemo(() => JSON.stringify(moodHistory), [moodHistory])
  const badgesKey = useMemo(() => JSON.stringify(state.badges || []), [state.badges])

  const diaryPayload = useMemo(
    () => ({
      visited_places: JSON.parse(visitedPlacesKey),
      badges: JSON.parse(badgesKey),
      mood_history: JSON.parse(moodHistoryKey),
      chat_summary: memorySummary,
    }),
    [visitedPlacesKey, badgesKey, moodHistoryKey, memorySummary],
  )

  useEffect(() => {
    if (diaryData || isGenerating || hasGeneratedRef.current) {
      return
    }

    hasGeneratedRef.current = true
    setIsGenerating(true)
    setIsLoading(true)
    setError('')

    generateDiary(diaryPayload)
      .then((data) => {
        const nextDiary = {
          diary: data?.diary || fallbackDiary.diary,
          share_caption: data?.share_caption || fallbackDiary.share_caption,
          summary_tags: Array.isArray(data?.summary_tags) && data.summary_tags.length ? data.summary_tags : fallbackDiary.summary_tags,
        }
        setDiaryData(nextDiary)
        writeCachedDiary(nextDiary)
        evaluateAchievements()
      })
      .catch(() => {
        setDiaryData(fallbackDiary)
        writeCachedDiary(fallbackDiary)
        setError('接口暂时没有返回可用日记，已展示本地 fallback。')
        evaluateAchievements()
      })
      .finally(() => {
        setIsGenerating(false)
        setIsLoading(false)
      })
  }, [diaryData, diaryPayload, isGenerating])

  const stableDiary = diaryData || fallbackDiary

  return (
    <section className="page diary-detail-page diffuse-bg">
      <div className="page-intro glass-card">
        <p className="eyebrow">Diary Detail</p>
        <h1 className="page-title">今日日记</h1>
        <p className="page-subtitle">{isLoading ? '正在生成今日日记…' : '今天的经历、心情和小碎片都慢慢落成了文字。'}</p>
      </div>

      <article className="diary-card glass-card">
        <BookOpen size={22} />
        <h2>今日日记正文</h2>
        <p>{isLoading ? '搭子正在把今天的路线、心情和碎片整理成一页柔和的日记。' : stableDiary.diary}</p>
      </article>

      <article className="diary-card glass-card">
        <MapPin size={22} />
        <h2>今日经历梳理</h2>
        <p>{visitedPlaces.join(' → ')}</p>
      </article>

      <article className="diary-card glass-card">
        <HeartPulse size={22} />
        <h2>心情变化</h2>
        <p>{moodHistory.join(' / ')}</p>
      </article>

      <article className="diary-card glass-card">
        <Tags size={22} />
        <h2>今日标签</h2>
        <div className="suggestion-row">
          {stableDiary.summary_tags.map((tag) => (
            <span key={tag} className="pill-button">
              {tag}
            </span>
          ))}
        </div>
      </article>

      {memoryImages.length ? (
        <article className="diary-card glass-card">
          <Image size={22} />
          <h2>收集的记忆碎片图片</h2>
          <div className="diary-memory-grid">
            {memoryImages.map((item) => (
              <img key={item.id} src={item.image} alt={item.title} className="diary-memory-image" />
            ))}
          </div>
        </article>
      ) : null}

      {error ? <p className="page-subtitle">{error}</p> : null}
    </section>
  )
}

export default DiaryDetailPage
