import { Camera, MapPin, Sparkles, Trophy } from 'lucide-react'

const typeMeta = {
  badge: {
    icon: Trophy,
    label: '任务徽章',
  },
  achievement: {
    icon: Sparkles,
    label: '成就',
  },
  random_drop: {
    icon: Sparkles,
    label: '随机掉落',
  },
  souvenir_card: {
    icon: Camera,
    label: '纪念物卡片',
  },
}

const getCardType = (fragment, sectionType) => {
  if (sectionType) return sectionType
  if (fragment.dropKind === 'badge' || fragment.type === 'task_badge') return 'badge'
  if (fragment.dropKind === 'achievement') return 'achievement'
  if (fragment.source === 'souvenir_card' || fragment.type === 'souvenir') return 'souvenir_card'
  return 'random_drop'
}

function MemoryFragmentCard({ fragment, sectionType }) {
  const cardType = getCardType(fragment, sectionType)
  const meta = typeMeta[cardType] || typeMeta.random_drop
  const Icon = meta.icon
  const hasImage = Boolean(fragment.image)

  return (
    <article
      className={`memory-fragment-card memory-postcard-card card-${cardType} ${fragment.rarity === 'rare' ? 'is-rare' : ''}`}
    >
      <div className="memory-fragment-visual">
        {hasImage ? (
          <img className="memory-fragment-photo" src={fragment.image} alt={fragment.title} />
        ) : (
          <div className="memory-fragment-glow" aria-hidden="true">
            <div className="gradient-orb" />
          </div>
        )}
        <div className="memory-fragment-stamp">
          <Icon size={21} />
        </div>
      </div>

      <div className="memory-fragment-copy">
        <div className="memory-fragment-meta">
          <span>{meta.label}</span>
          {fragment.location && (
            <span>
              <MapPin size={13} />
              {fragment.location}
            </span>
          )}
        </div>
        <h3>{fragment.title}</h3>
        <p>{fragment.description}</p>
        {fragment.collectedAt && <small>{fragment.collectedAt}</small>}
      </div>
    </article>
  )
}

export default MemoryFragmentCard
