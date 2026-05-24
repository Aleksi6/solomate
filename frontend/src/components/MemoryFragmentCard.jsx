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
    label: '记忆碎片',
  },
}

const getCardType = (fragment, sectionType) => {
  if (sectionType) return sectionType
  if (fragment.dropKind === 'badge' || fragment.type === 'task_badge') return 'badge'
  if (fragment.dropKind === 'achievement') return 'achievement'
  if (fragment.source === 'souvenir_card' || fragment.type === 'souvenir' || fragment.type === 'photo') return 'souvenir_card'
  return 'random_drop'
}

const getFragmentImage = (fragment) => fragment.thumbnail || fragment.image_data_url || fragment.image || ''

const getFragmentLocation = (fragment) => fragment.location || [fragment.city, fragment.place_name].filter(Boolean).join(' ')

const getFragmentTitle = (fragment) => fragment.title || fragment.scene_summary || fragment.reply_text || '寄给搭子的这一张'

const getFragmentDescription = (fragment) =>
  fragment.description || fragment.photo_advice || fragment.scene_summary || fragment.reply_text || '这一页已经被搭子替你认真收好。'

const formatCollectedAt = (value = '') => {
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

function MemoryFragmentCard({ fragment, sectionType, onClick }) {
  const cardType = getCardType(fragment, sectionType)
  const meta = typeMeta[cardType] || typeMeta.random_drop
  const Icon = meta.icon
  const image = getFragmentImage(fragment)
  const clickable = typeof onClick === 'function'

  return (
    <article
      className={`memory-fragment-card memory-postcard-card card-${cardType} ${fragment.rarity === 'rare' || fragment.is_rare ? 'is-rare' : ''} ${
        clickable ? 'is-clickable' : ''
      }`}
      onClick={clickable ? () => onClick(fragment) : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick(fragment)
              }
            }
          : undefined
      }
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="memory-fragment-visual">
        {image ? (
          <img className="memory-fragment-photo" src={image} alt={getFragmentTitle(fragment)} />
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
          {getFragmentLocation(fragment) && (
            <span>
              <MapPin size={13} />
              {getFragmentLocation(fragment)}
            </span>
          )}
        </div>
        <h3>{getFragmentTitle(fragment)}</h3>
        <p>{getFragmentDescription(fragment)}</p>
        {fragment.badges_unlocked?.length ? <small>解锁：{fragment.badges_unlocked.join('、')}</small> : null}
        {fragment.created_at || fragment.collectedAt ? <small>{formatCollectedAt(fragment.created_at || fragment.collectedAt)}</small> : null}
      </div>
    </article>
  )
}

export default MemoryFragmentCard
