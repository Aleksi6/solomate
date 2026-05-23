import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Sparkles } from 'lucide-react'
import MemoryFragmentCard from '../components/MemoryFragmentCard'
import { badges } from '../services/api'
import { getDemoState } from '../store/demoState'
import { readMemoryFragments } from '../utils/memoryDrops'

const sectionCopy = {
  badge: {
    title: '任务徽章',
    empty: '完成一段路上的小任务后，徽章会悄悄落进这里。',
  },
  achievement: {
    title: '成就',
    empty: '某些很轻的小勇气，也会被搭子认真记下来。',
  },
  random_drop: {
    title: '随机掉落',
    empty: '今天路上的一些刚刚好，还在等你和它撞个满怀。',
  },
  souvenir_card: {
    title: '纪念物卡片',
    empty: '当你把风景或纪念物收进手账，这里就会多一张旅行贴纸。',
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

const getFragmentSection = (fragment) => {
  if (fragment.dropKind === 'badge' || fragment.type === 'task_badge') return 'badge'
  if (fragment.dropKind === 'achievement') return 'achievement'
  if (fragment.source === 'souvenir_card' || fragment.type === 'souvenir') return 'souvenir_card'
  return 'random_drop'
}

function BadgePage() {
  const [state] = useState(getDemoState())
  const fragments = useMemo(() => getDisplayFragments(state), [state])
  const groupedFragments = useMemo(
    () =>
      Object.keys(sectionCopy).reduce((groups, key) => {
        groups[key] = fragments.filter((fragment) => getFragmentSection(fragment) === key)
        return groups
      }, {}),
    [fragments],
  )
  const totalCount = fragments.length
  const rareCount = fragments.filter((fragment) => fragment.rarity === 'rare').length

  return (
    <section className="page memory-page diffuse-bg">
      <div className="page-intro memory-book-intro">
        <p className="eyebrow">Memory Fragment Book</p>
        <h1 className="page-title">记忆碎片收集册</h1>
        <p className="page-subtitle">这些是今天路上悄悄留下来的小瞬间</p>
      </div>

      <section className="memory-progress stamp-progress memory-book-hero" aria-label="记忆碎片收集进度">
        <div className="memory-book-orb" aria-hidden="true">
          <div className="gradient-orb memory-book-light" />
        </div>
        <div className="memory-book-copy">
          <div>
            <Sparkles size={20} />
            <span>已收集 {totalCount} 枚碎片</span>
          </div>
          <small>{rareCount > 0 ? `其中有 ${rareCount} 枚稀有碎片在发亮。` : '每一枚都很轻，但它们会慢慢把今天拼完整。'}</small>
        </div>
      </section>

      {totalCount === 0 && (
        <section className="memory-empty memory-empty-soft">
          <BookOpen size={30} />
          <h2>你的收集册还很轻</h2>
          <p>等你说完一段路、寄出一张照片，或者收下一点点成就，这里就会慢慢长出今天的旅行贴纸。</p>
        </section>
      )}

      {Object.entries(sectionCopy).map(([type, copy]) => (
        <section key={type} className="memory-section">
          <div className="memory-section-head">
            <h2>{copy.title}</h2>
            {groupedFragments[type].length > 0 && <span>{groupedFragments[type].length}</span>}
          </div>
          {groupedFragments[type].length > 0 ? (
            <div className="memory-fragment-list">
              {groupedFragments[type].map((fragment) => (
                <MemoryFragmentCard key={fragment.id} fragment={fragment} sectionType={type} />
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
