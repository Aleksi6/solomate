import { Camera, MapPin, Sparkles, Trophy } from 'lucide-react'

const typeMeta = {
  badge: { icon: Trophy, label: '任务徽章' },
  achievement: { icon: Sparkles, label: '成就' },
  task_complete: { icon: Trophy, label: '任务完成' },
  photo_fragment: { icon: Camera, label: '照片碎片' },
  souvenir_card: { icon: Camera, label: '纪念物卡片' },
  random_drop: { icon: Sparkles, label: '随机掉落' },
}

function MemoryFragmentCard({ fragment }) {
  const meta = typeMeta[fragment.type] || typeMeta.random_drop
  const Icon = meta.icon

  return (
    <article className={`memory-fragment-card memory-postcard-card variant-${fragment.cardVariant || 'medium'} card-${fragment.type}`}>
      {fragment.hasImage ? (
        <div className="memory-fragment-visual">
          <img className="memory-fragment-photo" src={fragment.image} alt={fragment.title || fragment.mainText || meta.label} />
          <div className="memory-fragment-stamp">
            <Icon size={21} />
          </div>
        </div>
      ) : null}

      <div className="memory-fragment-copy">
        <div className="memory-fragment-meta">
          <span className="memory-fragment-type">
            <Icon size={14} />
            {meta.label}
          </span>
          {fragment.location ? (
            <span>
              <MapPin size={13} />
              {fragment.location}
            </span>
          ) : null}
        </div>
        {fragment.title ? <h3>{fragment.title}</h3> : null}
        {fragment.mainText ? <p>{fragment.mainText}</p> : null}
        {!fragment.mainText && fragment.description ? <p>{fragment.description}</p> : null}
        {fragment.timeLabel ? <small>{fragment.timeLabel}</small> : null}
      </div>
    </article>
  )
}

export default MemoryFragmentCard
