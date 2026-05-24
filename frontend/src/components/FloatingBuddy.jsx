import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCompanionAvatar } from '../config/personaAssets'
import { getActiveCompanionId, getActiveCompanionProfile } from '../utils/companionStorage'

const DEFAULT_COMPANION_ID = 'gentle_friend'

const visiblePaths = new Set(['/', '/home', '/persona', '/companions', '/photo', '/moment', '/memory', '/badges', '/diary'])

function FloatingBuddy() {
  const { pathname } = useLocation()
  const activeCompanionId = getActiveCompanionId() || DEFAULT_COMPANION_ID
  const activeCompanion = getActiveCompanionProfile()

  if (!visiblePaths.has(pathname)) {
    return null
  }

  return (
    <motion.div
      className="floating-buddy"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Link to={`/chat/${activeCompanionId}`} aria-label="回到搭子聊天" title="回到搭子聊天">
        <span className="floating-buddy-avatar-shell">
          <img className="floating-buddy-avatar" src={getCompanionAvatar(activeCompanion || { id: activeCompanionId })} alt={activeCompanion?.name || '当前搭子'} />
        </span>
      </Link>
    </motion.div>
  )
}

export default FloatingBuddy
