import { getCompanionAvatar } from '../config/personaAssets'

function CompanionChatItem({ companion, active, onSelect }) {
  const count = Number(companion.unreadCount || 0) + Number(companion.newMemoryCount || 0)
  const avatarSrc = companion.avatarSrc || getCompanionAvatar(companion)

  return (
    <button type="button" className={`companion-chat-row ${active ? 'is-active' : ''}`} onClick={() => onSelect(companion)}>
      <div className="companion-chat-avatar">
        <img className="persona-avatar-image companion-chat-avatar-image" src={avatarSrc} alt={companion.name || '搭子头像'} />
      </div>

      <div className="companion-chat-main">
        <div className="companion-chat-line">
          <strong>{companion.name}</strong>
          <span>{companion.recentTime || '刚刚'}</span>
        </div>
        <div className="companion-chat-line companion-chat-preview">
          <p>{companion.latestMessage || companion.starterText || '我在，随时可以出发。'}</p>
          {count > 0 ? <span className="companion-chat-badge">{count}</span> : null}
        </div>
      </div>
    </button>
  )
}

export default CompanionChatItem
