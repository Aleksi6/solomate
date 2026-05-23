import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Sparkles } from 'lucide-react'
import MemoryFragmentCard from '../components/MemoryFragmentCard'
import { badges } from '../services/api'
import { getDemoState } from '../store/demoState'
import { readMemoryFragments } from '../utils/memoryDrops'

const sectionCopy = {
  task_badge: {
    title: '任务徽章碎片',
    empty: '完成一次城市任务后，徽章会变成这里的一枚记忆碎片。',
  },
  random_drop: {
    title: '随机掉落碎片',
    empty: '某个刚刚好的瞬间，还在路上等你遇见。',
  },
  souvenir: {
    title: '纪念物卡片碎片',
    empty: '拍照、打卡或写下心情后，可以把小纪念收进这里。',
  },
}

const badgeToFragment = (badgeId) => {
  const badge = badges.find((item) => item.id === badgeId)
  const title = badge?.name || badgeId

  return {
    id: `badge-${badgeId}`,
    type: 'task_badge',
    rarity: 'common',
    dropKind: 'badge',
    title,
    description: badge?.description || '这是一枚从旧徽章记录里找回来的旅行记忆。',
    collectedAt: '来自徽章记录',
    sourceBadgeId: badgeId,
  }
}

const getDisplayFragments = (state) => {
  const storedFragments = readMemoryFragments()
  const storedBadgeIds = new Set(storedFragments.map((fragment) => fragment.sourceBadgeId).filter(Boolean))
  const migratedBadges = (state.badges || [])
    .filter((badgeId) => !storedBadgeIds.has(badgeId))
    .map(badgeToFragment)

  return [...storedFragments, ...migratedBadges]
}

function BadgePage() {
  const [state] = useState(getDemoState())
  const fragments = useMemo(() => getDisplayFragments(state), [state])
  const groupedFragments = useMemo(
    () => ({
      task_badge: fragments.filter((fragment) => fragment.type === 'task_badge' || fragment.dropKind === 'badge'),
      random_drop: fragments.filter(
        (fragment) =>
          fragment.type === 'random_drop' ||
          fragment.dropKind === 'achievement' ||
          fragment.dropKind === 'memory',
      ),
      souvenir: fragments.filter((fragment) => fragment.type === 'souvenir'),
    }),
    [fragments],
  )
  const totalCount = fragments.length

  return (
    <section className="page memory-page">
      <div className="page-intro">
        <p className="eyebrow">Memory Fragment Book</p>
        <h1>记忆碎片收集册</h1>
        <p className="lead">把路上的小确定感、任务徽章和偶然遇见的瞬间收起来。每一片都算数。</p>
      </div>

      <section className="memory-progress stamp-progress" aria-label="记忆碎片收集进度">
        <div>
          <Sparkles size={20} />
          <span>已收集 {totalCount} 枚碎片</span>
        </div>
        <small>{totalCount > 0 ? '继续探索会让这本册子更厚一点。' : '第一枚碎片还在等你出发。'}</small>
      </section>

      {totalCount === 0 && (
        <section className="memory-empty">
          <BookOpen size={30} />
          <h2>还没有记忆碎片</h2>
          <p>完成一次对话、任务或照片记录后，SoloMate 会把值得留下的小瞬间放进这里。</p>
        </section>
      )}

      {Object.entries(sectionCopy).map(([type, copy]) => (
        <section key={type} className="memory-section">
          <h2>{copy.title}</h2>
          {groupedFragments[type].length > 0 ? (
            <div className="memory-fragment-list">
              {groupedFragments[type].map((fragment) => (
                <MemoryFragmentCard key={fragment.id} fragment={fragment} />
              ))}
            </div>
          ) : (
            <p className="memory-section-empty">{copy.empty}</p>
          )}
        </section>
      ))}

      <Link className="primary-button full" to="/diary">
        生成今日旅行日记
      </Link>
    </section>
  )
}

export default BadgePage
