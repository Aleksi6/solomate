import { useMemo, useState } from 'react'
import { BookOpen, Sparkles, Trophy, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import MemoryFragmentCard from '../components/MemoryFragmentCard'
import { badges as badgeCatalog } from '../services/api'
import { getDemoState } from '../store/demoState'

const sectionCopy = {
  fragments: {
    title: '记忆碎片',
    empty: '还没有寄给搭子的照片。去拍一张，让搭子帮你收进今天的手账吧。',
  },
  badges: {
    title: '任务徽章',
    empty: '完成一段路上的小任务后，徽章会悄悄落进这里。',
  },
  rare: {
    title: '稀有碎片',
    empty: '今天还没有闪闪发亮的稀有碎片，不过旅程继续，惊喜也会继续。',
  },
}

const formatDateTime = (value = '') => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const todayKey = () => {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const toBadgeCard = (record, fragments = []) => {
  const sourceFragment = fragments.find((fragment) => record.source_fragments?.includes(fragment.id))
  const catalogBadge = badgeCatalog.find((item) => item.id === record.id || item.name === record.name)

  return {
    id: record.id,
    name: record.name,
    description: catalogBadge?.description || '这是一枚从今天旅途中留下来的徽章。',
    unlocked_at: record.unlocked_at,
    source_fragments: record.source_fragments || [],
    count: record.count || 1,
    sourceFragment,
  }
}

function BadgePage() {
  const [state] = useState(getDemoState)
  const [activeFragment, setActiveFragment] = useState(null)
  const [activeBadge, setActiveBadge] = useState(null)

  const fragments = useMemo(() => state.memoryFragments || [], [state.memoryFragments])
  const badgeCards = useMemo(() => (state.badgeRecords || []).map((record) => toBadgeCard(record, fragments)), [state.badgeRecords, fragments])
  const rareFragments = useMemo(() => fragments.filter((fragment) => fragment.is_rare || fragment.rarity === 'rare'), [fragments])
  const todayAddedCount = useMemo(
    () => fragments.filter((fragment) => String(fragment.created_at || '').startsWith(todayKey())).length,
    [fragments],
  )

  return (
    <section className="page memory-page diffuse-bg">
      <div className="page-intro memory-book-intro">
        <p className="eyebrow">Memory Fragment Book</p>
        <h1 className="page-title">记忆碎片收集册</h1>
        <p className="page-subtitle">今天寄给搭子的照片、搭子的评论和你解锁过的徽章，都在这里慢慢长成了一本手账。</p>
      </div>

      <section className="memory-progress stamp-progress memory-book-hero" aria-label="记忆碎片收集进度">
        <div className="memory-book-orb" aria-hidden="true">
          <div className="gradient-orb memory-book-light" />
        </div>
        <div className="memory-book-copy">
          <div>
            <Sparkles size={20} />
            <span>已收集 {fragments.length} 枚碎片</span>
          </div>
          <div>
            <Trophy size={20} />
            <span>已解锁 {badgeCards.length} 个徽章</span>
          </div>
          <small>今日新增 {todayAddedCount} 个记录。</small>
        </div>
      </section>

      {fragments.length === 0 && (
        <section className="memory-empty memory-empty-soft">
          <BookOpen size={30} />
          <h2>你的收集册还很轻</h2>
          <p>{sectionCopy.fragments.empty}</p>
        </section>
      )}

      <section className="memory-section">
        <div className="memory-section-head">
          <h2>{sectionCopy.fragments.title}</h2>
          {fragments.length > 0 && <span>{fragments.length}</span>}
        </div>
        {fragments.length > 0 ? (
          <div className="memory-fragment-list">
            {fragments.map((fragment) => (
              <MemoryFragmentCard key={fragment.id} fragment={fragment} sectionType="souvenir_card" onClick={setActiveFragment} />
            ))}
          </div>
        ) : (
          <p className="memory-section-empty">{sectionCopy.fragments.empty}</p>
        )}
      </section>

      <section className="memory-section">
        <div className="memory-section-head">
          <h2>{sectionCopy.badges.title}</h2>
          {badgeCards.length > 0 && <span>{badgeCards.length}</span>}
        </div>
        {badgeCards.length > 0 ? (
          <div className="badge-grid">
            {badgeCards.map((badge) => (
              <button key={badge.id} type="button" className="badge-card is-unlocked" onClick={() => setActiveBadge(badge)}>
                <div className="badge-medal">
                  <Trophy size={22} />
                </div>
                <h3>{badge.name}</h3>
                <p>{badge.description}</p>
                <span>{formatDateTime(badge.unlocked_at)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="memory-section-empty">{sectionCopy.badges.empty}</p>
        )}
      </section>

      <section className="memory-section">
        <div className="memory-section-head">
          <h2>{sectionCopy.rare.title}</h2>
          {rareFragments.length > 0 && <span>{rareFragments.length}</span>}
        </div>
        {rareFragments.length > 0 ? (
          <div className="memory-fragment-list">
            {rareFragments.map((fragment) => (
              <MemoryFragmentCard key={fragment.id} fragment={fragment} sectionType="achievement" onClick={setActiveFragment} />
            ))}
          </div>
        ) : (
          <p className="memory-section-empty">{sectionCopy.rare.empty}</p>
        )}
      </section>

      <Link className="primary-button full" to="/diary">
        生成今日旅行日记
      </Link>

      {activeFragment ? (
        <div className="memory-detail-backdrop" role="presentation" onClick={() => setActiveFragment(null)}>
          <article className="memory-detail-modal glass-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="memory-detail-close" onClick={() => setActiveFragment(null)} aria-label="关闭碎片详情">
              <X size={18} />
            </button>
            {activeFragment.image_data_url || activeFragment.image ? (
              <img
                className="memory-detail-image"
                src={activeFragment.image_data_url || activeFragment.image}
                alt={activeFragment.scene_summary || activeFragment.title || '碎片详情'}
              />
            ) : null}
            <div className="memory-detail-copy">
              <h2>{activeFragment.scene_summary || activeFragment.title || '这张照片的记录'}</h2>
              <p>{activeFragment.reply_text || '这一页已经被搭子收好。'}</p>
              {activeFragment.safety_observation ? <p>{activeFragment.safety_observation}</p> : null}
              {activeFragment.photo_advice ? <p>{activeFragment.photo_advice}</p> : null}
              {activeFragment.task_result?.reward_badge ? <p>解锁徽章：{activeFragment.task_result.reward_badge}</p> : null}
              {activeFragment.task_result?.reason ? <p>{activeFragment.task_result.reason}</p> : null}
              <small>{[activeFragment.city, activeFragment.place_name].filter(Boolean).join(' ')} {formatDateTime(activeFragment.created_at)}</small>
            </div>
          </article>
        </div>
      ) : null}

      {activeBadge ? (
        <div className="memory-detail-backdrop" role="presentation" onClick={() => setActiveBadge(null)}>
          <article className="memory-detail-modal glass-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="memory-detail-close" onClick={() => setActiveBadge(null)} aria-label="关闭徽章详情">
              <X size={18} />
            </button>
            <div className="memory-detail-copy">
              <h2>{activeBadge.name}</h2>
              <p>{activeBadge.description}</p>
              <p>解锁时间：{formatDateTime(activeBadge.unlocked_at)}</p>
              <p>来源碎片数：{activeBadge.count}</p>
              {activeBadge.sourceFragment ? (
                <>
                  <p>来源照片：{activeBadge.sourceFragment.scene_summary || activeBadge.sourceFragment.reply_text || '这张旅途记录'}</p>
                  {(activeBadge.sourceFragment.image_data_url || activeBadge.sourceFragment.image) ? (
                    <img
                      className="memory-detail-image"
                      src={activeBadge.sourceFragment.image_data_url || activeBadge.sourceFragment.image}
                      alt={activeBadge.name}
                    />
                  ) : null}
                  {activeBadge.sourceFragment.task_result?.reason ? <p>{activeBadge.sourceFragment.task_result.reason}</p> : null}
                </>
              ) : (
                <p>这枚徽章来自较早的记录，目前没有绑定到具体碎片。</p>
              )}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default BadgePage
