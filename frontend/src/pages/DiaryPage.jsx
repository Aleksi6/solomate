import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, HeartPulse, MapPin, Trophy } from 'lucide-react'
import { badges, generateDiary } from '../services/api'
import { getDemoState } from '../store/demoState'

function DiaryPage() {
  const [state] = useState(getDemoState())
  const [diary, setDiary] = useState(null)

  useEffect(() => {
    generateDiary().then(setDiary)
  }, [])

  const unlocked = badges.filter((badge) => state.badges.includes(badge.id))

  return (
    <section className="page diary-page">
      <div className="page-intro">
        <p className="eyebrow">今日旅行手账</p>
        <h1>把今天收进一页里</h1>
        <p className="lead">路线、心情、徽章和小碎片，都可以变成一页柔软的旅行记录。</p>
      </div>

      <div className="summary-list journal-summary">
        <article>
          <MapPin size={20} />
          <div>
            <h2>今日路线</h2>
            <p>夜市街区 → 老街入口 → 安心返回主路</p>
          </div>
        </article>
        <article>
          <Trophy size={20} />
          <div>
            <h2>获得徽章</h2>
            <p>{unlocked.length ? `已收集 ${unlocked.length} 枚徽章` : '今天还没有解锁徽章'}</p>
          </div>
        </article>
        <article>
          <HeartPulse size={20} />
          <div>
            <h2>心情变化</h2>
            <p>{state.moodHistory.length ? state.moodHistory.map((item) => item.mood).join(' / ') : '慢慢出发，慢慢安定'}</p>
          </div>
        </article>
      </div>

      <article className="diary-card journal-page-card">
        <BookOpen size={22} />
        <h2>{diary?.title || '正在整理今天的故事...'}</h2>
        <p>{diary?.content || '搭子正在把路线、徽章和心情整理成一段轻轻的旅行日记。'}</p>
      </article>

      <Link className="primary-button full" to="/">
        回到首页
      </Link>
    </section>
  )
}

export default DiaryPage
