import { MapPin, Volume2, VolumeX } from 'lucide-react'

function ChatHeader({ companion, isVoiceReplyEnabled, locationHint, weatherHint, onToggleVoiceReply }) {
  return (
    <header className="chat-header chat-mobile-header glass-card">
      <div className="chat-mobile-header-main">
        <div className="chat-mobile-header-identity">
          <div className="companion-avatar-wrap">
            <span className="companion-avatar-glow" aria-hidden="true" />
            <span className="companion-avatar" aria-hidden="true">
              {companion?.avatar || 'S'}
            </span>
          </div>

          <div className="chat-mobile-header-copy">
            <h1 className="page-title">{companion?.name || 'SoloMate'}</h1>
          </div>
        </div>

        <div className="chat-mobile-header-side">
          <div className="chat-mobile-header-location">
            <span className="pill-button weather-pill">{weatherHint}</span>
            <span className="location-pill">
              <MapPin size={14} />
              {locationHint}
            </span>
          </div>

          <button
            type="button"
            className={`ghost-button icon-only ${isVoiceReplyEnabled ? 'is-active' : ''}`}
            onClick={onToggleVoiceReply}
            aria-label={isVoiceReplyEnabled ? '\u5173\u95ed\u8bed\u97f3\u56de\u590d' : '\u5f00\u542f\u8bed\u97f3\u56de\u590d'}
            title={isVoiceReplyEnabled ? '\u5173\u95ed\u8bed\u97f3\u56de\u590d' : '\u5f00\u542f\u8bed\u97f3\u56de\u590d'}
          >
            {isVoiceReplyEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default ChatHeader
