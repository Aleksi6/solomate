import { Camera, MapPin, Sparkles, Trophy } from 'lucide-react'

const typeMeta = {
  task_badge: {
    icon: Trophy,
    label: '任务徽章',
  },
  random_drop: {
    icon: Sparkles,
    label: '随机掉落',
  },
  souvenir: {
    icon: Camera,
    label: '纪念物卡片',
  },
}

function MemoryFragmentCard({ fragment }) {
  const meta = typeMeta[fragment.type] || typeMeta.random_drop
  const Icon = meta.icon

  return (
    <article className={`memory-fragment-card ${fragment.type || 'random_drop'}`}>
      {fragment.image && <img className="memory-fragment-photo" src={fragment.image} alt={fragment.title} />}
      <div className="memory-fragment-stamp">
        <Icon size={21} />
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
