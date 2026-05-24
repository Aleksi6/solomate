import { Heart, Tag } from 'lucide-react'

function MomentCard({ item }) {
  const showTitle = item.title && item.title !== item.mainText

  return (
    <article className={`moment-card soft-card variant-${item.cardVariant || 'medium'}`}>
      <div className="moment-card-head">
        <span className="moment-card-icon">
          <Heart size={16} />
        </span>
        <div>
          <p className="eyebrow">记录此刻心情</p>
          {showTitle ? <h3>{item.title}</h3> : null}
        </div>
      </div>

      {item.hasImage ? (
        <div className="moment-card-image-wrap">
          <img className="moment-card-image" src={item.image} alt={item.title || item.mainText || '记录图片'} />
        </div>
      ) : null}

      {item.mainText ? <p className="moment-card-content">{item.mainText}</p> : null}

      {item.tags?.length ? (
        <div className="moment-card-tags">
          {item.tags.map((tag) => (
            <span key={tag} className="pill-button">
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <small>{item.timeLabel || ''}</small>
    </article>
  )
}

export default MomentCard
