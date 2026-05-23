import { Clock3, MessageCircle, Sparkles } from 'lucide-react'

function CompanionChatItem({ companion, active, onSelect }) {
  const count = Number(companion.unreadCount || 0) + Number(companion.newMemoryCount || 0)

  return (
    <button type="button" className={`companion-chat-item soft-card ${active ? 'is-active' : ''}`} onClick={() => onSelect(companion)}>
      <div className="companion-avatar-wrap">
        <div className="gradient-orb companion-avatar-glow" aria-hidden="true" />
        <span className="avatar-bubble companion-avatar">{companion.avatar}</span>
      </div>

      <div className="companion-main">
        <div className="companion-topline">
          <strong>{companion.name}</strong>
          {companion.recentTime ? (
            <span>
              <Clock3 size={13} />
              {companion.recentTime}
            </span>
          ) : null}
        </div>

        <div className="companion-tag-row">
          <span className="pill-button">{companion.typeLabel}</span>
          {companion.isCustom ? <span className="pill-button">共创搭子</span> : <span className="pill-button">固定搭子</span>}
        </div>

        <p>{companion.latestMessage || companion.tagline || '今天也可以慢慢和我说。'}</p>

        <div className="companion-bottomline">
          <span>
            <MessageCircle size={13} />
            {companion.latestSummary || '准备开始一段新的陪伴'}
          </span>
          {count > 0 ? (
            <span className="companion-count-badge">
              <Sparkles size={12} />
              {count}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

export default CompanionChatItem
