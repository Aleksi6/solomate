import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { getDemoState } from '../store/demoState'
import { personas } from '../services/api'

function FloatingBuddy() {
  const state = getDemoState()
  const persona = state.selectedPersona || personas[0]

  return (
    <motion.div
      className="floating-buddy"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Link to="/chat" aria-label="回到搭子聊天" title="回到搭子聊天">
        <span>{persona.avatar}</span>
        <MessageCircle size={18} />
      </Link>
    </motion.div>
  )
}

export default FloatingBuddy
